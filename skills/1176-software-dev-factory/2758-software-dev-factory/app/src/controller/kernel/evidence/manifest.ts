// Domain-blind evidence manifest and target-head freshness (§4.4, FR-K10).
// Pure: no I/O, no clock (`now` is an input), never throws; invalid input
// fails closed (not ready / reconcile).

import { isRecord, isStringArray } from "../guards.ts";

export interface EvidenceEntry {
  readonly capability: string;
  readonly kind: string;
  readonly producedAt: string;
  readonly validUntil?: string;
  readonly digest: string;
  readonly approvalCritical: boolean;
}

export interface CriterionMapping {
  readonly criterion: string;
  readonly evidence: string;
  readonly subject: string;
  readonly approved?: boolean;
}

export interface EvidenceManifestInput {
  readonly now: string;
  readonly requiredCapabilities: readonly string[];
  readonly criteria: readonly string[];
  readonly criterionMap: readonly CriterionMapping[];
  readonly entries: readonly EvidenceEntry[];
}

export interface EvidenceFinding {
  readonly subject: string;
  readonly reason: "missing" | "expired" | "unmapped" | "invalid-input";
}

export interface EvidenceManifestVerdict {
  readonly ready: boolean;
  readonly failed: readonly EvidenceFinding[];
  readonly flagged: readonly EvidenceFinding[];
}

export interface TargetFreshnessInput {
  readonly recordedTargetHead: string;
  readonly currentTargetHead: string;
}

export interface TargetFreshness {
  readonly fresh: boolean;
  readonly disposition: "proceed" | "reconcile";
}

const OBJECT_ID = /^[0-9a-f]{40}$/;

// L-039: timestamps must carry an explicit offset; offset-less or non-ISO
// strings parse host-TZ dependent and are rejected as invalid input.
const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;

function instant(value: unknown): number | null {
  if (typeof value !== "string" || !ISO_WITH_OFFSET.test(value)) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function isEntry(value: unknown): value is EvidenceEntry {
  return (
    isRecord(value) &&
    typeof value.capability === "string" &&
    typeof value.kind === "string" &&
    instant(value.producedAt) !== null &&
    (value.validUntil === undefined || instant(value.validUntil) !== null) &&
    typeof value.digest === "string" &&
    typeof value.approvalCritical === "boolean"
  );
}

function isMapping(value: unknown): value is CriterionMapping {
  return (
    isRecord(value) &&
    typeof value.criterion === "string" &&
    typeof value.evidence === "string" &&
    typeof value.subject === "string" &&
    (value.approved === undefined || typeof value.approved === "boolean")
  );
}

export function evaluateEvidenceManifest(input: unknown): EvidenceManifestVerdict {
  const invalid: EvidenceManifestVerdict = {
    ready: false,
    failed: [{ subject: "manifest", reason: "invalid-input" }],
    flagged: [],
  };
  if (!isRecord(input)) return invalid;
  const i = input as Partial<EvidenceManifestInput>;
  const now = instant(i.now);
  if (
    now === null ||
    !isStringArray(i.requiredCapabilities) ||
    !isStringArray(i.criteria) ||
    !Array.isArray(i.criterionMap) ||
    !i.criterionMap.every(isMapping) ||
    !Array.isArray(i.entries) ||
    !i.entries.every(isEntry)
  ) {
    return invalid;
  }

  const failed: EvidenceFinding[] = [];
  const flagged: EvidenceFinding[] = [];
  const present = new Set(i.entries.map((e) => e.capability));

  for (const capability of i.requiredCapabilities) {
    if (!present.has(capability)) failed.push({ subject: capability, reason: "missing" });
  }

  for (const entry of i.entries) {
    if (entry.validUntil === undefined || instant(entry.validUntil)! >= now) continue;
    (entry.approvalCritical ? failed : flagged).push({
      subject: entry.capability,
      reason: "expired",
    });
  }

  // A criterion is mapped by test evidence, or by demo evidence the owner
  // approved (P08 owner decision 2: unapproved demo → unmapped).
  for (const criterion of i.criteria) {
    const mapped = i.criterionMap.some(
      (m) =>
        m.criterion === criterion &&
        (m.evidence === "test" || (m.evidence === "demo" && m.approved === true)),
    );
    if (!mapped) failed.push({ subject: criterion, reason: "unmapped" });
  }

  return { ready: failed.length === 0, failed, flagged };
}

export function checkTargetFreshness(input: unknown): TargetFreshness {
  const i = isRecord(input) ? (input as Partial<TargetFreshnessInput>) : {};
  const fresh =
    typeof i.recordedTargetHead === "string" &&
    typeof i.currentTargetHead === "string" &&
    OBJECT_ID.test(i.recordedTargetHead) &&
    OBJECT_ID.test(i.currentTargetHead) &&
    i.recordedTargetHead === i.currentTargetHead;
  return { fresh, disposition: fresh ? "proceed" : "reconcile" };
}
