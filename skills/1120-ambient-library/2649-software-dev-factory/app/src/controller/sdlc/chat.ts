import { readFileSync } from "node:fs";
import { join } from "node:path";

import { hasCandidateShape, isProcessSafe, readRunState, type RunState } from "../kernel/resume.ts";
import { openGitRefStore, type GitRefStore } from "../kernel/state/git-ref-store.ts";
import { markPrReady, type CandidateRecord } from "./effects/pull-request.ts";
import { SDLC_LIFECYCLE } from "./lifecycle.ts";

// Packet P09 (FR-K2; §9): chat is a thin renderer over controller state. Pure
// read of refs/factory/* — no Git write.
//
// Spec honest-run-status (closes OI-7 / LIM-17): completed stages and their
// transitions come from the P25 event mirror — what the run actually did — not
// from slicing the static lifecycle table by the record's status. The mirror is
// written best-effort, so it is a floor on what happened and never a ceiling: a
// missing or malformed log under-reports rather than fabricating. Falling back
// to the table is the bug. Only this renderer reads the mirror; it decides
// nothing, so the P25 constraint that no gate, predicate, or transition reads it
// holds.

const ACTIVE_REF = "refs/factory/active";
export const TERMINAL_STATUS = "candidate_ready";

export interface RunStatus {
  readonly run_id: string;
  readonly spec_id: string;
  readonly spec_digest: string;
  readonly status: string;
  readonly current_stage: string;
  readonly completed: readonly string[];
  readonly active_jobs: readonly never[];
  readonly decision_needed: string | null;
  readonly recommended_action: string;
  readonly evidence_links: readonly string[];
  readonly allowed_commands: readonly string[];
  readonly lease: { readonly held: boolean; readonly holder: string | null };
  readonly candidate?: CandidateRecord;
  readonly transitions: readonly { readonly stage: string; readonly event: string }[];
}

// L-037: a stored candidate is re-presented only after recomputing it from its
// own claimed (runId, specId, attempt) and matching byte-for-byte (as start.ts does).
function verifiedCandidate(run: RunState, finalStage: string): CandidateRecord | null {
  if (!hasCandidateShape(run, finalStage)) return null;
  const stored = run.candidate as unknown as CandidateRecord;
  try {
    const expected = markPrReady({ ...stored, endpoint: { kind: stored.endpoint } });
    return JSON.stringify(stored) === JSON.stringify(expected) ? expected : null;
  } catch {
    return null;
  }
}

// Owner seam decision: the kernel's domain-blind resumeRun takes this verifier.
export function verifyCandidate(run: unknown): boolean {
  // OI-15: `run.status` / recorded stage names are arbitrary strings.
  const stages: readonly string[] = SDLC_LIFECYCLE.map((s) => s.stage);
  return verifiedCandidate(run as RunState, stages[stages.length - 1]) !== null;
}

export type StatusResult = RunStatus | { readonly disposition: "rejected" | "parked"; readonly reason: string };

// Stages this run's event mirror proves it advanced through, in log order.
// Unreadable, malformed, or absent log => no proven stages, never a throw.
function executedStages(repositoryPath: string, runId: string): readonly string[] {
  let lines: string[];
  try {
    lines = readFileSync(join(repositoryPath, "docs", "runs", runId, "events.jsonl"), "utf8").split("\n");
  } catch {
    return [];
  }
  // OI-15: membership test over stage names read out of the event log.
  const known = new Set<string>(SDLC_LIFECYCLE.map((s) => s.stage));
  const executed: string[] = [];
  for (const line of lines) {
    if (line.trim() === "") continue;
    let event: unknown;
    try {
      event = JSON.parse(line);
    } catch {
      continue; // A lost or corrupt line shortens the report; it never fails it.
    }
    if (typeof event !== "object" || event === null || Array.isArray(event)) continue;
    const { kind, stage } = event as Record<string, unknown>;
    // Only an advance is a completion: run-started and stage-parked are not.
    if (kind !== "stage-advanced" || typeof stage !== "string" || !known.has(stage)) continue;
    if (!executed.includes(stage)) executed.push(stage);
  }
  return executed;
}

function leaseFor(store: GitRefStore, runId: string): RunStatus["lease"] {
  try {
    const parsed: unknown = JSON.parse(store.read(ACTIVE_REF)?.files["lease.json"] ?? "null");
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      const lease = parsed as Record<string, unknown>;
      if (lease.run_id === runId && typeof lease.holder_id === "string") return { held: true, holder: lease.holder_id };
    }
  } catch {
    // L-037: an unreadable lease renders as not held rather than failing the view.
  }
  return { held: false, holder: null };
}

function render(request: { repositoryPath: string; runId: string }): StatusResult {
  if (!isProcessSafe(request.repositoryPath)) return { disposition: "rejected", reason: "Repository path is malformed" };
  if (!isProcessSafe(request.runId)) return { disposition: "rejected", reason: "runId is malformed" };

  const store = openGitRefStore(request.repositoryPath);
  const state = readRunState(store, request.runId);
  if (state.kind === "missing") return { disposition: "rejected", reason: `Unknown run ${request.runId}` };
  if (state.kind === "invalid") return { disposition: "parked", reason: "state_invalid" };
  const { run } = state;

  // OI-15: `run.status` / recorded stage names are arbitrary strings.
  const stages: readonly string[] = SDLC_LIFECYCLE.map((s) => s.stage);
  const complete = run.status === TERMINAL_STATUS;
  const lastAccepted = complete ? stages.length - 1 : stages.indexOf(run.status);
  if (lastAccepted < 0) return { disposition: "parked", reason: "state_invalid" };
  const candidate = complete ? verifiedCandidate(run, stages[stages.length - 1]) : null;
  // Terminal without a verified candidate, or the final stage accepted without
  // reaching terminal, is invalid state; chat never re-presents it.
  if (complete ? candidate === null : lastAccepted === stages.length - 1) {
    return { disposition: "parked", reason: "state_invalid" };
  }
  const completed = executedStages(request.repositoryPath, request.runId);
  const currentStage = stages[complete ? lastAccepted : lastAccepted + 1];

  // Key order is fixed here so in-process and fresh-process renders are JSON-identical.
  return {
    run_id: run.run_id,
    spec_id: run.spec_id,
    spec_digest: run.spec_digest,
    status: run.status,
    current_stage: currentStage,
    completed,
    active_jobs: [],
    // §12.1: owner decisions and evidence links arrive with later packets.
    decision_needed: null,
    recommended_action: complete ? "review the candidate" : `resume the run at ${currentStage}`,
    evidence_links: [],
    allowed_commands: complete ? ["status"] : ["status", "resume"],
    lease: leaseFor(store, request.runId),
    ...(candidate === null ? {} : { candidate }),
    transitions: completed.map((stage) => ({
      stage,
      event: SDLC_LIFECYCLE.find((s) => s.stage === stage)!.effect,
    })),
  };
}

export async function renderStatus(request: unknown): Promise<StatusResult> {
  try {
    return render(request as { repositoryPath: string; runId: string });
  } catch (error) {
    return { disposition: "rejected", reason: error instanceof Error ? error.message : String(error) };
  }
}
