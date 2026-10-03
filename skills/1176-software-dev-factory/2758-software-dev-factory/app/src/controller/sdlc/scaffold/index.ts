// Packet P12 (FR-K1; §7): non-destructive three-file install. Preview writes
// nothing; apply refuses before any write when a factory-managed path holds
// foreign bytes; owner files are never rewritten. Never throws.
import { existsSync, lstatSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { isProcessString } from "../../kernel/guards.ts";

export type ScaffoldMode = "preview" | "apply";
export type PlannedAction = "create" | "keep" | "conflict";

export interface ScaffoldRequest {
  readonly repositoryPath: string;
  readonly factoryDigest: string;
  readonly mode: ScaffoldMode;
}

export interface ScaffoldResult {
  readonly disposition: "compatible" | "incompatible" | "applied";
  readonly planned: readonly { path: string; action: PlannedAction }[];
  readonly conflicts: readonly string[];
  readonly written: readonly string[];
}

export const ROUTER_PATH = ".aai/instructions.md";
export const POLICY_PATH = ".aai/policy/factory.yaml";
export const MANIFEST_PATH = ".ailib/manifest.yaml";

const DIGEST_PATTERN = /^[0-9a-f]{64}$/;

// Minimal router (owner decision 1); append semantics for an existing owner
// router are P13.
const ROUTER_CONTENT = `# Repository instructions

## Factory

- Lifecycle and policy: \`.aai/policy/factory.yaml\`
- Vendored runtime manifest: \`.ailib/manifest.yaml\`
`;

// Proposed §8 profile; owner edits are kept byte-for-byte on later runs.
//
// P38 review M-C: these commands are EXECUTED by the controller, so the defaults
// have to emit what the controller reads or the first governed run on a freshly
// scaffolded repo parks at baseline with "governed run: no controller result for
// stage baseline" — byte-identical to the symptom OI-13 was filed on.
//   * `test_unit` runs at baseline and at quality; runSuiteCommand only returns a
//     report when stdout carries `<testcase`, so it needs `--reporter=junit`.
//     Plain `pnpm test` emits none (verified in this repo: 0 matches).
//   * `coverage` runs at green and is read back from coverage/coverage-summary.json,
//     which vitest writes only under `--coverage.reporter=json-summary`.
// `test_selector` is not executed by anything today; it mirrors `test_unit` so an
// operator narrowing the suite does not silently lose the reporter.
const POLICY_CONTENT = `quality_profile:
  runtime: node
  test_unit: "pnpm vitest run --reporter=junit"
  test_selector: "pnpm vitest run --reporter=junit {{selector}}"
  coverage: "pnpm vitest run --coverage.enabled --coverage.reporter=json-summary"
  coverage_floor: 80
  brownfield_policy: no_regression_and_ratchet
`;

function manifestContent(factoryDigest: string): string {
  return `source: software-dev-factory\nversion: 1\ndigest: ${factoryDigest}\n`;
}

const INVALID: ScaffoldResult = { disposition: "incompatible", planned: [], conflicts: [], written: [] };

// L-042: lstat every segment from the root down. A symlink anywhere (it could
// point outside the repository or dangle), a non-directory parent, or a
// non-regular leaf is a conflict reported in preview, before any write.
function plan(root: string, rel: string, content: string, owned: boolean): PlannedAction {
  const segments = rel.split("/");
  let full = root;
  for (let i = 0; i < segments.length; i++) {
    full = join(full, segments[i]);
    let st;
    try {
      st = lstatSync(full);
    } catch {
      return "create"; // this segment and everything below it is missing
    }
    if (st.isSymbolicLink()) return "conflict";
    const leaf = i === segments.length - 1;
    if (!leaf && !st.isDirectory()) return "conflict";
    if (leaf && !st.isFile()) return "conflict";
  }
  if (owned) return "keep"; // .aai/ is owner territory: never rewritten (§7)
  // Factory-managed path: identical bytes are a re-run, anything else is foreign.
  try {
    return readFileSync(join(root, rel), "utf8") === content ? "keep" : "conflict";
  } catch {
    return "conflict";
  }
}

export async function scaffold(request: ScaffoldRequest): Promise<ScaffoldResult> {
  try {
    const r = request as Partial<ScaffoldRequest> | null;
    if (
      !r ||
      !isProcessString(r.repositoryPath) ||
      typeof r.factoryDigest !== "string" ||
      !DIGEST_PATTERN.test(r.factoryDigest) ||
      (r.mode !== "preview" && r.mode !== "apply") ||
      !existsSync(r.repositoryPath)
    ) {
      return INVALID;
    }
    const root = r.repositoryPath;
    const files: readonly [string, string, boolean][] = [
      [ROUTER_PATH, ROUTER_CONTENT, true],
      [POLICY_PATH, POLICY_CONTENT, true],
      [MANIFEST_PATH, manifestContent(r.factoryDigest), false],
    ];
    const planned = files.map(([path, content, owned]) => ({ path, action: plan(root, path, content, owned) }));
    const conflicts = planned.filter((p) => p.action === "conflict").map((p) => p.path);
    if (conflicts.length > 0) return { disposition: "incompatible", planned, conflicts, written: [] };
    if (r.mode === "preview") return { disposition: "compatible", planned, conflicts, written: [] };

    const written: string[] = [];
    try {
      for (const [path, content] of files) {
        if (planned.find((p) => p.path === path)?.action !== "create") continue;
        const full = join(root, path);
        mkdirSync(dirname(full), { recursive: true });
        writeFileSync(full, content, { flag: "wx" }); // wx: refuse to overwrite, even on a race
        written.push(path);
      }
    } catch {
      // All-or-nothing: roll back this run's files; `written` stays the disk truth.
      for (const path of [...written]) {
        try {
          unlinkSync(join(root, path));
          written.splice(written.indexOf(path), 1);
        } catch {
          /* leave it listed */
        }
      }
      return { disposition: "incompatible", planned, conflicts, written };
    }
    return { disposition: "applied", planned, conflicts, written };
  } catch {
    return INVALID;
  }
}
