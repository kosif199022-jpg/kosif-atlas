import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// C5 packet 2: leaf module for the `review_agent` verdict. verdict.ts imports
// drive.ts, so these helpers cannot live in either without a cycle once drive.ts
// needs the mint too. They are the packet-1 definitions moved here verbatim
// (reviewRequirement, agentVerdictDigest) plus mintAgentVerdict, the controller
// side that packet 1 left unwritten. Imports nothing from drive.ts or verdict.ts.

// C5 packet 1: `review_requirement` is an OPTIONAL top-level key in
// .aai/policy/factory.yaml, read in the single-line regex style of cli.ts's
// `criteriaCeiling`. Absent → "human" (byte-identical to before the key
// existed); "human"/"both" accepted; any other value fails closed for EVERY
// verdict so an owner never believes a typo left the gate at "human". Absent or
// unreadable file → "human", matching cli.ts's `criteriaCeiling`.
export function reviewRequirement(repositoryPath: string): "human" | "both" | "invalid" {
  let text: string;
  try {
    text = readFileSync(resolve(repositoryPath, ".aai/policy/factory.yaml"), "utf8");
  } catch {
    return "human";
  }
  const match = /^review_requirement:[ \t]*(.*)$/m.exec(text);
  if (match === null) return "human";
  const raw = match[1]!.trim();
  if (raw === "human" || raw === "both") return raw;
  return "invalid";
}

// C5 packet 1: the record binding a `review_agent` verdict must carry —
// sha1(`<run_id>\n<green_sha>\n<sha1(JSON.stringify(record.review))>`). Not a
// signature (D1): it binds a verdict to this parked record, which is what
// packet 2's controller mint needs to be checkable. Reads only run_id,
// green_sha and review, so the digest over the record before `verdicts` is
// spread in equals the digest recomputed from the written record.
export function agentVerdictDigest(record: Record<string, unknown>): string {
  const reviewHash = createHash("sha1").update(JSON.stringify(record.review)).digest("hex");
  return createHash("sha1")
    .update(`${record.run_id as string}\n${record.green_sha as string}\n${reviewHash}`)
    .digest("hex");
}

// C5 packet 2: the controller-minted `review_agent` envelope for a `both`-mode
// review park. Returns null when the record carries no `review` key (nothing to
// vouch for). `decision` is `reject` when the review was unparseable
// (findings null) or carries any blocking/major finding — an unparseable reply
// is not an approval — else `approve`; under `both` the owner stays final.
export function mintAgentVerdict(
  record: Record<string, unknown>,
  policyVersion: string,
): Record<string, unknown> | null {
  if (!("review" in record)) return null;
  const review = record.review as { findings?: readonly { severity?: string }[] | null } | null;
  const findings = review?.findings ?? null;
  // reject when the reply was unparseable (findings null) or carries any
  // blocking/major finding; `?? true` folds the null case into the same branch.
  const clean = findings?.every((f) => f.severity !== "blocking" && f.severity !== "major") ?? false;
  const decision = clean ? "approve" : "reject";
  return {
    subject_digest: agentVerdictDigest(record),
    subject_kind: "review_verdict",
    decision,
    principal: "review_agent",
    auth_source: "controller_invocation",
    timestamp: new Date().toISOString(),
    event_id: `verdict-${randomUUID()}`,
    canonicalization_version: 1,
    policy_version: policyVersion,
  };
}
