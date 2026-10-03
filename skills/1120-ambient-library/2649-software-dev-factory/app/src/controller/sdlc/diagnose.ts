// Spec run-diagnosis packet 1: classify a parked run into a failure class, a
// recommended next action, and the context a retry should carry.
//
// ADVICE ONLY. Nothing in the trust chain may consume this — no gate,
// predicate, grader or lifecycle transition. Only surfaces that DISPLAY the
// diagnosis (control room, chat) may read it. The classifier is deliberately
// code-only heuristics over already-recorded evidence; the later diagnostician
// role (an agent reading the full evidence) builds on this seam rather than
// replacing it.
//
// Pure: no git, no spawn, no filesystem, no clock. Fail-closed: anything
// malformed, ambiguous or contradictory returns needs_human rather than
// throwing or guessing.
//
// Classification stands on the parked stage and the missing gate tokens —
// fields every park record carries. `persistPark` (drive.ts) writes no
// top-level `reason`, so a branch only a reason string can enter is dead code
// for every real run; v1 and v2 of this module were rejected for exactly that.

import type { RunEvent } from "./events.ts";

export type DiagnosisClass =
  // The agent's work missed the gates it was given — re-run it, carrying the
  // retry context.
  | "work_wrong"
  // The policy or environment blocked otherwise-sound work.
  | "rules_wrong"
  // The spec itself is wrong or unbuildable.
  | "order_wrong"
  // Everything else, including every undecided needs_owner park.
  | "needs_human";

export type DiagnosisAction =
  | "re_run"
  | "fix_environment_or_policy"
  | "amend_spec"
  | "amend_spec_or_reapprove"
  | "decide_review"
  | "read_evidence";

export interface RetryContext {
  readonly stage: string;
  // Enrichment only. persistPark writes no top-level `reason`, so this is null
  // for every real park; classification never depends on it.
  readonly reason: string | null;
  readonly missing_gates: readonly string[];
}

// Stable shape: every field is always present, so a surface renders it without
// version checks. `retry_context` is null for every class but work_wrong.
export interface Diagnosis {
  readonly class: DiagnosisClass;
  readonly action: DiagnosisAction;
  readonly summary: string;
  readonly retry_context: RetryContext | null;
}

export interface DiagnoseRunInput {
  readonly record: unknown;
  readonly events?: unknown;
}

// The spec's normative gate-token-to-class table, in match order: the first
// rule whose token matches owns the gate. `re_run` appears in exactly one row,
// because recommending a re-run for a gate a re-run reproduces identically
// sends an unattended operator into a loop that never terminates.
const GATE_RULES: readonly {
  readonly matches: (gate: string) => boolean;
  readonly class: DiagnosisClass;
  readonly action: DiagnosisAction;
  readonly why: string;
}[] = [
  {
    matches: (gate) => gate === "intake.spec-digest-matches" || gate === "intake.approval-envelope-valid",
    class: "order_wrong",
    action: "amend_spec_or_reapprove",
    why: "the approval does not cover this spec, and running it again reproduces the same mismatch until an owner signs the spec as it now stands",
  },
  {
    matches: (gate) =>
      gate === "plan.total-criterion-coverage" ||
      gate === "plan.dag-schema-valid" ||
      gate === "plan.classifier-rule-valid",
    class: "order_wrong",
    action: "amend_spec",
    why: "the spec is unbuildable as written, and a fresh attempt replans the same spec and fails the same way",
  },
  {
    matches: (gate) => gate.startsWith("baseline."),
    class: "rules_wrong",
    action: "fix_environment_or_policy",
    why: "the tree was already failing before this packet, and the agent's work cannot fix a pre-existing break",
  },
  {
    matches: (gate) => gate === "quality.required-capabilities-or-brownfield-rule-pass",
    class: "rules_wrong",
    action: "fix_environment_or_policy",
    why: "this is a profile or capability gap, not a coding mistake",
  },
  {
    matches: (gate) => gate.startsWith("red.") || gate.startsWith("green."),
    class: "work_wrong",
    action: "re_run",
    why: "the agent's own output missed, so a fresh attempt carrying this context can plausibly succeed",
  },
  {
    matches: (gate) => gate.startsWith("reconcile."),
    class: "needs_human",
    action: "read_evidence",
    why: "drift needs a human to judge whether the plan still holds",
  },
];

// AC-2 / OI-22: the advice layer never suggests destroying a park still waiting
// on the owner. Every needs_human summary is written to avoid those verbs.
function needsHuman(summary: string, action: DiagnosisAction = "read_evidence"): Diagnosis {
  return { class: "needs_human", action, summary, retry_context: null };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function asStringArray(value: unknown): readonly string[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((item) => typeof item === "string") ? (value as readonly string[]) : null;
}

// The disposition the event mirror ended on, used only to detect a record that
// contradicts its own log. Absent or unreadable events are NOT a contradiction —
// the mirror is best-effort evidence (events.ts swallows every write error), so
// a missing log means "no second opinion", not "conflict".
function terminalEventDisposition(events: unknown): string | null {
  if (!Array.isArray(events)) return null;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = asRecord(events[index]);
    if (event === null) continue;
    if (event["kind"] !== "run-parked" && event["kind"] !== "stage-parked") continue;
    return asString(event["disposition"]);
  }
  return null;
}

// OI-49: start() writes `candidate_ready` BEFORE the lifecycle walk begins
// (start.ts), and only a park overwrites it, so a run killed mid-walk — SIGKILL,
// harness timeout, machine sleep — carries the same record a finished run does.
// The event log tells them apart: an interrupted log's tail is a stage that
// started and never advanced, parked or completed.
//
// Kinds are bound to RunEvent["kind"] so renaming or splitting one upstream
// fails the typecheck here rather than silently reverting to the wrong answer.
const STARTED_KINDS: readonly RunEvent["kind"][] = ["run-started", "stage-started"];

// The stage the log stops on, when the tail is a started stage — otherwise
// null. Malformed entries carry no readable kind and are skipped in both
// directions, exactly as terminalEventDisposition skips them.
function interruptedAtStage(events: unknown): string | null {
  if (!Array.isArray(events)) return null;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = asRecord(events[index]);
    if (event === null) continue;
    const kind = asString(event["kind"]);
    if (kind === null) continue;
    if (!STARTED_KINDS.some((started) => started === kind)) return null;
    return asString(event["stage"]) ?? "an unnamed stage";
  }
  return null;
}

export function diagnoseRun(input: unknown): Diagnosis {
  const outer = asRecord(input);
  if (outer === null) return needsHuman("diagnosis input is not an object");

  const record = asRecord(outer["record"]);
  if (record === null) return needsHuman("run record is missing or not an object");

  const status = asString(record["status"]);
  if (status !== "parked") {
    // Advice only, and worded off the evidence rather than off a heartbeat: a
    // run still executing its first stage looks identical to one killed during
    // it, so the summary reports where the log stops, not that the process died.
    const interruptedAt = status === "candidate_ready" ? interruptedAtStage(outer["events"]) : null;
    if (interruptedAt !== null) {
      return needsHuman(
        `the run record says candidate_ready, but its event log stops at ${interruptedAt} with no advance, park or completion after it — the run was interrupted mid-walk rather than finished. If nothing is still running, clear it with \`factory abandon --spec <spec file> --force\`, which releases the stale lease only when its recorded holder pid is provably dead — it refuses a live holder, and refuses a lease that records no pid at all, for which the admin guide's manual recovery is the only path.`,
      );
    }
    return needsHuman(`run status is ${status ?? "absent"}, not a parked run`);
  }

  const stage = asString(record["stage"]);
  if (stage === null) return needsHuman("parked run record names no stage");

  const disposition = asString(record["disposition"]);
  if (disposition === null) return needsHuman(`park at ${stage} records no disposition`);

  const eventDisposition = terminalEventDisposition(outer["events"]);
  if (eventDisposition !== null && eventDisposition !== disposition) {
    return needsHuman(
      `record says ${disposition} at ${stage} but the event log ends on ${eventDisposition}; the evidence contradicts itself`,
    );
  }

  // An undecided park awaiting the owner outranks every gate rule: the owner's
  // decision IS the next action, and it is never automation's to pre-empt.
  if (disposition === "needs_owner") {
    return needsHuman(
      `the run is parked at ${stage} and is undecided, awaiting the owner's decision`,
      "decide_review",
    );
  }

  if (disposition !== "failed") {
    return needsHuman(`park disposition ${disposition} at ${stage} is not a recognized failure`);
  }

  const missing = asStringArray(record["missing"]);
  if (missing === null || missing.length === 0) {
    return needsHuman(`the run failed at ${stage} but records no missing gate to act on`);
  }

  const rules = missing.map((gate) => GATE_RULES.find((rule) => rule.matches(gate)) ?? null);
  const first = rules[0];
  // Fail closed: a gate outside the table, or gates that disagree about the
  // class, is exactly the ambiguity the spec says to hand to a human.
  // `rules[0]` is null, never undefined — `.find() ?? null` guarantees it, and
  // `missing.length > 0` guarantees the index exists. The old `=== undefined`
  // spelling was therefore a DEAD branch: an unrecognized leading gate fell
  // through to the `some()` clause, which caught it only because `rule === null`
  // short-circuits before `first.class` would dereference null. Correct by
  // evaluation order, one reordering away from a TypeError. Checking `null`
  // makes the guard live and narrows `first` for the uses below.
  if (first === null || rules.some((rule) => rule === null || rule.class !== first.class)) {
    return needsHuman(
      `the ${stage} park is missing ${gateList(missing)}, which the diagnosis cannot classify; read the run's evidence.`,
    );
  }

  // Enrichment, not a requirement: persistPark writes no top-level `reason`,
  // so a park without one is the normal case and classifies identically. Where
  // one is present the summary quotes it verbatim — the spec's named
  // mitigation, so even a wrong class shows the raw evidence.
  const reason = asString(record["reason"]);
  const quoted = reason === null ? "" : ` Recorded reason: ${reason}`;
  const summary = `The ${stage} stage parked missing ${gateList(missing)} — ${first.why}.${quoted}`;

  return first.class === "work_wrong"
    ? {
        class: first.class,
        action: first.action,
        summary,
        retry_context: { stage, reason, missing_gates: [...missing] },
      }
    : { class: first.class, action: first.action, summary, retry_context: null };
}

function gateList(missing: readonly string[]): string {
  return `${missing.length === 1 ? "gate" : "gates"} ${missing.join(", ")}`;
}
