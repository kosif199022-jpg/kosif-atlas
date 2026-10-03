// Packet P37 (OI-10), amendment 2 review: the ref-discarding half of
// `factory abandon`, extracted so BOTH fail-closed branches can be pinned by a
// stub store with no timing. The first amendment's blocking fix — checking every
// `store.delete` result — shipped with no test binding it: reverting it left the
// whole suite green. `GitRefStore` is a plain interface, so the fix is a unit
// test, not a race.
//
// The lease stays with the caller. Note what it does and does not buy: it
// excludes other LEASE-TAKERS, not every writer — verdict.ts advances a run ref
// without it. That is why every delete here CASes against the oid its own check
// read (amendment-2 review M1-R), and why start() publishes a run ref before the
// index that points at it (amendment-3 review B1-R3) rather than relying on the
// lease to order the two.

import { spawnSync } from "node:child_process";

import { isApprovalCritical, isAwaitingOwnerDecision } from "../kernel/retention.ts";
import type { GitRefStore } from "../kernel/state/git-ref-store.ts";

// OI-22: a plain `needs_owner` park (nobody has decided yet) is protected the
// same way an accepted verdict is — both need `--force` to discard. The two
// cases get distinct wording because they name different problems: one says a
// decision is already recorded, the other says one hasn't been made.
function protectionReason(record: unknown): string | null {
  if (isAwaitingOwnerDecision(record)) {
    return "is parked needs_owner awaiting an owner decision; nothing was discarded, re-run with --force to discard it without deciding";
  }
  if (isApprovalCritical(record)) {
    return "carries an accepted review verdict; nothing was discarded, re-run with --force to discard approval-critical evidence";
  }
  return null;
}

export type DiscardOutcome =
  | { readonly disposition: "abandoned"; readonly discarded: readonly string[] }
  | { readonly disposition: "refused"; readonly reason: string };

export interface DiscardInput {
  readonly specId: string;
  // null when the spec index carries no resolvable run_id — a dangling index,
  // which is exactly what `abandon` exists to clear.
  readonly runId: string | null;
  readonly force: boolean;
  // Every refs/factory/runs/* name in the repository, for the orphan sweep
  // below. The caller lists them (the store has no enumeration); everything
  // that decides what to DO with them lives here, where a stub can pin it.
  readonly runRefNames: readonly string[];
}

// P37 amendment-4 review B1-R4 / CRASH-1: the recovery `abandon` promises is not
// "delete the pair the index names" — it is "leave no state behind for this
// spec". A run ref can outlive its index two ways, neither of them exotic:
//
//   * a `start()` stalled on the lease publishes its run ref AFTER `abandon`
//     cleared the pair (start.ts re-reads the index under the lease to stop
//     this at the source, but a sweep is what recovers state already stranded);
//   * a run interrupted between the run-ref create and the index create —
//     Ctrl-C, a crash — leaves a run ref no index points at.
//
// Both are invisible to the index, so both were unclearable by `abandon` and
// never pruned by gc. The sweep is what makes them recoverable.
function sweepOrphans(
  store: GitRefStore,
  input: DiscardInput,
  discarded: string[],
): { readonly refusal: string | null } {
  for (const runRefName of input.runRefNames) {
    if (discarded.includes(runRefName)) continue;
    let snapshot;
    let record: unknown = null;
    try {
      // READ-1: the read is inside the try here too. Reached with --force (the
      // pre-scan returns early), this threw AFTER the named pair was deleted —
      // a whole-command failure naming nothing, with the state already gone.
      snapshot = store.read(runRefName);
      if (snapshot === null) continue;
      const json = snapshot.files["run.json"];
      record = json === undefined ? null : JSON.parse(json);
    } catch {
      // Unreadable ref or record: it names no spec, so it is not ours to clear.
      continue;
    }
    const named =
      typeof record === "object" && record !== null && !Array.isArray(record)
        ? (record as Record<string, unknown>).spec_id
        : undefined;
    if (named !== input.specId) continue;

    // P37 amendment-6 review SWEEP-2: re-check HERE, on the same snapshot this
    // delete CASes against. The pre-scan is a fast path that lets abandon refuse
    // with nothing deleted; it is not the decision. A ref that became
    // approval-critical between the two passes — a `factory verdict` accepted in
    // between, which takes no lease — was destroyed at exit 0 reporting a clean
    // abandon. The CAS makes the delete atomic; it does not make the decision
    // current. Same defect shape as M1-R, in a path that had no check at all.
    if (!input.force) {
      const reason = protectionReason(record);
      if (reason !== null) {
        return {
          refusal: `abandon: discarded ${discarded.join(", ") || "nothing"}, but ${runRefName} ${reason}`,
        };
      }
    }

    if (store.delete(runRefName, snapshot.oid).disposition !== "deleted") {
      return {
        refusal: `abandon: discarded ${discarded.join(", ") || "nothing"}, but ${runRefName} changed under us and was left in place; run abandon again to clear it`,
      };
    }
    discarded.push(runRefName);
  }
  return { refusal: null };
}

// P37 amendment-5 review SWEEP-1 / amendment-6 review MINOR 1. The invariant
// this function upholds, stated precisely because the looser version was WRONG:
//
//   Every refusal names exactly what was and was not discarded — and every
//   APPROVAL-CRITICAL refusal that can be issued before a delete IS issued
//   before one.
//
// It is NOT "a refusal means nothing was deleted". Two fail-closed refusals
// below fire after the run ref is gone (a ref moved under us mid-sequence);
// they say so, and re-running abandon clears the remainder. Only the pre-scan
// guarantees nothing was touched.
//
// The pre-scan below exists so an approval-critical orphan stops abandon while
// the state is still whole; the in-loop check in sweepOrphans is the one that
// actually decides, on the snapshot its own delete CASes against.
function protectedOrphan(store: GitRefStore, input: DiscardInput): { ref: string; reason: string } | null {
  if (input.force) return null;
  for (const runRefName of input.runRefNames) {
    try {
      // P37 amendment-7 review READ-1: the READ is inside the try. `store.read`
      // THROWS on a ref that is not a controller state commit, and both scans
      // walk EVERY refs/factory/runs/*, not just this spec's — so a single alien
      // or corrupted ref belonging to no spec under test threw out of here and
      // bricked `abandon` for every spec in the repository. A ref we cannot read
      // names no spec, so it is not ours to protect or to clear: skip it.
      const snapshot = store.read(runRefName);
      if (snapshot === null) continue;
      const json = snapshot.files["run.json"];
      if (json === undefined) continue;
      const record = JSON.parse(json) as Record<string, unknown>;
      const reason = protectionReason(record);
      if (reason !== null && record.spec_id === input.specId) return { ref: runRefName, reason };
    } catch {
      // Unreadable ref or record: nothing to protect.
      continue;
    }
  }
  return null;
}

export function discardRunState(store: GitRefStore, input: DiscardInput): DiscardOutcome {
  const specRefName = `refs/factory/specs/${input.specId}`;
  const discarded: string[] = [];

  // BEFORE anything is deleted, including the named run's own check below.
  const orphan = protectedOrphan(store, input);
  if (orphan !== null) {
    return {
      disposition: "refused",
      reason: `abandon: ${orphan.ref} ${orphan.reason}`,
    };
  }

  // Delete the run ref first, then the index that points at it. The reverse
  // order is what strands a run ref with no index — the orphan `factory verdict`
  // can never disambiguate.
  if (input.runId !== null) {
    const runRefName = `refs/factory/runs/${input.runId}`;
    const runSnapshot = store.read(runRefName);
    if (runSnapshot !== null) {
      // Never destroy approval-critical evidence silently. This check rides the
      // SAME oid the delete below CASes against, which is what stops it being a
      // TOCTOU: the lease is not mutual exclusion, because verdict.ts advances
      // this ref and never takes it (amendment review M1-R).
      let record: unknown = null;
      try {
        const json = runSnapshot.files["run.json"];
        record = json === undefined ? null : JSON.parse(json);
      } catch {
        // Unreadable record: nothing to protect, the abandon proceeds.
      }
      if (!input.force) {
        const reason = protectionReason(record);
        if (reason !== null) {
          return {
            disposition: "refused",
            reason: `abandon: run ${input.runId} ${reason}`,
          };
        }
      }

      // FAIL CLOSED. Treating a cas_mismatch as success is how the first
      // amendment manufactured the very orphan it was fixing: the run ref
      // survived, the index was deleted anyway, and exit 0 said "abandoned".
      if (store.delete(runRefName, runSnapshot.oid).disposition !== "deleted") {
        return {
          disposition: "refused",
          reason: `abandon: run ${input.runId} changed while it was being abandoned; nothing was discarded, re-read the state and run abandon again`,
        };
      }
      discarded.push(runRefName);
    }
    // runSnapshot === null: the index is dangling. Fall through and clear it —
    // amendment-2 review B1-R2. Refusing here is what left a spec permanently
    // unrunnable after a partial refusal, recoverable only by the hand
    // `git update-ref -d` that OI-10 exists to eliminate.
  }

  // The digest -> run_id index goes too: leaving it behind re-binds the next run
  // to the abandoned id, and a spec edited since would still be refused "a
  // different spec digest already owns this spec_id".
  const specSnapshot = store.read(specRefName);
  if (specSnapshot !== null) {
    if (store.delete(specRefName, specSnapshot.oid).disposition !== "deleted") {
      return {
        disposition: "refused",
        reason:
          discarded.length === 0
            ? `abandon: ${specRefName} changed while it was being abandoned; nothing was discarded, run abandon again`
            : `abandon: discarded ${discarded.join(", ")}, but ${specRefName} changed under us and was left in place; run abandon again to clear it`,
      };
    }
    discarded.push(specRefName);
  }

  // Last, with the index already gone: anything else this spec left behind.
  const swept = sweepOrphans(store, input, discarded);
  if (swept.refusal !== null) return { disposition: "refused", reason: swept.refusal };

  return { disposition: "abandoned", discarded };
}

// OI-79 (packet abandon-reset-to-base-1): put the branch back where the run
// found it. `discardRunState` above touches refs only; the red/green commits
// stayed on the branch and the hand revert that followed deleted files earlier
// packets had added. Reset when, and only when, every first-parent commit
// between base_sha and HEAD is the record's own red_sha/green_sha (identity is
// sha equality — subjects and authors are not pinned) and the tree is clean.
// The CLI wiring is the next packet.

export type ResetOutcome =
  | { disposition: "reset"; from: string; to: string }
  | { disposition: "noop"; reason: string }
  | { disposition: "refused"; reason: string };

const SHA = /^[0-9a-f]{40}$/;

function recordSha(record: unknown, key: string): string | null {
  if (typeof record !== "object" || record === null) return null;
  const value = (record as Record<string, unknown>)[key];
  return typeof value === "string" && SHA.test(value) ? value : null;
}

function gitRead(repositoryPath: string, args: readonly string[]): { ok: boolean; out: string } {
  const result = spawnSync("git", ["-C", repositoryPath, ...args], { encoding: "utf8" });
  return { ok: result.status === 0, out: (result.stdout ?? "").toString() };
}

export function resetBranchToBase(repositoryPath: string, record: unknown): ResetOutcome {
  const base = recordSha(record, "base_sha");
  if (base === null) return { disposition: "noop", reason: "record carries no 40-hex base_sha; nothing to reset" };

  const head = gitRead(repositoryPath, ["rev-parse", "HEAD"]);
  if (!head.ok) return { disposition: "refused", reason: `cannot resolve HEAD in ${repositoryPath}` };
  const from = head.out.trim();
  if (from === base) return { disposition: "noop", reason: `HEAD is already at base_sha ${base}` };

  const ancestry = spawnSync("git", ["-C", repositoryPath, "merge-base", "--is-ancestor", base, "HEAD"]);
  if (ancestry.status !== 0) {
    return { disposition: "refused", reason: `base_sha ${base} is not an ancestor of HEAD ${from}; nothing was reset` };
  }

  const status = gitRead(repositoryPath, ["status", "--porcelain"]);
  if (!status.ok) return { disposition: "refused", reason: "git status failed; nothing was reset" };
  if (status.out !== "") {
    return { disposition: "refused", reason: "working tree is dirty (uncommitted changes); commit or stash first, nothing was reset" };
  }

  const own = new Set([recordSha(record, "red_sha"), recordSha(record, "green_sha")].filter((s) => s !== null));
  const list = gitRead(repositoryPath, ["rev-list", "--first-parent", "--format=%H %s", "--no-commit-header", `${base}..HEAD`]);
  if (!list.ok) return { disposition: "refused", reason: "git rev-list failed; nothing was reset" };
  for (const line of list.out.split("\n")) {
    if (line === "") continue;
    const sha = line.slice(0, 40);
    if (own.has(sha)) continue;
    return { disposition: "refused", reason: `branch holds a commit the run did not make: ${sha} ${line.slice(41)}; nothing was reset` };
  }

  const reset = spawnSync("git", ["-C", repositoryPath, "reset", "--hard", "--quiet", base]);
  if (reset.status !== 0) return { disposition: "refused", reason: `git reset --hard ${base} failed` };
  return { disposition: "reset", from, to: base };
}
