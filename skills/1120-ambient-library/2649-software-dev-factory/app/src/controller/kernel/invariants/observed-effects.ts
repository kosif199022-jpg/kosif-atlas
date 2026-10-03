// Domain-blind observed-effect invariants (FR-K9). Pure: no I/O, no process
// access. Ref snapshots are opaque line-oriented "<refname> <objectname>" text
// supplied by the caller; path policies are explicit inputs.

import { isStringArray } from "../guards.ts";

export interface ObservedEffectsInput {
  readonly refsBefore: string;
  readonly refsAfter: string;
  readonly changedPaths: readonly string[];
  readonly allowedPaths: readonly string[];
  readonly protectedPaths: readonly string[];
}

export interface EffectViolation {
  readonly kind:
    | "effect.write-outside-allowed-paths"
    | "effect.protected-path-touched"
    | "effect.unauthorized-ref-change"
    | "effect.invalid-input";
  readonly count: number;
}

export interface EffectObservation {
  readonly violations: readonly EffectViolation[];
}

// Opt-in security boundary: only refs that can change the certified candidate
// or hide work from its path checks are watched. New governance ref namespaces
// must be added explicitly; otherwise they remain outside this invariant.
export const OBSERVED_EFFECT_REF_SCOPE = [
  "refs/heads",
  "refs/tags",
  "refs/factory",
  "refs/stash",
  "refs/replace",
] as const;


// Segment-boundary prefix match (L-036): "tests" matches "tests/x" not
// "testsuite/x"; an exact path entry matches only itself; "" never matches.
export function underPrefix(path: string, prefix: string): boolean {
  if (prefix.length === 0) return false;
  const dir = prefix.endsWith("/") ? prefix : `${prefix}/`;
  return path === prefix || path.startsWith(dir);
}

// L-038: a path carrying a relative-traversal segment is not a tracked path;
// it is invalid input, never something to classify against an allowlist.
function hasTraversalSegment(path: string): boolean {
  return path.split("/").some((segment) => segment === ".." || segment === ".");
}

function refLines(snapshot: string): readonly string[] {
  return snapshot.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
}

export function observeEffectViolations(input: unknown): EffectObservation {
  const invalid: EffectObservation = {
    violations: [{ kind: "effect.invalid-input", count: 1 }],
  };
  if (typeof input !== "object" || input === null) return invalid;
  const i = input as Partial<ObservedEffectsInput>;
  if (
    typeof i.refsBefore !== "string" ||
    typeof i.refsAfter !== "string" ||
    !isStringArray(i.changedPaths) ||
    !isStringArray(i.allowedPaths) ||
    !isStringArray(i.protectedPaths) ||
    i.changedPaths.some(hasTraversalSegment)
  ) {
    return invalid;
  }

  const violations: EffectViolation[] = [];

  const isProtected = (p: string) => i.protectedPaths!.some((a) => underPrefix(p, a));
  // A protected path is reported once, under the more specific kind.
  const outside = i.changedPaths.filter(
    (p) => !isProtected(p) && !i.allowedPaths!.some((a) => underPrefix(p, a)),
  );
  if (outside.length > 0) {
    violations.push({ kind: "effect.write-outside-allowed-paths", count: outside.length });
  }

  const touched = i.changedPaths.filter(isProtected);
  if (touched.length > 0) {
    violations.push({ kind: "effect.protected-path-touched", count: touched.length });
  }

  // v1 (P07 owner decision 2): any ref delta is a violation.
  const before = refLines(i.refsBefore);
  const after = new Set(refLines(i.refsAfter));
  const beforeSet = new Set(before);
  const delta =
    before.filter((l) => !after.has(l)).length +
    [...after].filter((l) => !beforeSet.has(l)).length;
  if (delta > 0) {
    violations.push({ kind: "effect.unauthorized-ref-change", count: delta });
  }

  return { violations };
}
