import {
  evaluateQuality,
  type QualityProfile,
  type QualityVerdict,
} from "./predicates/quality.ts";
import { runSuiteCommand } from "./suite-run.ts";

// Packet P29 (FR-K4/FR-K10): run the quality profile's required capabilities on
// the candidate (green) tree and return the single quality gate token FROM the
// real command result. The driver grants this token from this result — never
// from worker/agent text. Pure over its inputs (one spawn per capability), fail-
// closed, and non-throwing: a capability whose command emits no readable report
// records the failure (via the reused evaluateQuality predicate) rather than
// granting the token. runQuality does NOT checkout — the repo is assumed already
// at the green tree.

const QUALITY_PASS = "quality.required-capabilities-or-brownfield-rule-pass";

export interface QualityRequest {
  readonly repositoryPath: string;
  // Recorded as §10 evidence; the repo is assumed already at the green tree.
  readonly candidateSha: string;
  // required capabilities + coverageFloor (predicates/quality.ts profile).
  readonly profile: QualityProfile;
  // argv per required (junit) capability, keyed by capability name.
  readonly capabilityCommands: Readonly<Record<string, readonly string[]>>;
  readonly timeoutMs: number;
}

export interface QualityResult {
  readonly tokens: readonly string[]; // [QUALITY_PASS] iff verdict.passed, else []
  readonly accepted: boolean; // === verdict.passed
  readonly verdict: QualityVerdict; // the evaluateQuality verdict (evidence)
  readonly reason?: string;
}

// For each required capability run its command via runSuiteCommand; a null report
// (spawn error / no readable junit) is simply omitted from the candidate map, so
// the reused evaluateQuality predicate records it as a missing capability and
// fails closed. Coverage regression stays green's job (graded at the green
// stage), so no baseline coverage is threaded here.
export function runQuality(request: QualityRequest): QualityResult {
  const candidate: Record<string, string> = {};
  for (const capability of request.profile.required) {
    const command = request.capabilityCommands[capability];
    if (command === undefined || command.length === 0) continue;
    const junit = runSuiteCommand({
      repositoryPath: request.repositoryPath,
      command,
      timeoutMs: request.timeoutMs,
    });
    if (junit !== null) candidate[capability] = junit;
  }

  const verdict = evaluateQuality({ baseline: {}, candidate, profile: request.profile });
  const accepted = verdict.passed;
  return {
    tokens: accepted ? [QUALITY_PASS] : [],
    accepted,
    verdict,
    reason: accepted
      ? undefined
      : (verdict.records.find((r) => !r.passed)?.reason ?? "required capabilities not satisfied"),
  };
}
