import { isRecord } from "./guards.ts";

export const APPROVAL_SUBJECT_KINDS = [
  "spec",
  "plan_exception",
  "waiver",
  "review_verdict",
  "override",
] as const;

export type ApprovalSubjectKind = (typeof APPROVAL_SUBJECT_KINDS)[number];

export interface ApprovalEnvelope {
  readonly subject_digest: string;
  readonly subject_kind: ApprovalSubjectKind;
  readonly decision: "approve" | "reject" | "revoke";
  readonly principal: string;
  readonly auth_source: string;
  readonly timestamp: string;
  readonly event_id: string;
  readonly canonicalization_version: number;
  readonly policy_version: string;
}

export interface LocalApprovalPolicy {
  readonly approver: string;
  readonly localOperatorPrincipal: string;
  readonly policyVersion: string;
}

export interface ApprovalValidationRequest {
  readonly sidecarPath: string;
  readonly expectedSidecarPath: string;
  readonly envelope: unknown;
  readonly expectedSubjectDigest: string;
  readonly expectedSubjectKind: ApprovalSubjectKind;
  readonly policy: LocalApprovalPolicy;
  readonly canonicalizationVersion?: number;
}

// Diverges from sdlc/roles/conformance.ts's isNonEmptyString: this accepts
// whitespace-only strings (no trim), so it stays local.
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function assertExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): void {
  const actualKeys = Object.keys(value).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();

  if (
    actualKeys.length !== sortedExpectedKeys.length ||
    actualKeys.some((key, index) => key !== sortedExpectedKeys[index])
  ) {
    throw new Error("Approval envelope has missing or unknown fields");
  }
}

function assertPolicy(policy: LocalApprovalPolicy): void {
  if (
    !isNonEmptyString(policy.approver) ||
    !isNonEmptyString(policy.localOperatorPrincipal) ||
    !isNonEmptyString(policy.policyVersion)
  ) {
    throw new Error("Approval policy is malformed");
  }
}

export function validateApproval(
  request: ApprovalValidationRequest,
): ApprovalEnvelope {
  assertPolicy(request.policy);

  if (
    !isNonEmptyString(request.sidecarPath) ||
    request.sidecarPath !== request.expectedSidecarPath
  ) {
    throw new Error("Approval sidecar path is not authoritative");
  }

  if (!isRecord(request.envelope)) {
    throw new Error("Approval envelope is malformed");
  }

  assertExactKeys(request.envelope, [
    "subject_digest",
    "subject_kind",
    "decision",
    "principal",
    "auth_source",
    "timestamp",
    "event_id",
    "canonicalization_version",
    "policy_version",
  ]);

  const envelope = request.envelope;
  const canonicalizationVersion = request.canonicalizationVersion ?? 1;

  if (
    !isNonEmptyString(envelope.subject_digest) ||
    !/^[0-9a-f]{40}$/.test(envelope.subject_digest) ||
    envelope.subject_digest !== request.expectedSubjectDigest ||
    envelope.subject_kind !== request.expectedSubjectKind ||
    envelope.decision !== "approve" ||
    envelope.principal !== request.policy.localOperatorPrincipal ||
    envelope.auth_source !== "machine_possession" ||
    !isNonEmptyString(envelope.timestamp) ||
    Number.isNaN(Date.parse(envelope.timestamp)) ||
    !isNonEmptyString(envelope.event_id) ||
    envelope.canonicalization_version !== canonicalizationVersion ||
    envelope.policy_version !== request.policy.policyVersion
  ) {
    throw new Error("Approval envelope is invalid for this subject and policy");
  }

  return envelope as unknown as ApprovalEnvelope;
}
