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
  progressVerdict,
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

// Codex CLI contract, pinned by the P11 replacement Red against the official
// CLI reference (https://developers.openai.com/codex/cli/reference, fetched
// 2026-08-21, read-only, untrusted; no doc version/date shown).
// DOCUMENTED: `login status` prints the active auth mode as text, exit 0 with
//   credentials; `exec --json` emits newline-delimited JSON events.
// ASSUMED (undocumented; CLI version unpinned until a real binary is available):
//   `--version` -> "codex-cli X.Y.Z"; exact `login status` wording ("Logged in
//   using ChatGPT" / "... an API key" / "... an access token" / "Not logged in");
//   NDJSON event names thread.started{thread_id}, item.completed{item:{type:
//   "agent_message", text}}. `--output-last-message` is not required.
// Fail closed: only a ChatGPT FIRST status line is subscription-eligible (later
//   lines/words are hints, not status); any NUL byte in provider stdout is
//   unavailable (L-031 applies to outputs); nonzero exit or "Not logged in" is
//   unavailable. A stream is success only if it ends in turn.completed;
//   turn.failed / error / no terminal event -> fatal_failure.
// ASSUMED (unverified against a real binary): `exec` honors the POSIX `--`
//   end-of-options separator, so the prompt is passed as `exec --json -- <prompt>`
//   and a prompt beginning with "-" can never be parsed as a flag.

const ADAPTER_ID = "codex";
// Real `codex exec --json` streams include tool events and command output, not
// only the final message. A normal Red job observed 238,981 bytes; 64 KiB made
// Node terminate the successful process with ENOBUFS before turn.completed.
// Keep the capture bounded while leaving practical headroom for agent traces.
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
// P36 (OI-11): HOME/PATH are required; CODEX_HOME and USER are OPTIONAL and an
// omitted key must be ABSENT from the child environment, never an empty string.
const REQUIRED_ENVIRONMENT_KEYS = ["HOME", "PATH"] as const;
const OPTIONAL_ENVIRONMENT_KEYS = ["CODEX_HOME", "USER"] as const;

export interface CodexAdapterOptions {
  readonly executablePath: string;
  readonly processTimeoutMs: number;
  // Pinned model for exec invocations; undefined leaves the CLI's own default.
  // Preflight (--version, login status) is never pinned.
  readonly model?: string;
  // Codex takes reasoning effort as a config override rather than a flag, so it
  // is passed as `-c model_reasoning_effort="<value>"`. Undefined leaves
  // ~/.codex/config.toml's own value.
  readonly reasoningEffort?: string;
  // Resilience (packet adapter-resilience-layer-1). The soft budget is
  // processTimeoutMs; each driver retry of the same jobId doubles it up to
  // hardCeilingMs (default 7200000). transcriptDirectory unset => no
  // transcript and no path in the summary. Neither is read from process.env
  // here; configured.ts is where env becomes options.
  readonly hardCeilingMs?: number;
  readonly transcriptDirectory?: string;
  readonly runtimeEnvironment: {
    readonly CODEX_HOME?: string;
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
  readonly subscriptionEligible: boolean;
}

function failedResult(
  request: InvocationRequest,
  outcome: "transient_failure" | "auth_failure" | "fatal_failure",
  details: InvocationDiagnostic,
): InvocationResult {
  return sharedFailedResult(ADAPTER_ID, request, outcome, details);
}

export function createCodexAdapter(options: CodexAdapterOptions): Adapter {
  assertAdapterOptions("Codex", REQUIRED_ENVIRONMENT_KEYS, OPTIONAL_ENVIRONMENT_KEYS, options);

  const executablePath = options.executablePath;
  const processTimeoutMs = options.processTimeoutMs;
  const source = options.runtimeEnvironment;
  const environment: Record<string, string> = {
    HOME: source.HOME,
    PATH: source.PATH,
    ...(source.CODEX_HOME === undefined ? {} : { CODEX_HOME: source.CODEX_HOME }),
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
      return { exitCode: null, errorCode: "PROCESS_EXCEPTION", stdout: "", stderr: "" };
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

    let auth: AuthObservation = { available: false, subscriptionEligible: false };
    if (executableAvailable) {
      const authObservation = run(["login", "status"]);
      // P36 (OI-11): codex-cli 0.149.1 prints the status line on STDERR with an
      // EMPTY stdout, so BOTH streams are read. Fail closed: NUL on either
      // stream discards everything, and "Not logged in" on either stream wins.
      const streams = [authObservation.stdout, authObservation.stderr];
      // P36 review MAJOR-1/MAJOR-2: reading stderr widens what we trust, and
      // stderr is the ERROR channel — so a line only counts as a status line if
      // it ANCHORS on "logged in". Taking the first non-empty line and
      // regex-searching it anywhere classified `error: refresh failed, was
      // Logged in using ChatGPT earlier` as an eligible subscription, and
      // classified `Segmentation fault` as authenticated-with-unknown-method.
      // Every line of both streams is scanned, not just the first, so a banner
      // ("warning: update available") can neither shadow a real
      // "Not logged in" nor be mistaken for one.
      const allLines = streams.some((stream) => stream.includes("\0"))
        ? []
        : streams.flatMap((stream) => stream.split("\n").map((l) => l.trim())).filter((l) => l.length > 0);
      const deniedLogin = allLines.some((line) => /^not logged in\b/i.test(line));
      const statusLines = allLines.filter((line) => /^logged in\b/i.test(line));
      const methodOf = (line: string): string =>
        /api key/i.test(line)
          ? "api_key"
          : /access token/i.test(line)
            ? "access_token"
            : /chatgpt/i.test(line)
              ? "chatgpt"
              : "unknown";
      if (authObservation.exitCode === 0 && statusLines.length > 0 && !deniedLogin) {
        const methods = statusLines.map(methodOf);
        // MINOR-2: the streams disagreeing is not a licence to pick the
        // stronger claim. Eligibility requires EVERY status line to agree,
        // so a mixed pair fails closed regardless of which stream said what.
        const authMethod = methods[0]!;
        auth = {
          available: true,
          authMethod,
          subscriptionEligible: methods.every((m) => m === "chatgpt"),
        };
      }
    }

    return {
      adapterId: ADAPTER_ID,
      vendor: "openai",
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
          id: "openai-api-key",
          vendor: "openai",
          patternKind: "regex",
          pattern: "\\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\\b",
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
          "The configured Codex executable is unavailable",
        ),
      );
    }
    if (!facts.auth.available || !facts.auth.subscriptionEligible) {
      return failedResult(
        request,
        "auth_failure",
        diagnostic("auth_unavailable", "Codex authentication is unavailable"),
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
      "exec",
      "--json",
      ...(options.model === undefined ? [] : ["--model", options.model]),
      ...(options.reasoningEffort === undefined
        ? []
        : ["-c", `model_reasoning_effort="${options.reasoningEffort}"`]),
      "--sandbox",
      "workspace-write",
      "--cd",
      request.workingDirectory,
      "--",
      request.prompt,
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
    const actions: { name: string; error?: string; output?: string }[] = [];
    const settled = await settle();
    const resilience: InvocationResilience = {
      attempts: loop.attempts,
      backoffMs: loop.backoffMs,
      budgetMs,
      ...(actions.length === 0 ? {} : { progress: progressVerdict(actions) }),
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
              "The configured Codex executable is unavailable",
            ),
          );
        }
        if (!recheck.auth.available || !recheck.auth.subscriptionEligible) {
          return failedResult(
            request,
            "auth_failure",
            diagnostic("auth_unavailable", "Codex authentication is unavailable"),
          );
        }
        cachedFacts = recheck;
      }
      if (invocation.errorCode === "ETIMEDOUT") {
        return failedResult(
          request,
          "transient_failure",
          diagnostic("timeout", "Codex invocation timed out"),
        );
      }
      if (invocation.exitCode !== 0) {
        return failedResult(
          request,
          "fatal_failure",
          diagnostic(
            "process_exit",
            "Codex invocation exited unsuccessfully",
            invocation.exitCode ?? undefined,
          ),
        );
      }

      // NDJSON: every line must parse; text from the last agent_message item,
      // sessionId from thread.started. Unknown event types are tolerated.
      let text: string | undefined;
      let sessionId: string | undefined;
      let terminal: "completed" | "failed" | undefined;
      let usage: { inputTokens?: number; outputTokens?: number } | undefined;
      if (invocation.stdout.includes("\0")) {
        return failedResult(
          request,
          "fatal_failure",
          diagnostic("malformed_output", "Codex returned malformed JSON output", invocation.exitCode),
        );
      }
      for (const line of invocation.stdout.split("\n")) {
        if (line.trim().length === 0) continue;
        let event: unknown;
        try {
          event = JSON.parse(line);
        } catch {
          return failedResult(
            request,
            "fatal_failure",
            diagnostic(
              "malformed_output",
              "Codex returned malformed JSON output",
              invocation.exitCode,
            ),
          );
        }
        if (!isRecord(event)) continue;
        // Every completed item is an action for the progress verdict; a
        // command's aggregated output is its output, and its error when it
        // exited nonzero.
        if (event.type === "item.completed" && isRecord(event.item) && typeof event.item.type === "string") {
          const item = event.item;
          const output = typeof item.aggregated_output === "string" ? item.aggregated_output : undefined;
          const failed = typeof item.exit_code === "number" && item.exit_code !== 0;
          actions.push({
            name: typeof item.command === "string" ? item.command : String(item.type),
            ...(output === undefined ? {} : { output }),
            ...(failed && output !== undefined ? { error: output } : {}),
          });
        }
        if (event.type === "thread.started" && typeof event.thread_id === "string") {
          sessionId = event.thread_id;
        } else if (
          event.type === "item.completed" &&
          isRecord(event.item) &&
          event.item.type === "agent_message" &&
          typeof event.item.text === "string"
        ) {
          text = event.item.text;
        } else if (event.type === "turn.completed") {
          terminal = "completed";
          // Usage telemetry the turn already carries: keep it. Codex reports
          // token counts only (no cost figure).
          if (isRecord(event.usage)) {
            const inTok = event.usage.input_tokens;
            const outTok = event.usage.output_tokens;
            usage = {
              ...(typeof inTok === "number" && Number.isFinite(inTok) ? { inputTokens: inTok } : {}),
              ...(typeof outTok === "number" && Number.isFinite(outTok) ? { outputTokens: outTok } : {}),
            };
          }
        } else if (event.type === "turn.failed" || event.type === "error") {
          terminal = "failed";
        }
      }

      if (terminal !== "completed") {
        return failedResult(
          request,
          "fatal_failure",
          diagnostic(
            "malformed_output",
            terminal === "failed" ? "Codex turn failed" : "Codex turn did not complete",
            invocation.exitCode,
          ),
        );
      }
      if (text === undefined || sessionId === undefined) {
        return failedResult(
          request,
          "fatal_failure",
          diagnostic(
            "malformed_output",
            "Codex returned no agent message",
            invocation.exitCode,
          ),
        );
      }

      return {
        outcome: "success",
        adapterId: ADAPTER_ID,
        jobId: request.jobId,
        requestId: request.requestId,
        response: {
          text,
          sessionId,
          ...(usage !== undefined && Object.keys(usage).length > 0 ? { usage } : {}),
        },
      };
    }
  }

  return { preflight, invoke };
}
