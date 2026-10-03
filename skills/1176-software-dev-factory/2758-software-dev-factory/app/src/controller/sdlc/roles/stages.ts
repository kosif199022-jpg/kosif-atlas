import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Adapter } from "../../kernel/adapters/types.ts";
import type { DriveStageWorker } from "../drive.ts";
import { SDLC_LIFECYCLE } from "../lifecycle.ts";
import {
  gradeGreen,
  gradePlan,
  gradeRedProof,
  gradeReview,
  type GradeContext,
  type GradeResult,
} from "../run-stage.ts";
import { validateRolePackage, type RoleIdentity } from "./conformance.ts";

// Packet P22 (FR-K13 role binding + provenance). Bind the four shipped role
// packages under .ailib/factory/roles to the driver's per-stage workers so a
// run can dispatch each SDLC stage. This is pure wiring over existing seams:
// the loader (validateRolePackage) owns loading + identity + fail-closed; the
// real graders (gradeRedProof/gradeReview) own red/review checking. No new
// loader, no adapter invocation here (that seam is P24), no green/plan grader
// (those need runtime context and are P23 — represented fail-closed below).

// Agent worker = the driver contract plus the loader-recorded identity so the
// controller can pin invocation version/digest (spec §14).
export interface RoleStageWorker extends DriveStageWorker {
  readonly identity: RoleIdentity;
}

// P22 review MINOR-1: keep `identity` visible in the return type so a P24
// consumer reads the pinned version/digest without a cast. Non-agent
// pass-through workers omit it; agent workers set it.
export type StageWorker = DriveStageWorker & { readonly identity?: RoleIdentity };

// Stage -> shipped role package. The other five lifecycle stages are
// controller-driven (no agent), so they get deterministic pass-through workers.
const AGENT_ROLE: Record<string, string> = {
  plan: "plan-author",
  red: "test-writer",
  green: "implementer",
  review: "review-guide",
};

// P23 (FR-K6): green/plan grade for real from the runtime context the driver
// threads. green ignores agentText entirely — its authority is the state-sourced
// allowedPaths + real diff, so a caller lying about allowed paths in its output
// cannot widen what the grader enforces. Without a context (a single-arg call,
// e.g. before the driver wires one) they stay fail-closed rather than accept
// vacuously.
const notWired = (which: string): GradeResult => ({
  tokens: [],
  accepted: false,
  reason: `${which} grader not wired: no runtime context (P23)`,
});

const AGENT_GRADER: Record<string, (agentText: string, context?: GradeContext) => GradeResult> = {
  red: gradeRedProof,
  review: gradeReview,
  green: (_agentText, context) => (context === undefined ? notWired("green") : gradeGreen(context)),
  plan: (agentText, context) =>
    context === undefined
      ? notWired("plan")
      : gradePlan(agentText, context.criterionIds, context.classifier),
};

// Default root: the shipped factory role packages (same depth as conformance.ts).
const DEFAULT_ROLES_ROOT = fileURLToPath(
  new URL("../../../../.ailib/factory/roles", import.meta.url),
);

export function buildRoleStages(
  adapter: Adapter,
  rolesRoot: string = DEFAULT_ROLES_ROOT,
): Record<string, StageWorker> {
  const stages: Record<string, StageWorker> = {};

  for (const { stage } of SDLC_LIFECYCLE) {
    const roleName = AGENT_ROLE[stage];

    if (roleName === undefined) {
      // Non-agent stage: deterministic controller pass-through. Ignores the
      // agent text, never touches the adapter, emits one controller token.
      stages[stage] = {
        role: "controller",
        roleProcedure: "",
        jobContext: "",
        adapter,
        grade: () => ({ tokens: [`controller.${stage}-passthrough`], accepted: true }),
      };
      continue;
    }

    // Agent stage: bind only a valid package (fail closed — a malformed or
    // absent package leaves the stage key omitted, no silently-passing worker).
    const packagePath = join(rolesRoot, roleName);
    const validation = validateRolePackage({ packagePath });
    if (!validation.ok || !validation.role) continue;

    let roleMd: string;
    try {
      roleMd = readFileSync(join(packagePath, "ROLE.md"), "utf8");
    } catch {
      continue;
    }

    const worker: RoleStageWorker = {
      role: roleName,
      roleProcedure: roleMd, // the real ROLE.md text, read from the package
      jobContext: "", // rendered per-run by the driver caller (P24)
      adapter,
      identity: validation.role,
      grade: AGENT_GRADER[stage]!,
    };
    stages[stage] = worker;
  }

  return stages;
}
