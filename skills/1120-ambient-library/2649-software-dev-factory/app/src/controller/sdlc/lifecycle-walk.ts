import type { ProofEvaluation } from "./tdd.ts";
import { SDLC_LIFECYCLE, type SdlcStage } from "./lifecycle.ts";

// The controller run-loop spine: walk SDLC_LIFECYCLE in order, advancing only
// while each stage's gate is fully satisfied, and stop fail-closed at the first
// unmet gate. This is gate-and-grade only: the caller establishes satisfied
// gate tokens (by grading proofs, recording owner approvals, etc.); the walker
// consumes them to drive transitions. It never invokes an agent or runs a test.
//
// Gate tokens per stage:
//   - every predicate name in requirements.P
//   - every human-gate name in requirements.H
//   - `agent:<role>` for every role in requirements.A (proof that the agent
//     stage produced its artifact; the walker does not produce it)

export interface WalkResult {
  // Furthest stage whose gate (and every prior gate) was satisfied. null before
  // the first stage passes.
  readonly reached: string | null;
  // First stage with an unmet gate, or null when every stage passed.
  readonly blockedAt: string | null;
  // Unmet gate tokens at blockedAt, in requirement order. Empty when unblocked.
  readonly missing: readonly string[];
}

function stageTokens(stage: SdlcStage): readonly string[] {
  return [
    ...stage.requirements.P,
    ...stage.requirements.A.map((role) => `agent:${role}`),
    ...stage.requirements.H,
  ];
}

export function walkLifecycle(satisfied: ReadonlySet<string>): WalkResult {
  // Fail closed on a malformed satisfied set rather than treating it as empty.
  if (
    satisfied === null ||
    typeof satisfied?.has !== "function" ||
    typeof satisfied?.forEach !== "function"
  ) {
    throw new Error("satisfied must be a Set of gate tokens");
  }

  let reached: string | null = null;
  for (const stage of SDLC_LIFECYCLE) {
    const missing = stageTokens(stage).filter((token) => !satisfied.has(token));
    if (missing.length > 0) {
      return { reached, blockedAt: stage.stage, missing };
    }
    reached = stage.stage;
  }
  return { reached, blockedAt: null, missing: [] };
}

// Bridge tdd.ts output into walker tokens: an accepted proof clears exactly the
// structural predicates it is responsible for; a rejected one clears none of
// them (its failedPredicates name what stayed red). These are the only red/green
// predicates any built code evaluates today — the rest of each stage's P set
// (e.g. red.executed-pre-change, green.suite-passed) has no evaluator yet, so a
// gate built only from these will correctly block until those are built.
const RED_STRUCTURAL = ["red.failed-by-assertion", "red.test-only-tree-committed"] as const;
const GREEN_STRUCTURAL = ["green.red-commit-is-ancestor", "green.allowed-paths-valid"] as const;

function clearedTokens(
  proof: ProofEvaluation,
  responsible: readonly string[],
): readonly string[] {
  const failed = new Set(proof.failedPredicates);
  return responsible.filter((name) => !failed.has(name));
}

export function redProofTokens(proof: ProofEvaluation): readonly string[] {
  return clearedTokens(proof, RED_STRUCTURAL);
}

export function greenProofTokens(proof: ProofEvaluation): readonly string[] {
  return clearedTokens(proof, GREEN_STRUCTURAL);
}
