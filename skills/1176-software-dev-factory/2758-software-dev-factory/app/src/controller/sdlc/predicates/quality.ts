// Software quality predicates (§8, §10): per-capability pass records over
// JUnit test reports and istanbul coverage summaries, with a per-metric
// ratchet that only rises on an overall pass (P08 owner decisions 1 and 3).
// Pure and non-throwing: malformed reports become failed records.

import { isRecord } from "../../kernel/guards.ts";
import { junitFailureTypes } from "../tdd.ts";

export interface CoverageValues {
  readonly lines: number;
  readonly branches: number;
}

export interface QualityProfile {
  readonly required: readonly string[];
  readonly coverageFloor: number;
  readonly brownfieldPolicy: string;
  readonly assertionFailureTypes: readonly string[];
}

export interface QualityInput {
  readonly baseline: Readonly<Record<string, string>>;
  readonly candidate: Readonly<Record<string, string>>;
  readonly profile: QualityProfile;
}

// Metric values keyed by capability, so non-coverage capabilities can add
// their own metrics later without reshaping the verdict.
export interface QualityValues {
  readonly coverage: CoverageValues;
}

export interface QualityRecord {
  readonly capability: string;
  readonly passed: boolean;
  readonly values?: QualityValues;
  readonly reason?: string;
}

export interface QualityVerdict {
  readonly passed: boolean;
  readonly records: readonly QualityRecord[];
  readonly baseline: QualityValues | null;
  readonly ratchet: QualityValues | null;
}


function isStringMap(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((v) => typeof v === "string");
}

// L-039: a passing report needs positive proof of execution (>= 1 testcase);
// empty, non-XML, zero-test, or attribute-only-failure reports are malformed.
// The element grammar (any untyped failure/error → null) is tdd.ts's shared
// junitFailureTypes; this adds the testcase requirement and the summary-
// attribute cross-check that are quality's own.
function junitFailureCount(junitXml: string): number | null {
  if (!/<testcase\b/.test(junitXml)) return null;
  const types = junitFailureTypes(junitXml);
  if (types === null) return null;
  const count = types.length;
  for (const match of junitXml.matchAll(/\b(failures|errors)\s*=\s*"(\d+)"/g)) {
    if (Number(match[2]) > 0 && count === 0) return null;
  }
  return count;
}

// THE istanbul coverage-summary reader (total.lines.pct / total.branches.pct;
// any malformed shape → null, never throws). Exported as the single shared
// reader — baseline.ts, green-suite.ts and run-stage.ts each carried a private
// copy of this exact body until the owner-approved dedup (2026-08-27); the
// copies caused the OI-13/14 class of drift and are gone. Do not re-inline it.
export function coverageValues(summaryJson: string): CoverageValues | null {
  try {
    const parsed: unknown = JSON.parse(summaryJson);
    if (!isRecord(parsed) || !isRecord(parsed.total)) return null;
    const pct = (metric: unknown) =>
      isRecord(metric) && typeof metric.pct === "number" && Number.isFinite(metric.pct)
        ? metric.pct
        : null;
    const lines = pct(parsed.total.lines);
    const branches = pct(parsed.total.branches);
    return lines === null || branches === null ? null : { lines, branches };
  } catch {
    return null;
  }
}

function evaluateCapability(
  capability: string,
  report: string | undefined,
  baseline: CoverageValues | null,
  profile: QualityProfile,
): QualityRecord {
  if (report === undefined) {
    return { capability, passed: false, reason: `${capability}: required capability missing` };
  }
  if (capability === "coverage") {
    const values = coverageValues(report);
    if (values === null) {
      return { capability, passed: false, reason: `${capability}: malformed report` };
    }
    if (baseline === null) {
      return {
        capability,
        passed: false,
        values: { coverage: values },
        reason: `${capability}: malformed baseline`,
      };
    }
    const floor = profile.coverageFloor;
    const metrics: (keyof CoverageValues)[] = ["lines", "branches"];
    const reasons = metrics.flatMap((m) => {
      if (values[m] < floor) return [`coverage ${m} ${values[m]} below floor ${floor}`];
      if (values[m] < baseline[m]) return [`coverage ${m} regressed from ${baseline[m]} to ${values[m]}`];
      return [];
    });
    return reasons.length === 0
      ? { capability, passed: true, values: { coverage: values } }
      : { capability, passed: false, values: { coverage: values }, reason: reasons.join("; ") };
  }
  // Any other capability is a JUnit report; any failure fails it (decision 1).
  const failures = junitFailureCount(report);
  if (failures === null) return { capability, passed: false, reason: `${capability}: malformed report` };
  return failures === 0
    ? { capability, passed: true }
    : { capability, passed: false, reason: `${capability}: ${failures} failing test(s)` };
}

export function evaluateQuality(input: unknown): QualityVerdict {
  const i = isRecord(input) ? (input as Partial<QualityInput>) : {};
  const p = isRecord(i.profile) ? (i.profile as Partial<QualityProfile>) : {};
  if (
    !isStringMap(i.baseline) ||
    !isStringMap(i.candidate) ||
    !Array.isArray(p.required) ||
    !p.required.every((r) => typeof r === "string") ||
    typeof p.coverageFloor !== "number" ||
    !Number.isFinite(p.coverageFloor)
  ) {
    return {
      passed: false,
      records: [{ capability: "profile", passed: false, reason: "invalid input" }],
      baseline: null,
      ratchet: null,
    };
  }
  const profile = i.profile as QualityProfile;
  const baselineCoverage =
    i.baseline.coverage === undefined ? null : coverageValues(i.baseline.coverage);
  const records = profile.required.map((c) =>
    // L-039: own-property lookup so prototype keys ("constructor") read as missing.
    evaluateCapability(
      c,
      Object.hasOwn(i.candidate!, c) ? i.candidate![c] : undefined,
      baselineCoverage,
      profile,
    ),
  );
  const passed = records.every((r) => r.passed);
  const baseline = baselineCoverage === null ? null : { coverage: baselineCoverage };
  const candidate = records.find((r) => r.capability === "coverage")?.values ?? null;
  // Per-metric ratchet (decision 3): rises only when the whole candidate passes.
  const ratchet =
    passed && baselineCoverage !== null && candidate !== null
      ? {
          coverage: {
            lines: Math.max(baselineCoverage.lines, candidate.coverage.lines),
            branches: Math.max(baselineCoverage.branches, candidate.coverage.branches),
          },
        }
      : baseline;
  return { passed, records, baseline, ratchet };
}
