import type {
  Adapter,
  AdapterOutcome,
  AdapterSurface,
  InvocationDiagnostic,
} from "../kernel/adapters/types.ts";
import { evaluateGreenProof, evaluateRedProof } from "./tdd.ts";
import {
  greenProofTokens,
  redProofTokens,
  walkLifecycle,
  type WalkResult,
} from "./lifecycle-walk.ts";
import { gradeGreenSuite } from "./suite-run.ts";
import { coverageValues } from "./predicates/quality.ts";

// The connector between the walker, the worker procedures, and the adapters.
// For one stage it: assembles the worker's prompt (role procedure + job),
// runs the worker in a fresh context via an adapter, grades the returned work
// into walker tokens, and reports where the walk now stands. It is generic over
// the grader, so each stage supplies its own grade() and the connector stays
// worker-agnostic. It never grades by trusting the agent's word — a grader
// checks real artifacts (proofs, suites) the agent produced.

// LIM-21: the governance mode of the run a stage executes under. Caller-declared,
// never inferred from repository state — an inferred mode is exactly the
// implicit rule that breaks the fixture harness. Lived in drive.ts before this
// packet; drive.ts re-exports it so importers keep compiling.
export type GovernanceMode = "controller" | "fixture";

// P32/P33: the stages the controller runs itself (baseline, quality, reconcile)
// plus the one green token it produces its own evidence for. Under governance
// "controller" these tokens may come only from the controller's own result.
const CONTROLLER_TOKEN_PREFIXES: readonly string[] = ["baseline.", "quality.", "reconcile."];
export const GREEN_COVERAGE_TOKEN = "green.coverage-passed";
export function isControllerOwnedToken(token: string): boolean {
  return token === GREEN_COVERAGE_TOKEN || CONTROLLER_TOKEN_PREFIXES.some((prefix) => token.startsWith(prefix));
}

export interface GradeResult {
  // Walker gate tokens the graded work clears (may be empty).
  readonly tokens: readonly string[];
  // Whether the work fully satisfied its grader (distinct from "advanced the
  // walk" — a stage can have gate tokens no built grader produces yet).
  readonly accepted: boolean;
  readonly reason?: string;
  // OI-19: the reviewer's parsed findings (all severities), set only by
  // gradeReview. Present-and-empty means "reviewed, no findings"; absent means
  // the grader was not a review or the reply had no parseable record.
  readonly review?: { readonly findings: readonly ReviewFinding[] };
}

// P23 (FR-K6): the runtime context a stage grader needs, sourced from durable
// run state and the APPROVED spec/packet — never from the agent's own output.
// green reads repositoryPath/redSha/greenSha/allowedPaths/junitXml; plan reads
// criterionIds; red/review ignore it. redSha/greenSha/junitXml are nullable
// because Kernel v1 has no seam that records a committed red/green tree or the
// controller-run suite report yet — a null there grades fail-closed, honestly.
export interface GradeContext {
  readonly repositoryPath: string;
  readonly redSha: string | null;
  readonly greenSha: string | null;
  readonly allowedPaths: readonly string[];
  readonly criterionIds: readonly string[];
  readonly junitXml: string | null;
  // P28 (FR-K6): the green stage's coverage + base-ref inputs, threaded by the
  // driver from run state (green-tree coverage summary, a controller coverage
  // floor, and the base-ref snapshots at red and green). Optional so the other
  // stages' contexts and pre-P28 callers still satisfy the type.
  readonly coverageSummary?: string | null;
  readonly coverageFloor?: number;
  readonly baseRefAtRed?: string | null;
  readonly baseRefAtGreen?: string | null;
  // C1b: the agent-plan path threads the classifier context so gradePlan can
  // mint plan.classifier-rule-valid — the same single-packet rule the classifier
  // applied to the spec, reapplied to every emitted packet. Absent on the derive
  // path (no plan grade) and on pre-C1b callers, whose two-token behaviour holds.
  readonly classifier?: {
    readonly moduleRoots: readonly string[];
    readonly ceiling: number;
    readonly specAllowedPaths: readonly string[];
  };
}

export interface RunStageRequest {
  // Role name; a successful invocation emits `agent:<role>` for the stage's A gate.
  readonly role: string;
  readonly roleProcedure: string;
  // Job context (spec + packet + output contract), rendered by the caller.
  readonly jobContext: string;
  readonly adapter: Adapter;
  readonly invocation: {
    readonly jobId: string;
    readonly requestId: string;
    readonly surface: AdapterSurface;
    readonly workingDirectory: string;
  };
  readonly grade: (agentText: string, context?: GradeContext) => GradeResult;
  // Runtime grade context (repo + approved spec, from state). Optional so
  // single-arg graders (red/review, and pre-P23 callers) still compile.
  readonly context?: GradeContext;
  // Tokens already established by earlier stages.
  readonly priorSatisfied: ReadonlySet<string>;
  // LIM-21: under "controller", grader-minted controller-owned tokens the
  // caller did not already hold are stripped before the walk. Omitted or
  // "fixture" trusts the grader (byte-identical to the pre-LIM-21 behaviour).
  readonly governance?: GovernanceMode;
}

export interface RunStageResult {
  readonly outcome: AdapterOutcome;
  readonly agentText: string | null;
  readonly grade: GradeResult | null;
  // Model-usage figures the adapter reported for this invocation, when it
  // did. Pure telemetry passed through for the event mirror - no gate,
  // grade, or walk reads it.
  readonly usage?: { readonly inputTokens?: number; readonly outputTokens?: number; readonly costUsd?: number };
  // Resulting token set (sorted, deduped), including prior tokens.
  readonly satisfied: readonly string[];
  // LIM-21: grader-minted controller-owned tokens the controller refused
  // (sorted). Reported rather than silently dropped so an event mirror or
  // reviewer can see what was stripped. Always [] outside "controller".
  readonly stripped: readonly string[];
  readonly walk: WalkResult;
  // OI-17 (requirement 4): the adapter's diagnostic for a FAILED invocation,
  // passed through so the driver can record WHY the run parked. Previously
  // `runStage` discarded it, so auth, timeout, nonzero exit and unparseable
  // output all reached the durable record as the same sentence and the only way
  // to tell them apart was to run it again and watch — which is precisely what
  // unattended operation cannot do. Absent on success.
  readonly diagnostic?: InvocationDiagnostic;
}

function assemblePrompt(roleProcedure: string, jobContext: string): string {
  return `${roleProcedure}\n\n---\n\n${jobContext}`;
}

export async function runStage(request: RunStageRequest): Promise<RunStageResult> {
  const { role, roleProcedure, jobContext, adapter, invocation, grade, context, priorSatisfied } =
    request;
  const governance = request.governance;

  const result = await adapter.invoke({
    jobId: invocation.jobId,
    requestId: invocation.requestId,
    surface: invocation.surface,
    prompt: assemblePrompt(roleProcedure, jobContext),
    workingDirectory: invocation.workingDirectory,
  });

  // Invocation failed → no tokens; the walk stands on prior tokens alone.
  if (result.outcome !== "success" || result.response === undefined) {
    return {
      outcome: result.outcome,
      agentText: null,
      grade: null,
      satisfied: [...priorSatisfied].sort(),
      stripped: [],
      walk: walkLifecycle(priorSatisfied),
      ...(result.diagnostic === undefined ? {} : { diagnostic: result.diagnostic }),
    };
  }

  const agentText = result.response.text;
  const graded = grade(agentText, context);
  // LIM-21: on a GOVERNED run a controller-owned token the caller did not
  // already hold is worker mint — strip it so it neither satisfies a gate nor
  // reaches the caller's trail. Prior-held owned tokens came from an earlier
  // controller stage's own result and survive.
  const workerMinted = (token: string): boolean =>
    governance === "controller" && isControllerOwnedToken(token) && !priorSatisfied.has(token);
  const stripped = [...new Set(graded.tokens.filter(workerMinted))].sort();
  // A successful invocation satisfies the stage's agent-produced gate; the
  // grader adds the quality tokens. Both are needed for an agent stage to pass.
  const satisfied = new Set<string>([
    ...priorSatisfied,
    `agent:${role}`,
    ...graded.tokens.filter((token) => !workerMinted(token)),
  ]);

  return {
    outcome: "success",
    agentText,
    grade: graded,
    ...(result.response.usage === undefined ? {} : { usage: result.response.usage }),
    satisfied: [...satisfied].sort(),
    stripped,
    walk: walkLifecycle(satisfied),
  };
}

// ponytail: the red grader lives here while the test-writer is the only wired
// worker; move to a graders/ module when the other three are wired. It delegates
// all real checking to evaluateRedProof (git diff + junit inspection) — this
// wrapper only bridges the agent's returned JSON into that grader and into tokens.
export function gradeRedProof(agentText: string): GradeResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(agentText);
  } catch {
    return { tokens: [], accepted: false, reason: "red output was not valid JSON" };
  }
  const proof = evaluateRedProof(parsed);
  return {
    tokens: redProofTokens(proof),
    accepted: proof.accepted,
    reason: proof.accepted ? undefined : `red proof rejected: ${proof.failedPredicates.join(", ")}`,
  };
}

// Green grader for the implementer: grade what the controller produced after
// the implementer ran (it does not parse agent text — the implementer commits
// nothing; the controller commits the green tree and runs the suite). Composes
// four independent verdicts: the structural green proof (red-commit ancestry +
// allowed-paths discipline), the suite verdict, the coverage floor, and the
// base-ref snapshot. Each flows its token independently, so one failing gate
// still credits the others.
export interface GreenGradeInput {
  readonly repositoryPath: string;
  // null when no committed red/green tree exists yet — evaluateGreenProof then
  // fails the structural predicates closed (a null is not a valid sha).
  readonly redSha: string | null;
  readonly greenSha: string | null;
  readonly allowedPaths: readonly string[];
  readonly junitXml: string | null;
  // P28: state-sourced coverage + base-ref inputs (driver-threaded, never the
  // agent's word). Optional/absent → that gate is not evaluated and does not
  // block (pre-P28 callers with no coverage/base-ref state keep grading on the
  // structural + suite gates alone).
  readonly coverageSummary?: string | null;
  readonly coverageFloor?: number;
  readonly baseRefAtRed?: string | null;
  readonly baseRefAtGreen?: string | null;
}

const SHA40_PATTERN = /^[0-9a-f]{40}$/;

export function gradeGreen(input: GreenGradeInput): GradeResult {
  const proof = evaluateGreenProof({
    repositoryPath: input.repositoryPath,
    redSha: input.redSha,
    greenSha: input.greenSha,
    allowedPaths: input.allowedPaths,
  });
  const suite = gradeGreenSuite(input.junitXml);
  const tokens = [...greenProofTokens(proof), ...suite.tokens];
  const reasons = [
    ...(proof.accepted ? [] : [`green proof rejected: ${proof.failedPredicates.join(", ")}`]),
    ...(suite.reason ? [suite.reason] : []),
  ];

  // green.coverage-passed: evaluated only when the controller supplied a summary.
  let coveragePassed = true;
  if (input.coverageSummary != null) {
    const floor =
      typeof input.coverageFloor === "number" && Number.isFinite(input.coverageFloor)
        ? input.coverageFloor
        : Number.POSITIVE_INFINITY;
    const values = coverageValues(input.coverageSummary);
    if (values !== null && values.lines >= floor && values.branches >= floor) {
      tokens.push("green.coverage-passed");
    } else {
      coveragePassed = false;
      reasons.push(
        values === null
          ? "coverage summary malformed"
          : `coverage below floor ${floor} (lines ${values.lines}, branches ${values.branches})`,
      );
    }
  }

  // green.ref-snapshot-valid: evaluated only when a base-ref snapshot was supplied.
  // The base must not have moved between red and green — both snapshots present,
  // 40-hex, and equal.
  let refSnapshotValid = true;
  if (input.baseRefAtRed != null || input.baseRefAtGreen != null) {
    const atRed = input.baseRefAtRed;
    const atGreen = input.baseRefAtGreen;
    if (
      typeof atRed === "string" &&
      typeof atGreen === "string" &&
      SHA40_PATTERN.test(atRed) &&
      SHA40_PATTERN.test(atGreen) &&
      atRed === atGreen
    ) {
      tokens.push("green.ref-snapshot-valid");
    } else {
      refSnapshotValid = false;
      reasons.push("base ref snapshot moved between red and green");
    }
  }

  return {
    tokens,
    accepted: proof.accepted && suite.accepted && coveragePassed && refSnapshotValid,
    reason: reasons.length > 0 ? reasons.join("; ") : undefined,
  };
}

// --- plan grader (plan-author) -------------------------------------------------
// Mechanical checks on the emitted packet DAG. The judgment ("is this the right
// plan?") is the owner's scope gate, not this grader. plan.classifier-rule-valid
// needs the artifact-category classifier output schema defined first, so it is
// not graded here — the walk blocks on it, honestly.

interface PlanPacket {
  readonly packetId: string;
  readonly allowedPaths: readonly string[];
  readonly criterionIds: readonly string[];
  readonly dependencies: readonly string[];
}

// Diverges from kernel/guards.ts isStringArray: also requires every element
// to be nonempty, so it stays local.
function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string" && x.length > 0);
}

function parsePackets(value: unknown): readonly PlanPacket[] | null {
  if (typeof value !== "object" || value === null) return null;
  const packets = (value as { packets?: unknown }).packets;
  if (!Array.isArray(packets) || packets.length === 0) return null;
  const out: PlanPacket[] = [];
  for (const p of packets) {
    if (
      typeof p !== "object" ||
      p === null ||
      typeof (p as PlanPacket).packetId !== "string" ||
      (p as PlanPacket).packetId.length === 0 ||
      !isStringArray((p as PlanPacket).allowedPaths) ||
      !isStringArray((p as PlanPacket).criterionIds) ||
      !isStringArray((p as PlanPacket).dependencies)
    ) {
      return null;
    }
    out.push(p as PlanPacket);
  }
  return out;
}

// True iff dependencies reference real packets and contain no cycle (Kahn).
function isAcyclic(packets: readonly PlanPacket[]): boolean {
  const ids = new Set(packets.map((p) => p.packetId));
  if (ids.size !== packets.length) return false; // duplicate ids
  const indegree = new Map(packets.map((p) => [p.packetId, 0]));
  for (const p of packets) {
    for (const dep of p.dependencies) {
      if (!ids.has(dep)) return false; // dangling dependency
      indegree.set(p.packetId, (indegree.get(p.packetId) ?? 0) + 1);
    }
  }
  const queue = [...indegree].filter(([, d]) => d === 0).map(([id]) => id);
  let visited = 0;
  while (queue.length > 0) {
    const id = queue.shift()!;
    visited += 1;
    for (const p of packets) {
      if (p.dependencies.includes(id)) {
        indegree.set(p.packetId, (indegree.get(p.packetId) ?? 0) - 1);
        if (indegree.get(p.packetId) === 0) queue.push(p.packetId);
      }
    }
  }
  return visited === packets.length;
}

// True iff no path is claimed by two packets (no packet mutates another's paths).
function hasDisjointPaths(packets: readonly PlanPacket[]): boolean {
  const seen = new Set<string>();
  for (const p of packets) {
    for (const path of p.allowedPaths) {
      if (seen.has(path)) return false;
      seen.add(path);
    }
  }
  return true;
}

// The single §4.2 grouping the classifier applies, local to the grader so the
// packet check reads without importing spec.ts.
function planPathGroup(path: string, moduleRoots: readonly string[]): string {
  for (const root of moduleRoots) {
    if (path.startsWith(`${root}/`)) {
      return `${root}/${path.slice(root.length + 1).split("/", 1)[0]}`;
    }
  }
  return "<outside-module-roots>";
}

export interface PlanClassifierContext {
  readonly moduleRoots: readonly string[];
  readonly ceiling: number;
  readonly specAllowedPaths: readonly string[];
}

// The packet list the grader validated (production DAG), or null when the text
// carries no parseable DAG. Exported so the driver's packet parse shares the
// grader's schema instead of re-implementing it.
export function parsePlanPackets(agentText: string): readonly PlanPacket[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(agentText);
  } catch {
    return null;
  }
  return parsePackets(parsed);
}

// Every emitted packet must be single-packet scoped, per the classifier rule:
// production paths in one path group, criteria at or under the ceiling, every
// path inside the spec's allowed_paths, every criterion owned once. Returns the
// offending packet id, or null when the DAG obeys the rule.
function classifierViolation(
  packets: readonly PlanPacket[],
  classifier: PlanClassifierContext,
): string | null {
  const allowed = new Set(classifier.specAllowedPaths);
  const criterionOwner = new Map<string, string>();
  for (const p of packets) {
    const production = p.allowedPaths.filter((path) => !path.startsWith("tests/"));
    const groups = new Set(production.map((path) => planPathGroup(path, classifier.moduleRoots)));
    if (groups.size > 1) return p.packetId;
    if (p.criterionIds.length > classifier.ceiling) return p.packetId;
    if (p.allowedPaths.some((path) => !allowed.has(path))) return p.packetId;
    for (const id of p.criterionIds) {
      if (criterionOwner.has(id)) return p.packetId;
      criterionOwner.set(id, p.packetId);
    }
  }
  return null;
}

export function gradePlan(
  agentText: string,
  specCriterionIds: readonly string[],
  classifier?: PlanClassifierContext,
): GradeResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(agentText);
  } catch {
    return { tokens: [], accepted: false, reason: "plan output was not valid JSON" };
  }
  const packets = parsePackets(parsed);
  if (packets === null) {
    return { tokens: [], accepted: false, reason: "plan packet DAG is malformed" };
  }

  const tokens: string[] = [];
  const reasons: string[] = [];

  if (isAcyclic(packets) && hasDisjointPaths(packets)) {
    tokens.push("plan.dag-schema-valid");
  } else {
    reasons.push("plan DAG has a cycle, dangling dependency, duplicate id, or overlapping paths");
  }

  const covered = new Set(packets.flatMap((p) => p.criterionIds));
  const uncovered = specCriterionIds.filter((id) => !covered.has(id));
  if (uncovered.length === 0 && specCriterionIds.length > 0) {
    tokens.push("plan.total-criterion-coverage");
  } else {
    reasons.push(`criteria not covered by any packet: ${uncovered.join(", ") || "(none declared)"}`);
  }

  // plan.classifier-rule-valid is minted only on the agent path (classifier
  // supplied), and only when every packet is itself single-packet scoped.
  let required = 2;
  if (classifier !== undefined) {
    required = 3;
    const offender = classifierViolation(packets, classifier);
    if (offender === null) {
      tokens.push("plan.classifier-rule-valid");
    } else {
      reasons.push(`packet ${offender} is not single-packet scoped`);
    }
  }

  return {
    tokens,
    accepted: tokens.length === required,
    reason: reasons.length > 0 ? reasons.join("; ") : undefined,
  };
}

// --- review grader (review-guide) ----------------------------------------------
// Mechanical safety check: no unresolved blocking finding. The verdict ("approve
// this?") is the reviewer's human gate, not this grader.

type Severity = "blocking" | "major" | "minor";
export interface ReviewFinding {
  readonly severity: Severity;
  readonly axis: string;
  readonly path: string;
  readonly reason: string;
}
type Finding = ReviewFinding;

function parseReview(value: unknown): { findings: readonly Finding[] } | null {
  if (typeof value !== "object" || value === null) return null;
  const findings = (value as { findings?: unknown }).findings;
  if (!Array.isArray(findings)) return null;
  for (const f of findings) {
    if (
      typeof f !== "object" ||
      f === null ||
      !["blocking", "major", "minor"].includes((f as Finding).severity) ||
      typeof (f as Finding).path !== "string" ||
      typeof (f as Finding).reason !== "string"
    ) {
      return null;
    }
  }
  return { findings: findings as Finding[] };
}

export function gradeReview(agentText: string): GradeResult {
  // Dogfood run 5 parked here: a real reviewer wraps its verdict in prose or a
  // markdown fence, and a bare JSON.parse of the whole reply rejected every
  // compliant agent — the same failure red's attestation had. Extract instead:
  // whole text first, then every brace-run substring that parses to a review
  // record. Fail-closed: no parseable record anywhere keeps the same reason.
  const readReview = (text: string): { findings: readonly Finding[] } | null => {
    try {
      return parseReview(JSON.parse(text));
    } catch {
      return null;
    }
  };
  let record = readReview(agentText);
  if (record === null) {
    // ponytail: greedy brace scan, not a JSON tokenizer — one agent reply.
    for (let open = agentText.indexOf("{"); open !== -1 && record === null; open = agentText.indexOf("{", open + 1)) {
      for (let close = agentText.indexOf("}", open); close !== -1 && record === null; close = agentText.indexOf("}", close + 1)) {
        record = readReview(agentText.slice(open, close + 1));
      }
    }
  }
  if (record === null) {
    // Run 14a820e9: a substantively complete review with two real findings was
    // reduced to "not valid JSON" because its outer object was never closed, and
    // nothing in the reason said the reply survived — so the rational next move
    // was to pay for the review again. Name where OI-19 retains it. The reply
    // itself is untrusted (§11) and stays out of the reason.
    return {
      tokens: [],
      accepted: false,
      reason:
        "review output was not valid JSON; a bounded copy of the raw reply is retained at review.agent_reply in the run record — read it before re-running the review",
    };
  }
  const blocking = record.findings.filter((f) => f.severity === "blocking");
  if (blocking.length > 0) {
    // OI-19: the refusal carries each finding's reason, not just its path — an
    // operator reading a parked run learns WHAT was wrong, not only where.
    return {
      tokens: [],
      accepted: false,
      reason: `${blocking.length} unresolved blocking finding(s): ${blocking
        .map((f) => `${f.path}: ${f.reason}`)
        .join("; ")}`,
      review: { findings: record.findings },
    };
  }
  return {
    tokens: ["review.no-unresolved-blocking-finding"],
    accepted: true,
    review: { findings: record.findings },
  };
}
