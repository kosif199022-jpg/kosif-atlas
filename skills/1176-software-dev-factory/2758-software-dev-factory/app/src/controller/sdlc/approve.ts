import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { isProcessSafe } from "../kernel/guards.ts";

import {
  validateApproval,
  type ApprovalEnvelope,
  type LocalApprovalPolicy,
} from "../kernel/approval.ts";
import { deriveApprovedSpecPlan } from "./spec.ts";

// Packet P16 (FR-K2 partial): approveSpec stamps a digest-bound approval
// envelope for a canonical spec payload and writes the
// .aai/specs/<spec_id>.approval.json sidecar into the working tree.
// Committing the sidecar stays an owner action — this module never runs git.

export interface ApproveSpecRequest {
  readonly repositoryPath: string;
  readonly canonicalSpecPayload: string;
  readonly policy: LocalApprovalPolicy;
  readonly eventId: string;
  readonly timestamp: string;
}

export type ApproveSpecResult =
  | {
      readonly disposition: "approved";
      readonly specId: string;
      readonly sidecarPath: string;
      readonly envelope: ApprovalEnvelope;
    }
  | { readonly disposition: "digest_conflict"; readonly specId: string; readonly reason: string }
  | { readonly disposition: "rejected"; readonly reason: string };


// Same digest spec.ts computes privately (it is not exported); the tests'
// oracle is `git hash-object --stdin`, which is exactly sha1 over the git
// blob header plus the payload bytes.
function gitBlobOid(payload: string): string {
  const byteLength = Buffer.byteLength(payload, "utf8");
  return createHash("sha1")
    .update(`blob ${byteLength}\0`, "utf8")
    .update(payload, "utf8")
    .digest("hex");
}

const SPEC_VALID_SENTINEL = "Approval sidecar path is not authoritative";

// Reuse spec.ts's parser without duplicating it: deriveApprovedSpecPlan parses
// the payload FIRST and only then validates the approval sidecar, so an empty
// sidecar path deterministically fails with SPEC_VALID_SENTINEL exactly when
// the payload itself is valid. Any other error means the payload (or policy)
// is invalid and approval must be refused.
// ponytail: probe instead of exporting the parser — exporting would touch
// spec.ts, which is outside this packet's write allowance.
function assertSpecPayloadValid(payload: string, policy: LocalApprovalPolicy): void {
  try {
    deriveApprovedSpecPlan({
      canonicalSpecPayload: payload,
      approvalSidecar: { path: "", envelope: null },
      // moduleRoots/ceiling are never reached: validation stops at the sidecar.
      policy: { ...policy, moduleRoots: ["."], singlePacketCriteriaCeiling: 1 },
    });
  } catch (error) {
    if (error instanceof Error && error.message === SPEC_VALID_SENTINEL) return;
    throw error;
  }
  throw new Error("spec validation probe unexpectedly succeeded");
}

// The parser has already accepted the payload, which guarantees exactly one
// top-level `spec_id:` front-matter line; this only re-extracts its value.
function extractSpecId(payload: string): string {
  const lines = payload.split(/\r?\n/);
  const closingIndex = lines.indexOf("---", 1);
  for (const line of lines.slice(1, closingIndex)) {
    const match = /^spec_id: ?(.+)$/.exec(line);
    if (match !== null) {
      const specId = match[1] ?? "";
      // Belt and suspenders before the value lands in a filesystem path.
      if (!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(specId)) break;
      return specId;
    }
  }
  throw new Error("spec_id could not be derived from the canonical payload");
}

function readSidecarRecord(path: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // fall through: unreadable sidecar is treated as a conflict, never overwritten
  }
  return null;
}

function run(request: ApproveSpecRequest): ApproveSpecResult {
  if (typeof request?.canonicalSpecPayload !== "string") {
    throw new Error("Canonical spec payload must be a string");
  }
  if (!isProcessSafe(request.repositoryPath)) {
    throw new Error("Repository path is malformed");
  }

  assertSpecPayloadValid(request.canonicalSpecPayload, request.policy);
  const specId = extractSpecId(request.canonicalSpecPayload);
  const subjectDigest = gitBlobOid(request.canonicalSpecPayload);
  const sidecarPath = `.aai/specs/${specId}.approval.json`;
  const absoluteSidecarPath = join(request.repositoryPath, sidecarPath);

  if (existsSync(absoluteSidecarPath)) {
    const existing = readSidecarRecord(absoluteSidecarPath);
    if (existing === null || existing.subject_digest !== subjectDigest) {
      // Fail closed: never overwrite a sidecar bound to other payload bytes.
      return {
        disposition: "digest_conflict",
        specId,
        reason: `existing ${sidecarPath} is not bound to digest ${subjectDigest}`,
      };
    }
    // Identical digest: idempotent rerun returns the standing approval.
    const validated = validateApproval({
      sidecarPath,
      expectedSidecarPath: sidecarPath,
      envelope: existing,
      expectedSubjectDigest: subjectDigest,
      expectedSubjectKind: "spec",
      policy: request.policy,
    });
    return { disposition: "approved", specId, sidecarPath, envelope: validated };
  }

  const envelope: ApprovalEnvelope = {
    subject_digest: subjectDigest,
    subject_kind: "spec",
    decision: "approve",
    principal: request.policy.localOperatorPrincipal,
    auth_source: "machine_possession",
    timestamp: request.timestamp,
    event_id: request.eventId,
    canonicalization_version: 1,
    policy_version: request.policy.policyVersion,
  };
  // The kernel validator is the authority; nothing is written until it passes.
  const validated = validateApproval({
    sidecarPath,
    expectedSidecarPath: sidecarPath,
    envelope,
    expectedSubjectDigest: subjectDigest,
    expectedSubjectKind: "spec",
    policy: request.policy,
  });

  mkdirSync(dirname(absoluteSidecarPath), { recursive: true });
  // F5: "wx" closes the existsSync->write race; a concurrent creation fails
  // closed as rejected instead of silently overwriting.
  writeFileSync(absoluteSidecarPath, `${JSON.stringify(validated, null, 2)}\n`, { flag: "wx" });
  return { disposition: "approved", specId, sidecarPath, envelope: validated };
}

export async function approveSpec(request: unknown): Promise<ApproveSpecResult> {
  try {
    return run(request as ApproveSpecRequest);
  } catch (error) {
    // Fail closed: no parse or validation error escapes the public seam.
    return {
      disposition: "rejected",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
