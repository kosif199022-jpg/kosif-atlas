// Packet P12 (FR-K1; §7, §8): read-only install check. Validates the §8
// quality profile strictly (stdlib line parsing, no YAML dependency) and
// rejects custom refs under refs/factory/*. Writes nothing; never throws.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { buildConfiguredAdapter } from "../kernel/adapters/configured.ts";
import type { Adapter } from "../kernel/adapters/types.ts";
import { stripTrailingComment, unquote } from "./green-suite.ts";
import { MANIFEST_PATH, POLICY_PATH } from "./scaffold/index.ts";
import { isProcessString } from "../kernel/guards.ts";

export interface DoctorFinding {
  readonly kind: "invalid_input" | "manifest" | "quality_profile" | "custom_ref" | "adapter";
  readonly path?: string;
  readonly reason: string;
}

export interface DoctorResult {
  readonly ok: boolean;
  readonly findings: readonly DoctorFinding[];
}

// Owner decision 3: factory-owned ref shapes; everything else under refs/factory/ is custom.
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const OWNED_REF = new RegExp(
  `^refs/factory/(runs/${UUID}|specs/[A-Za-z0-9._-]+|candidates/${UUID}/[0-9]+|approvals|active)$`,
);

const REQUIRED_STRINGS = ["runtime", "test_unit", "test_selector", "coverage"] as const;
const BROWNFIELD_POLICIES = new Set(["no_regression_and_ratchet"]);

// P38 review 2, M-A′: doctor and green-suite.ts must move together on what a
// value IS — §8 records a capability's "deliberately absent" rationale as a
// trailing comment, and doctor once validated the comment as part of the value
// (the exact string OI-13 was filed on). `stripTrailingComment` and `unquote`
// are therefore IMPORTED from green-suite.ts (owner-approved dedup, 2026-08-27)
// rather than hand-synchronised copies; see their notes there. The line-scan
// loops stay separate on purpose: profileProblems() validates (records
// duplicate keys and unparseable lines, last-value-wins) while green-suite's
// readProfileValues() reads permissively (skips bad lines, first-value-wins) —
// unifying them would change one side's behavior.

// P38 review 3, MAJOR-2. `stripTrailingComment` claimed an unterminated quote was
// "left intact for doctor to reject" — and doctor did not reject it. A profile
// with a dropped closing quote, or a quoted value with argv trailing after it,
// passed doctor clean and then parked baseline with "governed run: no controller
// result for stage baseline": OI-13's verbatim string, from the packet meant to
// eliminate it. doctor is a real gate (src/cli.ts refuses every command on a
// quality_profile finding), so making it reject here turns an invented guarantee
// into a real one rather than deleting the sentence.
function quotingProblem(key: string, raw: string): string | null {
  const quote = raw.startsWith('"') ? '"' : raw.startsWith("'") ? "'" : null;
  if (quote === null) return null;
  const end = raw.indexOf(quote, 1);
  if (end < 0) return `${key}: unterminated ${quote === '"' ? "double" : "single"} quote`;
  // Only a comment may follow a closing quote. Anything else would be silently
  // truncated by stripTrailingComment, which is worse than refusing it.
  return /^\s*(#.*)?$/.test(raw.slice(end + 1)) ? null : `${key}: text after the closing quote`;
}

// Strict §8 parse: a top-level `quality_profile:` line followed by
// two-space-indented `key: value` scalars. Anything else is a reason.
function profileProblems(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => l === "quality_profile:");
  if (start < 0) return ["missing quality_profile section"];
  const values = new Map<string, string>();
  const problems: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    if (!line.startsWith("  ")) break; // section ended
    const m = /^  ([A-Za-z_][A-Za-z0-9_]*):(?: (.*))?$/.exec(line);
    if (!m) {
      problems.push(`unparseable line: ${line.trim()}`);
      continue;
    }
    if (values.has(m[1])) problems.push(`duplicate key: ${m[1]}`);
    const rawValue = (m[2] ?? "").trim();
    const quoting = quotingProblem(m[1], rawValue);
    if (quoting !== null) problems.push(quoting);
    values.set(m[1], stripTrailingComment(rawValue));
  }
  for (const key of REQUIRED_STRINGS) {
    const raw = values.get(key);
    // P38 review m2: the emptiness test has to look at the UNQUOTED value, and at
    // every YAML null spelling. `test_unit: ""` and `test_unit: "null"` passed
    // this gate and then bricked baseline with "governed run: no controller
    // result for stage baseline" — since P38 made `test_unit` the command
    // baseline actually runs, doctor's notion of a valid command has to match
    // what readStageProfile makes of it. The runtime identifier check keeps
    // reading the raw value: a quoted `runtime: "node"` was never an identifier
    // here and this is not the packet to change that.
    const value = raw === undefined ? undefined : unquote(raw).trim();
    if (value === undefined || value === "" || value === "~" || value.toLowerCase() === "null") {
      problems.push(`${key}: required non-empty string`);
    } else if (key === "runtime" && !/^[A-Za-z0-9._-]+$/.test(raw!)) {
      problems.push(`runtime: not an identifier`);
    }
  }
  const floor = values.get("coverage_floor");
  if (floor === undefined || !/^\d+(\.\d+)?$/.test(floor) || Number(floor) > 100) {
    problems.push("coverage_floor: required number in [0, 100]");
  }
  const policy = values.get("brownfield_policy");
  if (policy === undefined || !BROWNFIELD_POLICIES.has(unquote(policy))) {
    problems.push(`brownfield_policy: required one of ${[...BROWNFIELD_POLICIES].join(", ")}`);
  }
  return problems;
}

// Read-only ref listing; null on any failure so the caller fails closed.
function factoryRefs(cwd: string): string[] | null {
  try {
    const result = spawnSync("git", ["for-each-ref", "--format=%(refname)", "refs/factory/"], {
      cwd,
      encoding: "utf8",
    });
    if (result.status !== 0) return null;
    return result.stdout.split("\n").filter((l) => l !== "");
  } catch {
    return null;
  }
}

// P24 (FR-K4/FR-K12): preflight the adapter the CLI would build, from the same
// env config. P36: the builder is now shared with src/cli.ts rather than
// copy-pasted — doctor runs first (policyProblem), so a divergent copy here
// silently shadowed any fix made in the CLI. Throws on invalid config; caller
// catches. Returns null when no adapter is configured (no finding added).
function configuredAdapter(): Adapter | null {
  const vendor = process.env.FACTORY_ADAPTER;
  if (vendor !== "claude" && vendor !== "codex") return null;
  return buildConfiguredAdapter(vendor);
}

export async function doctor(request: { repositoryPath: string }): Promise<DoctorResult> {
  const findings: DoctorFinding[] = [];
  try {
    const path = (request as { repositoryPath?: unknown } | null)?.repositoryPath;
    if (!isProcessString(path) || !existsSync(path)) {
      return { ok: false, findings: [{ kind: "invalid_input", reason: "repositoryPath is not a usable directory" }] };
    }
    if (!existsSync(join(path, MANIFEST_PATH))) {
      findings.push({ kind: "manifest", path: MANIFEST_PATH, reason: "missing; run scaffold" });
    }
    const policyFull = join(path, POLICY_PATH);
    const problems = existsSync(policyFull)
      ? profileProblems(readFileSync(policyFull, "utf8"))
      : ["missing policy file"];
    if (problems.length > 0) {
      findings.push({ kind: "quality_profile", path: POLICY_PATH, reason: problems.join("; ") });
    }
    const refs = factoryRefs(path);
    if (refs === null) {
      findings.push({ kind: "custom_ref", reason: "could not list refs/factory/*" });
    } else {
      for (const ref of refs) {
        if (!OWNED_REF.test(ref)) findings.push({ kind: "custom_ref", path: ref, reason: "not a factory-owned ref shape" });
      }
    }
    // P24: when an adapter is configured, preflight it; an ineligible /
    // unauthenticated adapter cannot run agent stages, so surface it as a
    // finding (which makes ok:false). Not configured => no finding.
    const adapter = configuredAdapter();
    if (adapter !== null) {
      const facts = await adapter.preflight();
      if (!facts.executable.available || !facts.auth.subscriptionEligible) {
        findings.push({
          kind: "adapter",
          path: facts.executable.path,
          reason: !facts.executable.available
            ? "configured adapter executable is unavailable"
            : "configured adapter is not authenticated / subscription-eligible",
        });
      }
    }
  } catch (error) {
    findings.push({ kind: "invalid_input", reason: error instanceof Error ? error.message : String(error) });
  }
  return { ok: findings.length === 0, findings };
}
