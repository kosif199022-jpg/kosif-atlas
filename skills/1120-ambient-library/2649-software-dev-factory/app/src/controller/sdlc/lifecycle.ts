import type {
  EffectRegistration,
  KernelRegistries,
  PredicateRegistration,
  RoleRegistration,
} from "../kernel/registries.ts";

export interface GateRequirements {
  readonly P: readonly string[];
  readonly A: readonly string[];
  readonly H: readonly string[];
}

export interface SdlcStage {
  readonly stage: string;
  readonly effect: string;
  readonly requirements: GateRequirements;
}

export const SDLC_LIFECYCLE = [
  {
    stage: "intake",
    effect: "intake.validate-approved-handoff",
    requirements: {
      P: [
        "intake.approval-envelope-valid",
        "intake.spec-digest-matches",
        "intake.lease-acquired",
      ],
      A: [],
      H: ["owner.spec-approved"],
    },
  },
  {
    stage: "plan",
    effect: "plan.create-plan",
    requirements: {
      P: [
        "plan.classifier-rule-valid",
        "plan.dag-schema-valid",
        "plan.total-criterion-coverage",
      ],
      A: [],
      H: ["owner.scope-or-waiver-exception-if-required"],
    },
  },
  {
    stage: "baseline",
    effect: "baseline.run-local-profile",
    requirements: {
      P: [
        "baseline.test-unit-result-recorded",
        "baseline.coverage-value-recorded",
        "baseline.no-regression-or-approved-exception",
      ],
      A: [],
      H: ["owner.baseline-exception-if-required"],
    },
  },
  {
    stage: "red",
    effect: "red.produce-failing-tests",
    requirements: {
      P: [
        "red.test-only-tree-committed",
        "red.executed-pre-change",
        "red.failed-by-assertion",
        "red.affected-suite-baseline-green",
      ],
      A: ["test-writer"],
      H: [],
    },
  },
  {
    stage: "green",
    effect: "green.implement-minimum-change",
    requirements: {
      P: [
        "green.suite-passed",
        "green.coverage-passed",
        "green.red-commit-is-ancestor",
        "green.allowed-paths-valid",
        "green.ref-snapshot-valid",
      ],
      A: [],
      H: [],
    },
  },
  {
    stage: "quality",
    effect: "quality.run-full-profile",
    requirements: {
      P: ["quality.required-capabilities-or-brownfield-rule-pass"],
      A: [],
      H: [],
    },
  },
  {
    stage: "reconcile",
    effect: "reconcile.check-target-freshness",
    requirements: {
      P: [
        "reconcile.mergeable-with-current-target",
        "reconcile.drift-classified",
      ],
      A: [],
      H: ["owner.plan-invalidating-drift-if-required"],
    },
  },
  {
    stage: "review",
    effect: "review.collect-verdict",
    requirements: {
      P: ["review.no-unresolved-blocking-finding"],
      A: [],
      H: ["reviewer.review-verdict-approved"],
    },
  },
  {
    stage: "candidate",
    effect: "candidate.mark-pr-ready",
    requirements: {
      P: [
        "candidate.prior-gates-complete",
        "candidate.evidence-complete",
        "candidate.target-fresh",
      ],
      A: [],
      H: [],
    },
  },
] as const satisfies readonly SdlcStage[];

function unavailable(kind: "predicate" | "effect", name: string): never {
  throw new Error(`${kind} ${name} is unavailable until its owning packet`);
}

export const SDLC_PREDICATES: readonly PredicateRegistration[] = [
  ...new Set(SDLC_LIFECYCLE.flatMap((stage) => stage.requirements.P)),
].map((name) => ({
  name,
  evaluate: () => unavailable("predicate", name),
}));

export const SDLC_EFFECTS: readonly EffectRegistration[] = SDLC_LIFECYCLE.map(
  ({ effect: name }) => ({
    name,
    execute: () => unavailable("effect", name),
  }),
);

export const SDLC_ROLES: readonly RoleRegistration[] = [
  { name: "plan-author", packageRef: "unavailable:factory-role/plan-author" },
  { name: "test-writer", packageRef: "unavailable:factory-role/test-writer" },
  { name: "implementer", packageRef: "unavailable:factory-role/implementer" },
  { name: "review-guide", packageRef: "unavailable:factory-role/review-guide" },
];

export function registerSdlc(registries: KernelRegistries): void {
  for (const predicate of SDLC_PREDICATES) {
    registries.predicates.register(predicate);
  }
  for (const effect of SDLC_EFFECTS) {
    registries.effects.register(effect);
  }
  for (const role of SDLC_ROLES) {
    registries.roles.register(role);
  }
}
