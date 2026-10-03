import { spawnSync } from "node:child_process";

// C9 packet 1: after an approve verdict, publish
// `refs/factory/candidates/<run-id>/<attempt>` to origin (§9.1, LIM-13).
//
// Creation-only on both sides: the local ref is written with an all-zero
// expected OID, the push uses `--force-with-lease=<ref>:` (empty expected OID).
// A ref that already exists anywhere at a different sha is `rejected` and left
// alone — NEVER `--force`. Same rule as publish-refs.ts: a run never fails
// because a network did, so nothing here throws.
//
// Default-off (audit U-11): FACTORY_DELIVER=1|true is the owner's per-action
// consent to push; the approve decision alone sends nothing off the machine.

export interface CandidateRefInput {
  readonly runId: string;
  readonly attempt: number;
  readonly sha: string;
}

export interface CandidateRefResult {
  readonly disposition: "published" | "skipped" | "rejected";
  readonly ref: string;
  readonly reason?: string;
}

const ZERO_OID = "0".repeat(40);
const DEFAULT_TIMEOUT_MS = 15_000;

function timeoutMs(): number {
  const raw = Number(process.env.FACTORY_PUBLISH_TIMEOUT_MS);
  return Number.isInteger(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}

function git(repositoryPath: string, args: readonly string[], budgetMs?: number) {
  return spawnSync("git", ["-C", repositoryPath, ...args], {
    encoding: "utf8" as const,
    maxBuffer: 4 * 1024 * 1024,
    ...(budgetMs === undefined ? {} : { timeout: budgetMs }),
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_ASKPASS: "true" },
  });
}

function deliverEnabled(): boolean {
  const v = process.env.FACTORY_DELIVER;
  return v === "1" || v?.toLowerCase() === "true";
}

export function publishCandidateRef(
  repositoryPath: string,
  input: CandidateRefInput,
): CandidateRefResult {
  const ref = `refs/factory/candidates/${input.runId}/${input.attempt}`;
  const rejected = (reason: string): CandidateRefResult => ({ disposition: "rejected", ref, reason });

  if (!deliverEnabled()) {
    return { disposition: "skipped", ref, reason: "FACTORY_DELIVER is not 1/true" };
  }
  if (git(repositoryPath, ["remote", "get-url", "origin"]).status !== 0) {
    return { disposition: "skipped", ref, reason: "no origin remote" };
  }

  // Local ref: create-only. Present at the same sha is a no-op; anything else
  // is a divergence and stays as it is.
  const local = git(repositoryPath, ["rev-parse", "--verify", "--quiet", ref]).stdout.trim();
  if (local === "") {
    const created = git(repositoryPath, ["update-ref", ref, input.sha, ZERO_OID]);
    if (created.status !== 0) return rejected(`${created.stderr}`.trim().slice(0, 500));
  } else if (local !== input.sha) {
    return rejected(`local ${ref} already at ${local}, expected ${input.sha}`);
  }

  const push = git(
    repositoryPath,
    ["push", "--porcelain", `--force-with-lease=${ref}:`, "origin", `${ref}:${ref}`],
    timeoutMs(),
  );
  if (push.error !== undefined || push.status === null) {
    const code = (push.error as NodeJS.ErrnoException | undefined)?.code;
    return rejected(
      code === "ETIMEDOUT"
        ? `push exceeded ${timeoutMs()}ms (set FACTORY_PUBLISH_TIMEOUT_MS to raise it)`
        : `push could not run: ${String(push.error ?? "unknown")}`,
    );
  }
  if (push.status === 0) return { disposition: "published", ref };

  // The lease refuses any existing remote ref, including one already at our
  // sha. Idempotent re-runs are the common case, so distinguish them here.
  const remote = git(repositoryPath, ["ls-remote", "origin", ref], timeoutMs());
  if (remote.status === 0 && remote.stdout.trim().split(/\s+/)[0] === input.sha) {
    return { disposition: "published", ref };
  }
  const line = `${push.stdout}`.split("\n").find((l) => l.startsWith("!"));
  return rejected((line ?? `${push.stderr}`).trim().slice(0, 500));
}
