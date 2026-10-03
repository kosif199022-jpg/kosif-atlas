import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

// Packet P25: run observability — event mirror (specs/observability-event-mirror.md).
//
// One JSONL line per stage transition, appended to
// docs/runs/<run_id>/events.jsonl beside the run's evidence. The mirror is
// PURE OUTPUT: no gate, predicate, or transition reads it — this module only
// ever WRITES (append). The emit is best-effort exactly like drive.ts's
// persistPark: a failed append must never change the run verdict, so every
// error is swallowed. Manifests and run refs remain the single source of truth.

export interface RunEvent {
  readonly ts: string;
  readonly run_id: string;
  readonly seq: number;
  readonly stage: string;
  readonly kind:
    | "run-started"
    // A stage began processing — emitted before the stage's work, so a live
    // reader can tell "red is running" from "red never began" during the
    // minutes an agent invocation takes. P25 reserved this kind ("ignored if
    // emitted"); consumers deriving the trail keep filtering to
    // advanced/parked.
    | "stage-started"
    | "stage-advanced"
    | "stage-parked"
    | "run-parked"
    // The verdict resume walked every remaining gate: the run is complete.
    // Without it the mirror of a finished run ends at run-parked forever.
    | "run-complete";
  readonly tokens?: readonly string[];
  readonly missing?: readonly string[];
  readonly disposition?: string;
  // OI-28: why the stage parked, mirrored here because this log is APPEND-ONLY
  // and the durable run record is not. A second `factory run --spec` on the same
  // spec resolves the SAME run id and overwrites `run.json`, so a first
  // attempt's park reason — and with it OI-25's failing test names — is
  // destroyed by the retry that follows it. That is exactly how the 1/279
  // baseline failure of 2026-08-28 became undiagnosable: the mirror kept the
  // gate tokens, the record kept nothing.
  readonly reason?: string;
  // OI-28: the §10 baseline evidence for a baseline park, for the same reason.
  // Small and bounded — the command, the counts, and the failing test names
  // OI-25 already extracts.
  readonly baseline_evidence?: {
    readonly command?: readonly string[];
    readonly ran?: boolean;
    readonly total?: number;
    readonly failures?: number;
    readonly failing_tests?: readonly string[];
    readonly truncated?: boolean;
  };
  // Model usage the adapter reported for the invocation this event closes
  // (agent stages only, and only when the vendor reported it). Telemetry —
  // nothing reads the log back, and no gate consults these figures.
  readonly usage?: {
    readonly input_tokens?: number;
    readonly output_tokens?: number;
    readonly cost_usd?: number;
  };
}

// The next seq for a run whose log already has lines — the verdict resume
// appends to a log drive.ts started, and seq must stay contiguous across the
// whole file. Best-effort like the writer: unreadable log reads as empty.
export function countRunEvents(repositoryPath: string, runId: string): number {
  try {
    const path = join(repositoryPath, "docs", "runs", runId, "events.jsonl");
    return readFileSync(path, "utf8").split("\n").filter((l) => l.trim() !== "").length;
  } catch {
    return 0;
  }
}

// Append one event line to the run's log, creating the run dir on first write.
// Best-effort: swallow all errors — the mirror is evidence, not the verdict.
export function appendRunEvent(
  repositoryPath: string,
  runId: string,
  event: RunEvent,
): void {
  try {
    const path = join(repositoryPath, "docs", "runs", runId, "events.jsonl");
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, `${JSON.stringify(event)}\n`);
  } catch {
    // ponytail: swallowed on purpose — mirrors persistPark. The verdict already
    // reaches the owner; a lost line is a gap in evidence, never a failed run.
  }
}
