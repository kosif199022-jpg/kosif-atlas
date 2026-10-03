import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// Shared adapter resilience layer (packet adapter-resilience-layer-1). Every
// transport used to carry its own copy of this policy (or none): the shipped
// CLIs spawned once with a fixed timeout, the out-of-tree GLM adapter had
// backoff, budgets, progress and transcripts as private code. This module is
// the one copy. It is TRANSPORT-NEUTRAL: it never spawns, fetches or reads
// the environment; adapters inject the attempt function and the classifier
// that maps their own failure signal onto the four verdicts below.

// Verdict of one attempt. `retry` backs off in place; `timeout` and `fatal`
// stop the loop at once. A timeout is never retried in place because it has
// already consumed real wall-clock and the driver's retry (same jobId) is the
// one that doubles the budget.
export type AttemptVerdict = "ok" | "retry" | "timeout" | "fatal";

// Wait before retry N (1-based). Three retries, then the last failure stands.
// Handles: vendor rate limits and 5xx that clear within seconds.
export const BACKOFF_SCHEDULE_MS: readonly number[] = [2_000, 8_000, 20_000];

// Soft budget doubling ceiling, 2 h. Handles: a driver retry that would repeat
// the same too-short timeout forever.
export const DEFAULT_HARD_CEILING_MS = 7_200_000;

// The closed transient list for CLI transports, applied only to a failed
// (nonzero-exit or spawn-error) attempt's stdout + stderr. Each entry names a
// known transient vendor message class; a clean exit is never matched.
// Handles: 429 / 529 / overloaded / rate limit responses relayed by the CLI,
// and the two DNS/socket errors that mean "try again", not "you are wrong".
export const CLI_TRANSIENT_PATTERN = /\b429\b|\b529\b|overloaded|rate limit|ECONNRESET|EAI_AGAIN/i;

// The transport-neutral summary a result carries. Field names are the contract
// the follow-up packet (adapter-attempt-visibility) records; they are final.
export interface ResilienceSummary {
  // Spawns (or calls) made for this invoke, >= 1.
  readonly attempts: number;
  // Total in-place backoff slept, ms.
  readonly backoffMs: number;
  // The budget (spawn timeout for a CLI) this driver attempt ran under.
  readonly budgetMs: number;
  // Present only when the transport fed an action list to the verdict.
  readonly progress?: ProgressVerdict;
  // Present only when a transcript directory was configured.
  readonly transcriptPath?: string;
}

// Budget policy: per-jobId attempt counter with soft-budget doubling up to the
// hard ceiling. The driver retries a stage under the SAME jobId, so its second
// attempt gets double the budget without the driver knowing about budgets.
// Handles: a stage whose work simply needs longer than the first timeout.
export function createBudgetPolicy(options: {
  readonly softBudgetMs: number;
  readonly hardCeilingMs?: number;
}): { budgetFor(jobId: string): { attempt: number; budgetMs: number } } {
  const ceiling = options.hardCeilingMs ?? DEFAULT_HARD_CEILING_MS;
  const attempts = new Map<string, number>();
  return {
    budgetFor(jobId) {
      const attempt = (attempts.get(jobId) ?? 0) + 1;
      attempts.set(jobId, attempt);
      return { attempt, budgetMs: Math.min(options.softBudgetMs * 2 ** (attempt - 1), ceiling) };
    },
  };
}

// The transient backoff loop. Runs `attempt` until `classify` says anything
// but `retry`, sleeping BACKOFF_SCHEDULE_MS between retries; after the last
// retry the final result is returned as-is. `sleep` is injectable so tests
// assert the schedule without waiting. Handles: transient transport failures
// that would otherwise park the run on the driver's single retry.
export async function runWithBackoff<T>(options: {
  readonly attempt: (attempt: number) => Promise<T>;
  readonly classify: (result: T) => AttemptVerdict;
  readonly sleep?: (ms: number) => Promise<void>;
}): Promise<{ result: T; attempts: number; backoffMs: number }> {
  const sleep = options.sleep ?? ((ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  let backoffMs = 0;
  for (let index = 0; ; index += 1) {
    const result = await options.attempt(index + 1);
    const wait = BACKOFF_SCHEDULE_MS[index];
    if (options.classify(result) !== "retry" || wait === undefined) {
      return { result, attempts: index + 1, backoffMs };
    }
    backoffMs += wait;
    await sleep(wait);
  }
}

export interface ProgressAction {
  readonly name: string;
  readonly error?: string;
  readonly output?: string;
}

export interface ProgressVerdict {
  readonly progressing: boolean;
  readonly reason: string;
}

// Progress verdict over an action list, for turn-loop transports deciding
// whether to continue. Three signals, in priority order: the same error
// signature three times running is a loop; a vitest failure count that falls
// across the list is progress (rising is not); otherwise any distinct action
// counts as progress. Handles: an agent stuck re-running the same failing
// command. Single-shot CLIs compute it for evidence only.
export function progressVerdict(actions: readonly ProgressAction[]): ProgressVerdict {
  if (actions.length === 0) {
    return { progressing: false, reason: "no actions" };
  }
  const errors = actions.slice(-3).map((action) => action.error?.trim()).filter((e): e is string => !!e);
  if (errors.length === 3 && errors.every((e) => e === errors[0])) {
    return { progressing: false, reason: "same error signature three times running" };
  }
  const failed = actions
    .map((action) => /(\d+)\s+failed/.exec(action.output ?? ""))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => Number(m[1]));
  if (failed.length >= 2) {
    const first = failed[0]!;
    const last = failed[failed.length - 1]!;
    if (last < first) return { progressing: true, reason: `test failures fell ${first} -> ${last}` };
    if (last > first) return { progressing: false, reason: `test failures rose ${first} -> ${last}` };
  }
  const distinct = new Set(actions.map((action) => action.name)).size;
  return { progressing: true, reason: `${distinct} distinct action(s)` };
}

// Per-job JSONL transcript writer. Best-effort evidence: a failed directory
// creation or append is swallowed because a transcript must never change an
// outcome. Handles: post-mortem of a parked stage with no other record of the
// in-place attempts.
export function createTranscriptWriter(options: {
  readonly directory: string;
  readonly jobId: string;
}): { path: string; append(event: Record<string, unknown>): void } {
  const path = join(options.directory, `${options.jobId.replace(/[^A-Za-z0-9._-]/g, "_")}.jsonl`);
  try {
    mkdirSync(options.directory, { recursive: true });
  } catch {
    // ponytail: best-effort; append below fails the same way and is swallowed.
  }
  return {
    path,
    append(event) {
      try {
        appendFileSync(path, `${JSON.stringify({ at: new Date().toISOString(), ...event })}\n`);
      } catch {
        // best-effort evidence
      }
    },
  };
}
