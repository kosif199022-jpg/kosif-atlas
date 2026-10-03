import { readFileSync, rmSync } from "node:fs";
import { isAbsolute, join } from "node:path";

import { coverageValues } from "./predicates/quality.ts";
import {
  evaluateSuite,
  runProjectCommand,
  runSuiteCommand,
} from "./suite-run.ts";

// Packet P27 (FR-K6 controller-driven proof, FR-K10 baseline evidence): run the
// quality profile's unit suite + coverage on the base commit and return the
// three baseline gate tokens from the REAL command result. The driver grants
// these tokens from this result — never from worker/agent text. Fail-closed and
// non-throwing: a suite that does not run, or a missing/malformed coverage
// summary, records the failure rather than granting the token.
//
// NOT pure, and P40 widened that: this deletes the coverage summary and spawns
// TWICE (the §8 `test_unit`, then the §8 `coverage`). The older "pure over its
// inputs (a spawn plus a file read)" note was already only half true and is now
// wrong, so it is gone rather than left to mislead.

export interface BaselineRequest {
  readonly repositoryPath: string;
  // Recorded as §10 evidence; the repo is assumed already at base — runBaseline
  // does NOT checkout.
  readonly baseSha: string;
  // Unit-suite argv, handed straight to runSuiteCommand.
  readonly testCommand: readonly string[];
  // Repo-relative (or absolute) istanbul coverage-summary.json path.
  readonly coverageSummaryPath: string;
  // P40 (OI-14): the §8 profile's `coverage` argv. When non-empty, runBaseline
  // PRODUCES the summary rather than hoping one is lying in the tree. Empty means
  // no coverage command was declared: the summary is then read as-is, which is the
  // pre-P40 behaviour and the only way the fixtures that declare no `coverage` key
  // keep working. `doctor` requires `coverage`, so every §8-conforming repo takes
  // the producing path.
  readonly coverageCommand: readonly string[];
  readonly timeoutMs: number;
}

export interface BaselineResult {
  readonly tokens: readonly string[];
  readonly accepted: boolean;
  readonly records: {
    readonly baseSha: string;
    readonly testCommand: readonly string[];
    readonly suiteRan: boolean;
    readonly suitePassed: boolean;
    readonly total: number;
    readonly failures: number;
    // OI-25: the names the junit report gave for the cases that failed, so a
    // parked run says WHICH tests failed and not merely how many. Read from the
    // report only — a case the extraction cannot name is omitted, never guessed.
    // Empty means "the report named no failing case", which `suiteRan` is what
    // separates from "there was no report".
    readonly failingTests: readonly string[];
    // True iff the list was cut to MAX_FAILING_TEST_NAMES. `failures` still
    // carries the true total: a silent truncation would recreate OI-25's data
    // loss at a different scale.
    readonly failingTestsTruncated: boolean;
    readonly coverage: { readonly lines: number; readonly branches: number } | null;
  };
  readonly reason?: string;
}

const TEST_UNIT = "baseline.test-unit-result-recorded";
const COVERAGE = "baseline.coverage-value-recorded";
const NO_REGRESSION = "baseline.no-regression-or-approved-exception";

// OI-25: the failing case NAMES, from the same junit string `evaluateSuite`
// already counts. Extraction lives here rather than in `evaluateSuite` because
// that helper is shared with the green and quality suites; widening it would
// change three stages to fix one.
//
// ponytail: substring scan, not an XML parse — the same trade `countOccurrences`
// already makes, and the counts sit beside the names so a dialect this misses
// shows up as a nonzero `failures` next to a short list rather than as a pass.
// ponytail: 50 names, raise if a real bulk failure is ever under-reported.
const MAX_FAILING_TEST_NAMES = 50;

// OI-31: junit attribute values are XML-escaped, so a test named `a & b "q"`
// arrives as `a &amp; b &quot;q&quot;` and was recorded that way. The review that
// found it left it unfixed because the extraction is a substring scan rather than
// an XML parse, and the open question was "where does partial decoding stop".
//
// It stops here, and the boundary is XML's, not a judgement call: XML defines
// exactly FIVE predefined entities, and every other escape is a numeric
// character reference. Both are handled below, which is the complete set an
// attribute value can legally contain. `&amp;` is applied LAST so that an input
// of `&amp;lt;` decodes to the literal text `&lt;` rather than to `<`.
function decodeXmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function failingTestNames(junitXml: string | null): {
  readonly names: string[];
  readonly truncated: boolean;
} {
  if (typeof junitXml !== "string") return { names: [], truncated: false };
  const names: string[] = [];
  // Each split segment is one `<testcase`'s attributes plus everything up to the
  // next `<testcase`, so a `<failure>`/`<error>` child is scoped to its own case.
  for (const segment of junitXml.split("<testcase").slice(1)) {
    const close = segment.indexOf(">");
    if (close === -1) continue;
    const body = segment.slice(close + 1);
    if (!body.includes("<failure") && !body.includes("<error")) continue;
    // Leading boundary so `classname="..."` cannot be read as the name.
    const match = /(?:^|\s)name="([^"]*)"/.exec(segment.slice(0, close));
    // A failing case the report does not name contributes nothing: the count
    // already records it, and inventing a label would be a fabrication.
    if (match === null) continue;
    if (names.length >= MAX_FAILING_TEST_NAMES) return { names, truncated: true };
    names.push(decodeXmlEntities(match[1]!));
  }
  return { names, truncated: false };
}

// File-read wrapper over the shared istanbul reader (predicates/quality.ts):
// a missing/unreadable file reads as null, exactly like a malformed one.
function readCoverage(path: string): { lines: number; branches: number } | null {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return null;
  }
  return coverageValues(text);
}

export function runBaseline(request: BaselineRequest): BaselineResult {
  const junit = runSuiteCommand({
    repositoryPath: request.repositoryPath,
    command: request.testCommand,
    timeoutMs: request.timeoutMs,
  });
  const outcome = evaluateSuite(junit);
  const failing = failingTestNames(junit);

  const coveragePath = isAbsolute(request.coverageSummaryPath)
    ? request.coverageSummaryPath
    : join(request.repositoryPath, request.coverageSummaryPath);

  // P40 (OI-14), mirroring green-suite.ts's load-bearing rule: DELETE whatever is
  // at the summary path BEFORE spawning, so the value read afterwards is the one
  // THIS run produced. Without the delete, baseline still grades a file an agent
  // (or a previous run) could have planted, and running the command would close
  // nothing. Before P40 nothing produced the summary at all, so a freshly
  // scaffolded repository could never pass this gate — that was OI-14.
  //
  // Fail-closed and non-throwing throughout, exactly as before: an unspawnable
  // command, a command that writes nothing, and a malformed summary all leave
  // `coverage` null, which withholds the token and yields the same reason string.
  // Read defensively. This repository has NO typecheck (OI-15), so a call site
  // that forgets the new field is not a compile error — it would be a TypeError
  // thrown inside `driveRun`, aborting a run instead of parking it, which is
  // strictly worse than the behaviour it replaces. Degrading to the documented
  // no-command path is safe here: that path's planted-summary exposure is already
  // the accepted behaviour for a profile with no `coverage` key, and such a run
  // cannot pass green anyway (C5).
  const coverageCommand = request.coverageCommand ?? [];
  let coverageBlocked = false;
  // P41 review MAJOR-2: validate the budget before spawning, as `suite-run.ts:56`
  // and `green-suite.ts:281` both already do. P40 added this spawn WITHOUT that
  // guard, so `timeoutMs: 0` reached spawnSync — and `timeout: 0` means NO
  // TIMEOUT, so the coverage command ran unbounded. Measured by the reviewer:
  // 3013 ms for a 3 s command at 0, versus 208 ms at 200.
  //
  // No separate reason string: `runSuiteCommand` rejects the same budgets one
  // step earlier, so the stage always reports the suite failure and a coverage
  // reason here would be dead code. This guard is not redundant with it, though —
  // the coverage spawn happens whether or not the suite ran, so without it the
  // unbounded command still executed.
  const budgetValid = Number.isInteger(request.timeoutMs) && request.timeoutMs > 0;
  if (coverageCommand.length > 0) {
    // The budget gates the SPAWN, not the pre-delete. P41 amendment 1 put it on
    // the whole block, which skipped the delete as well — so an invalid budget
    // left a planted summary in place and `readCoverage` graded it. That is the
    // fail-open this pre-delete exists to prevent, reintroduced by the guard
    // meant to close a different one (P41 review 2, MINOR-1). Delete first,
    // always; decide about spawning after.
    try {
      rmSync(coveragePath, { force: true });
    } catch {
      // FAIL CLOSED, exactly as green does (`green coverage run: summary path not
      // removable`). P40's first draft swallowed this and let readCoverage grade
      // whatever it could not delete — which is precisely the planted file this
      // pre-delete exists to refuse, so the narrow case defeated the guard. The
      // P40 review (MINOR-4b) caught the mismatch between that behaviour and the
      // claim that baseline mirrors green. Withholding the token is the honest
      // answer, and it matches the module's own discipline everywhere else.
      coverageBlocked = true;
    }
    // An unusable budget must never reach spawnSync — `timeout: 0` means NO
    // timeout — and must not grade whatever the delete just left behind either.
    if (!budgetValid) coverageBlocked = true;
    if (!coverageBlocked) {
      try {
        const spawned = runProjectCommand({
          repositoryPath: request.repositoryPath,
          command: coverageCommand,
          timeoutMs: request.timeoutMs,
        });
        // Same one-line diagnostic runSuiteCommand emits (P41 review MINOR-1):
        // without it a timed-out coverage command is indistinguishable from one
        // that ran and wrote nothing, and the run parks with nothing pointing at
        // the budget.
        if (spawned?.errorCode === "ETIMEDOUT") {
          process.stderr.write(
            `baseline coverage command timed out after ${request.timeoutMs}ms: ${coverageCommand.join(" ")}\n` +
              `set FACTORY_STAGE_TIMEOUT_MS to raise the controller's per-spawn budget\n`,
          );
        }
      } catch {
        // Ignored on purpose: a spawn failure is indistinguishable here from a
        // command that ran and wrote nothing, and both are graded the same way —
        // by whether a readable summary exists below.
      }
    }
  }

  const coverage = coverageBlocked ? null : readCoverage(coveragePath);

  // Monotonic, fail-closed grants: the suite result and the coverage value each
  // earn their own token; no-regression is satisfied when both are recorded
  // (a fresh baseline has no prior to regress against — a policy-exception path
  // may satisfy it otherwise, which is out of P27 scope).
  const tokens: string[] = [];
  if (outcome.passed) tokens.push(TEST_UNIT);
  if (coverage !== null) tokens.push(COVERAGE);
  if (outcome.passed && coverage !== null) tokens.push(NO_REGRESSION);
  const accepted = tokens.length === 3;

  return {
    tokens,
    accepted,
    records: {
      baseSha: request.baseSha,
      testCommand: [...request.testCommand],
      suiteRan: outcome.ran,
      suitePassed: outcome.passed,
      total: outcome.total,
      failures: outcome.failures,
      failingTests: failing.names,
      failingTestsTruncated: failing.truncated,
      coverage,
    },
    reason: accepted
      ? undefined
      : !outcome.passed
        ? outcome.ran
          ? `baseline suite failed: ${outcome.failures}/${outcome.total} failing`
          : "baseline suite did not run or produced no readable report"
        : coverageBlocked
          ? "baseline coverage: summary path not removable"
          : "baseline coverage value missing or malformed",
  };
}
