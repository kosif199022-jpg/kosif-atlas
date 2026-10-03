import { createClaudeAdapter } from "./claude.ts";
import { createCodexAdapter } from "./codex.ts";
import type { Adapter } from "./types.ts";

// P24 (FR-K4/FR-K12): build a real vendor adapter from configured auth. The
// spawned CLI subprocess cannot be handed in-memory options, so config is env:
//   FACTORY_ADAPTER            "claude" | "codex" (absent/other => not configured)
//   FACTORY_ADAPTER_EXECUTABLE absolute path to the vendor CLI
//   FACTORY_ADAPTER_CONFIG_DIR vendor auth dir => CLAUDE_CONFIG_DIR / CODEX_HOME
//   FACTORY_ADAPTER_TIMEOUT_MS optional integer processTimeoutMs (default 120000)
//   FACTORY_ADAPTER_REASONING_EFFORT optional reasoning effort, pinned on every
//                              prompt invocation. codex takes it as
//                              `-c model_reasoning_effort="<value>"`, claude as
//                              `--effort <value>`.
//   FACTORY_ADAPTER_MODEL      optional model pinned on every prompt invocation.
//                              Unset leaves the vendor CLI's own default — which
//                              is what every dogfood run before this used, and
//                              why no run record could say which model wrote the
//                              work. Preflight calls are never pinned.
// HOME/PATH/USER come from the process env. Throws on invalid config (the
// adapter's own assertOptions); callers catch and fail closed.
//
// P36 (OI-11): this was copy-pasted into src/cli.ts and src/controller/sdlc/
// doctor.ts, and doctor's copy runs FIRST (policyProblem calls doctor before
// resolveStages), so a fix applied to one caller was invisible. One builder,
// two importers. The child environment stays a strict ALLOWLIST — never
// process.env wholesale. USER is forwarded when the operator has it (the Claude
// CLI reports loggedIn:false without it) and an unset config dir is OMITTED,
// not passed as an empty string (an empty CLAUDE_CONFIG_DIR breaks auth).
export function buildConfiguredAdapter(vendor: "claude" | "codex"): Adapter {
  const executablePath = process.env.FACTORY_ADAPTER_EXECUTABLE ?? "";
  const configDir = process.env.FACTORY_ADAPTER_CONFIG_DIR;
  const effortRaw = process.env.FACTORY_ADAPTER_REASONING_EFFORT;
  const reasoningEffort =
    effortRaw !== undefined && effortRaw.trim() !== "" ? effortRaw.trim() : undefined;
  const modelRaw = process.env.FACTORY_ADAPTER_MODEL;
  const model = modelRaw !== undefined && modelRaw.trim() !== "" ? modelRaw.trim() : undefined;
  const timeoutRaw = process.env.FACTORY_ADAPTER_TIMEOUT_MS;
  const processTimeoutMs = timeoutRaw && /^\d+$/.test(timeoutRaw) ? Number(timeoutRaw) : 120000;
  const HOME = process.env.HOME ?? "";
  const PATH = process.env.PATH ?? "";
  const USER = process.env.USER;
  const optionalUser = USER === undefined || USER === "" ? {} : { USER };
  const hasConfigDir = configDir !== undefined && configDir !== "";
  if (vendor === "claude") {
    return createClaudeAdapter({
      executablePath,
      processTimeoutMs,
      ...(model === undefined ? {} : { model }),
      ...(reasoningEffort === undefined ? {} : { reasoningEffort }),
      runtimeEnvironment: {
        HOME,
        PATH,
        ...(hasConfigDir ? { CLAUDE_CONFIG_DIR: configDir } : {}),
        ...optionalUser,
      },
    });
  }
  return createCodexAdapter({
    executablePath,
    processTimeoutMs,
    ...(model === undefined ? {} : { model }),
    ...(reasoningEffort === undefined ? {} : { reasoningEffort }),
    runtimeEnvironment: {
      HOME,
      PATH,
      ...(hasConfigDir ? { CODEX_HOME: configDir } : {}),
      ...optionalUser,
    },
  });
}
