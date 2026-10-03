import { spawnSync } from "node:child_process";
import {
  accessSync,
  constants,
  mkdtempSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, sep } from "node:path";

import type { GradeResult } from "./run-stage.ts";
import { isProcessString } from "../kernel/guards.ts";

// The suite-runner grader: run the project's configured test command and read a
// pass/fail verdict from its JUnit output. This is what lets the controller
// verify a fix actually works (green.suite-passed) instead of trusting the
// implementer's word — the piece the green stage was missing.

export interface SuiteOutcome {
  // Did a suite actually run and emit a readable JUnit report?
  readonly ran: boolean;
  // ran, with at least one test and zero failures/errors.
  readonly passed: boolean;
  readonly total: number;
  readonly failures: number;
}

function countOccurrences(xml: string, tag: string): number {
  // ponytail: element-name count, not an XML parse — robust across node --test
  // and vitest JUnit shapes; swap in a parser only if reports get exotic.
  return xml.split(tag).length - 1;
}

// Interpret JUnit XML into a verdict. null (no report produced) fails closed.
export function evaluateSuite(junitXml: string | null): SuiteOutcome {
  if (typeof junitXml !== "string" || junitXml.length === 0) {
    return { ran: false, passed: false, total: 0, failures: 0 };
  }
  const total = countOccurrences(junitXml, "<testcase");
  const failures =
    countOccurrences(junitXml, "<failure") + countOccurrences(junitXml, "<error");
  return { ran: true, passed: total > 0 && failures === 0, total, failures };
}

const DARWIN_SANDBOX_EXECUTABLE = "/usr/bin/sandbox-exec";

function confinedRepositoryPath(value: unknown): string | null {
  if (!isProcessString(value) || !isAbsolute(value)) return null;
  try {
    const path = realpathSync(value);
    return statSync(path).isDirectory() ? path : null;
  } catch {
    return null;
  }
}

function darwinSandboxAvailable(): boolean {
  if (process.platform !== "darwin") return false;
  try {
    accessSync(DARWIN_SANDBOX_EXECUTABLE, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function darwinWriteConfinementProfile(
  repositoryPath: string,
  controllerTempPath: string,
): string {
  return [
    "(version 1)",
    "(allow default)",
    "(deny file-write*)",
    `(allow file-write* (subpath ${JSON.stringify(repositoryPath)}))`,
    `(allow file-write* (subpath ${JSON.stringify(controllerTempPath)}))`,
    '(allow file-write* (literal "/dev/null"))',
    '(allow file-write* (literal "/dev/tty"))',
  ].join("\n");
}

function pathIsWithin(root: string, candidate: string): boolean {
  const path = relative(root, candidate);
  return path === "" || (path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

// macOS refuses to apply Seatbelt twice. A child may inherit the existing
// boundary only when the first sandbox-exec attempt returned the exact nesting
// failure AND this process proves it is already inside a controller-created
// command sandbox. The sibling write probe is load-bearing: a forged TMPDIR in
// an unconfined process remains writable and therefore cannot enable fallback.
function inheritedControllerConfinementTemp(
  repositoryPath: string,
): string | null {
  let inheritedTemp: string;
  let inheritedRoot: string;
  try {
    inheritedTemp = realpathSync(tmpdir());
    inheritedRoot = realpathSync(process.cwd());
  } catch {
    return null;
  }
  if (!basename(inheritedTemp).startsWith("factory-command-")) return null;
  if (
    !pathIsWithin(inheritedRoot, repositoryPath) &&
    !pathIsWithin(inheritedTemp, repositoryPath)
  ) {
    return null;
  }

  const probePath = join(
    dirname(inheritedTemp),
    `.factory-confinement-probe-${process.pid}-${Date.now()}`,
  );
  try {
    writeFileSync(probePath, "probe", { flag: "wx" });
    rmSync(probePath, { force: true });
    return null;
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";
    return code === "EPERM" || code === "EACCES" ? inheritedTemp : null;
  }
}

// Quality-profile commands execute repository-controlled code. Match the
// adapter boundary's strict runtime allowlist: enough identity and executable
// discovery to run the command, with no controller, provider, cloud, or other
// ambient host credentials copied into the untrusted project process.
export function projectCommandEnvironment(controllerTempPath?: string): NodeJS.ProcessEnv {
  const USER = process.env.USER;
  // pnpm records the absolute store path it installed with in
  // node_modules/.modules.yaml, and that path is derived from PNPM_HOME. Drop
  // PNPM_HOME and pnpm recomputes the platform default instead, decides the
  // installed tree belongs to another store, and tries to purge node_modules --
  // which, with no TTY, aborts the suite before a single test runs. Unset here
  // and unset at install time agree, which is why this only ever failed on a
  // hosted runner: pnpm/action-setup sets PNPM_HOME, a developer machine
  // usually does not. It names a directory, like HOME and PATH above; it
  // carries no credential.
  const PNPM_HOME = process.env.PNPM_HOME;
  return {
    HOME: process.env.HOME ?? "",
    PATH: process.env.PATH ?? "",
    // The controller RUNS a suite; it never installs dependencies. pnpm 10+
    // verifies node_modules against the lockfile before `pnpm <script>` and, when
    // they disagree, either prompts (no TTY here, so it aborts with
    // ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY and the suite never runs) or
    // installs into the confined worktree — which red isolation then correctly
    // rejects as ~1300 changed non-test paths under .pnpm-store/. Both are the
    // wrong answer, and which one you get depends on the host, so the suite
    // passed locally and failed on a hosted runner. Turn the check off instead.
    // pnpm 11 reads this one from `pnpm_config_*`, NOT `npm_config_*`
    // (pnpm.mjs: `if (process.env.pnpm_config_verify_deps_before_run != null)`).
    // pnpm 10 reads the npm-prefixed spelling. Set both; the wrong one alone is
    // silently ignored, which is how this looked fixed locally -- the check ran
    // either way and simply found the tree up to date -- and then ran
    // `pnpm install` on a hosted runner, hit the modules-purge prompt with no
    // TTY, and failed the suite before a single test.
    npm_config_verify_deps_before_run: "false",
    pnpm_config_verify_deps_before_run: "false",
    ...(PNPM_HOME === undefined || PNPM_HOME === "" ? {} : { PNPM_HOME }),
    ...(controllerTempPath === undefined ? {} : { TMPDIR: controllerTempPath }),
    ...(USER === undefined || USER === "" ? {} : { USER }),
  };
}

export interface RunProjectCommandRequest {
  readonly repositoryPath: string;
  readonly command: readonly string[];
  readonly timeoutMs: number;
}

export interface ProjectCommandObservation {
  readonly exitCode: number | null;
  readonly errorCode?: string;
  readonly stdout: string;
  readonly stderr: string;
}

export type RunSuiteRequest = RunProjectCommandRequest;

// ponytail: opt-in escape hatch for the ~dozen-member trusted distribution
// running Windows/Linux via WSL2 or Git Bash, where sandbox-exec doesn't
// exist. Set FACTORY_CONFINEMENT=none in .aai/factory.env to run commands
// unconfined instead of refusing. Default (unset) behavior is unchanged.
// Upgrade path: a real Linux confinement backend (LIM-23), if this trust
// assumption ever stops holding.
function confinementDisabled(): boolean {
  return process.env.FACTORY_CONFINEMENT === "none";
}

// The sole v1 process boundary for untrusted repository commands. A missing
// backend or malformed request returns null before the project command runs.
export function runProjectCommand(
  request: RunProjectCommandRequest,
): ProjectCommandObservation | null {
  const repositoryPath = confinedRepositoryPath(request?.repositoryPath);
  const unconfined = confinementDisabled();
  if (
    repositoryPath === null ||
    !Array.isArray(request?.command) ||
    request.command.length === 0 ||
    !request.command.every(isProcessString) ||
    !Number.isInteger(request?.timeoutMs) ||
    request.timeoutMs <= 0 ||
    (!unconfined && !darwinSandboxAvailable())
  ) {
    return null;
  }
  const [bin, ...args] = request.command;
  let controllerTempPath: string;
  try {
    controllerTempPath = realpathSync(mkdtempSync(join(tmpdir(), "factory-command-")));
  } catch {
    return null;
  }
  try {
    const spawnOptions = {
      cwd: repositoryPath,
      encoding: "utf8" as const,
      env: projectCommandEnvironment(controllerTempPath),
      timeout: request.timeoutMs,
    };
    if (unconfined) {
      const result = spawnSync(bin!, args, spawnOptions);
      return {
        exitCode: result.status,
        ...(result.error !== undefined && "code" in result.error
          ? { errorCode: String(result.error.code) }
          : {}),
        stdout: result.stdout ?? "",
        stderr: result.stderr ?? "",
      };
    }
    let result = spawnSync(DARWIN_SANDBOX_EXECUTABLE, [
      "-p",
      darwinWriteConfinementProfile(repositoryPath, controllerTempPath),
      bin!,
      ...args,
    ], spawnOptions);
    const nestedSeatbeltFailure =
      result.status === 71 &&
      (result.stdout ?? "") === "" &&
      /sandbox_apply: Operation not permitted/.test(result.stderr ?? "");
    const inheritedTemp = nestedSeatbeltFailure
      ? inheritedControllerConfinementTemp(repositoryPath)
      : null;
    if (inheritedTemp !== null) {
      result = spawnSync(bin!, args, {
        ...spawnOptions,
        env: projectCommandEnvironment(inheritedTemp),
      });
    }
    return {
      exitCode: result.status,
      ...(result.error !== undefined && "code" in result.error
        ? { errorCode: String(result.error.code) }
        : {}),
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    };
  } catch {
    return null;
  } finally {
    rmSync(controllerTempPath, { force: true, recursive: true });
  }
}

// Execute the configured test command and return its JUnit XML on stdout, or
// null on any spawn/timeout/nonzero-without-output failure. Never throws.
export function runSuiteCommand(request: RunSuiteRequest): string | null {
  const result = runProjectCommand(request);
  if (result === null) return null;
  try {
    // P41 review MINOR-1: a timeout is otherwise indistinguishable from any other
    // empty result, so the run parks on the generic "suite did not run" with
    // nothing pointing at the budget. P41's first draft deferred this on the
    // grounds that naming it needed a wider return type; the reviewer showed a
    // one-line stderr note does the job with no signature change, and there is
    // precedent at `start.ts:111`. Diagnostics to stderr, data to stdout.
    if (result.errorCode === "ETIMEDOUT") {
      process.stderr.write(
        `suite command timed out after ${request.timeoutMs}ms: ${request.command.join(" ")}\n` +
          `set FACTORY_STAGE_TIMEOUT_MS to raise the controller's per-spawn budget\n`,
      );
    }
    // A failing suite exits nonzero but still emits JUnit — that is a valid,
    // readable report (a red verdict), not an execution failure. Only a missing
    // report (spawn error / timeout) is null.
    return typeof result.stdout === "string" && result.stdout.includes("<testcase")
      ? result.stdout
      : null;
  } catch {
    return null;
  }
}

// Green stage: the suite passing clears green.suite-passed. Coverage
// (green.coverage-passed) needs a coverage tool per the quality profile and is a
// separate grader — deferred with this rationale, not silently dropped.
export function gradeGreenSuite(junitXml: string | null): GradeResult {
  const outcome = evaluateSuite(junitXml);
  return {
    tokens: outcome.passed ? ["green.suite-passed"] : [],
    accepted: outcome.passed,
    reason: outcome.passed
      ? undefined
      : outcome.ran
        ? `suite failed: ${outcome.failures}/${outcome.total} failing`
        : "suite did not run or produced no readable report",
  };
}
