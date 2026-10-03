import { createHash } from "node:crypto";

import type { EffectRegistration } from "../../kernel/registries.ts";

// Packet P06: the candidate-PR effect behind lifecycle stage `candidate`.
// Only the documented simulated endpoint exists (FR-K4). A real GitHub
// endpoint is a later packet; any other kind fails closed.

export const CANDIDATE_EFFECT = "candidate.mark-pr-ready";
const STAGE = "candidate";

export interface CandidateEndpoint {
  readonly kind: "simulated";
}

export interface CandidateRecord {
  readonly key: string;
  readonly endpoint: "simulated";
  readonly runId: string;
  readonly specId: string;
  readonly stage: typeof STAGE;
  readonly attempt: number;
}

export interface MarkPrReadyInput {
  readonly runId: string;
  readonly specId: string;
  readonly attempt: number;
  readonly endpoint: unknown;
}

// §9.1: deterministic idempotency key from (run_id, spec_id, stage, attempt).
export function candidateKey(input: Omit<MarkPrReadyInput, "endpoint">): string {
  return createHash("sha256")
    .update(JSON.stringify([input.runId, input.specId, STAGE, input.attempt]))
    .digest("hex");
}

export function markPrReady(input: MarkPrReadyInput): CandidateRecord {
  const endpoint = input.endpoint as Partial<CandidateEndpoint> | null | undefined;
  if (endpoint?.kind !== "simulated") {
    throw new Error("Only the simulated candidate endpoint is available");
  }
  if (
    typeof input.runId !== "string" ||
    input.runId.length === 0 ||
    typeof input.specId !== "string" ||
    input.specId.length === 0 ||
    !Number.isInteger(input.attempt) ||
    input.attempt < 1
  ) {
    throw new Error("Candidate effect input is malformed");
  }
  return {
    key: candidateKey(input),
    endpoint: "simulated",
    runId: input.runId,
    specId: input.specId,
    stage: STAGE,
    attempt: input.attempt,
  };
}

export const PULL_REQUEST_EFFECT: EffectRegistration = {
  name: CANDIDATE_EFFECT,
  execute: (input: unknown) => markPrReady(input as MarkPrReadyInput),
};
