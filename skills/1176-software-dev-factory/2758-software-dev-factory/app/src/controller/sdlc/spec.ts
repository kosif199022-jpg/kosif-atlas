import { createHash } from "node:crypto";
import { posix } from "node:path";

import {
  validateApproval,
  type ApprovalEnvelope,
  type LocalApprovalPolicy,
} from "../kernel/approval.ts";

interface SpecPolicy extends LocalApprovalPolicy {
  readonly moduleRoots: readonly string[];
  readonly singlePacketCriteriaCeiling: number;
}

interface ApprovalSidecar {
  readonly path: string;
  readonly envelope: unknown;
}

export interface DeriveApprovedSpecPlanRequest {
  readonly canonicalSpecPayload: string;
  readonly approvalSidecar: ApprovalSidecar;
  readonly policy: SpecPolicy;
}

interface VerificationMethod {
  readonly kind: "test";
  readonly command: string;
}

interface AcceptanceCriterion {
  readonly id: string;
  readonly outcome: string;
  readonly verification: VerificationMethod;
}

interface ExecutableSpec {
  readonly specId: string;
  readonly outcome: string;
  readonly allowedPaths: readonly string[];
  readonly interfacesTouched: readonly string[];
  readonly acceptanceCriteria: readonly AcceptanceCriterion[];
  // OI-26: packets this spec knowingly defers. Optional and empty by default.
  readonly followUpPackets: readonly string[];
}

const SCALAR_FIELDS = new Set(["spec_id", "version", "problem", "outcome"]);
const LIST_FIELDS = new Set([
  "in_scope",
  "out_of_scope",
  "constraints",
  "production_readiness_requirements",
  "risks",
  "allowed_paths",
  "interfaces_touched",
]);
const REQUIRED_FIELDS = new Set([
  ...SCALAR_FIELDS,
  ...LIST_FIELDS,
  "acceptance_criteria",
]);
// OI-26: the single-packet rule refuses a spec whose production `allowed_paths`
// span two module groups, so a feature that is a seam PLUS the surface making it
// usable cannot be one packet. Two shipped packets took the only route available
// — scoping their own surface out — and both are green, `complete` and
// unreachable, because nothing tracked the half that was deferred.
//
// This field is the smallest thing that fixes THAT, and it deliberately loosens
// nothing: the scope rule is unchanged and still refuses the same specs. What
// changes is that the deferred packet becomes a declared, recorded obligation
// carried on every park record, instead of a sentence in `out_of_scope` that no
// artifact holds. Optional, so every existing spec still parses.
const OPTIONAL_LIST_FIELDS = new Set(["follow_up_packets"]);

function requireNonEmpty(value: string | undefined, label: string): string {
  if (value === undefined || value.length === 0) {
    throw new Error(`${label} must not be empty`);
  }
  return value;
}

function parseCriteria(lines: readonly string[]): AcceptanceCriterion[] {
  const criteria: AcceptanceCriterion[] = [];
  let index = 0;

  while (index < lines.length) {
    const idMatch = /^  - id: (.+)$/.exec(lines[index] ?? "");
    const outcomeMatch = /^    outcome: (.+)$/.exec(lines[index + 1] ?? "");
    const verificationHeader = lines[index + 2];
    const kindMatch = /^      kind: (.+)$/.exec(lines[index + 3] ?? "");
    const commandMatch = /^      command: (.+)$/.exec(lines[index + 4] ?? "");

    if (
      idMatch === null ||
      outcomeMatch === null ||
      verificationHeader !== "    verification:" ||
      kindMatch?.[1] !== "test" ||
      commandMatch === null
    ) {
      throw new Error("acceptance_criteria uses an unsupported or malformed shape");
    }

    criteria.push({
      id: requireNonEmpty(idMatch[1], "criterion id"),
      outcome: requireNonEmpty(outcomeMatch[1], "criterion outcome"),
      verification: {
        kind: "test",
        command: requireNonEmpty(commandMatch[1], "verification command"),
      },
    });
    index += 5;
  }

  if (criteria.length === 0) {
    throw new Error("At least one machine-checkable criterion is required");
  }

  if (new Set(criteria.map(({ id }) => id)).size !== criteria.length) {
    throw new Error("Criterion ids must be unique");
  }

  return criteria;
}

function parseFrontmatter(payload: string): ExecutableSpec {
  const lines = payload.split(/\r?\n/);
  if (lines[0] !== "---") {
    throw new Error("Canonical spec must begin with front matter");
  }

  const closingIndex = lines.indexOf("---", 1);
  if (closingIndex < 0) {
    throw new Error("Canonical spec front matter is not closed");
  }

  const frontmatter = lines.slice(1, closingIndex);
  const values = new Map<string, string | readonly string[] | AcceptanceCriterion[]>();

  for (let index = 0; index < frontmatter.length; ) {
    const fieldMatch = /^([a-z_]+):(.*)$/.exec(frontmatter[index] ?? "");
    if (fieldMatch === null) {
      throw new Error("Canonical spec front matter is malformed");
    }

    const field = fieldMatch[1] ?? "";
    const inlineValue = (fieldMatch[2] ?? "").replace(/^ /, "");
    if ((!REQUIRED_FIELDS.has(field) && !OPTIONAL_LIST_FIELDS.has(field)) || values.has(field)) {
      throw new Error(`Unsupported or duplicate spec field: ${field}`);
    }

    if (SCALAR_FIELDS.has(field)) {
      values.set(field, requireNonEmpty(inlineValue, field));
      index += 1;
      continue;
    }

    if (field === "acceptance_criteria") {
      if (inlineValue.length > 0) {
        throw new Error("acceptance_criteria must be a block list");
      }
      const blockStart = index + 1;
      let blockEnd = blockStart;
      while (blockEnd < frontmatter.length && /^\s/.test(frontmatter[blockEnd] ?? "")) {
        blockEnd += 1;
      }
      values.set(field, parseCriteria(frontmatter.slice(blockStart, blockEnd)));
      index = blockEnd;
      continue;
    }

    if (inlineValue === "[]") {
      values.set(field, []);
      index += 1;
      continue;
    }
    if (inlineValue.length > 0) {
      throw new Error(`${field} must be a block list or []`);
    }

    const items: string[] = [];
    let itemIndex = index + 1;
    while (itemIndex < frontmatter.length) {
      const itemMatch = /^  - (.+)$/.exec(frontmatter[itemIndex] ?? "");
      if (itemMatch === null) break;
      items.push(requireNonEmpty(itemMatch[1], `${field} item`));
      itemIndex += 1;
    }
    values.set(field, items);
    index = itemIndex;
  }

  for (const field of REQUIRED_FIELDS) {
    if (!values.has(field)) {
      throw new Error(`Missing required spec field: ${field}`);
    }
  }

  const specId = values.get("spec_id");
  const version = values.get("version");
  const outcome = values.get("outcome");
  const allowedPaths = values.get("allowed_paths");
  const interfacesTouched = values.get("interfaces_touched");
  const acceptanceCriteria = values.get("acceptance_criteria");
  // OI-26: absent is the same as none — an existing spec must keep parsing.
  const followUpPacketsRaw = values.get("follow_up_packets") ?? [];
  if (!Array.isArray(followUpPacketsRaw) || !followUpPacketsRaw.every((p) => typeof p === "string")) {
    throw new Error("follow_up_packets must be a block list of strings or []");
  }

  if (
    typeof specId !== "string" ||
    !/^[a-z0-9][a-z0-9._-]{0,63}$/.test(specId) ||
    typeof version !== "string" ||
    !/^\d+$/.test(version) ||
    typeof outcome !== "string" ||
    !Array.isArray(allowedPaths) ||
    allowedPaths.length === 0 ||
    !allowedPaths.every((path) => typeof path === "string") ||
    !Array.isArray(interfacesTouched) ||
    !interfacesTouched.every((name) => typeof name === "string") ||
    !Array.isArray(acceptanceCriteria)
  ) {
    throw new Error("Canonical spec fields are invalid");
  }

  return {
    specId,
    outcome,
    allowedPaths,
    interfacesTouched,
    acceptanceCriteria: acceptanceCriteria as AcceptanceCriterion[],
    followUpPackets: followUpPacketsRaw as string[],
  };
}

function gitBlobOid(payload: string): string {
  const byteLength = Buffer.byteLength(payload, "utf8");
  return createHash("sha1")
    .update(`blob ${byteLength}\0`, "utf8")
    .update(payload, "utf8")
    .digest("hex");
}

function assertRelativePath(path: string, label: string): void {
  if (
    path.length === 0 ||
    posix.isAbsolute(path) ||
    path.includes("\\") ||
    posix.normalize(path) !== path ||
    path === ".." ||
    path.startsWith("../")
  ) {
    throw new Error(`${label} contains an invalid repository-relative path`);
  }
}

function pathGroup(path: string, moduleRoots: readonly string[]): string {
  for (const root of moduleRoots) {
    if (path.startsWith(`${root}/`)) {
      const firstLevel = path.slice(root.length + 1).split("/", 1)[0];
      return `${root}/${firstLevel}`;
    }
  }
  return "<outside-module-roots>";
}

export interface SpecScopeClassification {
  readonly verdict: "derive" | "agent";
  readonly pathGroups: string[];
  readonly interfacesTouched: number;
  readonly criteriaCount: number;
  readonly ceiling: number;
}

export function classifySpecScope(spec: ExecutableSpec, policy: SpecPolicy): SpecScopeClassification {
  if (
    !Array.isArray(policy.moduleRoots) ||
    policy.moduleRoots.length === 0 ||
    !policy.moduleRoots.every((root) => typeof root === "string") ||
    !Number.isInteger(policy.singlePacketCriteriaCeiling) ||
    policy.singlePacketCriteriaCeiling < 1
  ) {
    throw new Error("Planning policy is malformed");
  }

  for (const root of policy.moduleRoots) assertRelativePath(root, "moduleRoots");
  for (const path of spec.allowedPaths) assertRelativePath(path, "allowed_paths");

  // tests/** is scope-neutral: the packet's accompanying test updates are not
  // production module coupling (red already writes tests/** freely, and the
  // dogfood spec's own risk section predicted a consumer-test fix its packet
  // could not otherwise carry). A spec allowed to touch ONLY tests still
  // routes to agent below — with no production path there is no derived packet.
  const productionPaths = spec.allowedPaths.filter((path) => !path.startsWith("tests/"));
  const pathGroups = [...new Set(productionPaths.map((path) => pathGroup(path, policy.moduleRoots)))];
  const criteriaCount = spec.acceptanceCriteria.length;
  const ceiling = policy.singlePacketCriteriaCeiling;
  const isDerive =
    pathGroups.length === 1 && spec.interfacesTouched.length === 0 && criteriaCount <= ceiling;
  return {
    verdict: isDerive ? "derive" : "agent",
    pathGroups,
    interfacesTouched: spec.interfacesTouched.length,
    criteriaCount,
    ceiling,
  };
}

export function assertSinglePacketScope(spec: ExecutableSpec, policy: SpecPolicy): void {
  if (classifySpecScope(spec, policy).verdict === "agent") {
    throw new Error("Approved spec requires an agent-authored plan");
  }
}

export function deriveApprovedSpecPlan(request: DeriveApprovedSpecPlanRequest) {
  if (typeof request?.canonicalSpecPayload !== "string") {
    throw new Error("Canonical spec payload must be a string");
  }

  const spec = parseFrontmatter(request.canonicalSpecPayload);
  const specDigest = gitBlobOid(request.canonicalSpecPayload);
  const expectedSidecarPath = `.aai/specs/${spec.specId}.approval.json`;

  validateApproval({
    sidecarPath: request.approvalSidecar?.path,
    expectedSidecarPath,
    envelope: request.approvalSidecar?.envelope,
    expectedSubjectDigest: specDigest,
    expectedSubjectKind: "spec",
    policy: request.policy,
  });

  const classifier = classifySpecScope(spec, request.policy);
  const shared = {
    specId: spec.specId,
    specDigest,
    approval: request.approvalSidecar.envelope as ApprovalEnvelope,
    modelCallCount: 0,
    // OI-26: carried out of the spec so the driver can record it. The obligation
    // must outlive the spec file being read.
    followUpPackets: [...spec.followUpPackets],
    classifier,
  };

  if (classifier.verdict === "agent") {
    return {
      ...shared,
      planMode: "agent" as const,
      packets: [] as never[],
      // The plan-author is dispatched with the spec's own scope; the driver
      // grades its DAG against this, not the frontmatter.
      spec: {
        outcome: spec.outcome,
        allowedPaths: [...spec.allowedPaths],
        criterionIds: spec.acceptanceCriteria.map(({ id }) => id),
        verificationBindings: spec.acceptanceCriteria.map(
          ({ id: criterionId, verification: method }) => ({ criterionId, method }),
        ),
      },
    };
  }

  return {
    ...shared,
    planMode: "derive" as const,
    packets: [
      {
        packetId: `${spec.specId}-1`,
        parentIntent: spec.outcome,
        allowedPaths: [...spec.allowedPaths],
        criterionIds: spec.acceptanceCriteria.map(({ id }) => id),
        verificationBindings: spec.acceptanceCriteria.map(
          ({ id: criterionId, verification: method }) => ({
            criterionId,
            method,
          }),
        ),
        dependencies: [],
      },
    ],
  };
}
