import { spawnSync } from "node:child_process";
import { isAbsolute } from "node:path";

import {
  assertAdapterOptions,
  diagnostic,
  failedResult as sharedFailedResult,
  isExistingDirectory,
  isProcessString,
  isRecord,
} from "./shared.ts";
import {
  CLI_TRANSIENT_PATTERN,
  createBudgetPolicy,
  createTranscriptWriter,
  runWithBackoff,
} from "./resilience.ts";
import type {
  Adapter,
  AdapterFacts,
  InvocationDiagnostic,
  InvocationRequest,
  InvocationResilience,
  InvocationResult,
} from "./types.ts";

const ADAPTER_ID = "claude";
// Deliberately smaller than codex.ts's 2 MiB: `claude -p --output-format json`
// emits one JSON envelope, not an event stream, so 64 KiB is headroom, not a
// hazard. Not a shared constant — the budgets diverge for measured reasons.
const MAX_OUTPUT_BYTES = 64 * 1024;
// P36 (OI-11): HOME/PATH are required; CLAUDE_CONFIG_DIR and USER are OPTIONAL
// and an omitted key must be ABSENT from the child environment, never an empty
// string. Empirically, USER is required for `claude auth status` to report
// loggedIn, and a CLAUDE_CONFIG_DIR switches the CLI to a file credential store
// that does not exist when credentials live in the OS keychain.
const REQUIRED_ENVIRONMENT_KEYS = ["HOME", "PATH"] as const;
const OPTIONAL_ENVIRONMENT_KEYS = ["CLAUDE_CONFIG_DIR", "USER"] as const;

export interface ClaudeAdapterOptions {
  readonly executablePath: string;
  readonly processTimeoutMs: number;
  // The model every prompt invocation is pinned to. Undefined leaves the CLI's
  // own default — the pre-pin behaviour, and still what an operator who sets
  // nothing gets. Preflight calls (--version, auth status) are never pinned:
  // they ask the CLI about itself, not a model.
  readonly model?: string;
  // The reasoning effort every prompt invocation is pinned to, passed as
  // `--effort <level>`. Undefined leaves the CLI's own default. Preflight
  // calls are never pinned, for the same reason the model is not.
  readonly reasoningEffort?: string;
  // Resilience (packet adapter-resilience-layer-1). The soft budget is
  // processTimeoutMs; each driver retry of the same jobId doubles it up to
  // hardCeilingMs (default 7200000). transcriptDirectory unset => no
  // transcript and no path in the summary. Neither is read from process.env
  // here; configured.ts is where env becomes options.
  readonly hardCeilingMs?: number;
  readonly transcriptDirectory?: string;
  readonly runtimeEnvironment: {
    readonly CLAUDE_CONFIG_DIR?: string;
    readonly HOME: string;
    readonly PATH: string;
    readonly USER?: string;
  };
}

interface ProcessObservation {
  readonly exitCode: number | null;
  readonly errorCode?: string;
  readonly stdout: string;
  readonly stderr: string;
}

interface AuthObservation {
  readonly available: boolean;
  readonly authMethod?: string;
  readonly apiProvider?: string;
  readonly subscriptionEligible: boolean;
}

function failedResult(
  request: InvocationRequest,
  outcome: "transient_failure" | "auth_failure" | "fatal_failure",
  details: InvocationDiagnostic,
): InvocationResult {
  return sharedFailedResult(ADAPTER_ID, request, outcome, details);
}

export function createClaudeAdapter(options: ClaudeAdapterOptions): Adapter {
  assertAdapterOptions("Claude", REQUIRED_ENVIRONMENT_KEYS, OPTIONAL_ENVIRONMENT_KEYS, options);

  const executablePath = options.executablePath;
  const processTimeoutMs = options.processTimeoutMs;
  const source = options.runtimeEnvironment;
  const environment: Record<string, string> = {
    HOME: source.HOME,
    PATH: source.PATH,
    ...(source.CLAUDE_CONFIG_DIR === undefined ? {} : { CLAUDE_CONFIG_DIR: source.CLAUDE_CONFIG_DIR }),
    ...(source.USER === undefined ? {} : { USER: source.USER }),
  };

  function run(
    args: readonly string[],
    workingDirectory?: string,
    timeoutMs: number = processTimeoutMs,
  ): ProcessObservation {
    try {
      const result = spawnSync(executablePath, args, {
        encoding: "utf8",
        env: environment,
        maxBuffer: MAX_OUTPUT_BYTES,
        shell: false,
        timeout: timeoutMs,
        ...(workingDirectory === undefined ? {} : { cwd: workingDirectory }),
      });

      return {
        exitCode: result.status,
        errorCode:
          result.error && "code" in result.error
            ? String(result.error.code)
            : undefined,
        stdout: result.stdout ?? "",
        stderr: result.stderr ?? "",
      };
    } catch {
      return {
        exitCode: null,
        errorCode: "PROCESS_EXCEPTION",
        stdout: "",
        stderr: "",
      };
    }
  }

  async function preflight(): Promise<AdapterFacts> {
    // OI-45: return facts this instance already established rather than
    // re-spawning the vendor CLI, so taking facts as evidence is free on the
    // hot path. READ ONLY — invoke() caches only after its eligibility gates
    // pass, so writing here would pin an ineligible adapter for the life of
    // the instance and defeat the mid-run-logout recheck below. Facts are as
    // fresh as the last dispatch on this instance; a caller that shares an
    // instance with a dispatching caller sees that staleness.
    if (cachedFacts !== null) {
      return cachedFacts;
    }
    const versionObservation = run(["--version"]);
    const versionMatch =
      versionObservation.exitCode === 0
        ? /(?:^|\s)(\d+\.\d+\.\d+)(?:\s|$)/.exec(
            versionObservation.stdout.trim(),
          )
        : null;
    const executableAvailable = versionMatch !== null;

    let auth: AuthObservation = {
      available: false,
      subscriptionEligible: false,
    };
    if (executableAvailable) {
      const authObservation = run(["auth", "status"]);
      if (authObservation.stdout.length > 0) {
        try {
          const authStatus: unknown = JSON.parse(authObservation.stdout);
          if (isRecord(authStatus)) {
            const authMethod =
              typeof authStatus.authMethod === "string"
                ? authStatus.authMethod
                : undefined;
            const apiProvider =
              typeof authStatus.apiProvider === "string"
                ? authStatus.apiProvider
                : undefined;
            const available =
              authObservation.exitCode === 0 && authStatus.loggedIn === true;
            auth = {
              available,
              ...(authMethod === undefined ? {} : { authMethod }),
              ...(apiProvider === undefined ? {} : { apiProvider }),
              subscriptionEligible:
                available &&
                authMethod === "claude.ai" &&
                apiProvider === "firstParty",
            };
          }
        } catch {
          auth = { available: false, subscriptionEligible: false };
        }
      }
    }

    return {
      adapterId: ADAPTER_ID,
      vendor: "anthropic",
      executable: {
        available: executableAvailable,
        path: executablePath,
        ...(versionMatch === null ? {} : { version: versionMatch[1] }),
      },
      auth,
      headless: executableAvailable,
      surfaces: ["chat", "cli"],
      autonomousEligible: false,
      limits: { processTimeoutMs },
      secretPatterns: [
        {
          id: "anthropic-api-key",
          vendor: "anthropic",
          patternKind: "regex",
          pattern: "\\bsk-ant-[A-Za-z0-9_-]{20,}\\b",
        },
      ],
    };
  }

  // Eligible preflight facts cached per adapter INSTANCE (one process, one
  // run), so a multi-stage run pays the two preflight spawns once instead of
  // per invoke. The mid-run-logout failure mode is preserved below: any
  // process-level invocation failure drops the cache and re-preflights before
  // classifying, so a revoked login still parks as auth_failure.
  let cachedFacts: AdapterFacts | null = null;
  const budget = createBudgetPolicy({
    softBudgetMs: processTimeoutMs,
    ...(options.hardCeilingMs === undefined ? {} : { hardCeilingMs: options.hardCeilingMs }),
  });

  async function invoke(request: InvocationRequest): Promise<InvocationResult> {
    if (
      !isRecord(request) ||
      !isProcessString(request.prompt) ||
      !isProcessString(request.workingDirectory) ||
      !isAbsolute(request.workingDirectory) ||
      !isExistingDirectory(request.workingDirectory)
    ) {
      return failedResult(
        request,
        "fatal_failure",
        diagnostic("invalid_request", "The invocation request is invalid"),
      );
    }

    // OI-54: preflight() is the one reader of the fact cache; it already
    // returns the cached facts when set, so a second read here could only
    // diverge from it.
    const facts = await preflight();
    if (!facts.executable.available) {
      return failedResult(
        request,
        "fatal_failure",
        diagnostic(
          "executable_unavailable",
          "The configured Claude executable is unavailable",
        ),
      );
    }
    if (!facts.auth.available || !facts.auth.subscriptionEligible) {
      return failedResult(
        request,
        "auth_failure",
        diagnostic("auth_unavailable", "Claude authentication is unavailable"),
      );
    }
    if (!facts.surfaces.includes(request.surface)) {
      return failedResult(
        request,
        "fatal_failure",
        diagnostic("unsupported_surface", "The invocation surface is unsupported"),
      );
    }
    cachedFacts = facts;

    const argv = [
      "-p",
      request.prompt,
      "--output-format",
      "json",
      ...(options.model === undefined ? [] : ["--model", options.model]),
      ...(options.reasoningEffort === undefined
        ? []
        : ["--effort", options.reasoningEffort]),
    ];
    const { budgetMs } = budget.budgetFor(request.jobId);
    const transcript =
      options.transcriptDirectory === undefined
        ? undefined
        : createTranscriptWriter({ directory: options.transcriptDirectory, jobId: request.jobId });
    // Transient classification is over a FAILED attempt's stdout + stderr only;
    // a clean exit is "ok" whatever its text says. Timeouts stop the loop.
    const loop = await runWithBackoff({
      attempt: async () => run(argv, request.workingDirectory, budgetMs),
      classify: (observation) => {
        const verdict =
          observation.errorCode === "ETIMEDOUT"
            ? "timeout"
            : observation.errorCode === undefined && observation.exitCode === 0
              ? "ok"
              : CLI_TRANSIENT_PATTERN.test(observation.stdout + observation.stderr)
                ? "retry"
                : "fatal";
        transcript?.append({
          event: "attempt",
          jobId: request.jobId,
          budgetMs,
          verdict,
          exitCode: observation.exitCode,
          ...(observation.errorCode === undefined ? {} : { errorCode: observation.errorCode }),
        });
        return verdict;
      },
    });
    const invocation = loop.result;
    const settled = await settle();
    const resilience: InvocationResilience = {
      attempts: loop.attempts,
      backoffMs: loop.backoffMs,
      budgetMs,
      // The json envelope carries no actions, so no progress verdict.
      ...(transcript === undefined ? {} : { transcriptPath: transcript.path }),
    };
    return { ...settled, resilience };

    async function settle(): Promise<InvocationResult> {
      if (invocation.errorCode !== undefined || invocation.exitCode !== 0) {
        // Any process-level failure could be a mid-run logout the cache would
        // otherwise hide. Invalidate, re-preflight, and let the preflight gates
        // classify FIRST — exactly the order the uncached per-invoke preflight
        // enforced — before falling through to the original classification.
        cachedFacts = null;
        const recheck = await preflight();
        if (!recheck.executable.available) {
          return failedResult(
            request,
            "fatal_failure",
            diagnostic(
              "executable_unavailable",
              "The configured Claude executable is unavailable",
            ),
          );
        }
        if (!recheck.auth.available || !recheck.auth.subscriptionEligible) {
          return failedResult(
            request,
            "auth_failure",
            diagnostic("auth_unavailable", "Claude authentication is unavailable"),
          );
        }
        cachedFacts = recheck;
      }
      if (invocation.errorCode === "ETIMEDOUT") {
        return failedResult(
          request,
          "transient_failure",
          diagnostic("timeout", "Claude invocation timed out"),
        );
      }
      if (invocation.exitCode !== 0) {
        return failedResult(
          request,
          "fatal_failure",
          diagnostic(
            "process_exit",
            "Claude invocation exited unsuccessfully",
            invocation.exitCode ?? undefined,
          ),
        );
      }

      let payload: unknown;
      try {
        payload = JSON.parse(invocation.stdout);
      } catch {
        return failedResult(
          request,
          "fatal_failure",
          diagnostic(
            "malformed_output",
            "Claude returned malformed JSON output",
            invocation.exitCode,
          ),
        );
      }

      if (
        !isRecord(payload) ||
        payload.type !== "result" ||
        payload.is_error !== false ||
        typeof payload.result !== "string" ||
        typeof payload.session_id !== "string"
      ) {
        return failedResult(
          request,
          "fatal_failure",
          diagnostic(
            "malformed_output",
            "Claude returned an invalid result envelope",
            invocation.exitCode,
          ),
        );
      }

      // Usage telemetry the envelope already carries (P25's cost half): keep it
      // instead of discarding it. Absent or non-numeric fields stay absent.
      const usageRecord = isRecord(payload.usage) ? payload.usage : null;
      const num = (v: unknown): number | undefined =>
        typeof v === "number" && Number.isFinite(v) ? v : undefined;
      const usage = {
        ...(num(usageRecord?.input_tokens) === undefined ? {} : { inputTokens: num(usageRecord?.input_tokens) }),
        ...(num(usageRecord?.output_tokens) === undefined ? {} : { outputTokens: num(usageRecord?.output_tokens) }),
        ...(num(payload.total_cost_usd) === undefined ? {} : { costUsd: num(payload.total_cost_usd) }),
      };

      return {
        outcome: "success",
        adapterId: ADAPTER_ID,
        jobId: request.jobId,
        requestId: request.requestId,
        response: {
          text: payload.result,
          sessionId: payload.session_id,
          ...(Object.keys(usage).length === 0 ? {} : { usage }),
        },
      };
    }
  }

  return { preflight, invoke };
}
