import { spawnSync } from "node:child_process";
import { isProcessString, isStringArray } from "../kernel/guards.ts";

export interface RedProofInput {
  readonly repositoryPath: string;
  readonly baseSha: string;
  readonly redSha: string;
  readonly testPathPrefixes: readonly string[];
  readonly junitXml: string;
  readonly assertionFailureTypes: readonly string[];
  readonly attestedCause: string;
}

export interface GreenProofInput {
  readonly repositoryPath: string;
  readonly redSha: string;
  readonly greenSha: string;
  readonly allowedPaths: readonly string[];
}

export interface ProofEvaluation {
  readonly accepted: boolean;
  readonly failedPredicates: readonly string[];
}

const SHA_PATTERN = /^[0-9a-f]{40}$/;

// Read-only git query. Returns null on any failure so callers fail closed.
function gitRead(cwd: string, args: readonly string[]): string | null {
  try {
    const result = spawnSync("git", [...args], { cwd, encoding: "utf8" });
    return result.status === 0 ? result.stdout : null;
  } catch {
    return null;
  }
}

// Prefix allowlist matched on path-segment boundaries: "tests" matches
// "tests/x.ts" but not "testsuite/x.ts". Empty prefixes never match.
function underPrefix(path: string, prefix: string): boolean {
  if (prefix.length === 0) return false;
  const dir = prefix.endsWith("/") ? prefix : `${prefix}/`;
  return path === prefix || path.startsWith(dir);
}

function changedPaths(
  cwd: string,
  from: string,
  to: string,
): readonly string[] | null {
  const out = gitRead(cwd, ["diff", "--name-only", "-z", from, to]);
  if (out === null) return null;
  return out.split("\0").filter((p) => p.length > 0);
}

function isAncestor(cwd: string, ancestor: string, descendant: string): boolean {
  return gitRead(cwd, ["merge-base", "--is-ancestor", ancestor, descendant]) !== null;
}

// JUnit failure/error elements: every one must be in the assertion family, and
// at least one must exist. ponytail: attribute regex, not an XML parser —
// enough for vitest's reporter output; swap in a parser if reports get exotic.
// Exported as the one strict failure-element grammar (any untyped element →
// null); predicates/quality.ts builds its failure count on it (owner-approved
// dedup, 2026-08-27). suite-run.ts's evaluateSuite (substring counting, no
// type rule) and drive.ts's isAssertionFailureReport (ignores untyped
// elements) accept DIFFERENT grammars on purpose — do not unify them into this.
export function junitFailureTypes(junitXml: string): readonly string[] | null {
  const types: string[] = [];
  // Attribute values may legally contain a literal `>` (XML forbids only `<`
  // and `&` there), and JUnit writers do emit one inside a failure message.
  // `[^>]*` stopped inside the message, lost the `type` that followed, and
  // graded a conforming assertion failure as untyped -- rejecting red for a
  // report that was correct. Skip over quoted runs instead.
  const element = /<(failure|error)\b((?:"[^"]*"|'[^']*'|[^>])*?)\/?>/g;
  for (const match of junitXml.matchAll(element)) {
    const type = /\btype\s*=\s*"([^"]*)"/.exec(match[2] ?? "");
    if (!type) return null;
    types.push(type[1] ?? "");
  }
  return types;
}

function verdict(failed: string[]): ProofEvaluation {
  return { accepted: failed.length === 0, failedPredicates: failed };
}

function rejectAll(predicates: readonly string[]): ProofEvaluation {
  return verdict([...predicates]);
}

export function evaluateRedProof(input: unknown): ProofEvaluation {
  const all = ["red.failed-by-assertion", "red.test-only-tree-committed"];
  if (typeof input !== "object" || input === null) return rejectAll(all);
  const i = input as Partial<RedProofInput>;
  if (
    !isProcessString(i.repositoryPath) ||
    typeof i.baseSha !== "string" ||
    !SHA_PATTERN.test(i.baseSha) ||
    typeof i.redSha !== "string" ||
    !SHA_PATTERN.test(i.redSha) ||
    !isStringArray(i.testPathPrefixes) ||
    i.testPathPrefixes.length === 0 ||
    typeof i.junitXml !== "string" ||
    !isStringArray(i.assertionFailureTypes) ||
    i.assertionFailureTypes.length === 0 ||
    typeof i.attestedCause !== "string" ||
    i.attestedCause.trim() === ""
  ) {
    return rejectAll(all);
  }

  const failed: string[] = [];

  const types = junitFailureTypes(i.junitXml);
  if (
    types === null ||
    types.length === 0 ||
    types.some((t) => t.length === 0) ||
    !types.every((t) => i.assertionFailureTypes!.includes(t))
  ) {
    failed.push("red.failed-by-assertion");
  }

  const paths = changedPaths(i.repositoryPath, i.baseSha, i.redSha);
  if (
    paths === null ||
    paths.length === 0 ||
    !paths.every((p) => i.testPathPrefixes!.some((prefix) => underPrefix(p, prefix)))
  ) {
    failed.push("red.test-only-tree-committed");
  }

  return verdict(failed);
}

export function evaluateGreenProof(input: unknown): ProofEvaluation {
  const all = ["green.red-commit-is-ancestor", "green.allowed-paths-valid"];
  if (typeof input !== "object" || input === null) return rejectAll(all);
  const i = input as Partial<GreenProofInput>;
  if (
    !isProcessString(i.repositoryPath) ||
    typeof i.redSha !== "string" ||
    !SHA_PATTERN.test(i.redSha) ||
    typeof i.greenSha !== "string" ||
    !SHA_PATTERN.test(i.greenSha) ||
    !isStringArray(i.allowedPaths) ||
    i.allowedPaths.length === 0
  ) {
    return rejectAll(all);
  }

  const failed: string[] = [];

  if (!isAncestor(i.repositoryPath, i.redSha, i.greenSha)) {
    failed.push("green.red-commit-is-ancestor");
  } else {
    const paths = changedPaths(i.repositoryPath, i.redSha, i.greenSha);
    if (
      paths === null ||
      paths.length === 0 ||
      !paths.every((p) => i.allowedPaths!.includes(p))
    ) {
      failed.push("green.allowed-paths-valid");
    }
  }

  return verdict(failed);
}
