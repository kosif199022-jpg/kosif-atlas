import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  copyFileSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type {
  Adapter,
  AdapterFacts,
  AdapterOutcome,
  InvocationResilience,
  AdapterSurface,
} from "../kernel/adapters/types.ts";
import { OBSERVED_EFFECT_REF_SCOPE } from "../kernel/invariants/observed-effects.ts";
import { acquireLease, describeLeaseRun, releaseLease } from "../kernel/state/lease.ts";
import { openGitRefStore, type GitRefStore } from "../kernel/state/git-ref-store.ts";
import { mintAgentVerdict, reviewRequirement } from "./agent-verdict.ts";
import { runBaseline, type BaselineResult } from "./baseline.ts";
import { resetBranchToBase } from "./abandon.ts";
import {
  computeControllerIdentity,
  controllerDriftOverrideActive,
  controllerDriftReason,
  controllerDriftRecord,
  recordedControllerDigest,
  type ControllerDriftRecord,
  type ControllerIdentity,
} from "./controller-identity.ts";
import {
  readCoverageProfile,
  readStageProfile,
  runGreenSuite,
  type CoverageProfile,
  type GreenSuiteResult,
} from "./green-suite.ts";
import type { QualityVerdict } from "./predicates/quality.ts";
import { evaluateUntrustedResult } from "./predicates/security.ts";
import { runQuality, type QualityResult } from "./quality.ts";
import { reconcile, type ReconcileResult } from "./reconcile.ts";
import { appendRunEvent, type RunEvent } from "./events.ts";
import { SDLC_LIFECYCLE } from "./lifecycle.ts";
import { walkLifecycle } from "./lifecycle-walk.ts";
import {
  gradeRedProof,
  isControllerOwnedToken,
  parsePlanPackets,
  runStage,
  type GovernanceMode,
  type GradeContext,
  type GradeResult,
  type ReviewFinding,
} from "./run-stage.ts";
// LIM-21: GovernanceMode moved to run-stage.ts; re-exported so importers keep compiling.
export type { GovernanceMode } from "./run-stage.ts";
import { runSuiteCommand } from "./suite-run.ts";
import { deriveApprovedSpecPlan } from "./spec.ts";
import { start, type StartRequest } from "./start.ts";

// Packet P18: drive an approved run to its human gate without hand-orchestration
// (FR-K4 hands-off local dispatch, FR-K6 controller-driven proof). driveRun
// composes the existing seams — start() registers/validates the approved run,
// then a strictly sequential loop dispatches each lifecycle stage through
// runStage() with the caller-injected worker, and runStage's own walkLifecycle
// verdict decides advancement. No second budget/accounting layer, no retry, no
// concurrency: Kernel v1 drives one stage at a time, exactly once, and parks
// fail-closed at the first unmet gate.
//
// Packet P20 hardening (FR-K7 durable authority, FR-K8 honest persistence):
// the repo lease (refs/factory/active) is held for the WHOLE stage loop and
// released on every exit, and each park CAS-overwrites the run ref's premature
// candidate_ready claim with the stage the run actually parked at, plus the
// repo-computed integrated-diff digest acceptVerdict later re-verifies.

// The one gate only a human reviewer may satisfy (review's H requirement in
// lifecycle.ts). Parking on it is an owner decision, not a failure.
const HUMAN_REVIEW_GATE = "reviewer.review-verdict-approved";

// P43: real roles receive a controller-rendered, digest-bound packet rather
// than an empty user turn. The role procedure is stable capability guidance;
// this is the per-run authority and output contract. It is deliberately plain
// text so every supported adapter sees the same boundary.
export function renderRoleJobContext(input: {
  readonly stage: string;
  readonly canonicalSpecPayload: string;
  readonly packet: {
    readonly packetId: string;
    readonly parentIntent: string;
    readonly allowedPaths: readonly string[];
    readonly criterionIds: readonly string[];
    readonly verificationBindings: readonly unknown[];
  };
  // C1b: the §4.2 scope classifier's verdict, so the plan-author's prompt names
  // why it was dispatched (agent) and the criteria/paths it must decompose.
  readonly classifierVerdict?: string;
}): string {
  const packet = JSON.stringify(input.packet, null, 2);
  const planContract =
    input.stage === "plan" && input.classifierVerdict !== undefined
      ? `\n\nFor this Plan stage, the §4.2 scope classifier returned verdict "${input.classifierVerdict}": this spec is too large for a single packet. Decompose its allowed paths and acceptance criteria into a DAG of single-packet-scoped packets. Return exactly one JSON object of the shape {"packets":[{"packetId":"...","allowedPaths":["..."],"criterionIds":["..."],"dependencies":["..."]}]}.`
      : "";
  const writingStageAuthority =
    input.stage === "red" || input.stage === "green"
      ? `\n\nRepository router authority binds the interactive owner session. Its repository-write prohibitions do not forbid this stage-authorized write: write only within the ${input.stage} stage contract. The controller commits accepted changes; do not commit them yourself.`
      : "";
  const redContract =
    input.stage === "red"
      ? `\n\nThe controller has already established that the pre-change repository suite was green. The controller's machine-recorded baseline result is the only authority for that pre-change state. Do not run a redundant pre-write verification probe or use one as a reason to refuse the Red work. Write the assigned failing test first, then run the approved verification command to prove the new test fails by assertion.\n\nFor this Red stage, write only failing tests under tests/**. Do not edit production files, stage files, or commit. After writing the test, Return exactly one JSON object with this shape:\n{"attestedCause":"<why the new test fails by assertion before implementation>"}\nThe controller, not you, records the test run, stages the accepted files, and creates the Red commit.`
      : "";
  // Dogfood runs 5 and 7 reached review and parked on "review output was not
  // valid JSON". The review-guide role asks for "severity-ranked findings in the
  // factory schema" without ever stating the shape, and only red carried an
  // output contract — so a reviewer returning prose was obeying everything it
  // had been told. This names exactly what gradeReview/parseReview accept.
  const reviewContract =
    input.stage === "review"
      ? `\n\nFor this Review stage, do not approve, merge, or change any file — you produce a record, not a decision. Return exactly one JSON object with this shape:\n{"findings":[{"severity":"blocking|major|minor","path":"<repo-relative path>","reason":"<what is wrong and how it fails>"}]}\nUse "findings": [] when you have no findings. Every finding needs all three fields; "severity" must be exactly one of blocking, major, or minor. A blocking finding rejects the candidate, so reserve it for a defect that must not ship.`
      : "";
  return `Approved specification payload:\n${input.canonicalSpecPayload}\n\nApproved packet:\n${packet}${writingStageAuthority}${redContract}${reviewContract}${planContract}`;
}

export interface DriveStageWorker {
  readonly role: string;
  readonly roleProcedure: string;
  readonly jobContext: string;
  readonly adapter: Adapter;
  readonly grade: (agentText: string, context?: GradeContext) => GradeResult;
}

export interface DriveRequest extends StartRequest {
  readonly stages: Readonly<Record<string, DriveStageWorker>>;
  // P32 (OI-1/OI-5): how this run's controller-owned stages are governed.
  // "controller" — a GOVERNED run: baseline/quality/reconcile must each produce
  // their OWN controller result or the run parks fail-closed at that stage, and
  // worker-minted baseline.*/quality.*/reconcile.* tokens are always stripped.
  // "fixture" (the DEFAULT, and what every existing caller gets by omitting the
  // field) — today's behaviour: a stage with no controller result defers to the
  // injected worker and that worker's controller-owned tokens are trusted.
  // Caller-declared, never inferred from repo state: an inferred mode is exactly
  // the implicit rule that breaks the fixture harness.
  readonly governance?: GovernanceMode;
}

export interface DriveTrailEntry {
  readonly stage: string;
  // Gate tokens this stage's invocation newly satisfied (agent + grader tokens).
  readonly tokens: readonly string[];
  readonly disposition: "advanced" | "parked";
}

export interface DriveStatus {
  readonly disposition: "needs_owner" | "failed";
  readonly stage: string;
  readonly missing: readonly string[];
  readonly decision?: "approve_review";
  readonly reason?: string;
}

export interface DriveResult {
  readonly trail: readonly DriveTrailEntry[];
  readonly status: DriveStatus;
}

// OI-15: `readonly string[]`, not the literal union `SDLC_LIFECYCLE` infers.
// Every caller asks "is this arbitrary string a stage name / where does it sit",
// with strings that come from run records and worker output — so the wide type
// is the honest one. The narrow inferred type made those calls type errors
// while the runtime behaviour was correct.
const STAGE_NAMES: readonly string[] = SDLC_LIFECYCLE.map((s) => s.stage);
// Human-class gate tokens per stage: a park whose only unmet tokens are these
// is an owner decision (needs_owner); anything else is fail-closed (failed).
const HUMAN_TOKENS: ReadonlyMap<string, ReadonlySet<string>> = new Map(
  SDLC_LIFECYCLE.map((s) => [s.stage, new Set<string>(s.requirements.H)]),
);
// F2 (P18 review): unconditional human-class tokens (not the "-if-required"
// conditionals, where a grader may attest non-applicability). Grader output
// can never mint one of these. owner.spec-approved is granted by the driver
// itself, because its evidence is the approval envelope start() validated;
// the reviewer verdict has no in-run source at all. Exported so verdict.ts
// applies the SAME strip on resume (owner-approved dedup, 2026-08-27; it used
// to recompute an identical private copy).
export const UNMINTABLE_HUMAN_TOKENS: ReadonlySet<string> = new Set<string>(
  SDLC_LIFECYCLE.flatMap((s) => [...s.requirements.H]).filter((t) => !t.endsWith("-if-required")),
);
const DRIVER_GRANTED_TOKENS: ReadonlySet<string> = new Set(["owner.spec-approved"]);

// P32: the stages the controller runs itself (baseline, quality, reconcile) and
// the gate tokens they own. LIM-21: the predicate lives in run-stage.ts now;
// `runStage` strips under governance "controller" and this file's post-stage
// strip below stays as a second, agreeing check.
const CONTROLLER_OWNED_STAGES: readonly string[] = ["baseline", "quality", "reconcile"];

// P26 (FR-K4/FR-K6): the intake and plan gate tokens the controller GRANTS from
// validated run state — the same class as owner.spec-approved, never from
// worker/agent output. intake: start() validated the digest-bound approval
// envelope and driveRun holds the repo lease. plan: the successful single-packet
// derive (planMode "derive", 0 model calls) is a trivially valid, disjoint-path
// DAG covering every criterion, and its scope waiver is non-applicable — so NO
// plan-author agent is needed. A spec that fails derivation throws before the
// stage loop, so these are never granted without the real evidence in hand.
const INTAKE_GRANT_TOKENS = [
  "intake.approval-envelope-valid",
  "intake.spec-digest-matches",
  "intake.lease-acquired",
] as const;
const PLAN_GRANT_TOKENS = [
  "plan.classifier-rule-valid",
  "plan.dag-schema-valid",
  "plan.total-criterion-coverage",
  "owner.scope-or-waiver-exception-if-required",
] as const;

// OI-17: adapter diagnostics are untrusted text (§11) that can quote the
// environment, so a message kept in the durable record is bounded and has
// secret-shaped runs masked before it is written. Deliberately crude: this is a
// last line of defence on an evidence field, not an authorization boundary, and
// a mask that is too eager only costs legibility.
const MAX_DIAGNOSTIC_BYTES = 500;
// OI-47: a canonically-shaped UUID is exempt, because OI-46 routes red-gate
// rejection reasons — which name repository paths — through this same mask, and
// a run-id directory segment is 36 characters. For a path, legibility IS the
// payload. Some credential formats are UUID-shaped; that residual case is the
// deliberate, bounded price of naming the run. Anchored to the whole 8-4-4-4-12
// token on purpose: loosening it to a length or character rule would weaken the
// adapter case for every secret. Do not widen it.
const CANONICAL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function redactDiagnostic(message: string): string {
  return message
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, (run) =>
      CANONICAL_UUID.test(run) ? run : "[redacted]",
    )
    .slice(0, MAX_DIAGNOSTIC_BYTES);
}

// OI-17 (requirement 1): one durable entry per invocation attempt. `adapter_model`
// and `adapter_reasoning_effort` record what the run was CONFIGURED with; these
// record what actually served each attempt, sourced from the adapter's own
// preflight facts rather than the environment. Run 6f0cf711 is the evidence for
// why: three attempts across two adapters left a record that named neither.
// §10 evidence only — no gate, token, walk or exit code reads it.
export interface AdapterAttemptEntry {
  readonly adapter_id: string | null;
  readonly vendor: string | null;
  readonly executable_version: string | null;
  readonly auth_method: string | null;
  // "probed" — the four fields above came from this adapter's preflight facts.
  // "unavailable" — the preflight could not be read (a vendor CLI that has gone
  // away, an auth directory that cannot be opened), so the controller records
  // THAT rather than an identity it did not verify. Never the invocation
  // result's own self-declared adapterId: that is the adapter's word for who it
  // is, and the whole point of this entry is provenance the controller took.
  readonly provenance: "probed" | "unavailable";
  readonly outcome: AdapterOutcome;
  // The adapter's diagnostic kind, when it reported one (failures only).
  readonly kind?: string;
  // Packet adapter-attempt-visibility-1: the adapter's own resilience summary,
  // flat under its own names, only when the adapter reported one. Data, not a
  // decision input: no gate, predicate or walk reads it.
  readonly attempts?: number;
  readonly backoffMs?: number;
  readonly budgetMs?: number;
  readonly progress?: InvocationResilience["progress"];
  readonly transcriptPath?: string;
}

// Adapter output is untrusted (§11): every string inside the summary carries
// the same mask the diagnostic message does. Scalars are recorded as given.
function redactResilience(summary: InvocationResilience): InvocationResilience {
  return {
    attempts: summary.attempts,
    backoffMs: summary.backoffMs,
    budgetMs: summary.budgetMs,
    ...(summary.progress === undefined
      ? {}
      : {
          progress: {
            progressing: summary.progress.progressing,
            reason: redactDiagnostic(summary.progress.reason),
          },
        }),
    ...(summary.transcriptPath === undefined
      ? {}
      : { transcriptPath: redactDiagnostic(summary.transcriptPath) }),
  };
}

// A run makes at most two attempts per stage today, so this is headroom rather
// than a live limit — but the record must not be able to grow without bound.
const MAX_ADAPTER_ATTEMPTS = 64;

function describeAdapterAttempt(
  facts: AdapterFacts | null,
  outcome: AdapterOutcome,
  diagnosticKind: string | undefined,
  resilience?: InvocationResilience,
): AdapterAttemptEntry {
  // Preflight facts are vendor CLI output — the version is parsed out of
  // `--version` and the auth method out of an auth-status payload — so they are
  // untrusted under §11 and carry the same mask the requirement-4 diagnostic
  // does. An absent or non-string field records as null, never as "".
  const text = (value: unknown): string | null =>
    typeof value === "string" && value.length > 0 ? redactDiagnostic(value) : null;
  return {
    adapter_id: facts === null ? null : text(facts.adapterId),
    vendor: facts === null ? null : text(facts.vendor),
    executable_version: facts === null ? null : text(facts.executable?.version),
    auth_method: facts === null ? null : text(facts.auth?.authMethod),
    provenance: facts === null ? "unavailable" : "probed",
    outcome,
    ...(diagnosticKind === undefined ? {} : { kind: redactDiagnostic(diagnosticKind) }),
    ...(resilience === undefined ? {} : redactResilience(resilience)),
  };
}

const EMPTY_TREE_OID = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

// P20 (FR-K7/FR-K2): 40-hex sha1 of the integrated diff, computed FROM the
// repository — the patch HEAD introduced over its first parent (the empty
// tree for a root commit; the empty string for a repo with no commits yet).
// This is what a review verdict's subject_digest must bind to; a caller can
// claim any digest, but only this one is the repository's truth.
// ponytail: HEAD^..HEAD stands in for "spec base..integrated candidate" until
// a later packet records the run's true base; no kernel seam computes diffs,
// so this is the one raw git read in sdlc state handling.
//
// OI-20: `atCommit` pins the computation to a RECORDED commit (the run's
// green_sha) instead of live HEAD, so a parked run names its own subject and
// unrelated commits made while it waits cannot strip signability. A pinned
// commit that no longer resolves THROWS — the recorded evidence is gone, and
// that is a refusal, not a silent fallback to whatever HEAD holds now.
export function computeIntegratedDiffDigest(repositoryPath: string, atCommit?: string): string {
  const env = {
    ...process.env,
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
    LC_ALL: "C",
  };
  const run = (args: readonly string[]) =>
    spawnSync("git", ["-C", repositoryPath, ...args], {
      env,
      encoding: "utf8" as const,
      maxBuffer: 16 * 1024 * 1024,
    });
  const head = run(["rev-parse", "--verify", "--quiet", `${atCommit ?? "HEAD"}^{commit}`]);
  if (head.status !== 0) {
    if (atCommit !== undefined) {
      throw new Error(`recorded commit ${atCommit} does not exist in this repository`);
    }
    return createHash("sha1").update("").digest("hex");
  }
  const tip = head.stdout.trim();
  const parent = run(["rev-parse", "--verify", "--quiet", `${tip}^`]);
  const base = parent.status === 0 ? parent.stdout.trim() : EMPTY_TREE_OID;
  const diff = run(["diff", base, tip]);
  if (diff.status !== 0) {
    throw new Error(`integrated diff computation failed: ${diff.stderr.trim()}`);
  }
  return createHash("sha1").update(diff.stdout).digest("hex");
}

// P27 (FR-K6/FR-K10): the istanbul default coverage summary the controller
// reads on the base commit — fixed, not agent-supplied. P28 reads the same fixed
// path on the GREEN tree for green.coverage-passed.
const BASELINE_COVERAGE_SUMMARY_PATH = "coverage/coverage-summary.json";

// P41: the budget for every controller-run suite spawn. A governed run makes
// FOUR of them — baseline `test_unit`, baseline `coverage` (P40), green
// `coverage`, quality `test_unit` — and each was pinned at a hardcoded 120 s. A
// repository whose suite crosses that parks with no way to do anything about it,
// which the open-issues carry list called the item most likely to bite a real
// product build.
//
// Env rather than a request field: these spawns are reached from `driveRun`,
// whose callers do not thread stage configuration, and the vendor adapter already
// established the pattern (FACTORY_ADAPTER_TIMEOUT_MS).
//
// STRICTER than that pattern in one place, deliberately. The adapter's own parse
// admits "0" — and `spawnSync`'s `timeout: 0` means NO TIMEOUT, so that is the
// fail-open spelling and the one an operator would most plausibly reach for to
// mean "unlimited". Requiring a positive safe integer refuses it here and falls
// back to the default.
//
// The adapter is NOT vulnerable to that, and P41's first draft wrongly said it
// was — but the reason is NOT its parse. `configured.ts` happily turns "0" into 0
// (and silently defaults "-1" or "abc"); what saves it is the NEXT step:
// `assertOptions` rejects `processTimeoutMs <= 0` and THROWS
// (`adapters/claude.ts:74-75`, `codex.ts:88-89`), so FACTORY_ADAPTER_TIMEOUT_MS=0
// fails the run loudly before any spawn — `policy: … adapter options are
// invalid`, exit 1. Verified by running it. Tightening that parse would be
// harmless; replacing the throw with a silent default would not.
const DEFAULT_STAGE_TIMEOUT_MS = 120_000;

export function stageTimeoutMs(): number {
  const raw = process.env.FACTORY_STAGE_TIMEOUT_MS;
  if (raw === undefined || !/^\d+$/.test(raw)) return DEFAULT_STAGE_TIMEOUT_MS;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : DEFAULT_STAGE_TIMEOUT_MS;
}

// P33 (FR-K6, OI-3/OI-4): the green coverage gate no longer reads a file off the
// working tree against a module constant. The controller RUNS the §8 profile's
// coverage command on the green tree (green-suite.ts) and grades the value it
// produced against the PROFILE's floor. `GREEN_COVERAGE_FLOOR` and
// `readGreenCoverageSummary` are gone with the defect they encoded.

// The base commit the controller baselines against — the repo's current HEAD,
// read the same way computeIntegratedDiffDigest does. null when the repo has no
// commit yet: there is no base state to baseline, so the controller cannot run
// one (the stage then falls through to the injected worker).
function resolveHeadSha(repositoryPath: string): string | null {
  const head = spawnSync(
    "git",
    ["-C", repositoryPath, "rev-parse", "--verify", "--quiet", "HEAD"],
    {
      env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1", LC_ALL: "C" },
      encoding: "utf8" as const,
    },
  );
  return head.status === 0 ? head.stdout.trim() : null;
}

interface RedWorktree {
  readonly path: string;
  readonly baseSha: string;
  readonly neutralizedRouterPaths: readonly string[];
}

function git(repositoryPath: string, args: readonly string[]) {
  return spawnSync("git", ["-C", repositoryPath, ...args], {
    env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1", LC_ALL: "C" },
    encoding: "utf8" as const,
  });
}

function nulPaths(output: string): string[] {
  return output.split("\0").filter((path) => path.length > 0);
}

function isTestPath(path: string): boolean {
  return path.startsWith("tests/") && !path.includes("\0") && !path.split("/").includes("..");
}

function pathEntryExists(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

function mirrorDependencyEntry(source: string, destination: string, entry: string): void {
  const sourcePath = join(source, entry);
  const destinationPath = join(destination, entry);
  const metadata = lstatSync(sourcePath);
  if (metadata.isSymbolicLink()) {
    symlinkSync(readlinkSync(sourcePath), destinationPath);
    return;
  }
  if (metadata.isDirectory()) {
    if (entry === ".pnpm") {
      symlinkSync(sourcePath, destinationPath);
      return;
    }
    mkdirSync(destinationPath);
    for (const child of readdirSync(sourcePath)) {
      mirrorDependencyEntry(sourcePath, destinationPath, child);
    }
    return;
  }
  if (metadata.isFile()) copyFileSync(sourcePath, destinationPath);
}

// The agent gets a disposable, detached worktree outside every checkout. Its
// node_modules is a real local directory whose entries link to the owner's
// installed dependency tree. That keeps package reads cheap but lets tools such
// as Vite create caches inside the confined worktree instead of trying to write
// through a parent node_modules directory in the owner checkout.
export function createRedWorktree(repositoryPath: string, baseSha: string | null): RedWorktree | null {
  if (baseSha === null) return null;
  let path: string | null = null;
  try {
    path = mkdtempSync(join(tmpdir(), "factory-red-"));
    rmSync(path, { recursive: true, force: true });
    const result = git(repositoryPath, ["worktree", "add", "--detach", path, baseSha]);
    if (result.status !== 0) return null;

    const neutralizedRouterPaths: string[] = [];
    for (const routerPath of ["AGENTS.md", "CLAUDE.md"] as const) {
      const worktreeRouterPath = join(path, routerPath);
      if (!pathEntryExists(worktreeRouterPath)) continue;
      rmSync(worktreeRouterPath, { force: true });
      neutralizedRouterPaths.push(routerPath);
    }

    const dependenciesPath = join(repositoryPath, "node_modules");
    const ignoredDependencies = git(path, [
      "check-ignore",
      "-q",
      "node_modules/.factory-dependency-probe",
    ]);
    if (ignoredDependencies.status === 0) {
      let dependencyEntries: string[] = [];
      try {
        dependencyEntries = readdirSync(dependenciesPath);
      } catch {
        // A repository with no installed dependencies needs no mirror.
      }
      const worktreeDependencies = join(path, "node_modules");
      if (dependencyEntries.length > 0) mkdirSync(worktreeDependencies);
      for (const entry of dependencyEntries) {
        if (entry === ".vite-temp" || entry.startsWith(".factory-red-")) continue;
        mirrorDependencyEntry(dependenciesPath, worktreeDependencies, entry);
      }
    }
    return { path, baseSha, neutralizedRouterPaths };
  } catch {
    if (path !== null) {
      git(repositoryPath, ["worktree", "remove", "--force", path]);
      rmSync(path, { recursive: true, force: true });
    }
    return null;
  }
}

export function removeRedWorktree(repositoryPath: string, worktree: RedWorktree | null): void {
  if (worktree === null) return;
  try {
    git(repositoryPath, ["worktree", "remove", "--force", worktree.path]);
  } finally {
    rmSync(worktree.path, { recursive: true, force: true });
  }
}

// OI-46: coding agents write their own scratch into the throwaway worktree
// (`.serena/project.yml` from MCP tooling killed three correct packets on
// 2026-08-28). `ls-files --exclude` skips untracked matches for this invocation
// only: no repository file, no worktree state. The per-worktree `info/exclude`
// alternative is silently ignored because a linked worktree reads the common
// git dir's, and editing the shared one would change the owner checkout.
// ponytail: hardcoded list, lives in the gate that reads it so staleness bites
// where it is visible; extend it when a new adapter litters a new directory.
const AGENT_SCRATCH_DIRECTORIES = [".claude/", ".serena/"] as const;

// §10 evidence: the rejection carries the condition that failed and the paths
// that caused it, so an operator or `diagnose` can separate a bad packet from a
// tooling artefact without re-running the stage. Nothing consumes it as a gate
// input. Paths come from an untrusted worktree (§11), so the reason is bounded
// and redacted exactly like the adapter diagnostic.
type WorktreeInspection = { readonly paths: string[] } | { readonly reason: string };

const MAX_REPORTED_PATHS = 5;
function pathsReason(condition: string, paths: readonly string[]): { reason: string } {
  const shown = paths.slice(0, MAX_REPORTED_PATHS).join(", ");
  const rest = paths.length - MAX_REPORTED_PATHS;
  return {
    reason: redactDiagnostic(
      `red controller rejected the isolated worktree change: ${condition}: ${shown}` +
        (rest > 0 ? ` (+${rest} more)` : ""),
    ),
  };
}

function worktreeChangedTestPaths(worktree: RedWorktree): WorktreeInspection {
  if (resolveHeadSha(worktree.path) !== worktree.baseSha) {
    return {
      reason:
        "red controller rejected the isolated worktree change: worktree HEAD moved off the base commit",
    };
  }
  const staged = git(worktree.path, ["diff", "--cached", "--name-only", "-z"]);
  const tracked = git(worktree.path, ["diff", "--name-only", "-z", worktree.baseSha]);
  const untracked = git(worktree.path, [
    "ls-files",
    "--others",
    "--exclude-standard",
    ...AGENT_SCRATCH_DIRECTORIES.map((directory) => `--exclude=${directory}`),
    "-z",
  ]);
  if (staged.status !== 0 || tracked.status !== 0 || untracked.status !== 0) {
    return {
      reason:
        "red controller rejected the isolated worktree change: git could not inspect the worktree",
    };
  }
  if (staged.stdout.length > 0) {
    return pathsReason("the agent left a staged index", nulPaths(staged.stdout));
  }
  const changedPaths = [...new Set([...nulPaths(tracked.stdout), ...nulPaths(untracked.stdout)])];
  const changedRouterSetup = worktree.neutralizedRouterPaths.filter((path) =>
    pathEntryExists(join(worktree.path, path)),
  );
  if (changedRouterSetup.length > 0) {
    return pathsReason("controller-created router neutralization was changed", changedRouterSetup);
  }
  const routerSetupPaths = new Set(worktree.neutralizedRouterPaths);
  const paths = changedPaths.filter((path) => !routerSetupPaths.has(path));
  if (paths.length === 0) {
    return {
      reason:
        "red controller rejected the isolated worktree change: the worktree contained no changed paths",
    };
  }
  const nonTest = paths.filter((path) => !isTestPath(path));
  if (nonTest.length > 0) return pathsReason("changed non-test paths", nonTest);
  const nonFile = paths.filter((path) => {
    try {
      return !lstatSync(join(worktree.path, path)).isFile();
    } catch {
      // A deletion, symlink, or unreadable file is never an acceptable Red test.
      return true;
    }
  });
  if (nonFile.length > 0) {
    return pathsReason("changed paths that are not readable regular files", nonFile);
  }
  return { paths };
}

function hasDirtyTestPaths(repositoryPath: string): boolean {
  const tracked = git(repositoryPath, ["diff", "--name-only", "-z"]);
  const staged = git(repositoryPath, ["diff", "--cached", "--name-only", "-z"]);
  const untracked = git(repositoryPath, ["ls-files", "--others", "--exclude-standard", "-z"]);
  if (tracked.status !== 0 || staged.status !== 0 || untracked.status !== 0) return true;
  return [...nulPaths(tracked.stdout), ...nulPaths(staged.stdout), ...nulPaths(untracked.stdout)].some(isTestPath);
}

interface OwnerWorktreeSnapshot {
  readonly head: string | null;
  readonly paths: readonly string[];
  readonly digests: Readonly<Record<string, string>>;
}

// The Codex adapter receives the isolated CWD, but an absolute-path mistake is
// still possible. Snapshot every Git-visible owner edit before dispatch and
// refuse integration if it changed; this never tries to overwrite owner work.
export function snapshotOwnerWorktree(repositoryPath: string): OwnerWorktreeSnapshot | null {
  const tracked = git(repositoryPath, ["diff", "--name-only", "-z"]);
  const staged = git(repositoryPath, ["diff", "--cached", "--name-only", "-z"]);
  const untracked = git(repositoryPath, ["ls-files", "--others", "--exclude-standard", "-z"]);
  if (tracked.status !== 0 || staged.status !== 0 || untracked.status !== 0) return null;
  const paths = [...new Set([...nulPaths(tracked.stdout), ...nulPaths(staged.stdout), ...nulPaths(untracked.stdout)])].sort();
  const digests: Record<string, string> = {};
  for (const path of paths) {
    try {
      const stat = lstatSync(join(repositoryPath, path));
      digests[path] = stat.isFile()
        ? createHash("sha256").update(readFileSync(join(repositoryPath, path))).digest("hex")
        : `non-file:${stat.mode}`;
    } catch {
      digests[path] = "absent";
    }
  }
  return { head: resolveHeadSha(repositoryPath), paths, digests };
}

function ownerWorktreeUnchanged(repositoryPath: string, snapshot: OwnerWorktreeSnapshot): boolean {
  const current = snapshotOwnerWorktree(repositoryPath);
  return (
    current !== null &&
    current.head === snapshot.head &&
    JSON.stringify(current.paths) === JSON.stringify(snapshot.paths) &&
    JSON.stringify(current.digests) === JSON.stringify(snapshot.digests)
  );
}

// DIVERGES from tdd.ts's junitFailureTypes on purpose (audited 2026-08-27,
// left separate): the single regex here never sees a failure/error element
// with no type attribute, so `<failure/>` is invisible to this pre-filter,
// while junitFailureTypes returns null for it. That laxity is backstopped —
// the caller immediately runs gradeRedProof, whose tdd.ts grammar rejects
// untyped elements — so unifying them would change this function's verdicts
// without changing the stage outcome. Not exact-equivalent; do not merge.
function junitFailureTypeAttributes(junitXml: string): readonly string[] {
  // Quote-aware for the same reason as tdd.ts's junitFailureTypes: a literal
  // `>` inside a failure message is legal and hid the `type` that came after it.
  return [...junitXml.matchAll(/<(?:failure|error)\b(?:"[^"]*"|'[^']*'|[^>])*?\btype\s*=\s*"([^"]*)"/g)].map(
    (match) => match[1] ?? "",
  );
}

function isAssertionFailureReport(junitXml: string): boolean {
  const types = junitFailureTypeAttributes(junitXml);
  return types.length > 0 && types.every((type) => type === "AssertionError");
}

// The rejection is only actionable if it says what the runner actually reported.
// A bare "did not fail only by assertion" cannot distinguish "the test passed",
// "your runner omits the type attribute", and "the test crashed instead of
// asserting" -- and the JUnit that justified the verdict is discarded with the
// worktree, so on someone else's machine there is nothing left to inspect.
function assertionRejectionReason(junitXml: string): string {
  const types = junitFailureTypeAttributes(junitXml);
  const elements = junitXml.match(/<(?:failure|error)\b/g)?.length ?? 0;
  const detail =
    elements === 0
      ? "the suite reported no failure at all -- the new test passed against unchanged code"
      : types.length === 0
        ? `${elements} failure element(s), none carrying a type attribute`
        : `observed failure types: ${[...new Set(types)].join(", ")}`;
  return `red controller suite did not fail only by assertion (${detail})`;
}

function applyPatch(repositoryPath: string, patch: string): boolean {
  const result = spawnSync("git", ["-C", repositoryPath, "apply", "--whitespace=nowarn"], {
    env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1", LC_ALL: "C" },
    encoding: "utf8",
    input: patch,
  });
  return result.status === 0;
}

function pathExistsAt(repositoryPath: string, sha: string, path: string): boolean {
  return git(repositoryPath, ["cat-file", "-e", `${sha}:${path}`]).status === 0;
}

// The owner tree has no pre-existing test edits (checked before integration),
// so restoring exactly these paths on an integration failure cannot overwrite
// owner work. All other staged and dirty paths remain untouched.
function rollbackMaterializedTests(repositoryPath: string, baseSha: string, paths: readonly string[]): void {
  const tracked = paths.filter((path) => pathExistsAt(repositoryPath, baseSha, path));
  const created = paths.filter((path) => !pathExistsAt(repositoryPath, baseSha, path));
  if (tracked.length > 0) {
    git(repositoryPath, ["restore", "--source", baseSha, "--staged", "--worktree", "--", ...tracked]);
  }
  if (created.length > 0) {
    git(repositoryPath, ["restore", "--staged", "--", ...created]);
    for (const path of created) rmSync(join(repositoryPath, path), { force: true });
  }
}

export function controllerRedGrade(input: {
  readonly repositoryPath: string;
  readonly worktree: RedWorktree;
  readonly baselineGreen: boolean;
  readonly testCommand: readonly string[];
  readonly agentText: string;
  readonly ownerSnapshot: OwnerWorktreeSnapshot;
}): GradeResult {
  // The dogfood run fb56d688 parked here: the prompt says "return exactly one
  // JSON object", but a real vendor CLI wraps that object in prose or a markdown
  // fence, and requiring the ENTIRE reply to be bare JSON rejected every
  // compliant agent. Extract instead: try the whole text, then every brace-run
  // substring that parses to an object carrying a non-empty attestedCause.
  // Still fail-closed — text with no such object yields the same reason.
  let attestedCause: string | null = null;
  const readAttestation = (text: string): string | null => {
    try {
      const parsed: unknown = JSON.parse(text);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        typeof (parsed as { attestedCause?: unknown }).attestedCause === "string" &&
        (parsed as { attestedCause: string }).attestedCause.trim() !== ""
      ) {
        return (parsed as { attestedCause: string }).attestedCause;
      }
    } catch {
      // Not JSON at this boundary; the caller tries the next candidate.
    }
    return null;
  };
  attestedCause = readAttestation(input.agentText);
  if (attestedCause === null) {
    // ponytail: greedy-from-each-open-brace scan, not a JSON tokenizer. Fine for
    // one agent reply; revisit only if replies embed pathological brace soup.
    const text = input.agentText;
    for (let open = text.indexOf("{"); open !== -1 && attestedCause === null; open = text.indexOf("{", open + 1)) {
      for (let close = text.indexOf("}", open); close !== -1 && attestedCause === null; close = text.indexOf("}", close + 1)) {
        attestedCause = readAttestation(text.slice(open, close + 1));
      }
    }
  }
  if (attestedCause === null) {
    return { tokens: [], accepted: false, reason: "red output was not a valid attestation JSON object" };
  }
  if (!input.baselineGreen || hasDirtyTestPaths(input.repositoryPath)) {
    return { tokens: [], accepted: false, reason: "red controller refused ambiguous baseline or test worktree" };
  }
  if (!ownerWorktreeUnchanged(input.repositoryPath, input.ownerSnapshot)) {
    return { tokens: [], accepted: false, reason: "red controller detected owner worktree changes during agent turn" };
  }
  const inspection = worktreeChangedTestPaths(input.worktree);
  if ("reason" in inspection) {
    return { tokens: [], accepted: false, reason: inspection.reason };
  }
  if (resolveHeadSha(input.repositoryPath) !== input.worktree.baseSha) {
    return {
      tokens: [],
      accepted: false,
      reason: "red controller rejected the isolated worktree change: owner HEAD moved off the base commit",
    };
  }
  const paths = inspection.paths;

  const junitXml = runSuiteCommand({
    repositoryPath: input.worktree.path,
    command: input.testCommand,
    timeoutMs: stageTimeoutMs(),
  });
  if (junitXml === null) {
    return { tokens: [], accepted: false, reason: "red controller suite produced no readable JUnit report" };
  }
  if (!isAssertionFailureReport(junitXml)) {
    return { tokens: [], accepted: false, reason: assertionRejectionReason(junitXml) };
  }
  const added = git(input.worktree.path, ["add", "--", ...paths]);
  const committed = git(input.worktree.path, ["commit", "-m", "red: controller-validated failing tests"]);
  const redSha = resolveHeadSha(input.worktree.path);
  if (added.status !== 0 || committed.status !== 0 || redSha === null) {
    return { tokens: [], accepted: false, reason: "red controller could not commit isolated tests" };
  }
  const proof = gradeRedProof(
    JSON.stringify({
      repositoryPath: input.worktree.path,
      baseSha: input.worktree.baseSha,
      redSha,
      testPathPrefixes: ["tests"],
      junitXml,
      assertionFailureTypes: ["AssertionError"],
      attestedCause,
    }),
  );
  if (!proof.accepted) return proof;
  if (!ownerWorktreeUnchanged(input.repositoryPath, input.ownerSnapshot)) {
    return { tokens: [], accepted: false, reason: "red controller detected owner worktree changes during verification" };
  }
  const patch = git(input.worktree.path, ["diff", "--binary", input.worktree.baseSha, redSha]);
  if (patch.status !== 0 || !applyPatch(input.repositoryPath, patch.stdout)) {
    return { tokens: [], accepted: false, reason: "red controller could not integrate accepted tests" };
  }
  const staged = git(input.repositoryPath, ["add", "--", ...paths]);
  const integrated = git(input.repositoryPath, [
    "commit",
    "--only",
    "-m",
    "red: controller-validated failing tests",
    "--",
    ...paths,
  ]);
  if (
    staged.status !== 0 ||
    integrated.status !== 0 ||
    resolveHeadSha(input.repositoryPath) === input.worktree.baseSha
  ) {
    rollbackMaterializedTests(input.repositoryPath, input.worktree.baseSha, paths);
    return { tokens: [], accepted: false, reason: "red controller could not commit integrated tests" };
  }
  return {
    tokens: [...proof.tokens, "red.executed-pre-change", "red.affected-suite-baseline-green"],
    accepted: true,
  };
}

// The dogfood run parked at green on a designed contradiction: the implementer
// role's authority exclusions forbid commits, while greenSha was read as "HEAD
// after the worker commits". The agent obeyed its role, the change stayed
// uncommitted, greenSha === redSha, and allowed-paths failed on an empty diff.
// Mirror of Red's fix: the CONTROLLER validates and commits the agent's change.
// Fail-closed: any dirty path outside allowedPaths refuses without committing
// (tree left intact for inspection); a clean tree is a no-op so a worker that
// commits itself — every existing fixture — is untouched.
// Reads the current dirty-path set (tracked-modified + staged + untracked),
// excluding the controller's OWN outputs — never the agent's implementation.
// The coverage summary is deleted and regenerated by runGreenSuite before
// grading, so a dirty (even planted) file there can never be evidence;
// docs/runs/ holds this run's event mirror, appended as the run goes. Real
// repos gitignore both; fixtures do not, which is why the exclusion lives here
// rather than in --exclude-standard.
export function dirtyImplementationPaths(repositoryPath: string): string[] | null {
  const tracked = git(repositoryPath, ["diff", "--name-only", "-z"]);
  const staged = git(repositoryPath, ["diff", "--cached", "--name-only", "-z"]);
  const untracked = git(repositoryPath, ["ls-files", "--others", "--exclude-standard", "-z"]);
  if (tracked.status !== 0 || staged.status !== 0 || untracked.status !== 0) return null;
  return [
    ...new Set([...nulPaths(tracked.stdout), ...nulPaths(staged.stdout), ...nulPaths(untracked.stdout)]),
  ].filter((path) => path !== BASELINE_COVERAGE_SUMMARY_PATH && !path.startsWith("docs/runs/"));
}

export function commitGreenChanges(
  repositoryPath: string,
  allowedPaths: readonly string[],
  // Dirty paths captured BEFORE the green invocation. Pre-existing dirt is the
  // OWNER's (an operator's scratch spec, a fixture's scaffolding) — not the
  // agent's doing, and not grounds to park the run. Only dirt the agent's turn
  // introduced outside the packet is a violation.
  preDirty: ReadonlySet<string>,
): { committed: boolean; reason?: string } {
  const paths = dirtyImplementationPaths(repositoryPath);
  if (paths === null) {
    return { committed: false, reason: "green controller could not read worktree state" };
  }
  const newOutside = paths.filter((path) => !allowedPaths.includes(path) && !preDirty.has(path));
  if (newOutside.length > 0) {
    return {
      committed: false,
      reason: `green controller refused paths outside the approved packet: ${newOutside.join(", ")}`,
    };
  }
  const toCommit = paths.filter((path) => allowedPaths.includes(path));
  if (toCommit.length === 0) return { committed: false };
  const added = git(repositoryPath, ["add", "--", ...toCommit]);
  const committed = git(repositoryPath, [
    "commit",
    "--only",
    "-m",
    "green: controller-validated implementation",
    "--",
    ...toCommit,
  ]);
  if (added.status !== 0 || committed.status !== 0) {
    return { committed: false, reason: "green controller could not commit the implementation" };
  }
  return { committed: true };
}

// Audit disposition 2026-08-27: the §11 untrusted-result engine
// (`evaluateUntrustedResult`) had zero lifecycle callers while the admin guide
// described its checks as active. This seam is its one production call site:
// the controller runs it over the base→green diff, the agent's reply, and the
// ref store, AFTER the green commit exists and BEFORE the green grade can
// accept. Quarantine parks the run at green fail-closed.
//
// Paths red integrated are unioned into the allowlist before the effect check:
// red's controller already policed them as test-only, and every real run
// commits red tests outside the packet's allowed_paths (run 62b86db6 did), so
// without the union this gate would quarantine every healthy run. Protected
// paths are the owner-trust surface the admin guide names. No exemption knob
// exists yet: a packet whose diff must legitimately contain a secret-shaped
// byte string parks for the owner — fail-closed is the v1 answer on a trust
// boundary, and the park reason names only redacted finding kinds.
export function evaluateGreenSecurity(input: {
  readonly repositoryPath: string;
  readonly baseSha: string;
  readonly redSha: string;
  readonly greenSha: string;
  readonly allowedPaths: readonly string[];
  readonly refsBefore: string;
  readonly refsAfter: string;
  readonly agentText: string;
}): { accepted: true } | { accepted: false; reason: string } {
  const redNames = git(input.repositoryPath, [
    "diff",
    "--no-renames",
    "--name-only",
    "-z",
    input.baseSha,
    input.redSha,
  ]);
  if (redNames.status !== 0) {
    return { accepted: false, reason: "green security could not read the red diff" };
  }
  const redPaths = redNames.stdout.split("\0").filter((p) => p.length > 0);
  const evaluation = evaluateUntrustedResult({
    repositoryPath: input.repositoryPath,
    baseSha: input.baseSha,
    resultSha: input.greenSha,
    refsBefore: input.refsBefore,
    refsAfter: input.refsAfter,
    allowedPaths: [...new Set([...input.allowedPaths, ...redPaths])],
    protectedPaths: [".aai/policy/", ".ailib/manifest.yaml"],
    outputs: [input.agentText],
  });
  if (evaluation.disposition !== "accepted") {
    // OI-52: the scanner already recorded which pattern matched and in which
    // scanned stream; carry both into the reason so a fabricated test fixture
    // is told apart from a real leak without reading the scanner's source.
    // Only the pattern name (a fixed identifier from SECRET_PATTERNS) and the
    // source label travel — `length` and `sha256Prefix` are a partial oracle
    // on the matched value and stay out.
    const kinds = [
      ...new Set(
        evaluation.findings.map((f) =>
          typeof f.shape === "string" && typeof f.source === "string"
            ? `${f.kind} (${f.shape} in ${f.source})`
            : f.kind,
        ),
      ),
    ].join(", ");
    return { accepted: false, reason: `green security quarantine: ${kinds}` };
  }
  return { accepted: true };
}

// P27: run the baseline profile as a controller step. When the repo has a base
// commit, the controller OWNS the three baseline tokens from the real command
// result (like P26's plan-derive owns plan's tokens) — the baseline worker is not
// invoked, so no agent output can mint a baseline.* token. Returns null when
// there is no base commit or no verification command to run.
function runControllerBaseline(
  repositoryPath: string,
  testCommand: readonly string[],
  // P40 (OI-14): the §8 profile's coverage argv, reusing the CoverageProfile the
  // driver already reads for green. `readCoverageProfile` needs both `coverage`
  // and a valid `coverage_floor`, and `doctor` requires both, so a conforming repo
  // always supplies one. Empty argv keeps the pre-P40 read-the-tree behaviour.
  coverageCommand: readonly string[],
): BaselineResult | null {
  const baseSha = resolveHeadSha(repositoryPath);
  if (baseSha === null || testCommand.length === 0) return null;
  const result = runBaseline({
    repositoryPath,
    baseSha,
    testCommand,
    coverageSummaryPath: BASELINE_COVERAGE_SUMMARY_PATH,
    coverageCommand,
    timeoutMs: stageTimeoutMs(),
  });
  // The controller governs the baseline gate only when it actually EXECUTED the
  // profile's suite (a readable report). A command that yields no report at all
  // means there is no controller result to source from, so the stage defers to
  // the injected worker (Kernel v1's pre-P27 behavior) rather than parking on an
  // unexecutable probe. A suite that RAN and failed still governs (fail-closed).
  // ponytail: a real baseline whose command can't run should ultimately park,
  // not defer — revisit when a run records its true executable base (a later
  // packet); until then this keeps the pre-P27 driver fixtures honest.
  return result.records.suiteRan ? result : null;
}

// P29: the quality profile's coverage floor, used ONLY when §8 declares none.
// OI-4: the run now reads `coverage_floor` and `brownfield_policy` from the
// repository's §8 profile — `doctor` has always validated both, and the run
// ignored both, so a repo could declare a floor of 95 and be graded against 80.
// These stay as the fallback for a profile that omits them, since
// readStageProfile must keep yielding a usable profile for `baseline`.
const QUALITY_COVERAGE_FLOOR = 80;
// Only ever reached when §8 declares no policy. Note doctor.ts accepts exactly
// one value, `no_regression_and_ratchet`, so the old hardcoded "strict" was not
// merely ignoring §8 — it was a value §8 would have rejected. Nothing reads this
// field today (predicates/quality.ts carries it and never branches on it), so
// this corrects the RECORD rather than any decision.
const QUALITY_BROWNFIELD_POLICY = "no_regression_and_ratchet";

// P29: did the controller actually EXECUTE at least one required capability (a
// readable junit report)? A capability with no report reads as "required
// capability missing"; anything else (a pass, a real test failure, a malformed
// report) means a command ran. When NOTHING ran the controller has no result to
// source from, so the quality stage defers to the injected worker — the same
// "no controller result → defer" seam runControllerBaseline uses for a suite
// that produced no report (keeps the pre-P29 driver fixtures honest).
function anyCapabilityRan(verdict: QualityVerdict): boolean {
  return verdict.records.some(
    (record) =>
      record.capability !== "profile" &&
      (record.passed || !/required capability missing/.test(record.reason ?? "")),
  );
}

// P29: run the quality profile as a controller step. When at least one required
// capability executes, the controller OWNS quality's token from that RESULT (like
// P27 baseline) — the quality worker is skipped, so agent output can never mint
// quality.*. null means no executable capability here; the stage defers to the
// worker path.
function runControllerQuality(
  repositoryPath: string,
  // P38 (OI-4): these are §8 CAPABILITY names, not acceptance-criterion ids. The
  // parameter kept its P29 name through the P38 Green; the whole point of OI-4 is
  // that the two are different things.
  requiredCapabilities: readonly string[],
  capabilityCommands: Readonly<Record<string, readonly string[]>>,
  // OI-4: §8's declared values, or undefined when the profile omits them.
  declared?: { readonly coverageFloor?: number; readonly brownfieldPolicy?: string },
): QualityResult | null {
  const candidateSha = resolveHeadSha(repositoryPath);
  if (candidateSha === null || requiredCapabilities.length === 0) return null;
  const result = runQuality({
    repositoryPath,
    candidateSha,
    profile: {
      required: [...requiredCapabilities],
      coverageFloor: declared?.coverageFloor ?? QUALITY_COVERAGE_FLOOR,
      brownfieldPolicy: declared?.brownfieldPolicy ?? QUALITY_BROWNFIELD_POLICY,
      assertionFailureTypes: ["AssertionError"],
    },
    capabilityCommands,
    timeoutMs: stageTimeoutMs(),
  });
  return anyCapabilityRan(result.verdict) ? result : null;
}

// P29: check target-head freshness as a controller step. In Kernel v1 no seam
// tracks a separate movable target ref, and the base is frozen under the held
// lease, so the target head "read now" is the base ref snapshot taken at run
// start — reading the repo's current HEAD would conflate the run's OWN red/green
// commits (which legitimately move HEAD) with target drift. Passing the frozen
// snapshot on both sides makes the check tautologically pass in v1 (OI-2), while
// reconcile()'s "moved" branch stays pinned for the moment a real movable target
// ref is wired. null (no base snapshot) defers to the worker, mirroring baseline.
function runControllerReconcile(
  repositoryPath: string,
  baseRefSnapshot: string | null,
): ReconcileResult | null {
  if (baseRefSnapshot === null) return null;
  return reconcile({
    repositoryPath,
    targetRefAtStart: baseRefSnapshot,
    targetRefNow: baseRefSnapshot,
  });
}

function runRef(runId: string): string {
  return `refs/factory/runs/${runId}`;
}

// P20 (FR-K8): CAS-overwrite start()'s premature candidate_ready record with
// the stage the run actually parked at, the tokens actually earned, and the
// repo-computed integrated-diff digest (acceptVerdict's comparison anchor).
// Best-effort under the held lease: a persistence error must not turn an
// honest park report into a crash — the returned verdict is still the truth.
// P42: ONE OPTIONS OBJECT, not twelve positional parameters.
//
// This was positional, and the second of its two call sites had drifted out of
// alignment: `specId` was added by P37 (`f94470d`, the OI-10 fix) and only one
// caller was updated, so the other passed eleven arguments for twelve parameters
// and every value after `runId` landed one slot early — `spec_id` would have been
// written as a stage name. **This repository has no typecheck (OI-15)**, so
// nothing caught it.
//
// It was latent, not live: that call site is the "every gate satisfied" branch,
// unreachable while `reviewer.review-verdict-approved` stays in
// UNMINTABLE_HUMAN_TOKENS. A test cannot pin an unreachable path, and a
// source-shape guard would only watch for the next drift. Naming every field
// removes the possibility instead: order stops mattering, and a missing field is
// visible at the call site rather than silently defaulted.
//
// What that branch would actually have written. EIGHT fields shift —
// `governance`, `stage`, `disposition`, `missing`, `satisfied`, `red_sha`,
// `green_sha` and `spec_id` — and `green_coverage` disappears from the record
// altogether, because the twelfth parameter falls off the end and defaults to
// null. The loudest is `satisfied`: a Set spread into an array, receiving the
// string `"controller"`, writes the sorted CHARACTERS
// `["c","e","l","l","n","o","o","r","r","t"]`.
//
// `spec_id` is the NARROWEST of the eight, not the worst: `...carried` follows it
// and `start()` always writes a spec_id, so a stage name surfaces there only when
// the prior record is unparseable. The irony is still worth keeping — the
// parameter that went missing is the one P37 added so a park record could never
// become an orphan `abandon`'s sweep cannot claim — but an earlier version of
// this comment led with it because it was the satisfying example rather than the
// damaging one (P42 reviews 1 and 2).
interface PersistParkOptions {
  readonly store: GitRefStore;
  readonly repositoryPath: string;
  readonly runId: string;
  // Controller-derived, from the approved spec — never the worker's word.
  readonly specId: string;
  readonly stage: string;
  readonly disposition: DriveStatus["disposition"];
  readonly missing: readonly string[];
  readonly satisfied: ReadonlySet<string>;
  // P32: the mode the run ACTUALLY used, written on EVERY park (governed or
  // not) so a reader of the durable record can never mistake a fixture run's
  // worker-supplied tokens for controller evidence.
  readonly governance: GovernanceMode;
  // P28 (FR-K6): the committed red/green commit SHAs the run recorded, so they
  // survive the park in the durable run record. null until each stage commits.
  readonly redSha?: string | null;
  readonly greenSha?: string | null;
  // FR-K10/OI-21: the frozen base snapshot (§10 baseline evidence "base SHA")
  // and the approved packet's criterion ids — verdict.ts evaluates the
  // candidate stage's evidence-complete/target-fresh gates FROM this record.
  readonly baseSha?: string | null;
  readonly criterionIds?: readonly string[] | null;
  // OI-26: packets this spec declared it was deferring. Recorded on every park
  // so the half a seam-plus-surface feature left undone is visible in the run's
  // own evidence, instead of living only in the spec's `out_of_scope` prose.
  readonly followUpPackets?: readonly string[] | null;
  // OI-17 (requirement 4): the adapter's normalized outcome and diagnostic for a
  // park caused by a failed invocation. Without it, `auth_failure`,
  // `ETIMEDOUT`, a nonzero exit and unparseable output all reach an operator as
  // the same sentence, and the only way to tell them apart is to run it again
  // and watch — which is exactly what unattended operation cannot do.
  readonly adapterFailure?: {
    readonly outcome: string;
    readonly kind?: string;
    readonly message?: string;
    readonly exitCode?: number;
    readonly attempts: number;
    // Nested, because `attempts` above is driver attempts (OI-17) and the
    // summary's own `attempts` would clobber it.
    readonly resilience?: InvocationResilience;
  } | null;
  // OI-17 (requirement 1): every invocation attempt this run made, in order, and
  // how many fell off the front of the bound. `adapterFailure` above names only
  // the attempt that PARKED the run and names no adapter at all; these say which
  // adapter served each attempt, successes included.
  readonly adapterAttempts?: {
    readonly entries: readonly AdapterAttemptEntry[];
    readonly dropped: number;
  } | null;
  // P33 (§10): the controller's own green coverage run — which command it
  // spawned, whether it produced a readable summary, its exit, the profile floor
  // applied, and the values THIS run produced. null when no coverage run
  // happened (no profile, or the run never reached green).
  readonly greenCoverage?: GreenSuiteResult | null;
  // P42 (§10, OI-4's evidence half): the quality stage's own verdict. `runQuality`
  // returns one record per required capability with `passed` and a plain `reason`;
  // the driver used to read the verdict once as a boolean and keep only the token,
  // so the durable record could say the gate passed and not say what ran.
  readonly qualityVerdict?: QualityVerdict | null;
  // OI-25 (§10): what the baseline suite actually did — the argv spawned, whether
  // it produced a readable report, its counts, and the names of the cases that
  // failed. Without it a parked baseline records three missing tokens and nothing
  // to diagnose from, so a flake and a real regression leave identical records.
  // null when the controller never ran a baseline (no base commit, or the run
  // never got there), matching how greenCoverage/qualityVerdict are omitted.
  readonly baseline?: BaselineResult | null;
  // The model every agent invocation in this run was pinned to
  // (FACTORY_ADAPTER_MODEL), or null when nothing was pinned and each vendor CLI
  // used its own default. Recorded because otherwise the evidence cannot answer
  // "what wrote this" — the same spec at the same commit produces different work
  // on a different default. Related: OI-17 asks for per-attempt adapter
  // provenance; this is the model half of it.
  readonly adapterModel?: string | null;
  // Codex reasoning effort pinned for this run, or null when unpinned. Same
  // reasoning as adapterModel: an unrecorded default makes the run
  // unreproducible from its own evidence.
  readonly adapterReasoningEffort?: string | null;
  // OI-19: the review stage's retained output. null when the run never reached
  // review.
  readonly review?: ReviewEvidence | null;
  // C5 packet 2: the policy version stamped onto a controller-minted
  // `review_agent` verdict at a `both`-mode review park. Only read when the
  // mint fires; the two review park sites thread request.policy.policyVersion.
  readonly policyVersion?: string | null;
  // controller-pin-run-record (LIM-05): the identity of the controller that
  // captured it — computed ONCE at drive entry, before any stage runs, so a
  // run whose own green commit mutates the controller surface mid-run (a
  // self-build) still records the ENTRY identity: the pin must describe the
  // code that governed the run, not the code that happened to write the park.
  // Written on EVERY park (both call sites thread the same captured value), as
  // an additive `controller` object; omitted only when no identity could be
  // computed, which never happens on a readable tree.
  readonly controller?: ControllerIdentity | null;
  // The owner's recorded drift override, when re-entry proceeded past a
  // refused-drift pin under FACTORY_ALLOW_CONTROLLER_DRIFT=1. Null on every
  // ordinary park: the entry is evidence of an override decision, and a park
  // that records none never erases one a prior park wrote (the same rule
  // adapter_attempts follows via `carried`).
  readonly controllerDrift?: ControllerDriftRecord | null;
  // C1b: whether the packet under execution was controller-derived ("derive")
  // or taken from an agent-authored DAG ("agent"), and for the agent path the
  // DAG's response digest, its packet ids, and which one is under execution.
  readonly plan?: {
    readonly mode: "agent" | "derive";
    readonly digest?: string;
    readonly packet_ids?: readonly string[];
    readonly active_packet_id?: string;
    // C1b packet 2: one entry per packet in execution order for an agent run.
    readonly packets?: readonly {
      readonly packet_id: string;
      readonly base_sha: string | null;
      readonly red_sha: string | null;
      readonly green_sha: string | null;
      readonly disposition: string;
    }[];
    // C1b packet 3: the packet→criterion map (kept so a supersede re-entry can
    // require every completed packet to reappear with identical criteria) and
    // the replaced plan(s) recorded when a supersede re-entry walked in.
    readonly packet_criteria?: Record<string, readonly string[]>;
    readonly superseded?: readonly {
      readonly digest: string;
      readonly packet_id: string;
      readonly stage: string;
      readonly parked_at: string;
    }[];
  } | null;
  // C1b packet 3 (FR-K14): the `packet_too_large` park block — the failed
  // packet, its stage, its evidence shas and its parent intent — written only
  // when an agent-mode packet fails at baseline/red/green/quality. null omits
  // the key AND removes any carried from a prior park.
  readonly packetTooLarge?: {
    readonly packet_id: string;
    readonly stage: string;
    readonly reason: string;
    readonly missing: readonly string[];
    readonly evidence: {
      readonly base_sha: string | null;
      readonly red_sha: string | null;
      readonly green_sha: string | null;
    };
    readonly parent_intent: {
      readonly outcome: string;
      readonly criterion_ids: readonly string[];
    };
  } | null;
}

// OI-19: the reviewer's structured findings plus a bounded copy of the raw
// reply. ponytail: 4 KiB cap, raise if a real review is ever truncated.
export interface ReviewEvidence {
  readonly findings: readonly ReviewFinding[] | null;
  readonly agent_reply: string;
}
const MAX_REVIEW_REPLY_BYTES = 4096;

function persistPark(options: PersistParkOptions): void {
  const {
    store,
    repositoryPath,
    runId,
    specId,
    stage,
    disposition,
    missing,
    satisfied,
    governance,
    redSha = null,
    greenSha = null,
    baseSha = null,
    criterionIds = null,
    followUpPackets = null,
    adapterFailure = null,
    adapterAttempts = null,
    greenCoverage = null,
    qualityVerdict = null,
    baseline = null,
    adapterModel = null,
    adapterReasoningEffort = null,
    review = null,
    policyVersion = null,
    controller = null,
    controllerDrift = null,
    plan = null,
    packetTooLarge = undefined,
  } = options;
  try {
    const ref = runRef(runId);
    const digest = computeIntegratedDiffDigest(repositoryPath);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const current = store.read(ref);
      // P37 review B1: NEVER re-create a run ref that has vanished. start()
      // always creates this ref before the stage loop runs, so a null here can
      // only mean something deleted it under us — `factory abandon`, or a hand
      // `git update-ref -d`. Re-creating it resurrects an orphan with no spec
      // index: `factory verdict` then sees two parked runs and can never be
      // disambiguated, because its only operand is an envelope path. Fail
      // closed — the park verdict still reaches the owner on stdout.
      if (current === null) return;
      let carried: Record<string, unknown> = {};
      try {
        const parsed: unknown = JSON.parse(current?.files["run.json"] ?? "{}");
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          // P20-F1: carry the WHOLE prior record, not two keys. Dropping
          // `candidate` made start()'s idempotency guard (record.candidate
          // !== undefined) miss, so a duplicate trigger re-ran the candidate
          // effect and clobbered this park back to candidate_ready. Keeping
          // it means a duplicate start on a parked run fails closed as
          // state_invalid (status is now "parked", not "candidate_ready").
          carried = { ...(parsed as Record<string, unknown>) };
        }
      } catch {
        // Unreadable prior record: persist the honest fields alone.
      }
      const record = {
        run_id: runId,
        // P37 amendment-5 review MINOR: name the spec UNCONDITIONALLY, not only
        // via `carried`. When the prior record is unparseable `carried` is {},
        // and a park record with no spec_id is a run `abandon`'s sweep can never
        // claim for any spec — the permanent orphan the sweep exists to kill.
        spec_id: specId,
        ...carried,
        governance,
        adapter_model: adapterModel,
        adapter_reasoning_effort: adapterReasoningEffort,
        // controller-pin-run-record: the pin that names the governing
        // controller. Explicit keys override the carried prior record, so a
        // re-entered run parks under ITS entry-time pin rather than the
        // previous attempt's. `commit` is omitted when the controller root is
        // not a git checkout — the digest is the identity, the commit the
        // dirty-tree disambiguator.
        ...(controller === null
          ? {}
          : {
              controller: {
                digest: controller.digest,
                ...(controller.commit === null ? {} : { commit: controller.commit }),
              },
            }),
        ...(controllerDrift === null ? {} : { controller_drift: controllerDrift }),
        status: "parked",
        stage,
        disposition,
        missing,
        satisfied: [...satisfied].sort(),
        integrated_diff_digest: digest,
        red_sha: redSha,
        green_sha: greenSha,
        // FR-K10/OI-21 (§10): the evidence the candidate gate is evaluated
        // from at verdict time. `parked_at` timestamps the record's evidence
        // entries; `criterion_map` is the approval-critical criterion→evidence
        // map — minted only once a red commit exists to bind tests to criteria
        // (v1 specs only support kind "test" verification, spec.ts enforces).
        parked_at: new Date().toISOString(),
        base_sha: baseSha,
        // OI-26: written only when the spec declared one, so an ordinary
        // single-packet spec's record is unchanged.
        ...(followUpPackets === null || followUpPackets.length === 0
          ? {}
          : { follow_up_packets: [...followUpPackets] }),
        ...(plan === null ? {} : { plan }),
        ...(adapterFailure === null ? {} : { adapter_failure: adapterFailure }),
        // OI-17 (requirement 1). Omitted entirely when the run made no
        // invocation attempt, the same rule adapter_failure follows — and
        // because `carried` is spread above, a park that records none never
        // erases a prior park's attempts.
        ...(adapterAttempts === null || adapterAttempts.entries.length === 0
          ? {}
          : {
              adapter_attempts: [...adapterAttempts.entries],
              ...(adapterAttempts.dropped > 0
                ? { adapter_attempts_dropped: adapterAttempts.dropped }
                : {}),
            }),
        ...(criterionIds === null
          ? {}
          : {
              criterion_ids: [...criterionIds],
              criterion_map:
                redSha === null
                  ? []
                  : criterionIds.map((criterion) => ({
                      criterion,
                      evidence: "test",
                      subject: redSha,
                    })),
            }),
        ...(greenCoverage === null
          ? {}
          : {
              green_coverage: {
                command: [...greenCoverage.records.coverageCommand],
                ran: greenCoverage.records.ran,
                exit: greenCoverage.records.exitCode,
                floor: greenCoverage.records.coverageFloor,
                lines: greenCoverage.records.coverage?.lines ?? null,
                branches: greenCoverage.records.coverage?.branches ?? null,
              },
            }),
        // P42 (§10, OI-4): what the quality stage actually ran, per capability.
        // Same shape as green_coverage above — the verdict this run produced,
        // not a re-derivation from the granted token.
        ...(qualityVerdict === null
          ? {}
          : {
              quality_evidence: {
                passed: qualityVerdict.passed,
                records: qualityVerdict.records.map((r) => ({
                  capability: r.capability,
                  passed: r.passed,
                  // Both optional in QualityRecord: `reason` is set only on a
                  // failure, `values` only where the capability produced metrics.
                  // Plain assignment is correct — `JSON.stringify` drops an
                  // `undefined` value, so an absent reason simply does not appear.
                  // (An earlier version wrapped these in conditional spreads and
                  // justified it by claiming the direct form would emit
                  // `"reason": null`. That was false: only `?? null` does that.
                  // P42 review 2 MINOR-3. The spreads were ceremony; the comment
                  // defending them was worse than the ceremony.)
                  reason: r.reason,
                  values: r.values,
                })),
                baseline: qualityVerdict.baseline,
                ratchet: qualityVerdict.ratchet,
              },
            }),
        // OI-25 (§10): the baseline suite's own result. Same shape and same rule
        // as green_coverage and quality_evidence above — written from the result
        // the controller produced, and absent entirely when it produced none.
        ...(baseline === null
          ? {}
          : {
              baseline_evidence: {
                command: [...baseline.records.testCommand],
                ran: baseline.records.suiteRan,
                total: baseline.records.total,
                failures: baseline.records.failures,
                failing_tests: [...baseline.records.failingTests],
                truncated: baseline.records.failingTestsTruncated,
              },
            }),
        // OI-19: the review the gate summarized, retained where the owner's
        // verdict decision reads from. findings [] = reviewed, none found;
        // findings null = reply had no parseable record (agent_reply carries
        // the bounded raw reply for diagnosis).
        ...(review === null ? {} : { review }),
        // C5 packet 2: at a governed `both`-mode review park the controller
        // mints the `review_agent` verdict itself, bound to this record by the
        // packet-1 digest (which reads only run_id/green_sha/review, so the
        // digest over these fields equals the one recomputed from the written
        // record). Spread after `carried` so a re-entered park replaces, never
        // appends, an earlier attempt's verdicts. Absent/human parks stay
        // byte-identical to HEAD — no `verdicts` key.
        ...(review !== null &&
        stage === "review" &&
        disposition === "needs_owner" &&
        policyVersion !== null &&
        reviewRequirement(repositoryPath) === "both"
          ? {
              verdicts: [
                mintAgentVerdict({ run_id: runId, green_sha: greenSha, review }, policyVersion),
              ],
            }
          : {}),
      };
      // C1b packet 3: `packet_too_large` is written on an agent packet failure
      // and otherwise ABSENT — even when `carried` (a prior park) had it. A
      // spread cannot delete, so set/remove explicitly after the literal so a
      // supersede re-entry that walks to review clears the failed-run block.
      // `undefined` = leave the carried block untouched: a retention/reset
      // refusal (preservePlan) must not drop the supersede evidence a follow-up
      // re-entry still needs to detect the supersede.
      if (packetTooLarge === undefined) {
        // leave carried packet_too_large (if any) as the spread wrote it
      } else if (packetTooLarge === null) {
        delete (record as Record<string, unknown>).packet_too_large;
      } else {
        (record as Record<string, unknown>).packet_too_large = packetTooLarge;
      }
      const snapshot = { "run.json": JSON.stringify(record) };
      const result = store.compareAndSwap(ref, current.oid, snapshot);
      if (result.disposition === "advanced") return;
    }
  } catch {
    // ponytail: swallowed on purpose — the park verdict already reaches the
    // owner; the durable record is evidence, not the report itself.
  }
}

// Shared with verdict.ts (owner-approved dedup, 2026-08-27): the park shape is
// generic over the status type because drive parks with DriveStatus
// ("needs_owner" | "failed", optional decision) while verdict parks with
// VerdictStatus ("complete" | "failed") — same runtime behavior, different
// status unions.
export function parked<Status extends { readonly stage: string }>(
  trail: DriveTrailEntry[],
  stage: string,
  tokens: readonly string[],
  status: Omit<Status, "stage">,
): { readonly trail: readonly DriveTrailEntry[]; readonly status: Status } {
  trail.push({ stage, tokens, disposition: "parked" });
  return { trail, status: { ...status, stage } as Status };
}

// controller-pin-run-record: the pin on the PRIOR record of a re-entered run,
// read-only. Any failure reads as "no pin" (never refuse): an unreadable
// record predates judgement here anyway — start() already validated the run's
// state before returning `reentered`.
function readPinnedControllerDigest(repositoryPath: string, runId: string): string | null {
  try {
    const snapshot = openGitRefStore(repositoryPath).read(runRef(runId));
    if (snapshot === null) return null;
    const parsed: unknown = JSON.parse(snapshot.files["run.json"] ?? "{}");
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    return recordedControllerDigest(parsed as Record<string, unknown>);
  } catch {
    return null;
  }
}

// C1b packet 3: the whole prior record of a re-entered run, read-only. A
// supersede re-entry reads its `packet_too_large` block and completed packets
// from here. Any failure reads as "no record" — start() already validated the
// run's state before returning `reentered`.
function readPriorRunRecord(repositoryPath: string, runId: string): Record<string, unknown> | null {
  try {
    const snapshot = openGitRefStore(repositoryPath).read(runRef(runId));
    if (snapshot === null) return null;
    const parsed: unknown = JSON.parse(snapshot.files["run.json"] ?? "{}");
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

// C1b packet 3: the seam between a failed multi-packet run and its replacement
// DAG. Computed once at re-entry from the prior record; consumed to reset the
// branch, seed the completed packets, digest the replacement, and record the
// superseded plan.
interface SupersedeState {
  readonly originalBase: string | null;
  readonly failedEntry: {
    base_sha: string | null;
    red_sha: string | null;
    green_sha: string | null;
  } | null;
  readonly completed: readonly {
    packet_id: string;
    base_sha: string | null;
    red_sha: string | null;
    green_sha: string | null;
    disposition: string;
  }[];
  readonly priorCriteria: Record<string, readonly string[]>;
  readonly priorDigest: string;
  readonly priorPacketId: string;
  readonly priorStage: string;
  readonly priorParkedAt: string;
  readonly planJsonBytes: string | null;
}

async function drive(request: DriveRequest): Promise<DriveResult> {
  // P32: resolve the caller-declared mode once. Anything other than an explicit
  // "controller" opt-in is the permissive default, so an unrecognised value can
  // never buy a run the governed label it did not ask for.
  // P32-F4 (review amendment): but an unrecognised value must not silently BUY
  // THE PERMISSIVE MODE either. `driveRun` takes `unknown` and casts, and the
  // project has no TypeScript compiler, so the GovernanceMode union is enforced
  // by neither compiler nor runtime — a caller writing "Controller" or "governed"
  // would get a permissive run it did not ask for. §11 fail-closed: an EXPLICIT
  // value that is not one of the two modes rejects before start(), so no run
  // record is created and nothing runs. An OMITTED field still means "fixture".
  const requestedGovernance: unknown = (request as { readonly governance?: unknown }).governance;
  if (
    requestedGovernance !== undefined &&
    requestedGovernance !== "controller" &&
    requestedGovernance !== "fixture"
  ) {
    return {
      trail: [],
      status: {
        disposition: "failed",
        stage: "intake",
        missing: [],
        reason: `unrecognised governance mode ${JSON.stringify(requestedGovernance) ?? String(requestedGovernance)}: expected "controller" or "fixture"`,
      },
    };
  }
  const governance: GovernanceMode =
    requestedGovernance === "controller" ? "controller" : "fixture";
  const started = await start(request);
  if (started.disposition === "rejected") {
    return {
      trail: [],
      status: { disposition: "failed", stage: "intake", missing: [], reason: started.reason },
    };
  }
  if (started.disposition === "run_in_progress") {
    return {
      trail: [],
      status: {
        disposition: "failed",
        stage: "intake",
        missing: [],
        reason: `${describeLeaseRun(started.runId)} is already held by ${started.holderId}`,
      },
    };
  }

  // controller-pin-run-record (LIM-05): capture the governing controller's
  // identity ONCE, here at drive entry, before any stage runs. A self-build
  // run's green commit mutates the controller's own src/ mid-run; computing
  // the pin at park time would record the MUTATED controller and certify
  // drift instead of detecting it. One capture, threaded to every park this
  // run writes. Fail-closed by omission of any other option: if the identity
  // cannot be computed at all the throw escapes to driveRun's intake failure
  // — a controller that cannot say who it is should not drive a run.
  const entryController = computeControllerIdentity();
  // Set only at re-entry, when the prior record's pin drifted and the owner
  // overrode the refusal (see the re-entry check below); written onto every
  // subsequent park so the override is recorded, never silent.
  let controllerDrift: ControllerDriftRecord | null = null;
  // C1b packet 3: set when a re-entered run's prior record carries a
  // `packet_too_large` block — the owner supplied (or is re-authoring) a
  // replacement DAG that supersedes the failed plan.
  let supersede: SupersedeState | null = null;
  if (started.disposition === "reentered") {
    // LIM-05: a re-entered parked run is about to be re-walked by whatever
    // controller code is on disk NOW. The prior record's pin is compared
    // BEFORE anything persists — re-entry must not overwrite the drift
    // evidence it is about to judge — and before any stage re-runs, so a
    // refused run stays parked, decidable, and un-mutated.
    const priorPin = readPinnedControllerDigest(request.repositoryPath, started.runId);
    if (priorPin !== null && priorPin !== entryController.digest) {
      if (!controllerDriftOverrideActive()) {
        return {
          trail: [],
          status: {
            disposition: "failed",
            stage: "intake",
            missing: [],
            reason: controllerDriftReason(priorPin, entryController.digest),
          },
        };
      }
      controllerDrift = controllerDriftRecord(
        priorPin,
        entryController.digest,
        request.policy.localOperatorPrincipal,
      );
    }
    // C1b packet 3 (FR-K14): a re-entered run whose prior record parked with a
    // `packet_too_large` block is a supersede. Capture the failed packet's
    // evidence, the completed packets and their criteria, and the replacement
    // DAG's bytes (a `plan.json` the owner dropped, or null to re-author).
    const priorRecord = readPriorRunRecord(request.repositoryPath, started.runId);
    const ptl = priorRecord?.packet_too_large;
    if (priorRecord !== null && typeof ptl === "object" && ptl !== null && !Array.isArray(ptl)) {
      const rawPlan = priorRecord.plan;
      const priorPlan =
        typeof rawPlan === "object" && rawPlan !== null && !Array.isArray(rawPlan)
          ? (rawPlan as Record<string, unknown>)
          : {};
      const priorPackets = (
        Array.isArray(priorPlan.packets) ? priorPlan.packets : []
      ).filter(
        (p): p is Record<string, unknown> =>
          typeof p === "object" && p !== null && !Array.isArray(p),
      );
      const asEntry = (p: Record<string, unknown>) => ({
        packet_id: String(p.packet_id),
        base_sha: (p.base_sha ?? null) as string | null,
        red_sha: (p.red_sha ?? null) as string | null,
        green_sha: (p.green_sha ?? null) as string | null,
        disposition: String(p.disposition),
      });
      const failed = priorPackets.find((p) => p.disposition === "failed");
      const rawCriteria = priorPlan.packet_criteria;
      const priorCriteria =
        typeof rawCriteria === "object" && rawCriteria !== null && !Array.isArray(rawCriteria)
          ? (rawCriteria as Record<string, readonly string[]>)
          : {};
      let planJsonBytes: string | null = null;
      try {
        planJsonBytes = readFileSync(
          join(request.repositoryPath, ".aai", "runs", started.runId, "plan.json"),
          "utf8",
        );
      } catch {
        planJsonBytes = null;
      }
      supersede = {
        originalBase: typeof priorRecord.base_sha === "string" ? priorRecord.base_sha : null,
        failedEntry:
          failed === undefined
            ? null
            : {
                base_sha: asEntry(failed).base_sha,
                red_sha: asEntry(failed).red_sha,
                green_sha: asEntry(failed).green_sha,
              },
        completed: priorPackets.filter((p) => p.disposition === "complete").map(asEntry),
        priorCriteria,
        priorDigest: typeof priorPlan.digest === "string" ? priorPlan.digest : "",
        priorPacketId:
          typeof (ptl as Record<string, unknown>).packet_id === "string"
            ? String((ptl as Record<string, unknown>).packet_id)
            : "",
        priorStage:
          typeof (ptl as Record<string, unknown>).stage === "string"
            ? String((ptl as Record<string, unknown>).stage)
            : "",
        priorParkedAt:
          typeof priorRecord.parked_at === "string"
            ? priorRecord.parked_at
            : new Date().toISOString(),
        planJsonBytes,
      };
    }
  }

  // P23 (FR-K6): build the grade context from the run's real state. allowedPaths
  // and criterionIds come from the APPROVED spec/packet (start() already
  // validated this same derivation), repositoryPath from the request. redSha /
  // greenSha / junitXml stay null until a run-state seam records a committed
  // red/green tree and the controller-run suite (a later packet); a null there
  // grades fail-closed. State-sourced, never the agent's word.
  // P23 review (B): derive BEFORE acquiring the lease — a throw here (or in the
  // follow-up that reads real state) must not leak the lease past P20's
  // "release on every exit" invariant.
  const derived = deriveApprovedSpecPlan(request);
  // C1b: on the agent path there is no derived packet yet — the plan-author
  // authors the DAG and the driver takes its root packet after the plan stage
  // advances (below). Until then the spec's own scope (every criterion, every
  // allowed path) drives the plan dispatch and grade. `let` because the packet
  // under execution is only known once the DAG is graded and parsed.
  let approvedPacket =
    derived.planMode === "agent"
      ? {
          packetId: `${derived.specId}-plan`,
          parentIntent: derived.spec.outcome,
          allowedPaths: derived.spec.allowedPaths,
          criterionIds: derived.spec.criterionIds,
          verificationBindings: derived.spec.verificationBindings,
          dependencies: [] as readonly string[],
        }
      : derived.packets[0]!;
  // C1b: recorded on every park so a reader knows whether the packet under
  // execution was controller-derived or taken from an agent-authored DAG. The
  // agent branch fills digest/packet_ids/active_packet_id once the DAG is parsed.
  let planRecord: {
    mode: "agent" | "derive";
    digest?: string;
    packet_ids?: readonly string[];
    active_packet_id?: string;
    packets?: readonly {
      packet_id: string;
      base_sha: string | null;
      red_sha: string | null;
      green_sha: string | null;
      disposition: string;
    }[];
    packet_criteria?: Record<string, readonly string[]>;
    superseded?: readonly {
      digest: string;
      packet_id: string;
      stage: string;
      parked_at: string;
    }[];
  } = { mode: derived.planMode };
  // C1b packet 3: the packet→criterion map, so a supersede re-entry can require
  // every completed packet to reappear with identical criteria. Populated as
  // each packet activates, and seeded from the prior record on a supersede.
  const packetCriteria: Record<string, readonly string[]> = {};
  // C1b packet 2: serial packet execution over an agent-authored DAG. The
  // parsed packets, the ids already walked to completion, and one record entry
  // per finished packet in execution order. `activePacketId` names the packet
  // currently under execution (or the last one, once the plan is exhausted).
  type PlanPacketShape = NonNullable<ReturnType<typeof parsePlanPackets>>[number];
  let planPackets: readonly PlanPacketShape[] = [];
  const completedIds = new Set<string>();
  const packetEntries: {
    packet_id: string;
    base_sha: string | null;
    red_sha: string | null;
    green_sha: string | null;
    disposition: string;
  }[] = [];
  let activePacketId: string | null = null;
  // The per-packet gate tokens a completed packet leaves in `satisfied`: every
  // baseline/red/green/quality token the walk consumes. Cleared on activation of
  // the next packet so it re-walks those stages from blocked, keeping intake and
  // plan tokens. Built exactly as lifecycle-walk's stageTokens so the reset
  // guarantees walkLifecycle blocks at baseline again.
  const perPacketDropTokens = new Set<string>(
    SDLC_LIFECYCLE.filter((s) => ["baseline", "red", "green", "quality"].includes(s.stage)).flatMap(
      (s) => [
        ...s.requirements.P,
        ...s.requirements.A.map((role) => `agent:${role}`),
        ...s.requirements.H,
      ],
    ),
  );
  // Rebuild the packet under execution from a DAG packet — the shared step the
  // plan-advanced (root) and quality-advanced (next) branches both need.
  const activatePacket = (packet: PlanPacketShape): void => {
    // Only the agent path authors a DAG; the guard also narrows `derived` to the
    // branch carrying `spec`.
    if (derived.planMode !== "agent") return;
    approvedPacket = {
      packetId: packet.packetId,
      parentIntent: derived.spec.outcome,
      allowedPaths: [...packet.allowedPaths],
      criterionIds: [...packet.criterionIds],
      verificationBindings: derived.spec.verificationBindings.filter((b) =>
        packet.criterionIds.includes((b as { readonly criterionId: string }).criterionId),
      ),
      dependencies: packet.dependencies,
    };
    gradeContext = {
      repositoryPath: request.repositoryPath,
      redSha,
      greenSha,
      allowedPaths: approvedPacket.allowedPaths,
      criterionIds: approvedPacket.criterionIds,
      junitXml: null,
    };
    activePacketId = packet.packetId;
    packetCriteria[packet.packetId] = [...packet.criterionIds];
    planRecord = {
      ...planRecord,
      active_packet_id: packet.packetId,
      packet_criteria: { ...packetCriteria },
    };
  };
  // The `plan` record a park writes: the derive record unchanged, or for an
  // agent run the completed packets plus the in-flight packet (disposition
  // `failed` when the park failed, else `active`). A packet already completed is
  // not re-appended — its entry is authoritative.
  const planRecordForPark = (disposition: string, stage?: string): typeof planRecord => {
    if (planRecord.mode !== "agent") return planRecord;
    const packets = [...packetEntries];
    if (activePacketId !== null && !completedIds.has(activePacketId)) {
      // C1b packet 3: null the shas on the FAILING stage, not on the
      // `greenSha === redSha` heuristic. A red-failed packet has no red commit
      // of its own (red commits only on acceptance, so redSha === base), and a
      // green-failed packet has no green commit — key both directly on `stage`.
      const redFailed = stage === "red";
      const greenFailed = stage === "green";
      packets.push({
        packet_id: activePacketId,
        base_sha: baseRefSnapshot,
        red_sha: redFailed ? null : redSha,
        green_sha: redFailed || greenFailed ? null : greenSha,
        disposition: disposition === "failed" ? "failed" : "active",
      });
    }
    return { ...planRecord, packets } as typeof planRecord;
  };
  // C1b packet 3: seed the completed packets (and their criteria) from the
  // prior record so a supersede re-entry does not re-walk work already on the
  // branch; the plan stage then activates the first uncompleted packet.
  if (supersede !== null) {
    for (const c of supersede.completed) {
      packetEntries.push({
        packet_id: c.packet_id,
        base_sha: c.base_sha,
        red_sha: c.red_sha,
        green_sha: c.green_sha,
        disposition: c.disposition,
      });
      completedIds.add(c.packet_id);
    }
    Object.assign(packetCriteria, supersede.priorCriteria);
  }
  // P27 took the baseline unit-suite command from the packet's first verification
  // binding. P38 SUPERSEDES that; what survives from P27 is only the argv shape
  // (fixture commands are quoting-free; robust shell parsing is a later concern)
  // and the rule that the command is controller-derived, never worker-supplied.
  // P38 (OI-13): the baseline suite is the §8 profile's `test_unit` — the
  // REPOSITORY's own suite — not acceptance criterion AC-1's command. Baseline
  // exists to prove the suite is green BEFORE anything changes; pointing it at
  // an acceptance criterion demanded that the not-yet-written test already pass,
  // and writing that test is precisely what the Red stage is for. Controller-
  // derived from policy, never worker-supplied. An unreadable profile yields no
  // command, and runControllerBaseline then defers exactly as it did before.
  const stageProfile = readStageProfile(request.repositoryPath);
  const baselineTestCommand = stageProfile?.testUnit ?? [];
  // Read from the environment for the same reason the adapters do: the model is
  // process-level configuration, not per-request state, and driveRun's callers
  // thread no adapter config. Null means "nothing pinned", which is itself
  // evidence — see PersistParkOptions.adapterModel.
  const adapterModel = process.env.FACTORY_ADAPTER_MODEL?.trim() || null;
  const adapterReasoningEffort = process.env.FACTORY_ADAPTER_REASONING_EFFORT?.trim() || null;
  // P33 (D1): the §8 quality profile's coverage command + floor, read once from
  // .aai/policy/factory.yaml. null when the repo declares no readable profile —
  // the controller then has no coverage command to run, threads no summary and no
  // floor, and the green coverage gate is simply not evaluated (today's behaviour
  // for a repo with no summary).
  // ponytail: the controller only RUNS it on a GOVERNED run, so a fixture run
  // keeps its worker-supplied coverage token. P38 review m6 retires the SECOND
  // half of P33's rationale — "a fixture run must not have an arbitrary
  // policy-declared command spawned inside it" is no longer true of this file:
  // `readStageProfile` above is ungated, and a fixture run now spawns the §8
  // `test_unit` at baseline and the §8 capabilities at quality. The gate that
  // remains is P33's token scoping alone. Inert today — `driveRun`'s only call
  // site (src/cli.ts) passes `governance: "controller"`. Drop it when fixture
  // mode retires.
  const coverageProfile: CoverageProfile | null =
    governance === "controller" ? readCoverageProfile(request.repositoryPath) : null;
  // P38 (OI-4), correcting P29: the quality profile's required capabilities are
  // the §8 profile's DECLARED capabilities (lint, types, sca, secrets, sast,
  // build) and their commands — not the packet's criterion ids re-running their
  // own acceptance tests. The old wiring made
  // `quality.required-capabilities-or-brownfield-rule-pass` overstate what ran.
  // Controller-derived from policy, never worker-supplied.
  const capabilityCommands: Record<string, readonly string[]> = {
    ...(stageProfile?.capabilities ?? {}),
  };
  const requiredCapabilities = Object.keys(capabilityCommands);
  // C1b: `let` so the plan-routing step can rebuild it against the packet under
  // execution once the DAG is parsed. On the agent path it carries the classifier
  // context, which gradePlan consumes to mint plan.classifier-rule-valid; later
  // stages ignore it.
  let gradeContext: GradeContext = {
    repositoryPath: request.repositoryPath,
    redSha: null,
    greenSha: null,
    allowedPaths: approvedPacket.allowedPaths,
    criterionIds: approvedPacket.criterionIds,
    junitXml: null,
    ...(derived.planMode === "agent"
      ? {
          classifier: {
            moduleRoots: request.policy.moduleRoots,
            ceiling: request.policy.singlePacketCriteriaCeiling,
            specAllowedPaths: derived.spec.allowedPaths,
          },
        }
      : {}),
  };

  // P28 (FR-K6): the committed red/green trees the run produces, captured from
  // the repo (never the agent's word). redSha is the HEAD after the red stage
  // advances; greenSha is the HEAD after the green stage's worker commits. The
  // base-ref snapshot is the base HEAD at run start — in Kernel v1 nothing moves
  // the base under the run, so the red/green snapshots are equal; a later packet
  // wires a real base ref that could move, and the grader's compare catches it.
  // C1b packet 2: the run's ORIGINAL base is kept for the park record's
  // base_sha (verdict.ts:162 compares it for candidate freshness), while
  // `baseRefSnapshot` is reassigned to each serial packet's base — the prior
  // packet's green sha — as the agent-mode walk rewinds. On a single walk
  // (derive, or the first packet) the two are equal, so the derive path is
  // byte-for-byte unchanged.
  // C1b packet 3: on a supersede re-entry the run's ORIGINAL base is the prior
  // record's (HEAD at re-entry is the failed packet's tree, not the base), and
  // the active packet's base is the failed packet's base — the reset target.
  // Neither is a live HEAD read, so they hold regardless of when the reset runs.
  const runBaseSnapshot = supersede?.originalBase ?? resolveHeadSha(request.repositoryPath);
  let baseRefSnapshot =
    supersede?.failedEntry?.base_sha ?? runBaseSnapshot;
  let redSha: string | null = null;
  let greenSha: string | null = null;
  let baselineGreen = false;
  // P33: the controller's own coverage run at green, kept for the durable record.
  let greenCoverage: GreenSuiteResult | null = null;
  // P42 (§10, OI-4): the quality verdict has to outlive its loop iteration —
  // `park` is a closure defined above the stage loop, so a per-iteration const
  // is invisible to it. Same shape and same reason as greenCoverage.
  let qualityVerdict: QualityVerdict | null = null;
  // OI-25: the baseline result has to outlive its loop iteration for the same
  // reason qualityVerdict does — `park` is a closure defined above the loop, and
  // a run that PASSES baseline parks at a later stage still owing this evidence.
  let baselineResult: BaselineResult | null = null;
  // C1b: the plan-author's raw response text, captured by the plan grade wrapper
  // so the routing step below can parse the DAG and digest the exact bytes the
  // grader validated. Only written on the agent path.
  let planDagText: string | null = null;
  // OI-17 (requirement 4): the adapter's normalized outcome and diagnostic for
  // the invocation that parked the run, so an operator can tell auth from
  // timeout from process-exit from unparseable output WITHOUT re-running blind.
  let adapterFailure: PersistParkOptions["adapterFailure"] = null;
  // OI-17 (requirement 1): one entry per invocation attempt, bounded, kept in
  // the same durable record adapter_failure and baseline_evidence use.
  const adapterAttempts: AdapterAttemptEntry[] = [];
  let adapterAttemptCount = 0;
  // Probed facts are memoized per adapter INSTANCE for the whole run. The vendor
  // adapters spawn two processes for a preflight (`--version`, `auth status`),
  // so re-probing before every attempt would pay for evidence with latency on
  // every stage. The consequence is deliberate and worth naming: an entry
  // describes the adapter as it was FIRST probed in this run, so an executable
  // replaced mid-run is recorded stale — this is not a live read.
  const probedFacts = new Map<Adapter, AdapterFacts | null>();
  const probeAdapterFacts = async (adapter: Adapter): Promise<AdapterFacts | null> => {
    if (probedFacts.has(adapter)) return probedFacts.get(adapter) ?? null;
    let facts: AdapterFacts | null = null;
    try {
      const probed: unknown = await adapter.preflight();
      facts = typeof probed === "object" && probed !== null ? (probed as AdapterFacts) : null;
    } catch {
      // The vendor CLI is gone, or its auth directory cannot be read. A run must
      // not fail because its provenance could not be taken — degrade to an entry
      // that says the provenance is unavailable.
      facts = null;
    }
    probedFacts.set(adapter, facts);
    return facts;
  };
  const recordAdapterAttempt = async (
    adapter: Adapter,
    outcome: AdapterOutcome,
    diagnosticKind: string | undefined,
    resilience?: InvocationResilience,
  ): Promise<void> => {
    adapterAttemptCount += 1;
    adapterAttempts.push(
      describeAdapterAttempt(await probeAdapterFacts(adapter), outcome, diagnosticKind, resilience),
    );
    // Keep the most recent: on a run long enough to truncate, the attempts that
    // explain where it ended are the ones at the end.
    if (adapterAttempts.length > MAX_ADAPTER_ATTEMPTS) adapterAttempts.shift();
  };
  // OI-19: what the review stage actually produced — the parsed findings (all
  // severities, null when the reply had no parseable record) and a bounded
  // copy of the raw reply so a malformed-output park is diagnosable without a
  // rerun. Persisted on every park so the owner signs a verdict having the
  // review in the durable record, and "no blocking findings" is
  // distinguishable from "no findings".
  let reviewEvidence: ReviewEvidence | null = null;

  // P20 (FR-K7): hold the repo lease for the WHOLE stage loop. start()
  // validated the handoff but released its own lease; re-acquire under the
  // same holder so a rival driveRun launched mid-loop is refused
  // run_in_progress-style before any of its stages run.
  // ponytail: the release/re-acquire gap is a known race window; closing it
  // means start() handing its lease to the caller — a start.ts seam change
  // owned by a later packet.
  const store = openGitRefStore(request.repositoryPath);
  const lease = acquireLease(store, {
    run_id: started.runId,
    holder_id: request.holderId,
    holder_pid: process.pid,
    surface: request.surface,
    acquired_at: new Date().toISOString(),
  });
  if (lease.disposition === "run_in_progress") {
    return {
      trail: [],
      status: {
        disposition: "failed",
        stage: "intake",
        missing: [],
        reason: `${describeLeaseRun(lease.current.lease.run_id)} is already held by ${lease.current.lease.holder_id}`,
      },
    };
  }

  const trail: DriveTrailEntry[] = [];
  // start() succeeded, so the digest-bound approval envelope is validated:
  // that is the evidence behind owner.spec-approved.
  let satisfied: ReadonlySet<string> = new Set(DRIVER_GRANTED_TOKENS);

  // P26: per-stage controller grants sourced from the validated state above.
  // Both are reached only after start() and the derive succeeded, so the
  // evidence behind every token holds; plan is gated on the derive mode for
  // honesty (an agent-authored plan, if that path ever existed, would not be
  // controller-derivable).
  const stageGrants: Record<string, readonly string[]> = {
    intake: INTAKE_GRANT_TOKENS,
    ...(derived.planMode === "derive" ? { plan: PLAN_GRANT_TOKENS } : {}),
  };

  // P25 (run observability): mirror each transition to the run's append-only
  // event log. seq is a per-run 0-based counter so ordering never depends on
  // clock resolution. PURE OUTPUT — best-effort inside appendRunEvent; the
  // driver never reads the log back.
  let seq = 0;
  const emit = (
    kind: RunEvent["kind"],
    stage: string,
    extra?: Pick<RunEvent, "tokens" | "missing" | "disposition" | "usage">,
  ): void => {
    appendRunEvent(request.repositoryPath, started.runId, {
      ts: new Date().toISOString(),
      run_id: started.runId,
      seq: seq++,
      stage,
      kind,
      ...extra,
    });
  };

  // Every park persists its honest stage (FR-K8) and mirrors it (P25) before
  // reporting it. Emission order is stage-parked then run-parked, so a full
  // run's log reads run-started, stage-advanced*, stage-parked, run-parked.
  const park = (
    stage: string,
    tokens: readonly string[],
    rawStatus: Omit<DriveStatus, "stage">,
    usage?: RunEvent["usage"],
    // C1b packet 3: a supersede re-entry parks BEFORE the plan stage rebuilds
    // planRecord (retention refused at plan, reset refused at intake). Passing
    // the in-flight planRecord would clobber the prior record's plan (and its
    // digest); `preservePlan` writes plan: null so `persistPark`'s carried
    // prior plan survives byte-for-byte.
    preservePlan = false,
  ): DriveResult => {
    // OI-39 (option 2): when red advances, the controller commits its
    // failing-test tree onto the current branch — `green.red-commit-is-ancestor`
    // gates green on it, so that commit is load-bearing and stays. If green is
    // then refused the run parks fail-closed and correctly, but the branch is
    // left carrying red's failing tests and the record said nothing about it
    // (`review-refusal-evidence` v3 left `main` with 17 failing tests until it
    // was reverted by hand). APPEND to the reason the grade already produced —
    // a green refused for a suite failure must still LEAD with that sentence —
    // and name the sha so the operator can act without reading the event log.
    // Every other park, and a green park on a run with no red commit of its
    // own, is byte-identical.
    const status: Omit<DriveStatus, "stage"> =
      stage === "green" &&
      redSha !== null &&
      redSha !== baseRefSnapshot &&
      typeof rawStatus.reason === "string"
        ? { ...rawStatus, reason: `${rawStatus.reason}. The branch now carries red's failing tests from commit ${redSha}; revert it if this run is not resumed` }
        : rawStatus;
    // C1b packet 3 (FR-K14): the `packet_too_large` block — written only when an
    // agent-mode packet FAILS at baseline/red/green/quality (never a derive run,
    // never a needs_owner park). The evidence shas null on the failing stage,
    // mirroring the plan.packets entry.
    const packetStage =
      stage === "baseline" || stage === "red" || stage === "green" || stage === "quality";
    const packetTooLarge =
      derived.planMode === "agent" &&
      activePacketId !== null &&
      status.disposition === "failed" &&
      packetStage
        ? {
            packet_id: activePacketId,
            stage,
            reason: typeof status.reason === "string" ? status.reason : "",
            missing: status.missing,
            evidence: {
              base_sha: baseRefSnapshot,
              red_sha: stage === "red" ? null : redSha,
              green_sha: stage === "red" || stage === "green" ? null : greenSha,
            },
            parent_intent: {
              outcome: derived.planMode === "agent" ? derived.spec.outcome : "",
              criterion_ids: [...approvedPacket.criterionIds],
            },
          }
        : null;
    persistPark({
      store,
      repositoryPath: request.repositoryPath,
      runId: started.runId,
      specId: derived.specId,
      stage,
      disposition: status.disposition,
      missing: status.missing,
      satisfied,
      governance,
      redSha,
      greenSha,
      baseSha: runBaseSnapshot,
      criterionIds: approvedPacket.criterionIds,
      followUpPackets: derived.followUpPackets ?? null,
      greenCoverage,
      qualityVerdict,
      baseline: baselineResult,
      adapterFailure,
      adapterAttempts: {
        entries: adapterAttempts,
        dropped: adapterAttemptCount - adapterAttempts.length,
      },
      adapterModel,
      adapterReasoningEffort,
      review: reviewEvidence,
      policyVersion: request.policy.policyVersion,
      controller: entryController,
      controllerDrift,
      plan: preservePlan ? null : planRecordForPark(status.disposition, stage),
      packetTooLarge: preservePlan ? undefined : packetTooLarge,
    });
    emit("stage-parked", stage, {
      tokens,
      missing: status.missing,
      disposition: status.disposition,
      // OI-28: mirror the reason and the baseline evidence into the APPEND-ONLY
      // log as well as the record. `resolveRunId` reuses the spec index, so a
      // second `factory run --spec` on the same spec gets the SAME run id and
      // overwrites `run.json` — destroying the first attempt's park evidence.
      // The mirror survives that, so a run that failed once and was retried can
      // still be diagnosed. This is why the 1/279 baseline failure of
      // 2026-08-28 could not be diagnosed: attempt 2 overwrote the record while
      // the mirror kept only the gate tokens.
      ...(typeof (status as { readonly reason?: unknown }).reason === "string"
        ? { reason: (status as { readonly reason: string }).reason }
        : {}),
      ...(stage === "baseline" && baselineResult !== null
        ? {
            baseline_evidence: {
              command: [...baselineResult.records.testCommand],
              ran: baselineResult.records.suiteRan,
              total: baselineResult.records.total,
              failures: baselineResult.records.failures,
              failing_tests: [...baselineResult.records.failingTests],
              truncated: baselineResult.records.failingTestsTruncated,
            },
          }
        : {}),
      ...(usage === undefined ? {} : { usage }),
    });
    const result = parked(trail, stage, tokens, status);
    emit("run-parked", stage, { disposition: status.disposition });
    return result;
  };

  try {
    // Loop entry: the run is now driving (seq 0).
    emit("run-started", STAGE_NAMES[0]!);

    // C1b packet 3 (FR-K14): a supersede re-entry validates completed-packet
    // retention (with a plan.json) and resets the branch to the failed packet's
    // base BEFORE walking. Order matters: a dropped/re-scoped completed packet
    // parks at plan with the branch UNTOUCHED, so retention is checked first; a
    // foreign commit makes the reset refuse and parks at intake.
    if (supersede !== null) {
      if (supersede.planJsonBytes !== null) {
        const replacement = parsePlanPackets(supersede.planJsonBytes);
        for (const c of supersede.completed) {
          const match = replacement?.find((p) => p.packetId === c.packet_id);
          const original = supersede.priorCriteria[c.packet_id] ?? [];
          if (
            match === undefined ||
            [...match.criterionIds].join(" ") !== [...original].join(" ")
          ) {
            return park(
              "plan",
              [],
              {
                disposition: "failed",
                missing: [],
                reason: `superseding plan drops or re-scopes completed packet ${c.packet_id}; the branch and plan are unchanged`,
              },
              undefined,
              true,
            );
          }
        }
      }
      if (supersede.failedEntry !== null) {
        // resetBranchToBase (reused unchanged) refuses on ANY dirty tree, but
        // `git reset --hard` preserves untracked files regardless. Stash the
        // untracked inputs/artifacts (policy, spec, run dirs) out of the way so
        // the base reset can proceed, then restore them for the walk. A genuine
        // foreign commit still refuses — the branch content, not the working
        // tree, is what disqualifies it.
        const dirty =
          spawnSync("git", ["-C", request.repositoryPath, "status", "--porcelain"], {
            encoding: "utf8",
          }).stdout.trim() !== "";
        if (dirty) {
          spawnSync("git", [
            "-C",
            request.repositoryPath,
            "stash",
            "push",
            "--include-untracked",
            "--quiet",
            "-m",
            "factory-supersede-reset",
          ]);
        }
        const reset = resetBranchToBase(request.repositoryPath, supersede.failedEntry);
        if (dirty) {
          spawnSync("git", ["-C", request.repositoryPath, "stash", "pop", "--quiet"]);
        }
        if (reset.disposition === "refused") {
          return park(
            "intake",
            [],
            { disposition: "failed", missing: [], reason: reset.reason },
            undefined,
            true,
          );
        }
      }
    }
    // C1b packet 2: a mutable index over STAGE_NAMES so the agent-mode walk can
    // rewind to baseline after a packet's quality advances. Identical to the old
    // `for (const [index, stageName] of STAGE_NAMES.entries())` for a single
    // walk — each advance does `index += 1`.
    let index = 0;
    while (index < STAGE_NAMES.length) {
      const stageName = STAGE_NAMES[index]!;
      // Live observability: mark the stage as begun BEFORE its work, so a
      // reader of the mirror can tell "red is running" from "red never began"
      // during a minutes-long agent invocation. Best-effort like every emit.
      emit("stage-started", stageName);
      const worker = request.stages[stageName];
      if (worker === undefined) {
        return park(stageName, [], {
          disposition: "failed",
          missing: [],
          reason: `no worker injected for stage ${stageName}`,
        });
      }

      // P26: gate tokens the controller grants for this stage from validated
      // state (idempotent Set-union — fixtures that already mint them are
      // unaffected). Never sourced from worker output.
      const granted = stageGrants[stageName] ?? [];
      // A derived plan is authored by the controller, not an agent: for the real
      // role-bound plan worker (buildRoleStages sets `identity`) on the derive
      // path, grant plan from state and DO NOT dispatch the plan-author. Injected
      // fixtures carry no identity, so they are still invoked — preserving
      // failInvocationAt:"plan" parking and the grade-context wiring.
      const derivePlan =
        stageName === "plan" &&
        granted.length > 0 &&
        (worker as { readonly identity?: unknown }).identity !== undefined;

      // P27: at the baseline stage the controller runs the baseline profile on
      // the base commit and OWNS the three baseline tokens from that RESULT — the
      // baseline worker is skipped, so agent output can never mint a baseline.*
      // token (the state-sourced strip, mirroring P26 plan-derive). null means no
      // base commit to baseline; the stage then falls through to the worker path.
      const controllerBaseline =
        stageName === "baseline"
          ? runControllerBaseline(
              request.repositoryPath,
              baselineTestCommand,
              coverageProfile?.command ?? [],
            )
          : null;

      // P29: at the quality and reconcile stages the controller runs its own
      // real check and OWNS the stage's tokens from that RESULT — the worker is
      // skipped, so agent output can never mint quality.*/reconcile.* (the
      // state-sourced strip, mirroring P27 baseline). null defers to the worker.
      const controllerQuality =
        stageName === "quality"
          ? runControllerQuality(
              request.repositoryPath,
              requiredCapabilities,
              capabilityCommands,
              stageProfile ?? undefined,
            )
          : null;
      const controllerReconcile =
        stageName === "reconcile"
          ? runControllerReconcile(request.repositoryPath, baseRefSnapshot)
          : null;

      // P32 (OI-1/OI-5): on a GOVERNED run a controller-owned stage must produce
      // its OWN result. When it cannot — no base commit, an unrunnable command,
      // no capability executed — park fail-closed HERE instead of taking the
      // defer path to the injected worker (the latent fail-open both issues
      // name). Fixture runs keep the defer path, which is why the mode is
      // explicit rather than inferred.
      if (
        governance === "controller" &&
        CONTROLLER_OWNED_STAGES.includes(stageName) &&
        controllerBaseline === null &&
        controllerQuality === null &&
        controllerReconcile === null
      ) {
        return park(stageName, [], {
          disposition: "failed",
          missing: walkLifecycle(satisfied).missing,
          reason: `governed run: no controller result for stage ${stageName}`,
        });
      }

      // F1 (P18 review): a throwing worker/grader must not discard the trail or
      // misattribute the failure to intake; park at THIS stage with the trail.
      let result: Awaited<ReturnType<typeof runStage>> | undefined;
      // The resilience summary of the attempt `result` came from, when reported.
      let lastResilience: InvocationResilience | undefined;
      let stageTokens: string[];
      if (controllerBaseline !== null) {
        // An accepted baseline additionally attests baseline's conditional H
        // (owner.baseline-exception-if-required) non-applicable — there is no
        // regression, so no owner exception is required — exactly as plan's
        // derive grants owner.scope-or-waiver-exception-if-required. A rejected
        // baseline attests nothing extra, so the walk parks fail-closed here.
        const baselineGrants = controllerBaseline.accepted
          ? [...controllerBaseline.tokens, "owner.baseline-exception-if-required"]
          : controllerBaseline.tokens;
        // Keep the result for the park record, where the controller OWNS the
        // stage — a worker-run baseline never writes §10 evidence, the same rule
        // the tokens themselves follow.
        baselineResult = controllerBaseline;
        satisfied = new Set([...satisfied, ...baselineGrants]);
        stageTokens = [...baselineGrants];
        baselineGreen = controllerBaseline.accepted;
      } else if (controllerQuality !== null) {
        // P42: keep the verdict for the park record. Assigned here, where the
        // controller OWNS the stage, so a worker-run quality stage never writes
        // §10 evidence — the same rule the token itself follows.
        qualityVerdict = controllerQuality.verdict;
        // The controller's runQuality result governs quality: its token is
        // granted from the RESULT, and a not-accepted result grants nothing (the
        // walk then parks fail-closed here — the worker's minted quality.* never
        // substitutes).
        satisfied = new Set([...satisfied, ...controllerQuality.tokens]);
        stageTokens = [...controllerQuality.tokens];
      } else if (controllerReconcile !== null) {
        // An accepted reconcile additionally attests reconcile's conditional H
        // (owner.plan-invalidating-drift-if-required) non-applicable — the target
        // did not move, so no owner decision is required — exactly as P27 baseline
        // grants owner.baseline-exception-if-required. A classified-but-moved
        // (not accepted) result grants only drift-classified, so the walk parks.
        const reconcileGrants = controllerReconcile.accepted
          ? [...controllerReconcile.tokens, "owner.plan-invalidating-drift-if-required"]
          : controllerReconcile.tokens;
        satisfied = new Set([...satisfied, ...reconcileGrants]);
        stageTokens = [...reconcileGrants];
      } else if (derivePlan) {
        satisfied = new Set([...satisfied, ...granted]);
        stageTokens = [...granted];
      } else {
        // P28 (FR-K6): at the green stage the controller grades the committed
        // green tree, not the agent's word. runStage invokes the worker (which
        // commits the green tree) BEFORE calling grade, so this wrapper resolves
        // the post-invocation state — greenSha = HEAD now, the green-tree coverage
        // summary — and threads it plus the red SHA, coverage floor, and both base
        // -ref snapshots into the real green grader. greenSha is recorded for the
        // durable run record here (it exists only after the worker commits).
        const roleBoundWorker = (worker as { readonly identity?: unknown }).identity !== undefined;
        const needsIsolatedRed = stageName === "red" && roleBoundWorker;
        const ownerSnapshot = needsIsolatedRed ? snapshotOwnerWorktree(request.repositoryPath) : null;
        // OI-30: `let`, because a retry must not inherit the worktree a
        // timed-out first attempt was writing into. Replaced (never mutated in
        // place) between attempts below.
        let redWorktree =
          needsIsolatedRed
            ? createRedWorktree(request.repositoryPath, baseRefSnapshot)
            : null;
        if (stageName === "red" && roleBoundWorker && redWorktree === null) {
          return park(stageName, [], {
            disposition: "failed",
            missing: walkLifecycle(satisfied).missing,
            reason: "red controller could not create isolated worktree",
          });
        }
        if (stageName === "red" && roleBoundWorker && ownerSnapshot === null) {
          removeRedWorktree(request.repositoryPath, redWorktree);
          return park(stageName, [], {
            disposition: "failed",
            missing: walkLifecycle(satisfied).missing,
            reason: "red controller could not snapshot owner worktree",
          });
        }
        // Green: dirty paths present BEFORE the agent's turn are the owner's,
        // not the agent's; commitGreenChanges only polices what the turn adds.
        const preGreenDirty: ReadonlySet<string> = new Set(
          stageName === "green" ? dirtyImplementationPaths(request.repositoryPath) ?? [] : [],
        );
        // Security gate input: the ref store as it stands BEFORE the agent's
        // green turn. Role-bound only — a fixture worker commits its own tree,
        // which legitimately moves refs/heads and would false-quarantine.
        const preGreenRefs =
          stageName === "green" && roleBoundWorker
            ? git(request.repositoryPath, ["for-each-ref", ...OBSERVED_EFFECT_REF_SCOPE]).stdout
            : null;
        const stageGrade: (agentText: string, context?: GradeContext) => GradeResult =
          stageName === "red" && redWorktree !== null
            ? (agentText) => {
                // OI-30 made `redWorktree` reassignable so a retry gets a fresh
                // one, which means this closure reads it at GRADE time, not at
                // definition time — deliberately, so the retry is graded in the
                // worktree it actually ran in. The null check is therefore real
                // rather than ceremonial: the recreate path parks on failure, so
                // reaching here with null would be a defect, and refusing the
                // grade is the fail-closed answer to it.
                if (redWorktree === null) {
                  return { tokens: [], accepted: false, reason: "red worktree is missing at grade time" };
                }
                return controllerRedGrade({
                  repositoryPath: request.repositoryPath,
                  worktree: redWorktree,
                  baselineGreen,
                  testCommand: baselineTestCommand,
                  agentText,
                  ownerSnapshot: ownerSnapshot!,
                });
              }
            : stageName === "green"
            ? (agentText) => {
                // End-of-turn ref snapshot, taken BEFORE the controller's own
                // commit moves refs/heads — the security gate polices the
                // agent's turn, not the controller's bookkeeping.
                const postTurnRefs =
                  preGreenRefs === null
                    ? null
                    : git(request.repositoryPath, [
                        "for-each-ref",
                        ...OBSERVED_EFFECT_REF_SCOPE,
                      ]).stdout;
                const greenCommit = commitGreenChanges(
                  request.repositoryPath,
                  approvedPacket.allowedPaths,
                  preGreenDirty,
                );
                if (greenCommit.reason !== undefined) {
                  return { tokens: [], accepted: false, reason: greenCommit.reason };
                }
                greenSha = resolveHeadSha(request.repositoryPath);
                // §11 untrusted-result gate (audit disposition 2026-08-27): the
                // committed packet diff, the agent's reply, and the ref delta of
                // the turn. Quarantine parks the run at green fail-closed.
                if (preGreenRefs !== null && postTurnRefs !== null && greenSha !== null) {
                  const security = evaluateGreenSecurity({
                    repositoryPath: request.repositoryPath,
                    baseSha: baseRefSnapshot ?? greenSha,
                    redSha: redSha ?? baseRefSnapshot ?? greenSha,
                    greenSha,
                    allowedPaths: approvedPacket.allowedPaths,
                    refsBefore: preGreenRefs,
                    refsAfter: postTurnRefs,
                    agentText,
                  });
                  if (!security.accepted) {
                    return { tokens: [], accepted: false, reason: security.reason };
                  }
                }
                // P33 (D2/D3): the controller runs the profile's coverage command
                // on the committed green tree and threads the summary IT produced
                // plus the PROFILE's floor. runGreenSuite deletes any file at the
                // summary path before spawning, so an agent-planted (or stale)
                // summary can never be what is graded.
                greenCoverage =
                  coverageProfile === null
                    ? null
                    : runGreenSuite({
                        repositoryPath: request.repositoryPath,
                        greenSha,
                        coverageCommand: coverageProfile.command,
                        coverageFloor: coverageProfile.floor,
                        coverageSummaryPath: BASELINE_COVERAGE_SUMMARY_PATH,
                        timeoutMs: stageTimeoutMs(),
                      });
                // Nothing ran the green SUITE before this: coverage was
                // controller-run (P33) but junitXml stayed null from the default
                // context, so gradeGreenSuite always reported "suite did not
                // run" on a real role-bound green. Run the §8 suite on the
                // committed green tree — the TDD contract: red's failing tests
                // must now pass with the implementation.
                const greenJunit =
                  greenSha === null
                    ? null
                    : runSuiteCommand({
                        repositoryPath: request.repositoryPath,
                        command: baselineTestCommand,
                        timeoutMs: stageTimeoutMs(),
                      });
                return worker.grade(agentText, {
                  ...gradeContext,
                  junitXml: greenJunit,
                  redSha,
                  greenSha,
                  ...(greenCoverage === null
                    ? {}
                    : {
                        coverageSummary: greenCoverage.coverageSummary,
                        coverageFloor: coverageProfile!.floor,
                      }),
                  baseRefAtRed: baseRefSnapshot,
                  baseRefAtGreen: baseRefSnapshot,
                });
              }
            : stageName === "review"
            ? (agentText, context) => {
                // OI-19: retain what the review gate is about to summarize —
                // the parsed findings and a bounded copy of the raw reply —
                // BEFORE the grade reduces it to a token. Captured here, in
                // the wrapper, because agentText never reaches the stage loop.
                const grade = worker.grade(agentText, context);
                reviewEvidence = {
                  findings: grade.review?.findings ?? null,
                  agent_reply: agentText.slice(0, MAX_REVIEW_REPLY_BYTES),
                };
                return grade;
              }
            : stageName === "plan" && derived.planMode === "agent"
            ? (agentText, context) => {
                // C1b: capture the raw DAG text BEFORE grading so the routing
                // step below parses and digests the exact bytes the grader saw.
                // Packet 3: on a supersede the owner's plan.json bytes are graded
                // and digested in place of the author's text (the author is still
                // dispatched — one spent call — so the seam stays a runStage
                // change, deferred).
                const graded = supersede?.planJsonBytes ?? agentText;
                planDagText = graded;
                return worker.grade(graded, context);
              }
            : worker.grade;
        // Packet adapter-retry-1: one bounded automatic retry when the
        // adapter's own outcome is transient_failure. A fresh invocation of
        // the same request, no backoff, no second retry; every other outcome
        // keeps its single shot.
        let retried = false;
        try {
          for (let attempt = 1; attempt <= 2; attempt += 1) {
            // OI-30: a `transient_failure` is exactly ETIMEDOUT — the process was
            // killed mid-turn, so whatever it had written is still on disk:
            // partial test files, a half-staged index, a lock. Reusing that
            // worktree grades attempt 2 as though it were a clean attempt.
            // Recreate from the same base before retrying. `removeRedWorktree`
            // stays in the `finally` below so every exit path still cleans up
            // whichever worktree is current.
            if (attempt === 2 && redWorktree !== null) {
              removeRedWorktree(request.repositoryPath, redWorktree);
              redWorktree = createRedWorktree(request.repositoryPath, baseRefSnapshot);
              if (redWorktree === null) {
                return park(stageName, [], {
                  disposition: "failed",
                  missing: walkLifecycle(satisfied).missing,
                  reason: "red controller could not recreate isolated worktree for the retry",
                });
              }
            }
            // Packet adapter-attempt-visibility-1: runStage narrows the adapter's
            // InvocationResult to a RunStageResult and drops `resilience`
            // (run-stage.ts is outside this packet's paths), so capture the raw
            // result here. Provenance still probes `worker.adapter` itself.
            lastResilience = undefined;
            result = await runStage({
              role: worker.role,
              roleProcedure: worker.roleProcedure,
              jobContext:
                (worker as { readonly identity?: unknown }).identity === undefined
                  ? worker.jobContext
                  : renderRoleJobContext({
                      stage: stageName,
                      canonicalSpecPayload: request.canonicalSpecPayload,
                      packet: approvedPacket,
                      classifierVerdict: derived.classifier.verdict,
                    }),
              adapter: {
                preflight: () => worker.adapter.preflight(),
                invoke: async (invocationRequest) => {
                  const raw = await worker.adapter.invoke(invocationRequest);
                  lastResilience = raw.resilience;
                  return raw;
                },
              },
              grade: stageGrade,
              context: gradeContext,
              governance,
              invocation: {
                jobId: `${started.runId}:${stageName}`,
                requestId: randomUUID(),
                surface: request.surface as AdapterSurface,
                workingDirectory: redWorktree?.path ?? request.repositoryPath,
              },
              priorSatisfied: satisfied,
            });
            // OI-17 (requirement 1): record the attempt that just ran — success
            // or failure — before the retry decision, so the history carries
            // both halves of a retried stage rather than only its last word.
            await recordAdapterAttempt(
              worker.adapter,
              result.outcome,
              result.diagnostic?.kind,
              lastResilience,
            );
            if (result.outcome !== "transient_failure") break;
            retried = true;
          }
        } catch (error) {
          // OI-44: the append above never runs when the invocation THROWS, so
          // the record showed N entries for N+1 invocations with nothing saying
          // so. The adapters normalize auth, timeout, exit-code and malformed
          // output into outcomes, so reaching here means a defect or an
          // infrastructure failure — exactly when an honest attempt history
          // matters most. `kind: "threw"` is what separates this from an
          // adapter that ANSWERED with a failure.
          try {
            await recordAdapterAttempt(worker.adapter, "fatal_failure", "threw");
          } catch {
            // Best-effort exactly as the neighbouring durable writes are: the
            // bookkeeping must not be able to prevent or alter the park, so a
            // failure here is swallowed rather than escaping the catch.
          }
          return park(stageName, [], {
            disposition: "failed",
            missing: [],
            reason: `stage ${stageName} threw: ${error instanceof Error ? error.message : String(error)}`,
          });
        } finally {
          removeRedWorktree(request.repositoryPath, redWorktree);
        }

        // OI-15: the loop always assigns on a non-throwing path, but nothing in
        // the types says so, and `result!` would assert it rather than check it.
        // A guard is honest and fail-closed: if the loop somehow produced
        // nothing, park rather than dereference undefined inside a running
        // factory.
        if (result === undefined) {
          return park(stageName, [], {
            disposition: "failed",
            missing: walkLifecycle(satisfied).missing,
            reason: `stage ${stageName} produced no invocation result`,
          });
        }

        // Failed invocation (retry exhausted or non-transient): park fail-closed
        // naming the stage's unmet gate.
        //
        // OI-12: the controller's grants for THIS stage are facts it established
        // BEFORE dispatching anything — start() validated the digest-bound
        // approval envelope, driveRun holds the lease, the single-packet derive
        // succeeded. An adapter that never answered cannot un-establish them. The
        // walk was computed against `priorSatisfied`, which does not carry them,
        // so an intake auth_failure used to report
        //   missing: [approval-envelope-valid, spec-digest-matches, lease-acquired]
        // — telling an operator their approval was bad when the real cause was a
        // dead adapter, and the truth sat in `reason` where automation does not
        // look. Union them in before the walk so `missing` names only what is
        // genuinely unmet.
        //
        // Safe by construction: `granted` is sourced from validated run state,
        // never from worker output, so this cannot launder an agent's mint — the
        // failing worker produced no tokens at all here.
        //
        // `missing` is then narrowed to gates belonging to the stage that
        // actually parked. Without that, an intake failure reports PLAN's gates
        // — because with the grants in hand intake has nothing unmet, so the walk
        // advances and names the next blocker — which is a different lie in the
        // same field. The filter reuses walkLifecycle's result rather than
        // re-deriving requirement satisfaction, so there is no second copy of the
        // walk's conditional-H logic to drift.
        if (result.outcome !== "success") {
          // OI-17 (requirement 4): keep WHY the invocation failed, not just that
          // it did. `outcome` separates auth from transient from fatal; the
          // diagnostic's `kind` separates a timeout from a spawn failure from
          // unparseable output; `attempts` says whether the bounded retry was
          // spent. The message is bounded and masked — it is adapter output,
          // which §11 treats as untrusted, and can carry environment text.
          adapterFailure = {
            outcome: result.outcome,
            ...(result.diagnostic?.kind === undefined ? {} : { kind: result.diagnostic.kind }),
            ...(result.diagnostic?.message === undefined
              ? {}
              : { message: redactDiagnostic(result.diagnostic.message) }),
            ...(result.diagnostic?.exitCode === undefined
              ? {}
              : { exitCode: result.diagnostic.exitCode }),
            attempts: retried ? 2 : 1,
            ...(lastResilience === undefined
              ? {}
              : { resilience: redactResilience(lastResilience) }),
          };
          // Name the in-place attempts only when the summary reports more than
          // one, so a single-attempt summary leaves the reason byte-identical.
          const inPlace = lastResilience?.attempts ?? 1;
          const inPlaceNote = inPlace > 1 ? ` (${inPlace} in-place adapter attempts)` : "";
          satisfied = new Set([...satisfied, ...granted]);
          const ownGates = new Set<string>(
            (() => {
              const requirements = SDLC_LIFECYCLE.find((s) => s.stage === stageName)?.requirements;
              return requirements === undefined
                ? []
                : [...requirements.P, ...requirements.A, ...requirements.H];
            })(),
          );
          return park(stageName, [...granted], {
            disposition: "failed",
            missing: walkLifecycle(satisfied).missing.filter((gate) => ownGates.has(gate)),
            reason: retried
              ? `adapter invocation failed (${result.outcome}) at ${stageName} after one retry${inPlaceNote}`
              : `adapter invocation failed (${result.outcome}) at ${stageName}${inPlaceNote}`,
          });
        }

        // P32 (G2): on a GOVERNED run a controller-owned token that the
        // controller did not already earn is worker mint — drop it, so it
        // neither satisfies a gate nor lands on the recorded trail. Tokens
        // already in `prior` came from an earlier controller stage's own result
        // and must survive (result.satisfied carries the whole prior set).
        const prior = satisfied;
        // P33 (D5): the controller produces green.coverage-passed itself, so on a
        // GOVERNED run that ONE token joins the controller-owned set and a worker
        // mint of it is stripped. Scope is the token, not the `green.` prefix —
        // the other four green.* tokens keep their current source.
        // P34 (C5): unconditional. Gating on `coverageProfile !== null` made a
        // governed run against a repo with no readable §8 profile fall back to
        // TRUSTING the worker's mint; with no profile the controller cannot
        // produce the token, so the run must park (fail closed).
        const workerMinted = (token: string): boolean =>
          governance === "controller" && isControllerOwnedToken(token) && !prior.has(token);
        stageTokens = [`agent:${worker.role}`, ...(result.grade?.tokens ?? []), ...granted].filter(
          (token) => !workerMinted(token),
        );
        // F2 (P18 review): strip any human-class token a grader tried to mint and
        // recompute the walk over the stripped set, so no agent output can carry
        // the run past a human gate. The controller grants (P + non-applicable
        // conditionals) are not unmintable-human tokens, so they survive.
        satisfied = new Set(
          [...prior, ...result.satisfied, ...granted].filter(
            (token) =>
              (!UNMINTABLE_HUMAN_TOKENS.has(token) || DRIVER_GRANTED_TOKENS.has(token)) &&
              !workerMinted(token),
          ),
        );
        // P33: the controller's own coverage result is the ONLY source of
        // green.coverage-passed once it ran — granted from the result, exactly as
        // P27 baseline grants baseline.*.
        // OI-15: `greenCoverage` is assigned inside the green grade CLOSURE,
        // which TypeScript's flow analysis does not follow — so at this point it
        // is still narrowed to the `null` it was declared with, and
        // `?.tokens` resolves to `never`. The cast restores the DECLARED type
        // and asserts nothing about the value: the `?.` below still handles null
        // at runtime, which is the case that actually occurs (every non-green
        // stage). An annotated alias does not work here — TypeScript carries the
        // initializer's narrowing through it.
        const greenCoverageResult = greenCoverage as GreenSuiteResult | null;
        const controllerGreenTokens =
          stageName === "green" ? (greenCoverageResult?.tokens ?? []) : [];
        if (controllerGreenTokens.length > 0) {
          stageTokens = [...stageTokens, ...controllerGreenTokens];
          satisfied = new Set([...satisfied, ...controllerGreenTokens]);
        }
      }

      // P28: the red stage's worker committed the failing-test tree during its
      // invocation; HEAD is now the committed red tree. Record it for the green
      // grade context and the durable run record.
      if (stageName === "red") redSha = resolveHeadSha(request.repositoryPath);

      // C1b: an accepted agent-authored plan resolves the spec's multi-packet
      // scope, so plan's scope-waiver H gate is non-applicable — the same grant
      // the derive path makes via PLAN_GRANT_TOKENS. Granted from the accepted
      // grade (all three plan P tokens held), never worker-minted; a plan that
      // failed the classifier rule never reaches here with accepted === true.
      if (
        stageName === "plan" &&
        derived.planMode === "agent" &&
        result?.grade?.accepted === true
      ) {
        satisfied = new Set([...satisfied, "owner.scope-or-waiver-exception-if-required"]);
        stageTokens = [...stageTokens, "owner.scope-or-waiver-exception-if-required"];
      }

      const walk = walkLifecycle(satisfied);

      // Advanced iff the walk is now blocked strictly beyond this stage.
      const blockedAt = walk.blockedAt;
      // Usage telemetry from the stage's agent invocation, when the vendor
      // reported it (snake_case to match the log's field style).
      const stageUsage =
        result?.usage === undefined
          ? undefined
          : {
              ...(result.usage.inputTokens === undefined ? {} : { input_tokens: result.usage.inputTokens }),
              ...(result.usage.outputTokens === undefined ? {} : { output_tokens: result.usage.outputTokens }),
              ...(result.usage.costUsd === undefined ? {} : { cost_usd: result.usage.costUsd }),
            };
      if (blockedAt === null || STAGE_NAMES.indexOf(blockedAt) > index) {
        // C1b: the agent plan stage advanced on its three tokens — now take the
        // DAG's root packet as the packet under execution. The parse is the
        // driver's own, independent of the grader's verdict: a grader that
        // accepted every token over text carrying no DAG still parks here.
        if (stageName === "plan" && derived.planMode === "agent") {
          const packets = parsePlanPackets(planDagText ?? "");
          if (packets === null) {
            return park("plan", stageTokens, {
              disposition: "failed",
              missing: [],
              reason: "plan stage advanced but the plan-author returned no packets",
            });
          }
          planPackets = packets;
          // C1b packet 3: every completed packet (seeded on a supersede) must
          // reappear with identical criteria or the replacement silently drops
          // delivered work — park at plan, branch and prior plan preserved.
          for (const id of completedIds) {
            const match = packets.find((p) => p.packetId === id);
            const original = packetCriteria[id] ?? [];
            if (
              match === undefined ||
              [...match.criterionIds].join(" ") !== [...original].join(" ")
            ) {
              return park(
                "plan",
                stageTokens,
                {
                  disposition: "failed",
                  missing: [],
                  reason: `superseding plan drops or re-scopes completed packet ${id}`,
                },
                undefined,
                true,
              );
            }
          }
          // The first packet to walk: on a supersede, the first uncompleted
          // packet whose dependencies are all complete; otherwise the root (no
          // dependencies). Emitted order breaks ties.
          const startPacket =
            supersede !== null
              ? packets.find(
                  (p) => !completedIds.has(p.packetId) && p.dependencies.every((d) => completedIds.has(d)),
                )
              : (packets.find((p) => p.dependencies.length === 0) ?? packets[0]!);
          if (startPacket === undefined) {
            return park("plan", stageTokens, {
              disposition: "failed",
              missing: [],
              reason: "superseding plan has no runnable uncompleted packet",
            });
          }
          planRecord = {
            mode: "agent",
            digest: createHash("sha256").update(planDagText ?? "").digest("hex"),
            packet_ids: packets.map((p) => p.packetId),
            active_packet_id: startPacket.packetId,
            packet_criteria: { ...packetCriteria },
            ...(supersede !== null
              ? {
                  superseded: [
                    {
                      digest: supersede.priorDigest,
                      packet_id: supersede.priorPacketId,
                      stage: supersede.priorStage,
                      parked_at: supersede.priorParkedAt,
                    },
                  ],
                }
              : {}),
          };
          activatePacket(startPacket);
        }

        // C1b packet 2: a packet's quality stage advanced — record it complete
        // and, on the agent path, activate the next dependency-satisfied packet
        // on the just-committed green and rewind to baseline. When no packet
        // remains the walk falls through to reconcile as the derive path does.
        if (stageName === "quality" && derived.planMode === "agent") {
          packetEntries.push({
            packet_id: activePacketId!,
            base_sha: baseRefSnapshot,
            red_sha: redSha,
            green_sha: greenSha,
            disposition: "complete",
          });
          completedIds.add(activePacketId!);
          const remaining = planPackets.filter((p) => !completedIds.has(p.packetId));
          if (remaining.length > 0) {
            // Emitted order breaks ties; a packet is runnable once every
            // dependency is complete.
            const next = remaining.find((p) => p.dependencies.every((d) => completedIds.has(d)));
            if (next === undefined) {
              // Mechanical selection's terminal case: a dependency cycle the
              // grader missed. Park fail-closed rather than spin.
              return park("quality", stageTokens, {
                disposition: "failed",
                missing: [],
                reason: "no runnable packet: the plan's remaining packets have unmet dependencies",
              });
            }
            // The just-committed green sha is the next packet's base; clear the
            // per-packet shas, verdicts and gate tokens so it re-walks baseline
            // -> red -> green -> quality on its own evidence.
            baseRefSnapshot = greenSha!;
            redSha = null;
            greenSha = null;
            greenCoverage = null;
            qualityVerdict = null;
            satisfied = new Set([...satisfied].filter((t) => !perPacketDropTokens.has(t)));
            activatePacket(next);
            trail.push({ stage: stageName, tokens: stageTokens, disposition: "advanced" });
            emit("stage-advanced", stageName, {
              tokens: stageTokens,
              ...(stageUsage === undefined ? {} : { usage: stageUsage }),
            });
            index = STAGE_NAMES.indexOf("baseline");
            continue;
          }
          // Every packet complete: fall through and advance to reconcile.
        }

        trail.push({ stage: stageName, tokens: stageTokens, disposition: "advanced" });
        emit("stage-advanced", stageName, { tokens: stageTokens, ...(stageUsage === undefined ? {} : { usage: stageUsage }) });
        index += 1;
        continue;
      }

      // Parked at this stage. Owner decision iff every unmet token is human-class.
      const humans = HUMAN_TOKENS.get(stageName) ?? new Set<string>();
      const ownerOnly = walk.missing.every((token) => humans.has(token));
      if (ownerOnly && result?.grade?.accepted !== false) {
        return park(stageName, stageTokens, {
          disposition: "needs_owner",
          missing: walk.missing,
          ...(walk.missing.includes(HUMAN_REVIEW_GATE)
            ? { decision: "approve_review" as const }
            : {}),
        }, stageUsage);
      }
      return park(stageName, stageTokens, {
        disposition: "failed",
        missing: walk.missing,
        reason:
          result?.grade?.reason ??
          // OI-29: green's coverage result was the one controller-owned result
          // missing from this chain, so a run stopped by the coverage floor
          // recorded `missing: ["green.coverage-passed"]` and NO reason at all —
          // while green-suite.ts had already built the sentence naming the floor
          // and the observed values. Kept after `grade.reason` so a green stage
          // that failed its SUITE still leads with that.
          (greenCoverage as GreenSuiteResult | null)?.reason ??
          controllerBaseline?.reason ??
          controllerQuality?.reason ??
          controllerReconcile?.reason,
      }, stageUsage);
    }

    // Every gate satisfied — cannot happen while review's human gate is unmet,
    // but fail closed rather than fabricate a park.
    const lastStage = STAGE_NAMES[STAGE_NAMES.length - 1]!;
    persistPark({
      store,
      repositoryPath: request.repositoryPath,
      runId: started.runId,
      // P42: `specId` was MISSING here — see the note on PersistParkOptions.
      specId: derived.specId,
      stage: lastStage,
      disposition: "needs_owner",
      missing: [],
      satisfied,
      adapterAttempts: {
        entries: adapterAttempts,
        dropped: adapterAttemptCount - adapterAttempts.length,
      },
      governance,
      redSha,
      greenSha,
      baseSha: runBaseSnapshot,
      criterionIds: approvedPacket.criterionIds,
      followUpPackets: derived.followUpPackets ?? null,
      greenCoverage,
      qualityVerdict,
      baseline: baselineResult,
      adapterFailure,
      adapterModel,
      adapterReasoningEffort,
      review: reviewEvidence,
      policyVersion: request.policy.policyVersion,
      controller: entryController,
      controllerDrift,
      plan: planRecordForPark("needs_owner", lastStage),
      packetTooLarge: null,
    });
    emit("run-parked", lastStage, { disposition: "needs_owner" });
    return {
      trail,
      status: { disposition: "needs_owner", stage: lastStage, missing: [] },
    };
  } finally {
    // FR-K7: parked is not "still holding the repo" — release on every exit.
    releaseLease(store, lease.oid);
  }
}

export async function driveRun(request: unknown): Promise<DriveResult> {
  try {
    return await drive(request as DriveRequest);
  } catch (error) {
    // Fail closed: no validation or spawn error escapes the public seam.
    return {
      trail: [],
      status: {
        disposition: "failed",
        stage: "intake",
        missing: [],
        reason: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
