import { spawnSync } from "node:child_process";
import { SNAPSHOT_COMMIT_MESSAGE } from "../kernel/state/git-ref-store.ts";

// OI-32 (option 1): publish `refs/factory/*` after a run produces evidence.
//
// Run records and the spec index live in a custom ref namespace that `git push
// origin main` does not send, so for the whole life of this project the durable
// authority existed on exactly one machine. Pushing it by hand is a snapshot;
// this makes it a step.
//
// THE RULE THIS MODULE EXISTS TO KEEP: a run must never fail because a network
// did. Every failure here — no remote, no network, a rejected ref, a hung push —
// is reported and swallowed. The caller's exit code is decided by the run's own
// disposition and nothing in this file may change it.
//
// NEVER `--force`. A rejected ref means local and remote genuinely diverged, and
// on this namespace that is approval-critical evidence. The rejection is the
// signal; forcing past it destroys the thing being published.

export interface PublishRefsResult {
  readonly attempted: boolean;
  // Why it was not attempted, when it wasn't: no remote, or disabled.
  readonly skipped?: string;
  readonly pushed: readonly string[];
  // Refs the remote refused. Non-fast-forward is the expected case: `abandon`
  // deletes a spec ref and the next run CREATES it again with no parent, so it
  // is an unrelated root commit rather than a descendant.
  readonly rejected: readonly string[];
  // Diverged spec refs repaired with a two-parent snapshot (LOCAL tree, parents
  // [local, remote]) that the remote then accepted as a fast-forward. Owner
  // ruling 2026-09-02. Spec refs only: a diverged run ref is evidence.
  readonly reconciled: readonly string[];
  readonly failed?: string;
}

const DEFAULT_TIMEOUT_MS = 15_000;

// Deliberately short and separate from FACTORY_STAGE_TIMEOUT_MS. A stage budget
// is sized for an agent turn; this is a push, and a slow one must not add
// minutes to every run. Falls back on any unusable value rather than refusing —
// this is best-effort output, so a bad budget must not become a hard failure.
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

export function publishFactoryRefs(repositoryPath: string): PublishRefsResult {
  const none = { attempted: false, pushed: [], rejected: [], reconciled: [] } as const;

  // Opt-out, not opt-in: the default has to be "publish", or this changes
  // nothing for the unattended case it exists to serve. `0` and `false` both
  // disable, because both are what an operator reaches for.
  const setting = process.env.FACTORY_PUBLISH_REFS;
  if (setting === "0" || setting?.toLowerCase() === "false") {
    return { ...none, skipped: "FACTORY_PUBLISH_REFS is disabled" };
  }

  // A repository with no `origin` is the normal case for a fixture or an
  // offline clone, and is not worth a warning.
  const deadline = Date.now() + timeoutMs();
  const remote = git(repositoryPath, ["remote", "get-url", "origin"]);
  if (remote.status !== 0) return { ...none, skipped: "no origin remote" };

  // GIT_TERMINAL_PROMPT=0 above matters more than the timeout: without it a push
  // needing credentials BLOCKS on a prompt, and an unattended run hangs forever
  // rather than failing fast. The timeout is the second line of defence.
  const push = git(
    repositoryPath,
    ["push", "--porcelain", "origin", "refs/factory/*:refs/factory/*"],
    timeoutMs(),
  );

  if (push.error !== undefined || push.status === null) {
    const code = (push.error as NodeJS.ErrnoException | undefined)?.code;
    return {
      ...none,
      attempted: true,
      failed:
        code === "ETIMEDOUT"
          ? `push exceeded ${timeoutMs()}ms (set FACTORY_PUBLISH_TIMEOUT_MS to raise it)`
          : `push could not run: ${String(push.error ?? "unknown")}`,
    };
  }

  // --porcelain gives one machine-readable line per ref: a leading flag, then
  // `<from>:<to>`. `!` is a rejection; `=` is up to date; anything else moved.
  const pushed: string[] = [];
  const rejected: string[] = [];
  for (const line of `${push.stdout}`.split("\n")) {
    const match = /^([ +\-*!=])\t([^:]+):/.exec(line);
    if (match === null) continue;
    const [, flag, ref] = match;
    if (flag === "!") rejected.push(ref!);
    else if (flag !== "=") pushed.push(ref!);
  }

  // A nonzero exit with rejections is the expected diverged case, already
  // reported through `rejected`. A nonzero exit with none is something else —
  // auth, a missing remote branch, a dead network — and must not be silent.
  if (push.status !== 0 && rejected.length === 0) {
    return { attempted: true, pushed, rejected, reconciled: [], failed: `${push.stderr}`.trim().slice(0, 500) };
  }

  const reconciled: string[] = [];
  const failures: string[] = [];
  const remaining = () => Math.max(1, deadline - Date.now());
  const specRefs = rejected.filter((ref) => ref.startsWith("refs/factory/specs/"));
  if (specRefs.length > 0) {
    // One round trip answers both questions: what the remote's head is, and
    // whether the run it names is on the remote.
    const remoteRefs = new Map<string, string>();
    const ls = git(
      repositoryPath,
      ["ls-remote", "origin", "refs/factory/specs/*", "refs/factory/runs/*"],
      remaining(),
    );
    if (ls.status !== 0) failures.push(`ls-remote: ${`${ls.stderr}`.trim().slice(0, 200)}`);
    for (const line of `${ls.stdout ?? ""}`.split("\n")) {
      const [sha, ref] = line.split("\t");
      if (sha !== undefined && ref !== undefined) remoteRefs.set(ref, sha);
    }
    for (const ref of specRefs) {
      const why = reconcileSpecRef(repositoryPath, ref, remoteRefs, remaining);
      if (why === undefined) reconciled.push(ref);
      // A missing remote run ref is the ruling's "leave it" case, not a failure.
      else if (why !== null) failures.push(`${ref}: ${why}`);
    }
  }
  const stillRejected = rejected.filter((ref) => !reconciled.includes(ref));
  return {
    attempted: true,
    pushed,
    rejected: stillRejected,
    reconciled,
    ...(failures.length > 0 ? { failed: failures.join("; ").slice(0, 500) } : {}),
  };
}

// Returns undefined on success, null when the ruling says leave it, else the
// reason the ref stays rejected (appended to `failed`). The
// remote is only touched by the final non-force push, so every earlier failure
// leaves both sides exactly as they were.
function reconcileSpecRef(
  repositoryPath: string,
  ref: string,
  remoteRefs: ReadonlyMap<string, string>,
  remaining: () => number,
): string | null | undefined {
  const remoteHead = remoteRefs.get(ref);
  if (remoteHead === undefined) return "remote head not listed";
  const local = git(repositoryPath, ["rev-parse", "--verify", `${ref}^{commit}`]);
  if (local.status !== 0) return "no local head";
  const localHead = `${local.stdout}`.trim();

  // The remote's commit is not necessarily in the local object store. An empty
  // --refmap disables git's opportunistic update of the configured
  // `refs/factory/*` mapping, so only FETCH_HEAD moves — never the local ref.
  const fetch = git(repositoryPath, ["fetch", "--quiet", "--refmap=", "origin", ref], remaining());
  if (fetch.status !== 0) return `fetch: ${`${fetch.stderr}`.trim().slice(0, 200)}`;
  const fetched = git(repositoryPath, ["rev-parse", "--verify", "FETCH_HEAD"]);
  if (fetched.status !== 0 || `${fetched.stdout}`.trim() !== remoteHead) return "fetched head mismatch";

  const spec = git(repositoryPath, ["cat-file", "-p", `${remoteHead}:spec.json`]);
  if (spec.status !== 0) return "remote spec.json unreadable";
  let runId: unknown;
  try {
    runId = (JSON.parse(`${spec.stdout}`) as { run_id?: unknown }).run_id;
  } catch {
    return "remote spec.json not understood";
  }
  if (typeof runId !== "string" || runId === "") return "remote spec.json has no run_id";
  // Without the run ref the remote's pointer is the only evidence that run
  // existed; leave it alone.
  if (!remoteRefs.has(`refs/factory/runs/${runId}`)) return null;

  const tree = git(repositoryPath, ["rev-parse", `${localHead}^{tree}`]);
  if (tree.status !== 0) return "no local tree";
  const commit = git(repositoryPath, [
    "commit-tree", `${tree.stdout}`.trim(),
    "-p", localHead, "-p", remoteHead,
    "-m", SNAPSHOT_COMMIT_MESSAGE,
  ]);
  if (commit.status !== 0) return `commit-tree: ${`${commit.stderr}`.trim().slice(0, 200)}`;
  const merged = `${commit.stdout}`.trim();
  // Compare-and-swap on the head we read: a concurrent writer loses nothing.
  const moved = git(repositoryPath, ["update-ref", ref, merged, localHead]);
  if (moved.status !== 0) return "local ref moved underneath us";

  const push = git(repositoryPath, ["push", "--porcelain", "origin", `${ref}:${ref}`], remaining());
  const accepted = `${push.stdout ?? ""}`.split("\n").some((line) => /^[ +\-*]\t/.test(line));
  if (push.status !== 0 || !accepted) return `push: ${`${push.stderr}`.trim().slice(0, 200)}`;
  return undefined;
}

// One line on STDERR. Never stdout: that carries the run's machine-readable
// status record, and a consumer parsing it must not have to filter this out.
export function reportPublishedRefs(result: PublishRefsResult): void {
  if (!result.attempted) {
    if (result.skipped !== undefined && result.skipped !== "no origin remote") {
      process.stderr.write(`factory refs not published: ${result.skipped}\n`);
    }
    return;
  }
  if (result.failed !== undefined) {
    process.stderr.write(
      `factory refs not published: ${result.failed}\n` +
        `the run is unaffected; publish later with ` +
        `\`git push origin 'refs/factory/*:refs/factory/*'\`\n`,
    );
    // Only the reconcile failed: the push ran, so fall through and report it.
    if (result.rejected.length === 0 && result.reconciled.length === 0) return;
  }
  if (result.reconciled.length > 0) {
    process.stderr.write(
      `factory refs: ${result.reconciled.length} diverged spec ref(s) reconciled (two-parent snapshot, no force):\n` +
        result.reconciled.map((ref) => `  ${ref}\n`).join(""),
    );
  }
  if (result.rejected.length > 0) {
    process.stderr.write(
      `factory refs: ${result.pushed.length} published, ` +
        `${result.rejected.length} REJECTED as diverged from the remote:\n` +
        result.rejected.map((ref) => `  ${ref}\n`).join("") +
        `a spec ref diverges when \`abandon\` deleted it and a later run recreated it. ` +
        `Do NOT --force: that overwrites approval-critical evidence.\n`,
    );
    return;
  }
  if (result.pushed.length > 0) {
    process.stderr.write(`factory refs: ${result.pushed.length} published\n`);
  }
}
