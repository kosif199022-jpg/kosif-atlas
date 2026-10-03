import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildConfiguredAdapter } from "./controller/kernel/adapters/configured.ts";
import { openGitRefStore } from "./controller/kernel/state/git-ref-store.ts";
import { acquireLease, describeLeaseRun, leaseHolderAlive, releaseLease, ORPHAN_SWEEP_LEASE } from "./controller/kernel/state/lease.ts";
import { approveSpec } from "./controller/sdlc/approve.ts";
import { doctor } from "./controller/sdlc/doctor.ts";
import { publishFactoryRefs, reportPublishedRefs } from "./controller/sdlc/publish-refs.ts";
import { driveRun, computeIntegratedDiffDigest, type DriveStageWorker } from "./controller/sdlc/drive.ts";
import { buildRoleStages } from "./controller/sdlc/roles/stages.ts";
import { discardRunState, resetBranchToBase, type ResetOutcome } from "./controller/sdlc/abandon.ts";
import { diagnoseRun } from "./controller/sdlc/diagnose.ts";
import { deriveApprovedSpecPlan } from "./controller/sdlc/spec.ts";
import { start } from "./controller/sdlc/start.ts";
import { acceptVerdict } from "./controller/sdlc/verdict.ts";
import { reviewRequirement } from "./controller/sdlc/agent-verdict.ts";

// Packet P17 (FR-K4 argv entry, FR-K2 approval via CLI; closes LIM-02):
// `factory approve <spec.md>` and `factory start --spec <spec.md>` against the
// repository at process.cwd(). One JSON status record on stdout; exit 0 only
// on approved / candidate_ready. Usage errors go to stderr with exit 2.
//
// Packet P21 (FR-K4 end-to-end through the human gate and back): `factory run
// --spec <spec.md>` drives an approved spec to the review human gate (exit 0 on
// the needs_owner park — awaiting the owner is not a failure), and `factory
// verdict <envelope.json>` resumes the parked run to a reviewed candidate
// (exit 0 on completion). Both resolve stage workers through FACTORY_WORKERS_MODULE
// (see resolveStages); with no worker source configured the CLI refuses
// fail-closed with a nonzero exit distinct from the usage exit 2 and no banner.

const USAGE = `Usage: factory <command>

Commands:
  approve <spec.md>         stamp the digest-bound approval sidecar for a spec
  start --spec <spec.md>    run an approved spec to a simulated candidate
  run --spec <spec.md>      drive an approved spec to the review human gate
  verdict <envelope.json> [--run <run_id>]  resume the parked run with a review verdict (--run picks one of several parked runs)
  abandon --spec <spec.md> [--force] [--run <run_id>]  discard a spec's run state and reset the branch to the run's base (only if just the run's own commits sit on it); --run names the run instead of the spec index
  diagnose --spec <spec.md> explain what the spec's parked run means
`;

// Exit code for the fail-closed no-workers refusal: nonzero and distinct from
// the usage exit (2), with no usage banner — a refusal is not a usage typo.
const SEAM_REFUSAL_EXIT = 3;

// ponytail: the remaining approval/planning policy fields are not in
// .aai/policy/factory.yaml yet; these mirror the P06/P16 seam fixtures until a
// policy packet owns them there. C1a moved the one field with recorded user
// cost — the criteria ceiling — into the policy file below.
const APPROVAL_POLICY = {
  approver: "local_operator",
  localOperatorPrincipal: "local_operator",
  policyVersion: "factory-policy-v1",
  moduleRoots: ["src"],
  singlePacketCriteriaCeiling: 2,
};

// C1a: `single_packet_criteria_ceiling` is an OPTIONAL top-level key in
// .aai/policy/factory.yaml. Absent means 2 — byte-identical to before the key
// existed. Present-but-malformed refuses fail-closed naming the key rather
// than falling back, so an owner never believes they raised a limit they did
// not raise. Strict single-line match in the house style; doctor's parser
// reads only the `quality_profile:` section, so an unknown top-level key is
// invisible to it (src/controller/sdlc/doctor.ts).
const CRITERIA_CEILING_KEY = "single_packet_criteria_ceiling";

function criteriaCeiling(root: string): { readonly ceiling: number } | { readonly problem: string } {
  let text: string;
  try {
    text = readFileSync(resolve(root, ".aai/policy/factory.yaml"), "utf8");
  } catch {
    return { ceiling: APPROVAL_POLICY.singlePacketCriteriaCeiling }; // policyProblem owns the missing file
  }
  const match = new RegExp(`^${CRITERIA_CEILING_KEY}:[ \\t]*(.*)$`, "m").exec(text);
  if (match === null) return { ceiling: APPROVAL_POLICY.singlePacketCriteriaCeiling };
  const raw = match[1].trim();
  if (!/^[0-9]+$/.test(raw) || Number(raw) < 1) {
    return {
      problem: `.aai/policy/factory.yaml: ${CRITERIA_CEILING_KEY} must be an integer >= 1, got: ${raw === "" ? "(empty)" : raw}`,
    };
  }
  return { ceiling: Number(raw) };
}

// The one gate every policy-gated command runs: the §8 profile check plus the
// ceiling read, so the two cannot drift apart across five call sites.
async function policyGate(
  root: string,
): Promise<{ readonly policy: typeof APPROVAL_POLICY } | { readonly problem: string }> {
  const problem = await policyProblem(root);
  if (problem !== null) return { problem };
  // C5 packet 3b: fail closed on a malformed review_requirement, matching the
  // ceiling key — a policy the factory cannot interpret stops it at the door.
  if (reviewRequirement(root) === "invalid") {
    const match = /^review_requirement:[ \t]*(.*)$/m.exec(readFileSync(resolve(root, ".aai/policy/factory.yaml"), "utf8"));
    return { problem: `.aai/policy/factory.yaml: review_requirement is not a recognised value, got: ${match?.[1]?.trim() ?? ""}` };
  }
  const ceiling = criteriaCeiling(root);
  if ("problem" in ceiling) return ceiling;
  return { policy: { ...APPROVAL_POLICY, singlePacketCriteriaCeiling: ceiling.ceiling } };
}

function emit(record: unknown, ok: boolean): void {
  process.stdout.write(`${JSON.stringify(record)}\n`);
  process.exitCode = ok ? 0 : 1;
}

// The existing P12 reader (doctor) owns the .aai/policy/factory.yaml parse;
// the CLI only refuses to run against a missing or malformed policy file.
// Manifest/custom-ref findings are install hygiene, not policy, so they do
// not block approve/start.
async function policyProblem(root: string): Promise<string | null> {
  // F3 (P17 review): a directory git cannot list refs in is not a repository;
  // refuse before approve stamps a sidecar into a plain folder.
  const refs = spawnSync("git", ["-C", root, "rev-parse", "--git-dir"], { encoding: "utf8" });
  if (refs.status !== 0) return `${root}: not a git repository`;
  const result = await doctor({ repositoryPath: root });
  const finding = result.findings.find(
    (f) => f.kind === "quality_profile" || f.kind === "invalid_input",
  );
  return finding === undefined ? null : `${finding.path ?? "policy"}: ${finding.reason}`;
}

function readSpec(root: string, specPath: string): string | null {
  try {
    return readFileSync(resolve(root, specPath), "utf8");
  } catch {
    return null;
  }
}

// Best-effort sidecar location for start: same front-matter extraction rule as
// approve.ts. A payload this cannot resolve is invalid anyway, so the empty
// path fails closed inside the seam's own validation.
function specIdOf(payload: string): string | null {
  const lines = payload.split(/\r?\n/);
  const closingIndex = lines.indexOf("---", 1);
  for (const line of lines.slice(1, closingIndex)) {
    const match = /^spec_id: ?(.+)$/.exec(line);
    if (match !== null && /^[a-z0-9][a-z0-9._-]{0,63}$/.test(match[1])) return match[1];
  }
  return null;
}

function sidecarPathFor(payload: string): string {
  const specId = specIdOf(payload);
  return specId === null ? "" : `.aai/specs/${specId}.approval.json`;
}

function readSidecarEnvelope(root: string, sidecarPath: string): unknown {
  if (sidecarPath === "") return null;
  try {
    return JSON.parse(readFileSync(resolve(root, sidecarPath), "utf8")) as unknown;
  } catch {
    return null; // missing or unreadable: the seam rejects a null envelope
  }
}

// OI-57: one resolver, two callers. `diagnose` and `abandon` both need an
// approved spec id, and closing OI-36 gave `diagnose` the block by copying
// `abandon`'s verbatim — the same drift OI-36 existed to fix, one step later.
// Returns the derivation error rather than a sentence: each command emits its
// refusal through a different path, in its own wording. Reads the approval
// sidecar and the built-in APPROVAL_POLICY only — never .aai/policy/factory.yaml
// (OI-34).
type ApprovedSpecResolution = { readonly specId: string } | { readonly error: string };

function resolveApprovedSpecId(root: string, payload: string): ApprovedSpecResolution {
  const sidecarPath = sidecarPathFor(payload);
  try {
    return {
      specId: deriveApprovedSpecPlan({
        canonicalSpecPayload: payload,
        approvalSidecar: { path: sidecarPath, envelope: readSidecarEnvelope(root, sidecarPath) },
        // C1a: the ceiling is deliberately NOT enforced here. This resolver may
        // not read .aai/policy/factory.yaml (OI-34), so enforcing the built-in 2
        // would strand a spec approved under a raised ceiling in exactly the two
        // read/recovery commands an owner needs when a run goes wrong. Approval
        // authorization — the sidecar digest — is unchanged.
        policy: { ...APPROVAL_POLICY, singlePacketCriteriaCeiling: Number.MAX_SAFE_INTEGER },
      }).specId,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// Resolution order (P24): (1) a configured adapter builds the real role stages
// via buildRoleStages; (2) else the P21 FACTORY_WORKERS_MODULE seam, now
// wrapped so a malformed specifier or a module without buildStages FAILS CLOSED
// (returns null => bounded refusal) instead of a raw uncaught throw; (3) else
// null => the no-workers refusal. A dynamic-import() specifier is a file:// URL
// in tests. Null in every branch is what the caller turns into a fail-closed
// refusal — never a silent bypass of real role packages.
// P24 review MINOR-1: a discriminated result so the refusal names WHICH source
// failed — a misconfigured adapter and a broken module must not collapse into
// the same generic message. Reasons name env-var *names* only, never values or
// paths (no secret/path leakage, §11).
type StageResolution =
  | { readonly stages: Record<string, DriveStageWorker> }
  | { readonly refusal: string };

async function resolveStages(): Promise<StageResolution> {
  const vendor = process.env.FACTORY_ADAPTER;
  if (vendor === "claude" || vendor === "codex") {
    try {
      return { stages: buildRoleStages(buildConfiguredAdapter(vendor)) };
    } catch {
      // fail closed on invalid adapter config
      return { refusal: `FACTORY_ADAPTER=${vendor} is set but the adapter could not be built (check FACTORY_ADAPTER_EXECUTABLE and FACTORY_ADAPTER_CONFIG_DIR)` };
    }
  }
  const specifier = process.env.FACTORY_WORKERS_MODULE;
  if (specifier === undefined || specifier === "") {
    return { refusal: "no worker source configured (set FACTORY_ADAPTER, or FACTORY_WORKERS_MODULE)" };
  }
  try {
    const module = (await import(specifier)) as {
      buildStages: (context?: unknown) => Record<string, DriveStageWorker> | Promise<Record<string, DriveStageWorker>>;
    };
    const stages = await module.buildStages();
    // MINOR-3: reject arrays too (typeof [] === "object"); a non-record fails closed.
    if (typeof stages !== "object" || stages === null || Array.isArray(stages)) {
      return { refusal: "FACTORY_WORKERS_MODULE is set but its buildStages did not return a stage record" };
    }
    return { stages };
  } catch {
    // fail closed on a malformed module (P21-review fold-in)
    return { refusal: "FACTORY_WORKERS_MODULE is set but could not be loaded (module missing or has no buildStages export)" };
  }
}

// A bounded refusal: machine-readable, nonzero, and distinct from the usage
// exit — a refusal is not a usage typo.
function refuse(reason: string): void {
  process.stdout.write(`${JSON.stringify({ disposition: "refused", reason })}\n`);
  process.exitCode = SEAM_REFUSAL_EXIT;
}

function refuseNoWorkers(command: string, detail: string): void {
  refuse(`${command} requires stage workers: ${detail}`);
}

// refs/factory/specs/<spec_id> is start()'s digest -> run_id index; untrusted on
// read back (L-037), so anything unparseable reads as "no run recorded".
function runIdOfSpecIndex(specJson: string | undefined): string | null {
  if (specJson === undefined) return null;
  try {
    const parsed: unknown = JSON.parse(specJson);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    const runId = (parsed as Record<string, unknown>).run_id;
    return typeof runId === "string" && runId.trim() !== "" && !runId.includes("\0") ? runId : null;
  } catch {
    return null;
  }
}

// C9 packet 2: after packet 1 publishes `refs/factory/candidates/<run>/<attempt>`,
// push the same commit to the human-facing branch `factory/<spec-id>` and open
// (or find) its pull request with `gh`. The custom ref is authoritative; the
// branch is cosmetic (spec §9.1), so a collision is reported, never resolved.
// Same rule as publish-refs.ts: nothing here may change the process exit code.
interface PullRequestResult {
  readonly disposition: "opened" | "reused" | "skipped" | "rejected";
  readonly branch: string;
  readonly url?: string;
  readonly reason?: string;
}

const DELIVER_TIMEOUT_MS = 30_000;

function nonInteractive(cmd: string, args: readonly string[], cwd: string) {
  return spawnSync(cmd, args, {
    cwd,
    encoding: "utf8" as const,
    maxBuffer: 4 * 1024 * 1024,
    timeout: DELIVER_TIMEOUT_MS,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_ASKPASS: "true", GH_PROMPT_DISABLED: "1" },
  });
}

function firstStderrLine(r: { stderr: string; error?: Error }): string {
  const line = `${r.stderr}`.split(/\r?\n/).find((l) => l.trim() !== "");
  return line ?? (r.error?.message ?? "exited non-zero with no stderr");
}

function openPullRequest(root: string, runId: string, candidateRef: PullRequestInput): PullRequestResult {
  const specId = candidateRef.specId;
  const branch = `factory/${specId}`;
  const branchRef = `refs/heads/${branch}`;
  const skipped = (reason: string): PullRequestResult => ({ disposition: "skipped", branch, reason });
  const rejected = (reason: string): PullRequestResult => ({ disposition: "rejected", branch, reason });
  if (candidateRef.disposition !== "published") {
    return skipped(`candidate ref not published: ${candidateRef.reason ?? candidateRef.disposition}`);
  }
  // Creation-only CAS: expected OID empty means "must not exist". An existing
  // branch at the SAME sha is up to date and passes; anything else is refused
  // by the remote. NEVER --force.
  const push = nonInteractive(
    "git",
    ["push", "--quiet", `--force-with-lease=${branchRef}:`, "origin", `${candidateRef.sha}:${branchRef}`],
    root,
  );
  if (push.status !== 0) return rejected(`branch push refused: ${firstStderrLine(push)}`);

  // Reconcile by lookup before creating: a second `verdict` for the same run
  // must find the PR, not open another.
  const list = nonInteractive("gh", ["pr", "list", "--head", branch, "--state", "open", "--json", "url"], root);
  if ((list.error as NodeJS.ErrnoException | undefined)?.code === "ENOENT") {
    return skipped("gh is not on PATH; branch pushed, open the pull request by hand");
  }
  if (list.status !== 0) return rejected(firstStderrLine(list));
  try {
    const existing = JSON.parse(list.stdout) as { url?: unknown }[];
    const url = existing.find((e) => typeof e.url === "string")?.url;
    if (typeof url === "string") return { disposition: "reused", branch, url };
  } catch {
    return rejected("gh pr list returned unparseable JSON");
  }

  const create = nonInteractive(
    "gh",
    [
      "pr",
      "create",
      "--head",
      branch,
      "--title",
      `${specId}: factory candidate ${runId}`,
      "--body",
      `Factory run: ${runId}\nCandidate ref: ${candidateRef.ref}\nCommit: ${candidateRef.sha}\n\nMerge authority stays with the owner.`,
    ],
    root,
  );
  if (create.status !== 0) return rejected(firstStderrLine(create));
  const url = `${create.stdout}`.trim().split(/\s+/).pop() ?? "";
  return url === "" ? rejected("gh pr create printed no URL") : { disposition: "opened", branch, url };
}

interface PullRequestInput {
  readonly disposition: string;
  readonly ref: string;
  readonly reason?: string;
  readonly specId: string;
  readonly sha: string;
}

// spec_id and the approved green commit come from the run's durable record;
// the verdict status carries neither.
function pullRequestInputFor(root: string, runId: string, candidateRef: { disposition: string; ref: string; reason?: string }): PullRequestInput | null {
  const show = spawnSync("git", ["-C", root, "show", `refs/factory/runs/${runId}:run.json`], { encoding: "utf8" });
  if (show.status !== 0) return null;
  try {
    const record = JSON.parse(show.stdout) as Record<string, unknown>;
    if (typeof record.spec_id !== "string" || typeof record.green_sha !== "string") return null;
    return { ...candidateRef, specId: record.spec_id, sha: record.green_sha };
  } catch {
    return null;
  }
}

// Discover the run awaiting a review verdict from the ref store (the envelope
// carries no run_id, so identity comes from refs/factory/runs/*). Plain git
// reads, matching how the run ref is written and shown.
// P21-MAJOR-1: only a needs_owner park at review awaits a verdict; a failed
// park is also written status:"parked" and must be ignored. When more than one
// run genuinely awaits a verdict, the CLI must not guess — it returns an
// ambiguity signal so the caller disambiguates rather than acting on the
// alphabetically-first UUID.
type RunDiscovery =
  | { readonly kind: "found"; readonly runId: string; readonly greenSha: string | null }
  | { readonly kind: "none" }
  | { readonly kind: "ambiguous"; readonly runIds: readonly string[] };

// Every refs/factory/runs/* ref name. The ref store has no enumeration, and
// `abandon`'s orphan sweep needs one (P37 amendment-4 review B1-R4 / CRASH-1).
// Plain git read, matching how discoverParkedRunId lists the same refs.
function listRunRefs(root: string): readonly string[] {
  const refs = spawnSync("git", ["-C", root, "for-each-ref", "--format=%(refname)", "refs/factory/runs/"], {
    encoding: "utf8",
  });
  if (refs.status !== 0) return [];
  return refs.stdout.trim().split("\n").filter((line) => line !== "");
}

function discoverParkedRunId(root: string): RunDiscovery {
  const refs = spawnSync("git", ["-C", root, "for-each-ref", "--format=%(refname)", "refs/factory/runs/"], {
    encoding: "utf8",
  });
  if (refs.status !== 0) return { kind: "none" };
  const awaiting: { runId: string; greenSha: string | null }[] = [];
  for (const ref of refs.stdout.trim().split("\n").filter((line) => line !== "")) {
    const show = spawnSync("git", ["-C", root, "show", `${ref}:run.json`], { encoding: "utf8" });
    if (show.status !== 0) continue;
    try {
      const record = JSON.parse(show.stdout) as Record<string, unknown>;
      if (
        record.status === "parked" &&
        record.disposition === "needs_owner" &&
        record.stage === "review" &&
        typeof record.run_id === "string"
      ) {
        awaiting.push({
          runId: record.run_id,
          // OI-20: the run's recorded green commit pins the signable diff, so
          // the CLI's claim survives commits made while the run was parked.
          greenSha:
            typeof record.green_sha === "string" && /^[0-9a-f]{40}$/.test(record.green_sha)
              ? record.green_sha
              : null,
        });
      }
    } catch {
      // unreadable ref: skip
    }
  }
  if (awaiting.length === 0) return { kind: "none" };
  if (awaiting.length > 1) return { kind: "ambiguous", runIds: awaiting.map((a) => a.runId) };
  return { kind: "found", ...awaiting[0]! };
}

// OI-62: `--run <id>` on verdict and abandon. Pulls the pair out of argv (any
// position) and validates the id BEFORE any ref read — a malformed id must
// never reach the store. Returns the remaining argv for the command's own
// shape check.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function takeRunFlag(
  args: readonly string[],
): { rest: string[]; runId: string | null; error?: undefined } | { error: string } {
  const at = args.indexOf("--run");
  if (at === -1) return { rest: [...args], runId: null };
  const runId = args[at + 1];
  if (runId === undefined || runId.startsWith("--")) return { error: "--run requires a run id" };
  if (!UUID_RE.test(runId)) return { error: `--run ${runId} is not a well-formed run id (UUID)` };
  return { rest: [...args.slice(0, at), ...args.slice(at + 2)], runId };
}

// C5 packet 3b: `--contest <reason>` on verdict. Same shape as takeRunFlag —
// pulled from any position, a missing or `--`-prefixed value refused naming the
// flag before any ref is read. Returns the remaining argv and the reason (null
// when absent, passed straight to acceptVerdict's `contest`).
function takeContestFlag(
  args: readonly string[],
): { rest: string[]; contest: string | null; error?: undefined } | { error: string } {
  const at = args.indexOf("--contest");
  if (at === -1) return { rest: [...args], contest: null };
  const contest = args[at + 1];
  if (contest === undefined || contest.startsWith("--")) return { error: "--contest requires a reason" };
  return { rest: [...args.slice(0, at), ...args.slice(at + 2)], contest };
}

// The named run must be exactly what auto-discovery would accept: the flag
// chooses among eligible parks, it never widens what is eligible.
function addressParkedRun(root: string, runId: string): RunDiscovery | { kind: "rejected"; reason: string } {
  const show = spawnSync("git", ["-C", root, "show", `refs/factory/runs/${runId}:run.json`], { encoding: "utf8" });
  if (show.status !== 0) return { kind: "rejected", reason: `run ${runId} has no readable record under refs/factory/runs` };
  let record: Record<string, unknown>;
  try {
    record = JSON.parse(show.stdout) as Record<string, unknown>;
  } catch {
    return { kind: "rejected", reason: `run ${runId}'s record is not valid JSON` };
  }
  if (record.status !== "parked" || record.disposition !== "needs_owner" || record.stage !== "review") {
    return {
      kind: "rejected",
      reason: `run ${runId} is not awaiting a review verdict: status ${String(record.status)}, disposition ${String(record.disposition)}, stage ${String(record.stage)}`,
    };
  }
  return {
    kind: "found",
    runId,
    greenSha:
      typeof record.green_sha === "string" && /^[0-9a-f]{40}$/.test(record.green_sha) ? record.green_sha : null,
  };
}

// The run's event mirror, best-effort. docs/runs/<id>/events.jsonl is written
// by events.ts, which swallows every write failure, so a missing, partial or
// unreadable log is normal evidence-absence — never an error. Undefined means
// "no second opinion"; diagnoseRun treats that as no contradiction.
function readRunEvents(root: string, runId: string): unknown[] | undefined {
  let text: string;
  try {
    text = readFileSync(resolve(root, "docs", "runs", runId, "events.jsonl"), "utf8");
  } catch {
    return undefined;
  }
  const events: unknown[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === "") continue;
    try {
      events.push(JSON.parse(line) as unknown);
    } catch {
      // ponytail: a torn trailing append is expected in an append-only mirror.
    }
  }
  return events;
}

async function main(argv: string[]): Promise<void> {
  if (argv.includes("--help")) {
    process.stdout.write(USAGE);
    return;
  }

  const [command, ...rest] = argv;
  const root = process.cwd();

  if (command === "approve" && rest.length === 1) {
    const gate = await policyGate(root);
    if ("problem" in gate) return emit({ disposition: "rejected", reason: gate.problem }, false);
    const policy = gate.policy;
    const payload = readSpec(root, rest[0]);
    if (payload === null) {
      return emit({ disposition: "rejected", reason: `spec file is unreadable: ${rest[0]}` }, false);
    }
    const result = await approveSpec({
      repositoryPath: root,
      canonicalSpecPayload: payload,
      policy,
      eventId: `approval-${randomUUID()}`,
      timestamp: new Date().toISOString(),
    });
    return emit(result, result.disposition === "approved");
  }

  if (command === "start" && rest[0] === "--spec" && rest.length === 2) {
    const gate = await policyGate(root);
    if ("problem" in gate) return emit({ disposition: "rejected", reason: gate.problem }, false);
    const policy = gate.policy;
    const payload = readSpec(root, rest[1]);
    if (payload === null) {
      return emit({ disposition: "rejected", reason: `spec file is unreadable: ${rest[1]}` }, false);
    }
    const sidecarPath = sidecarPathFor(payload);
    const result = await start({
      repositoryPath: root,
      canonicalSpecPayload: payload,
      approvalSidecar: { path: sidecarPath, envelope: readSidecarEnvelope(root, sidecarPath) },
      policy,
      holderId: randomUUID(),
      surface: "cli",
      candidateEndpoint: { kind: "simulated" },
    });
    return emit(result, result.disposition === "candidate_ready");
  }

  if (command === "run" && rest[0] === "--spec" && rest.length === 2) {
    const gate = await policyGate(root);
    if ("problem" in gate) return emit({ disposition: "rejected", reason: gate.problem }, false);
    const policy = gate.policy;
    const payload = readSpec(root, rest[1]);
    if (payload === null) {
      return emit({ disposition: "rejected", reason: `spec file is unreadable: ${rest[1]}` }, false);
    }
    const resolved = await resolveStages();
    if ("refusal" in resolved) return refuseNoWorkers("run", resolved.refusal);
    const stages = resolved.stages;
    const sidecarPath = sidecarPathFor(payload);
    const result = await driveRun({
      repositoryPath: root,
      canonicalSpecPayload: payload,
      approvalSidecar: { path: sidecarPath, envelope: readSidecarEnvelope(root, sidecarPath) },
      policy,
      holderId: randomUUID(),
      surface: "cli",
      candidateEndpoint: { kind: "simulated" },
      stages,
      // P34: `factory run --spec` is controller-governed. Worker-minted
      // controller-owned tokens are stripped and the controller produces
      // baseline/green-coverage/quality/reconcile results itself (OI-1, OI-3,
      // OI-5). SCOPE (P34 review MAJOR-2): this is the only `driveRun` caller,
      // but it is NOT the only path that executes lifecycle stages. Direct
      // `runStage` calls and the post-verdict `candidate` re-run in verdict.ts
      // are ungoverned — see OI-8. P39 retired the hand-composed loop as the
      // documented product-build path, so this command is now the only one;
      // that narrowed OI-8 but did not close it, because `runStage` is still
      // exported and still bypasses everything above.
      governance: "controller",
    });
    process.stdout.write(`${JSON.stringify(result)}\n`);
    // Parked awaiting the owner is not a failure; anything else is.
    process.exitCode = result.status.disposition === "needs_owner" ? 0 : 1;
    // OI-32: publish the run's durable evidence. AFTER the status record and
    // after the exit code is set, because publishing must not be able to change
    // either — a run does not fail because a network did.
    reportPublishedRefs(publishFactoryRefs(root));
    return;
  }

  const verdictArgs = command === "verdict" ? takeRunFlag(rest) : null;
  if (verdictArgs !== null && verdictArgs.error !== undefined) {
    return emit({ disposition: "rejected", reason: `verdict: ${verdictArgs.error}` }, false);
  }
  const contestArgs =
    verdictArgs !== null && verdictArgs.error === undefined ? takeContestFlag(verdictArgs.rest) : null;
  if (contestArgs !== null && contestArgs.error !== undefined) {
    return emit({ disposition: "rejected", reason: `verdict: ${contestArgs.error}` }, false);
  }
  if (
    command === "verdict" &&
    verdictArgs !== null &&
    verdictArgs.error === undefined &&
    contestArgs !== null &&
    contestArgs.error === undefined &&
    contestArgs.rest.length === 1
  ) {
    const envelopePath = contestArgs.rest[0]!;
    const gate = await policyGate(root);
    if ("problem" in gate) return emit({ disposition: "rejected", reason: gate.problem }, false);
    const policy = gate.policy;
    const resolved = await resolveStages();
    if ("refusal" in resolved) return refuseNoWorkers("verdict", resolved.refusal);
    const stages = resolved.stages;
    const discovery =
      verdictArgs.runId === null ? discoverParkedRunId(root) : addressParkedRun(root, verdictArgs.runId);
    if (discovery.kind === "rejected") return emit({ disposition: "rejected", reason: discovery.reason }, false);
    if (discovery.kind === "none") {
      return emit({ disposition: "rejected", reason: "no run awaiting a review verdict under refs/factory/runs" }, false);
    }
    if (discovery.kind === "ambiguous") {
      return emit(
        {
          disposition: "rejected",
          reason: `more than one run awaits a review verdict; disambiguate with --run: ${discovery.runIds
            .map((id) => `factory verdict ${envelopePath} --run ${id}`)
            .join(" | ")}`,
        },
        false,
      );
    }
    const runId = discovery.runId;
    // OI-20: the claim is recomputed from the run's recorded green commit when
    // one exists, so unrelated commits made while the run was parked do not
    // strip signability. A recorded commit that no longer resolves refuses
    // here with the reason, not deep in the seam.
    let claimedDigest: string;
    try {
      claimedDigest =
        discovery.greenSha === null
          ? computeIntegratedDiffDigest(root)
          : computeIntegratedDiffDigest(root, discovery.greenSha);
    } catch (error) {
      return emit(
        {
          disposition: "rejected",
          reason: `run ${runId}'s recorded green commit is not verifiable: ${error instanceof Error ? error.message : String(error)}`,
        },
        false,
      );
    }
    // The operand is the authoritative sidecar path, passed verbatim (relative
    // to cwd) so the validator's string-equal check against the run's expected
    // sidecar location holds. P20 makes the durable record authoritative, so
    // acceptVerdict re-derives priorSatisfied and re-checks the digest.
    const result = await acceptVerdict({
      repositoryPath: root,
      runId,
      surface: "cli",
      priorSatisfied: [],
      integratedDiffDigest: claimedDigest,
      verdictSidecar: { path: envelopePath, envelope: readSidecarEnvelope(root, envelopePath) },
      policy,
      stages,
      contest: contestArgs.contest,
    });
    // C9 packet 2: branch + pull request for a published candidate. Appended
    // to the same record before it is written; cannot touch the exit code.
    let pullRequest: PullRequestResult | undefined;
    if (result.status.candidate_ref !== undefined) {
      const input = pullRequestInputFor(root, runId, result.status.candidate_ref);
      pullRequest =
        input === null
          ? { disposition: "skipped", branch: "factory/unknown", reason: "run record lacks spec_id/green_sha" }
          : openPullRequest(root, runId, input);
    }
    process.stdout.write(`${JSON.stringify(pullRequest === undefined ? result : { ...result, pull_request: pullRequest })}\n`);
    process.exitCode = result.status.disposition === "complete" ? 0 : 1;
    // OI-32: the verdict is where a run reaches `complete`, so this is the write
    // most worth publishing. Same ordering rule as `run`: after the record and
    // after the exit code.
    reportPublishedRefs(publishFactoryRefs(root));
    return;
  }

  // Packet cli-diagnose-1 (OI-26): make the run-diagnosis seam reachable.
  // Keyed on the spec file, like start/run/abandon. READ ONLY — no ref update,
  // no commit, no lease.
  //
  // OI-34: deliberately NOT gated on the §8 quality profile the way
  // approve/start/run/verdict/abandon are. Those execute or mutate; this one
  // only reads, and a repository whose .aai/policy/factory.yaml is missing or
  // malformed is precisely the rules_wrong / fix_environment_or_policy case
  // this command exists to explain. Refusing there would make it useless in
  // the situation it was built for. Do not re-add the guard by analogy.
  if (command === "diagnose" && rest[0] === "--spec" && rest.length === 2) {
    const payload = readSpec(root, rest[1]);
    if (payload === null) return refuse(`diagnose: spec file is unreadable: ${rest[1]}`);
    // OI-36: authorize the spec the way `abandon` does. A raw front-matter read
    // let a decoy carrying nothing but a `spec_id:` line print that spec's real
    // run diagnosis at exit 0 for a caller holding no approval for it. The
    // shared resolver reads the approval sidecar and the built-in
    // APPROVAL_POLICY only — not .aai/policy/factory.yaml — so the OI-34 note
    // above still holds.
    const resolved = resolveApprovedSpecId(root, payload);
    if ("error" in resolved) {
      return refuse(`diagnose requires an approved spec: ${resolved.error}`);
    }
    const specId = resolved.specId;

    let record: unknown;
    let runId: string | null;
    try {
      const store = openGitRefStore(root);
      const specIndex = store.read(`refs/factory/specs/${specId}`);
      runId = specIndex === null ? null : runIdOfSpecIndex(specIndex.files["spec.json"]);
      if (runId === null) return refuse(`diagnose: no run is recorded for spec ${specId}`);
      const runSnapshot = store.read(`refs/factory/runs/${runId}`);
      const runJson = runSnapshot?.files["run.json"];
      if (runJson === undefined) {
        return refuse(`diagnose: run ${runId} of spec ${specId} has no readable run record`);
      }
      record = JSON.parse(runJson) as unknown;
    } catch (error) {
      // The store throws on a non-controller commit or a git failure; a
      // fabricated diagnosis would be worse than a refusal.
      return refuse(
        `diagnose: the recorded state of spec ${specId} is unreadable: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const diagnosis = diagnoseRun({ record, events: readRunEvents(root, runId) });
    // C5 packet 3b: surface the agent/owner verdicts and the contest so the
    // owner can read the minted verdict before deciding. Projected here from the
    // record already read — diagnose.ts stays a pure classifier.
    const rec = record as Record<string, unknown>;
    const verdicts = Array.isArray(rec.verdicts)
      ? (rec.verdicts as Record<string, unknown>[]).map((v) => ({
          principal: v.principal,
          decision: v.decision,
          event_id: v.event_id,
          timestamp: v.timestamp,
        }))
      : [];
    return emit(
      { spec_id: specId, run_id: runId, ...diagnosis, verdicts, review_contest: rec.review_contest ?? null },
      true,
    );
  }

  // Packet P37 (OI-10): the supported escape hatch from a run whose state makes
  // its spec unrunnable — replacing `git update-ref -d refs/factory/runs/<id>`
  // by hand. Keyed on the spec file, like start/run, because that is the handle
  // the operator has. EXPLICIT only: `run` never discards state implicitly.
  const abandonArgs = command === "abandon" ? takeRunFlag(rest) : null;
  if (abandonArgs !== null && abandonArgs.error !== undefined) {
    return emit({ disposition: "rejected", reason: `abandon: ${abandonArgs.error}` }, false);
  }
  if (
    command === "abandon" &&
    abandonArgs !== null &&
    abandonArgs.error === undefined &&
    abandonArgs.rest[0] === "--spec" &&
    (abandonArgs.rest.length === 2 || (abandonArgs.rest.length === 3 && abandonArgs.rest[2] === "--force"))
  ) {
    const force = abandonArgs.rest.length === 3;
    const specPath = abandonArgs.rest[1]!;
    const addressedRunId = abandonArgs.runId;
    const gate = await policyGate(root);
    if ("problem" in gate) return emit({ disposition: "rejected", reason: gate.problem }, false);
    const policy = gate.policy;
    const payload = readSpec(root, specPath);
    if (payload === null) {
      return emit({ disposition: "rejected", reason: `spec file is unreadable: ${specPath}` }, false);
    }

    // P37 review MINOR: authorize exactly like `start` and `run` do. Reading a
    // bare `spec_id:` line out of any file made `abandon` the one spec-keyed
    // command that skipped approval — a never-approved decoy naming a real
    // spec_id deleted that spec's live run state at exit 0.
    const resolved = resolveApprovedSpecId(root, payload);
    if ("error" in resolved) {
      return emit(
        {
          disposition: "rejected",
          reason: `abandon requires an approved spec: ${resolved.error}`,
        },
        false,
      );
    }
    const specId = resolved.specId;

    // P37 amendment-3 review MAJOR: the ref store THROWS — `read` on a
    // non-controller commit, `delete` on a bad oid or a git failure. Without
    // this the stack escaped to stderr, stdout was empty, and the spec was
    // wedged with no machine-readable reason. start.ts already upholds this
    // contract; abandon did not.
    try {
    const store = openGitRefStore(root);
    const specRefName = `refs/factory/specs/${specId}`;
    // A missing index is NOT "nothing to abandon": a run interrupted between
    // start()'s two creates leaves a run ref no index points at (amendment-4
    // review CRASH-1). Resolve what we can and let the sweep find the rest;
    // "no state is recorded" is decided by what was actually discarded.
    // OI-62: `--run` replaces the index lookup only. The spec is still the
    // authorization handle (OI-36), so the named run must belong to it.
    let runId: string | null;
    if (addressedRunId === null) {
      const specIndex = store.read(specRefName);
      runId = specIndex === null ? null : runIdOfSpecIndex(specIndex.files["spec.json"]);
    } else {
      const json = store.read(`refs/factory/runs/${addressedRunId}`)?.files["run.json"];
      if (json === undefined) {
        return emit({ disposition: "rejected", reason: `abandon: run ${addressedRunId} has no readable record` }, false);
      }
      const owner = (JSON.parse(json) as Record<string, unknown>).spec_id;
      if (owner !== specId) {
        return emit(
          {
            disposition: "rejected",
            reason: `abandon: run ${addressedRunId} belongs to spec ${String(owner)}, not ${specId}`,
          },
          false,
        );
      }
      runId = addressedRunId;
    }

    // Always take the singleton lease before deleting anything. Discarding
    // state out from under a running controller is worse than the brick this
    // fixes, and holding it is what stops a start() stalled here from
    // publishing a run ref into a world we just emptied (B1-R4). When no run id
    // resolves there is no single run to name, so the lease carries a label
    // rather than a run — it still excludes a concurrent start.
    let lease;
    try {
      lease = acquireLease(store, {
        run_id: runId ?? ORPHAN_SWEEP_LEASE,
        holder_id: randomUUID(),
        holder_pid: process.pid,
        surface: "cli",
        acquired_at: new Date().toISOString(),
      });
    } catch (error) {
      return refuse(
        `abandon: the run lease at refs/factory/active is unreadable: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    // OI-18: `--force` covers the one refusal an operator most often hits — a
    // lease stranded by an interrupted run. Contract: it clears a lease whose
    // recorded holder pid is PROVABLY dead (signal-0 → ESRCH), refuses a live
    // holder, and refuses a lease with no recorded pid (unprovable; the manual
    // procedure in the admin guide remains the only path for those). The
    // outcome is recorded in the abandoned output, never silent.
    let staleLeaseCleared: { run_id: string; holder_id: string; holder_pid: number } | null = null;
    if (lease.disposition === "run_in_progress") {
      const holder = lease.current.lease;
      const alive = leaseHolderAlive(holder);
      if (force && alive === false) {
        const released = releaseLease(store, lease.current.oid);
        if (released.disposition !== "released") {
          return refuse("abandon: the stale lease changed while clearing it; retry");
        }
        staleLeaseCleared = {
          run_id: holder.run_id,
          holder_id: holder.holder_id,
          holder_pid: holder.holder_pid!,
        };
        lease = acquireLease(store, {
          run_id: runId ?? ORPHAN_SWEEP_LEASE,
          holder_id: randomUUID(),
          holder_pid: process.pid,
          surface: "cli",
          acquired_at: new Date().toISOString(),
        });
        if (lease.disposition === "run_in_progress") {
          return refuse("abandon: the lease was re-acquired by another holder while clearing it; retry");
        }
      } else {
        // Amendment-5 review MINOR: the holder may itself be an orphan sweep, whose
        // lease carries a label rather than a run id. Never render that as a run.
        const held = holder.run_id;
        const liveness =
          alive === true
            ? `its holder process (pid ${holder.holder_pid}) is still alive`
            : alive === false
            ? `its holder process (pid ${holder.holder_pid}) is dead; rerun with --force to clear it`
            : "it records no holder pid, so staleness cannot be proven (see the admin guide's manual recovery)";
        return refuse(
          held === ORPHAN_SWEEP_LEASE
            ? `abandon: another abandon is sweeping orphans, held by ${holder.holder_id}; ${liveness}`
            : `abandon: ${describeLeaseRun(held)} is already held by ${holder.holder_id}; ${liveness}`,
        );
      }
    }

    // OI-79 packet 2: read the record BEFORE discardRunState deletes its ref —
    // reading afterwards always yields null and every abandon would report noop.
    let record: unknown = null;
    if (runId !== null) {
      try {
        record = JSON.parse(store.read(`refs/factory/runs/${runId}`)?.files["run.json"] ?? "null");
      } catch {
        record = null;
      }
    }
    let outcome;
    let branch: ResetOutcome = { disposition: "noop", reason: "no run record to reset from" };
    try {
      outcome = discardRunState(store, { specId, runId, force, runRefNames: listRunRefs(root) });
      // Reset only after a successful discard and while the lease is still held.
      // A refused reset never fails the abandon: the refs are already gone.
      if (outcome.disposition === "abandoned" && record !== null) branch = resetBranchToBase(root, record);
    } finally {
      try {
        releaseLease(store, lease.oid);
      } catch {
        // ponytail: best-effort, like persistPark — the refs are already gone.
      }
    }
    // OI-18: a cleared stale lease IS discarded state — report it as such even
    // when the spec itself had nothing else recorded.
    if (outcome.disposition === "abandoned" && outcome.discarded.length === 0 && staleLeaseCleared === null) {
      return emit({ disposition: "rejected", reason: `no state is recorded for spec ${specId}` }, false);
    }
    if (outcome.disposition === "refused") return refuse(outcome.reason);
    // run_id is null when the index carried no resolvable run id — the record
    // still names the spec and what was discarded.
    return emit(
      {
        disposition: "abandoned",
        spec_id: specId,
        run_id: runId,
        discarded: outcome.discarded,
        branch,
        ...(staleLeaseCleared === null ? {} : { stale_lease_cleared: staleLeaseCleared }),
      },
      true,
    );
    } catch (error) {
      return emit(
        {
          disposition: "rejected",
          reason: `abandon could not complete for spec ${specId}: ${error instanceof Error ? error.message : String(error)}`,
        },
        false,
      );
    }
  }

  process.stderr.write(USAGE);
  process.exitCode = 2;
}

await main(process.argv.slice(2));
