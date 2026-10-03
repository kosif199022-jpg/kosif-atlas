import { statSync } from "node:fs";
import { isAbsolute } from "node:path";

import type { InvocationDiagnostic, InvocationRequest, InvocationResult } from "./types.ts";

// Helpers that were line-identical between claude.ts and codex.ts (hoisted per
// codex.ts's own note, owner-approved dedup 2026-08-27). Only the vendor label
// and adapter id vary, so they are parameters. What deliberately did NOT move:
// each adapter's run()/spawn core (codex reads stderr and needs a 2 MiB output
// budget where claude uses 64 KiB — measured, load-bearing differences), the
// auth-status parsing, and argv construction. Those stay vendor-specific.

export const MAX_DIAGNOSTIC_LENGTH = 512;

// Two consolidation branches met here: kernel/guards.ts owns these bodies;
// shared.ts imports them (its own helpers use them) and re-exports so the
// adapters keep one import site.
import { isProcessString, isRecord } from "../guards.ts";
export { isProcessString, isRecord };

export function isExistingDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

export function diagnostic(
  kind: string,
  message: string,
  exitCode?: number,
): InvocationDiagnostic {
  return {
    kind,
    message: message.slice(0, MAX_DIAGNOSTIC_LENGTH),
    ...(exitCode === undefined ? {} : { exitCode }),
  };
}

export function failedResult(
  adapterId: string,
  request: InvocationRequest,
  outcome: "transient_failure" | "auth_failure" | "fatal_failure",
  details: InvocationDiagnostic,
): InvocationResult {
  return {
    outcome,
    adapterId,
    jobId: request.jobId,
    requestId: request.requestId,
    diagnostic: details,
  };
}

// The shape both adapters demand of their options: absolute NUL-free
// executable path, positive integer timeout, and a runtime environment whose
// keys are exactly the required set plus a subset of the optional set, every
// value a process-safe string (P36/OI-11: an omitted optional key must be
// ABSENT, never an empty string).
export function assertAdapterOptions(
  vendorLabel: string,
  requiredEnvironmentKeys: readonly string[],
  optionalEnvironmentKeys: readonly string[],
  options: {
    readonly executablePath: string;
    readonly processTimeoutMs: number;
    readonly runtimeEnvironment: Record<string, string | undefined>;
  },
): void {
  if (
    typeof options !== "object" ||
    options === null ||
    !isProcessString(options.executablePath) ||
    !isAbsolute(options.executablePath) ||
    !Number.isInteger(options.processTimeoutMs) ||
    options.processTimeoutMs <= 0
  ) {
    throw new Error(`${vendorLabel} adapter options are invalid`);
  }

  const environment = options.runtimeEnvironment;
  if (typeof environment !== "object" || environment === null) {
    throw new Error(`${vendorLabel} adapter runtime environment is invalid`);
  }

  const keys = Object.keys(environment);
  const known: readonly string[] = [...requiredEnvironmentKeys, ...optionalEnvironmentKeys];
  if (
    requiredEnvironmentKeys.some((key) => !keys.includes(key)) ||
    keys.some((key) => !known.includes(key)) ||
    keys.some((key) => !isProcessString(environment[key]))
  ) {
    throw new Error(`${vendorLabel} adapter runtime environment is invalid`);
  }
}
