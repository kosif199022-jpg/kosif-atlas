import { readFileSync, rmSync } from "node:fs";
import { isAbsolute, join } from "node:path";

import { POLICY_PATH } from "./scaffold/index.ts";
import { coverageValues } from "./predicates/quality.ts";
import { runProjectCommand } from "./suite-run.ts";
import { isProcessString, isRecord } from "../kernel/guards.ts";

// Packet P33 (FR-K6 controller-driven proof, FR-K10 evidence; closes OI-3 and
// OI-4's coverage half): the controller RUNS the §8 quality profile's coverage
// command on the green tree and produces the coverage evidence itself, so
// `green.coverage-passed` is graded from a value THIS run produced rather than
// from a file the graded agent could write (spec §11: agent results are
// untrusted input). Modelled on the P27 baseline.ts precedent — a controller
// stage module that runs a command and returns tokens + §10 records.

export interface CoverageProfile {
  // §8 profile `coverage`, argv-split.
  readonly command: readonly string[];
  // §8 profile `coverage_floor`.
  readonly floor: number;
}

export interface GreenSuiteRequest {
  readonly repositoryPath: string;
  // §10 evidence only; runGreenSuite does NOT checkout.
  readonly greenSha: string | null;
  readonly coverageCommand: readonly string[];
  readonly coverageFloor: number;
  // Repo-relative (or absolute) istanbul coverage-summary.json path.
  readonly coverageSummaryPath: string;
  readonly timeoutMs: number;
}

export interface GreenSuiteResult {
  readonly tokens: readonly string[];
  readonly accepted: boolean;
  // The summary TEXT this run produced (null when the command produced none).
  // This — never a working-tree read — is what the driver threads into the
  // green grade context.
  readonly coverageSummary: string | null;
  readonly records: {
    readonly greenSha: string | null;
    readonly coverageCommand: readonly string[];
    readonly ran: boolean;
    readonly exitCode: number | null;
    readonly coverageFloor: number;
    readonly coverage: { readonly lines: number; readonly branches: number } | null;
  };
  readonly reason?: string;
}

const COVERAGE_PASSED = "green.coverage-passed";

// L-031/L-036: strings handed to process APIs must be nonempty and NUL-free.
function isProcessSafe(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !value.includes("\0");
}

// Scaffold writes the profile's string scalars quoted, so a value may arrive
// as `"node fake-coverage.cjs"`. Shared with doctor.ts (owner-approved dedup,
// 2026-08-27) — the two modules must agree on what a value IS.
export function unquote(raw: string): string {
  const m = /^"(.*)"$/.exec(raw) ?? /^'(.*)'$/.exec(raw);
  return m ? m[1]! : raw;
}

// Read the §8 quality profile's coverage knobs. Same strict line shape doctor.ts
// validates (a top-level `quality_profile:` line followed by two-space-indented
// `key: value` scalars) — a shared parser belongs in a later packet, doctor.ts is
// outside this packet's allowlist. Missing file / missing key / unparseable →
// null. NEVER throws.

// P38 review 2, M-A′: strip a YAML TRAILING comment from a scalar.
//
// §8 requires a recorded rationale on an explicit null, and the only form it
// demonstrates for that rationale is a trailing comment — on two of its own
// example lines (`test_e2e: null   # rationale: ...`). Without this, `raw` is the
// whole remainder of the line, so the sanctioned way to declare a capability
// absent became a COMMAND named `null` and parked the run at quality, naming the
// capability the operator deliberately declared absent.
//
// A `#` opens a comment only OUTSIDE quotes: inside a quoted scalar it is an
// ordinary character, which is what the quotes are for. So a quoted value keeps
// everything up to its closing quote and drops the rest; an unquoted one is cut
// at the first `#` that STARTS THE LINE OR FOLLOWS WHITESPACE — `--tag=v1#2` is
// not a comment, and neither is `null# rationale`, whose value is `null#`.
//
// An unterminated quote is left intact here, and `doctor.quotingProblem` refuses
// the profile outright — as does a quoted value with argv trailing after the
// closing quote, which this function would otherwise truncate in silence. P38
// review 3, MAJOR-2: that sentence used to assert the refusal without doctor
// implementing it, which is the same invented-guarantee mistake MINOR-5 caught
// five lines below. Do not restate a guarantee here without checking doctor.ts
// still provides it.
export function stripTrailingComment(raw: string): string {
  const quote = raw.startsWith('"') ? '"' : raw.startsWith("'") ? "'" : null;
  if (quote !== null) {
    const end = raw.indexOf(quote, 1);
    return end < 0 ? raw : raw.slice(0, end + 1);
  }
  const cut = raw.search(/(^|\s)#/);
  return cut < 0 ? raw : raw.slice(0, cut).trimEnd();
}

// The §8 `quality_profile:` scalars, shared by every profile reader below.
// Same narrow subset doctor.ts validates (a top-level `quality_profile:` line
// followed by two-space-indented `key: value` scalars).
function readProfileValues(text: string): Map<string, string> | null {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => l === "quality_profile:");
  if (start < 0) return null;
  const values = new Map<string, string>();
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    if (!line.startsWith("  ")) break; // section ended
    const m = /^  ([A-Za-z_][A-Za-z0-9_]*):(?: (.*))?$/.exec(line);
    if (m && !values.has(m[1]!)) values.set(m[1]!, stripTrailingComment((m[2] ?? "").trim()));
  }
  return values;
}

// Packet P38 (OI-13, OI-4). The commands the BASELINE and QUALITY stages run.
// Both stages previously derived their commands from the approved spec's
// acceptance criteria, which inverts what each stage means:
//
//   * Baseline exists to prove the suite is green BEFORE anything changes —
//     that is §8 `test_unit`. Pointing it at acceptance criterion AC-1 demanded
//     that the not-yet-written test already pass, so `factory run --spec` could
//     not get past stage three for any spec introducing a new test file (OI-13).
//   * Quality exists to run the profile's REQUIRED CAPABILITIES. Re-running the
//     acceptance criteria made its token overstate what ran (OI-4).
//
// The acceptance criteria belong to the red and green stages, where the test is
// supposed to exist.
//
// §8 (specs/factory-spec-final.md) declares these capability commands; the
// parser simply never read them. A capability that is absent, blank, or an
// explicit `null` is NOT required. §8 asks for a recorded rationale on an
// explicit null; NOTHING validates that rationale today (`doctor` has no such
// check — P38 review 2, MINOR-5). What this parser owes §8 is that writing the
// rationale the way §8 writes it, as a trailing comment, does not change the
// meaning of the value it annotates. That is `stripTrailingComment` above.
export const QUALITY_CAPABILITIES = ["lint", "types", "sca", "secrets", "sast", "build"] as const;

export interface StageProfile {
  // §8 `test_unit`, argv-split. Never empty — a profile without it is no profile.
  readonly testUnit: readonly string[];
  // Declared, non-null §8 capability commands, argv-split, keyed by capability.
  readonly capabilities: Readonly<Record<string, readonly string[]>>;
  // OI-4: §8 `coverage_floor` and `brownfield_policy`. OPTIONAL on purpose —
  // `doctor` requires both of a valid profile, but readStageProfile is also the
  // reader for `baseline`'s test_unit, and a profile missing them must still
  // yield a usable profile rather than null. A caller that needs a floor
  // supplies its own default when this is undefined.
  //
  // Validated exactly as readCoverageProfile validates the same field: digits
  // only, so a blank `coverage_floor:` cannot become `Number("") === 0` and
  // silently disable the gate (the P33 review MAJOR-1 defect).
  readonly coverageFloor?: number;
  readonly brownfieldPolicy?: string;
}

export function readStageProfile(repositoryPath: string): StageProfile | null {
  if (!isProcessString(repositoryPath)) return null;
  let text: string;
  try {
    text = readFileSync(join(repositoryPath, POLICY_PATH), "utf8");
  } catch {
    return null;
  }
  const values = readProfileValues(text);
  if (values === null) return null;
  const rawTestUnit = values.get("test_unit");
  if (rawTestUnit === undefined) return null;
  const testUnit = unquote(rawTestUnit).split(/\s+/).filter(Boolean);
  if (testUnit.length === 0) return null;

  // `test_unit` is ALWAYS a required capability: doctor.ts requires it of every
  // valid profile, so quality always has at least one real thing to run — the
  // repository's own suite, on the GREEN tree. That is a different claim from
  // baseline's (the same suite on the BASE tree) and from green's coverage run.
  // Without it, a profile declaring no optional capabilities would leave a
  // governed run nothing to check at quality: either it parks forever, or the
  // quality token is granted having run nothing — which is the overstatement
  // OI-4 exists to remove.
  const capabilities: Record<string, readonly string[]> = { test_unit: testUnit };
  for (const capability of QUALITY_CAPABILITIES) {
    const raw = values.get(capability);
    if (raw === undefined) continue;
    // §8 sanctions an explicit `null` (with a recorded rationale) as the way to
    // declare a capability deliberately absent. Test the RAW value, and test all
    // four YAML null spellings. P38 review M-A, both directions:
    //   * `sast: NULL` / `Null` are YAML nulls. Matching only lowercase made them
    //     a COMMAND, parking a governed run at quality forever with a reason line
    //     blaming a capability the operator deliberately declared absent.
    //   * `lint: "null"` is a YAML *string* — a command named `null`. Unquoting
    //     before the comparison made it silently NOT required. That is the
    //     fail-open direction, and it is the one that matters.
    if (raw === "" || raw === "~" || raw.toLowerCase() === "null") continue;
    const command = unquote(raw).split(/\s+/).filter(Boolean);
    if (command.length > 0) capabilities[capability] = command;
  }
  // OI-4: §8's own values, so the quality stage stops asserting a profile the
  // repository never declared. Same digit-only validation readCoverageProfile
  // applies; a malformed value yields `undefined` (the caller's default) rather
  // than a permissive number.
  const rawFloor = values.get("coverage_floor");
  const floorText = rawFloor === undefined ? null : unquote(rawFloor);
  const coverageFloor =
    floorText !== null && /^\d+(\.\d+)?$/.test(floorText) && Number(floorText) >= 0 && Number(floorText) <= 100
      ? Number(floorText)
      : undefined;
  const rawPolicy = values.get("brownfield_policy");
  const brownfieldPolicy = rawPolicy === undefined ? undefined : unquote(rawPolicy) || undefined;

  return {
    testUnit,
    capabilities,
    ...(coverageFloor === undefined ? {} : { coverageFloor }),
    ...(brownfieldPolicy === undefined ? {} : { brownfieldPolicy }),
  };
}

export function readCoverageProfile(repositoryPath: string): CoverageProfile | null {
  if (!isProcessString(repositoryPath)) return null;
  let text: string;
  try {
    text = readFileSync(join(repositoryPath, POLICY_PATH), "utf8");
  } catch {
    return null;
  }
  const values = readProfileValues(text);
  if (values === null) return null;
  const rawCommand = values.get("coverage");
  const rawFloor = values.get("coverage_floor");
  if (rawCommand === undefined || rawFloor === undefined) return null;
  const command = unquote(rawCommand).split(/\s+/).filter(Boolean);
  // P33 review MAJOR-1: `Number("")` is 0, so a blank `coverage_floor:` silently
  // became a floor of 0 and disabled the gate this function exists to enforce.
  // Require digits the way doctor.ts:67 validates the same field, so a malformed
  // floor yields no profile (fail closed) instead of a permissive one.
  const floorText = unquote(rawFloor);
  if (!/^\d+(\.\d+)?$/.test(floorText)) return null;
  const floor = Number(floorText);
  if (command.length === 0 || !Number.isFinite(floor) || floor < 0 || floor > 100) return null;
  return { command, floor };
}

function rejected(
  request: GreenSuiteRequest,
  exitCode: number | null,
  reason: string,
): GreenSuiteResult {
  return {
    tokens: [],
    accepted: false,
    coverageSummary: null,
    records: {
      greenSha: request?.greenSha ?? null,
      coverageCommand: Array.isArray(request?.coverageCommand) ? [...request.coverageCommand] : [],
      ran: false,
      exitCode,
      coverageFloor:
        typeof request?.coverageFloor === "number" && Number.isFinite(request.coverageFloor)
          ? request.coverageFloor
          : Number.POSITIVE_INFINITY,
      coverage: null,
    },
    reason,
  };
}

// THE LOAD-BEARING RULE: remove any file already at coverageSummaryPath BEFORE
// spawning the coverage command, then read that path afterwards. The value
// graded is therefore the one THIS run produced — a summary planted by the agent
// (or left stale by the P27 baseline commit) can never be read, whatever it
// claims. Fail-closed and non-throwing: an unspawnable command, a command that
// writes nothing, or a malformed summary each record the failure and withhold
// the token.
export function runGreenSuite(request: GreenSuiteRequest): GreenSuiteResult {
  if (
    !isProcessString(request?.repositoryPath) ||
    !Array.isArray(request?.coverageCommand) ||
    request.coverageCommand.length === 0 ||
    !request.coverageCommand.every(isProcessString) ||
    !isProcessString(request?.coverageSummaryPath) ||
    typeof request?.coverageFloor !== "number" ||
    !Number.isFinite(request.coverageFloor) ||
    !Number.isInteger(request?.timeoutMs) ||
    request.timeoutMs <= 0
  ) {
    return rejected(request, null, "green coverage run: invalid request");
  }

  const summaryPath = isAbsolute(request.coverageSummaryPath)
    ? request.coverageSummaryPath
    : join(request.repositoryPath, request.coverageSummaryPath);

  // Pre-delete: whatever is there now is not this run's evidence.
  try {
    rmSync(summaryPath, { force: true });
  } catch {
    return rejected(request, null, "green coverage run: summary path not removable");
  }

  let exitCode: number | null = null;
  try {
    const spawned = runProjectCommand({
      repositoryPath: request.repositoryPath,
      command: request.coverageCommand,
      timeoutMs: request.timeoutMs,
    });
    exitCode = spawned?.exitCode ?? null;
    // P41 review 2, MAJOR-1: this is the FOURTH controller spawn, and amendment 1
    // gave the diagnostic to only three — a green-coverage timeout was silent on
    // both streams. Same line, same stream (diagnostics to stderr; this module's
    // callers read JUnit and JSON from stdout).
    if (spawned?.errorCode === "ETIMEDOUT") {
      process.stderr.write(
        `green coverage command timed out after ${request.timeoutMs}ms: ${request.coverageCommand.join(" ")}\n` +
          `set FACTORY_STAGE_TIMEOUT_MS to raise the controller's per-spawn budget\n`,
      );
    }
  } catch {
    exitCode = null;
  }

  let summary: string | null;
  try {
    summary = readFileSync(summaryPath, "utf8");
  } catch {
    summary = null;
  }
  const coverage = summary === null ? null : coverageValues(summary);
  const ran = coverage !== null;
  const accepted =
    coverage !== null &&
    coverage.lines >= request.coverageFloor &&
    coverage.branches >= request.coverageFloor;

  return {
    tokens: accepted ? [COVERAGE_PASSED] : [],
    accepted,
    coverageSummary: summary,
    records: {
      greenSha: request.greenSha ?? null,
      coverageCommand: [...request.coverageCommand],
      ran,
      exitCode,
      coverageFloor: request.coverageFloor,
      coverage,
    },
    reason: accepted
      ? undefined
      : coverage === null
        ? `green coverage run produced no readable summary (exit ${exitCode ?? "none"})`
        : `coverage below floor ${request.coverageFloor} (lines ${coverage.lines}, branches ${coverage.branches})`,
  };
}
