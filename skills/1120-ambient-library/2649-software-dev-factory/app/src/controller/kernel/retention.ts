// Packet P13 (FR-K11; §9.1 retention): pure, domain-blind GC eligibility.
// `now` is an input (no clock); timestamps need an explicit offset (L-039);
// anything unparseable keeps the run (fail closed). Never throws.

import { isRecord } from "./guards.ts";

export interface RetentionRun {
  readonly runId: string;
  readonly status?: string;
  readonly terminal: boolean;
  readonly completedAt?: string;
  readonly retentionClass?: string;
}

export interface RetentionPolicy {
  readonly keepTerminalDays: number;
  readonly keepApprovalCritical: boolean;
}

// OI-15: `cas_mismatch` was MISSING from this union while `upgrade/index.ts`
// has always produced it — a run whose delete lost a compare-and-swap is kept,
// and that is a legitimate keep reason, not an error. The typecheck found it;
// nothing else had.
export type KeepReason =
  | "nonterminal"
  | "approval_critical"
  | "invalid_timestamp"
  | "within_retention"
  | "invalid_input"
  | "cas_mismatch";

export interface GcEligibility {
  readonly prune: readonly string[];
  readonly keep: readonly { runId: string; reason: KeepReason }[];
}

const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;
const DAY_MS = 86_400_000;

function instant(value: unknown): number | null {
  if (typeof value !== "string" || !ISO_WITH_OFFSET.test(value)) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}


// P37 (M1): one predicate for "this run's state is approval-critical evidence",
// naming BOTH signals a run can carry it in. `gcEligibility` sees only
// `retention_class` (its RetentionRun input is domain-blind and carries no
// record), and `factory abandon` sees only `review_verdict` (a live durable
// record is not classified yet). So the two callers exercise one branch each —
// this is a shared NAME for the notion and the place to add the third signal,
// not a shared code path. Amendment-review MINOR: the first amendment called it
// "one definition", which over-sold it.
// OI-42: the verdict clause asks what the reviewer DECIDED, not whether an
// envelope is present. Once a rejection is recorded into `review_verdict`, a
// presence test made every rejected run approval-critical — `factory abandon`
// refused it as carrying "an accepted review verdict", a false sentence about a
// decision whose whole content is that the packet must be reworked. Only an
// explicit `reject` drops the protection: an envelope whose decision cannot be
// read stays critical, fail-closed.
export function isApprovalCritical(record: unknown): boolean {
  if (!isRecord(record)) return false;
  const verdict = record.review_verdict;
  return (
    record.retention_class === "approval-critical" ||
    (isRecord(verdict) && verdict.decision !== "reject")
  );
}

// OI-22: a `needs_owner` park has not yet been decided — no envelope exists
// for `isApprovalCritical` to see, but it is exactly the state a human is
// meant to act on next. `factory abandon` must not treat "nobody has decided
// yet" the same as "nothing here matters": require the same explicit
// `--force` override it already requires for an accepted verdict.
export function isAwaitingOwnerDecision(record: unknown): boolean {
  return isRecord(record) && record.status === "parked" && record.disposition === "needs_owner";
}

export function gcEligibility(request: {
  runs: readonly RetentionRun[];
  policy: RetentionPolicy;
  now: string;
}): GcEligibility {
  const prune: string[] = [];
  const keep: { runId: string; reason: KeepReason }[] = [];
  const r = request as Partial<typeof request> | null;
  const runs = Array.isArray(r?.runs) ? r.runs : [];
  const nowMs = instant(r?.now);
  const policy = isRecord(r?.policy) ? r.policy : null;
  const days = policy && typeof policy.keepTerminalDays === "number" && Number.isFinite(policy.keepTerminalDays) && policy.keepTerminalDays >= 0
    ? policy.keepTerminalDays
    : null;
  const keepCritical = policy?.keepApprovalCritical !== false;
  for (const run of runs) {
    const runId = isRecord(run) && typeof run.runId === "string" ? run.runId : null;
    if (runId === null) continue;
    const reason = ((): KeepReason | null => {
      if (nowMs === null || days === null) return "invalid_input";
      if (run.terminal !== true) return "nonterminal";
      if (keepCritical && isApprovalCritical({ retention_class: run.retentionClass })) return "approval_critical";
      const completed = instant(run.completedAt);
      if (completed === null) return "invalid_timestamp";
      return nowMs - completed > days * DAY_MS ? null : "within_retention";
    })();
    if (reason === null) prune.push(runId);
    else keep.push({ runId, reason });
  }
  return { prune, keep };
}
