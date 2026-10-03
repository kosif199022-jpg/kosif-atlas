import { acquireLease, releaseLease, type AcquireLeaseResult, type LeaseRecord, ORPHAN_SWEEP_LEASE } from "./state/lease.ts";
import { openGitRefStore, type GitRefStore } from "./state/git-ref-store.ts";
import { isProcessSafe, isRecord } from "./guards.ts";

const ACTIVE_REF = "refs/factory/active";

// Packet P09 (FR-K2, FR-K7; §9, §12.1): cross-surface resume. Domain-blind:
// stage names and the terminal status arrive as inputs; run.json.status is the
// last accepted stage (or terminalStatus), so resume continues at the next one
// and replays nothing.

export interface ResumeRequest {
  readonly repositoryPath: string;
  readonly runId: string;
  readonly holderId: string;
  readonly surface: string;
  readonly expected: { readonly specDigest: string };
  readonly stages: readonly string[];
  readonly terminalStatus: string;
  // Owner seam decision (P09 attempt 2): domain-specific candidate revalidation
  // is supplied by the lifecycle; the kernel stays domain-blind.
  readonly verifyCandidate: (run: RunState) => boolean;
}

export type ResumeResult =
  | { readonly disposition: "already_complete"; readonly stage: string; readonly replayed: [] }
  | { readonly disposition: "resumed"; readonly stage: string; readonly replayed: [] }
  | { readonly disposition: "run_in_progress"; readonly runId: string; readonly holderId: string }
  | { readonly disposition: "parked"; readonly reason: "state_invalid" }
  | { readonly disposition: "rejected"; readonly reason: string };

export interface RunState {
  readonly run_id: string;
  readonly spec_id: string;
  readonly spec_digest: string;
  readonly status: string;
  readonly candidate?: Record<string, unknown>;
}

export type RunStateRead =
  | { readonly kind: "found"; readonly oid: string; readonly run: RunState }
  | { readonly kind: "missing" }
  | { readonly kind: "invalid"; readonly reason: string };

// isProcessSafe moved to ./guards.ts (single definition, no competing exports).
export { isProcessSafe } from "./guards.ts";

export function runRef(runId: string): string {
  return `refs/factory/runs/${runId}`;
}

// §9.1: a terminal candidate must structurally name its own (run, spec, final
// stage, attempt) and carry an idempotency key. Domain-specific revalidation
// (recomputing the record) belongs to the lifecycle that produced it.
export function hasCandidateShape(run: RunState, finalStage: string): boolean {
  const c = run.candidate;
  return (
    isRecord(c) &&
    isProcessSafe(c.key) &&
    c.runId === run.run_id &&
    c.specId === run.spec_id &&
    c.stage === finalStage &&
    Number.isInteger(c.attempt) &&
    (c.attempt as number) >= 1
  );
}

// A throwing or non-boolean verifier fails closed.
function verifiedBy(verify: ResumeRequest["verifyCandidate"], record: RunState): boolean {
  try {
    return verify(record) === true;
  } catch {
    return false;
  }
}

// §9.2: a controller resuming its own run reacquires the lease it already holds.
function ownLease(store: GitRefStore, request: ResumeRequest): AcquireLeaseResult | null {
  const snapshot = store.read(ACTIVE_REF);
  if (snapshot === null) return null;
  try {
    const lease = JSON.parse(snapshot.files["lease.json"] ?? "") as LeaseRecord;
    if (isRecord(lease) && lease.run_id === request.runId && lease.holder_id === request.holderId) {
      return { disposition: "acquired", oid: snapshot.oid, lease };
    }
  } catch {
    // Unreadable lease: fall through to acquireLease, which fails closed.
  }
  return null;
}

// L-037: state read back from refs is untrusted; validate shape before acting.
export function readRunState(store: GitRefStore, runId: string): RunStateRead {
  const snapshot = store.read(runRef(runId));
  if (snapshot === null) return { kind: "missing" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(snapshot.files["run.json"] ?? "");
  } catch {
    return { kind: "invalid", reason: "run.json is not valid JSON" };
  }
  if (!isRecord(parsed)) return { kind: "invalid", reason: "run.json is not a record" };
  for (const key of ["run_id", "spec_id", "spec_digest", "status"]) {
    if (!isProcessSafe(parsed[key])) return { kind: "invalid", reason: `run.json is missing ${key}` };
  }
  if (parsed.run_id !== runId) return { kind: "invalid", reason: "run.json run_id does not match its ref" };
  if (parsed.candidate !== undefined && !isRecord(parsed.candidate)) {
    return { kind: "invalid", reason: "run.json candidate is not a record" };
  }
  return { kind: "found", oid: snapshot.oid, run: parsed as unknown as RunState };
}

function run(request: ResumeRequest): ResumeResult {
  if (!isProcessSafe(request.repositoryPath)) return { disposition: "rejected", reason: "Repository path is malformed" };
  if (!isProcessSafe(request.runId)) return { disposition: "rejected", reason: "runId is malformed" };
  if (!isProcessSafe(request.holderId) || !isProcessSafe(request.surface)) {
    return { disposition: "rejected", reason: "holderId and surface are required" };
  }
  if (!isRecord(request.expected) || !isProcessSafe(request.expected.specDigest)) {
    return { disposition: "rejected", reason: "expected.specDigest is required" };
  }
  const stages = Array.isArray(request.stages) ? request.stages.filter((s) => typeof s === "string") : [];
  if (stages.length === 0 || !isProcessSafe(request.terminalStatus)) {
    return { disposition: "rejected", reason: "stages and terminalStatus are required" };
  }
  if (typeof request.verifyCandidate !== "function") {
    return { disposition: "rejected", reason: "verifyCandidate is required" };
  }

  const store = openGitRefStore(request.repositoryPath);
  const state = readRunState(store, request.runId);
  if (state.kind === "missing") return { disposition: "rejected", reason: `Unknown run ${request.runId}` };
  if (state.kind === "invalid") return { disposition: "parked", reason: "state_invalid" };
  const { run: record } = state;

  if (record.spec_digest !== request.expected.specDigest) {
    return { disposition: "rejected", reason: "Expected spec digest does not match the stored run state" };
  }
  const complete = record.status === request.terminalStatus;
  const lastAccepted = complete ? stages.length - 1 : stages.indexOf(record.status);
  if (lastAccepted < 0) return { disposition: "parked", reason: "state_invalid" };
  // Terminal without a verifiable candidate, or the final stage accepted without
  // reaching terminal, is invalid state: there is nothing sound to resume at.
  if (complete ? !verifiedBy(request.verifyCandidate, record) : lastAccepted === stages.length - 1) {
    return { disposition: "parked", reason: "state_invalid" };
  }

  const lease =
    ownLease(store, request) ??
    acquireLease(store, {
      run_id: request.runId,
      holder_id: request.holderId,
      surface: request.surface,
      acquired_at: new Date().toISOString(),
    });
  if (lease.disposition === "run_in_progress") {
    // P37 amendment-7 review MINOR 2: the lease's run_id may be `abandon`'s
    // orphan-sweep LABEL rather than a run. Never emit it in a public runId
    // field — a caller would take it for a run that does not exist.
    const heldRun = lease.current.lease.run_id;
    return {
      disposition: "run_in_progress",
      runId: heldRun === ORPHAN_SWEEP_LEASE ? "" : heldRun,
      holderId: lease.current.lease.holder_id,
    };
  }
  try {
    if (complete) return { disposition: "already_complete", stage: stages[lastAccepted], replayed: [] };
    // ponytail: no stage effects are executed here yet; resume only positions the
    // run at the first incomplete stage. Executing that stage is a later packet.
    return { disposition: "resumed", stage: stages[lastAccepted + 1], replayed: [] };
  } finally {
    releaseLease(store, lease.oid);
  }
}

export async function resumeRun(request: unknown): Promise<ResumeResult> {
  try {
    return run(request as ResumeRequest);
  } catch (error) {
    // Fail closed: no spawn or validation error escapes the public seam.
    return { disposition: "rejected", reason: error instanceof Error ? error.message : String(error) };
  }
}
