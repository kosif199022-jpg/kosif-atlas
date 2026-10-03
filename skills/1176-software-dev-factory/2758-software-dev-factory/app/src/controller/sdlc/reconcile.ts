// Packet P29 (FR-K4/FR-K10): check target-head freshness and CLASSIFY drift,
// returning the two reconcile gate tokens FROM the comparison result. The driver
// grants these from this result — never from worker/agent text. Pure over its
// two supplied snapshots (a 40-hex compare, mirroring green's ref-snapshot-valid
// precedent), fail-closed, and non-throwing.
//
//   both snapshots present, 40-hex, EQUAL  -> drift "none",  both tokens, accepted
//   both present, 40-hex, DIFFER           -> drift "moved", drift-classified only
//   either missing / not 40-hex            -> drift "unknown", no tokens (fail-closed)

const RECONCILE_MERGEABLE = "reconcile.mergeable-with-current-target";
const RECONCILE_DRIFT = "reconcile.drift-classified";

export interface ReconcileRequest {
  readonly repositoryPath: string;
  readonly targetRefAtStart: string | null; // base/target head snapshot at run start
  readonly targetRefNow: string | null; // target head read at reconcile
}

export interface ReconcileResult {
  readonly tokens: readonly string[]; // subset of the two reconcile P tokens
  readonly accepted: boolean; // mergeable && classified (target unchanged)
  readonly drift: "none" | "moved" | "unknown";
  readonly reason?: string;
}

function isSha(value: string | null): value is string {
  return typeof value === "string" && /^[0-9a-f]{40}$/.test(value);
}

export function reconcile(request: ReconcileRequest): ReconcileResult {
  const { targetRefAtStart, targetRefNow } = request;
  if (!isSha(targetRefAtStart) || !isSha(targetRefNow)) {
    return {
      tokens: [],
      accepted: false,
      drift: "unknown",
      reason: "target ref snapshot missing or malformed",
    };
  }
  if (targetRefAtStart === targetRefNow) {
    // The target did not move under the run: mergeable AND classified.
    return { tokens: [RECONCILE_MERGEABLE, RECONCILE_DRIFT], accepted: true, drift: "none" };
  }
  // The target moved: the drift is CLASSIFIED, not silently accepted — mergeable
  // is withheld.
  return {
    tokens: [RECONCILE_DRIFT],
    accepted: false,
    drift: "moved",
    reason: `target moved from ${targetRefAtStart} to ${targetRefNow}`,
  };
}
