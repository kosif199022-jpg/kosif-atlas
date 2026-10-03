// Packet P13 (FR-K11; §7 upgrade, §9.1 retention, §12.2 clean-tree guard):
// three-way preview, token-gated apply, byte-exact rollback, and terminal-run
// GC. Preview writes nothing; apply refuses before any write. Never throws.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";

import { gcEligibility, type RetentionPolicy, type RetentionRun } from "../../kernel/retention.ts";
import { readRunState, runRef } from "../../kernel/resume.ts";
import { openGitRefStore } from "../../kernel/state/git-ref-store.ts";
import { MANIFEST_PATH, POLICY_PATH, ROUTER_PATH } from "../scaffold/index.ts";
import { isProcessString } from "../../kernel/guards.ts";

export type Mode = "preview" | "apply";
export type FileClass = "owned" | "projected" | "vendored";
export type FileAction = "keep" | "update" | "merge_conflict";
export type RefusalKind = "invalid_input" | "missing_preview" | "stale_preview" | "nonterminal_run" | "dirty_tree" | "path_conflict" | "write_failed" | "merge_conflict" | "not_installed";

export interface Refusal {
  readonly kind: RefusalKind;
  readonly detail: string;
}
export interface ReportRow {
  readonly path: string;
  readonly class: FileClass;
  readonly action: FileAction;
}
export interface UpgradeRequest {
  readonly repositoryPath: string;
  readonly toDigest: string;
  readonly mode: Mode;
  readonly previewToken?: string;
}
export type UpgradeResult =
  | { readonly disposition: "previewable"; readonly token: string; readonly report: readonly ReportRow[]; readonly refusals: [] }
  | { readonly disposition: "applied"; readonly written: readonly string[]; readonly rollback: { token: string }; readonly refusals: [] }
  | { readonly disposition: "refused"; readonly report: readonly ReportRow[]; readonly written: []; readonly refusals: readonly Refusal[] };
export interface RollbackResult {
  readonly disposition: "restored" | "refused";
  readonly restored: readonly string[];
  readonly refusals: readonly Refusal[];
}
export interface GcRequest {
  readonly repositoryPath: string;
  readonly policy: RetentionPolicy;
  readonly now: string;
  readonly mode: Mode;
}
export interface GcResult {
  readonly pruned: readonly string[];
  readonly kept: readonly { runId: string; reason: string }[];
  readonly refusals: readonly Refusal[];
}

const TERMINAL_STATUS = "candidate_ready"; // start.ts terminal status
const DIGEST_PATTERN = /^[0-9a-f]{64}$/;
const RUNS_PREFIX = "refs/factory/runs/";
const SPECS_PREFIX = "refs/factory/specs/";
// ponytail: rollback state parks inside .git (not the tree, not a ref) so the
// tree digest oracle and doctor's owned-ref shapes both stay untouched.
const ROLLBACK_DIR = "factory-upgrade";

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}
function refused(refusals: Refusal[], report: ReportRow[] = []): UpgradeResult {
  return { disposition: "refused", report, written: [], refusals };
}
function git(cwd: string, args: string[]): string | null {
  try {
    const r = spawnSync("git", args, { cwd, encoding: "utf8" });
    return r.status === 0 ? r.stdout : null;
  } catch {
    return null;
  }
}

// Mirrors scaffold's manifest bytes so A → B is a pure digest rewrite.
function manifestContent(digest: string): string {
  return `source: software-dev-factory\nversion: 1\ndigest: ${digest}\n`;
}

// L-042: lstat every segment; symlinks and non-regular nodes are conflicts.
function pathState(root: string, rel: string): "missing" | "file" | "conflict" {
  const segments = rel.split("/");
  let full = root;
  for (let i = 0; i < segments.length; i++) {
    full = join(full, segments[i]);
    let st;
    try {
      st = lstatSync(full);
    } catch {
      return "missing";
    }
    if (st.isSymbolicLink()) return "conflict";
    const leaf = i === segments.length - 1;
    if (!leaf && !st.isDirectory()) return "conflict";
    if (leaf && !st.isFile()) return "conflict";
  }
  return "file";
}

function readBytes(root: string, rel: string): Buffer | null {
  return pathState(root, rel) === "file" ? readFileSync(join(root, rel)) : null;
}

// Nonterminal (or unreadable — L-037) runs pin their factory bytes: refuse.
function nonterminalRuns(root: string): string[] | null {
  const listed = git(root, ["for-each-ref", "--format=%(refname)", RUNS_PREFIX]);
  if (listed === null) return null;
  const store = openGitRefStore(root);
  const out: string[] = [];
  for (const ref of listed.split("\n").filter((l) => l !== "")) {
    const runId = ref.slice(RUNS_PREFIX.length);
    const state = readRunState(store, runId);
    if (state.kind !== "found" || state.run.status !== TERMINAL_STATUS) out.push(runId);
  }
  return out;
}

// §12.2 clean-tree guard. `except` lets rollback ignore the paths apply itself
// wrote (they are dirty by construction until the owner commits them).
function isClean(root: string, except: readonly string[] = []): boolean | null {
  const status = git(root, ["status", "--porcelain"]);
  if (status === null) return null;
  return status
    .split("\n")
    .filter((l) => l !== "")
    .every((l) => except.includes(l.slice(3)));
}

function gitDir(root: string): string | null {
  const out = git(root, ["rev-parse", "--git-dir"]);
  if (out === null) return null;
  const dir = out.trim();
  return isAbsolute(dir) ? dir : join(root, dir);
}

interface Plan {
  readonly report: ReportRow[];
  readonly token: string;
  readonly conflicts: string[];
  readonly installed: boolean;
  readonly merges: string[];
}

// Three-way rule: owned (.aai/) always keeps; the vendored manifest's base is
// derivable from its own recorded digest — bytes equal to target keep, equal
// to base update, anything else is an owner edit (merge_conflict). The token binds the target digest to
// the observed bytes of every managed path, so a different target or a tree
// that moved since the preview yields a different token.
function plan(root: string, toDigest: string): Plan {
  const target = manifestContent(toDigest);
  const conflicts: string[] = [];
  const observed: Record<string, string | null> = {};
  const rows: ReportRow[] = [];
  for (const [path, cls] of [[ROUTER_PATH, "owned"], [POLICY_PATH, "owned"]] as const) {
    const state = pathState(root, path);
    if (state === "conflict") conflicts.push(path);
    observed[path] = state === "file" ? sha256(readFileSync(join(root, path))) : null;
    rows.push({ path, class: cls, action: "keep" });
  }
  const mState = pathState(root, MANIFEST_PATH);
  if (mState === "conflict") conflicts.push(MANIFEST_PATH);
  const current = mState === "file" ? readFileSync(join(root, MANIFEST_PATH), "utf8") : null;
  observed[MANIFEST_PATH] = current === null ? null : sha256(current);
  const recorded = current === null ? null : /^digest: ([0-9a-f]{64})$/m.exec(current)?.[1] ?? null;
  const base = recorded === null ? null : manifestContent(recorded);
  const action: FileAction = current === target ? "keep" : current === base ? "update" : "merge_conflict";
  rows.push({ path: MANIFEST_PATH, class: "vendored", action });
  const token = sha256(JSON.stringify({ toDigest, observed }));
  return { report: rows, token, conflicts, installed: current !== null, merges: action === "merge_conflict" ? [MANIFEST_PATH] : [] };
}

export async function upgrade(request: UpgradeRequest): Promise<UpgradeResult> {
  try {
    const r = request as Partial<UpgradeRequest> | null;
    if (
      !r ||
      !isProcessString(r.repositoryPath) ||
      typeof r.toDigest !== "string" ||
      !DIGEST_PATTERN.test(r.toDigest) ||
      (r.mode !== "preview" && r.mode !== "apply") ||
      !existsSync(r.repositoryPath)
    ) {
      return refused([{ kind: "invalid_input", detail: "repositoryPath, toDigest (sha256 hex), and mode are required" }]);
    }
    const root = r.repositoryPath;
    const nonterminal = nonterminalRuns(root);
    if (nonterminal === null) return refused([{ kind: "invalid_input", detail: "could not list refs/factory/runs/*" }]);
    if (nonterminal.length > 0) {
      return refused([{ kind: "nonterminal_run", detail: `nonterminal run(s) pin factory bytes: ${nonterminal.sort().join(", ")}` }]);
    }
    const p = plan(root, r.toDigest);
    if (p.conflicts.length > 0) {
      return refused([{ kind: "path_conflict", detail: `not a regular file path: ${p.conflicts.join(", ")}` }], p.report);
    }
    if (!p.installed) return refused([{ kind: "not_installed", detail: `no ${MANIFEST_PATH}; install the factory before upgrading` }], p.report);
    if (p.merges.length > 0) {
      return refused([{ kind: "merge_conflict", detail: `owner-modified vendored file(s): ${p.merges.join(", ")}` }], p.report);
    }
    if (r.mode === "preview") return { disposition: "previewable", token: p.token, report: p.report, refusals: [] };

    if (!isProcessString(r.previewToken)) return refused([{ kind: "missing_preview", detail: "apply requires the token of a matching preview" }], p.report);
    const clean = isClean(root);
    if (clean !== true) return refused([{ kind: "dirty_tree", detail: "working tree has uncommitted changes; commit or stash before apply" }], p.report);
    if (r.previewToken !== p.token) return refused([{ kind: "stale_preview", detail: "preview token does not match target digest and current tree; re-run preview" }], p.report);
    const dir = gitDir(root);
    if (dir === null) return refused([{ kind: "invalid_input", detail: "not a Git repository" }], p.report);

    // Snapshot pre-apply bytes of exactly the paths apply will write.
    const before: Record<string, string | null> = {};
    for (const row of p.report) {
      if (row.action !== "update") continue;
      const bytes = readBytes(root, row.path);
      before[row.path] = bytes === null ? null : bytes.toString("base64");
    }
    const snapshot = JSON.stringify({ files: before });
    const rollbackToken = sha256(snapshot);
    const stateDir = join(dir, ROLLBACK_DIR);
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(join(stateDir, `${rollbackToken}.json`), snapshot, { flag: "wx" });

    const written: string[] = [];
    try {
      for (const row of p.report) {
        if (row.action !== "update") continue;
        const full = join(root, row.path);
        mkdirSync(dirname(full), { recursive: true });
        writeFileSync(full, manifestContent(r.toDigest));
        written.push(row.path);
      }
    } catch {
      restore(root, before);
      return refused([{ kind: "write_failed", detail: "write failed; pre-apply bytes restored" }], p.report);
    }
    return { disposition: "applied", written, rollback: { token: rollbackToken }, refusals: [] };
  } catch (error) {
    return refused([{ kind: "invalid_input", detail: error instanceof Error ? error.message : String(error) }]);
  }
}

function restore(root: string, files: Record<string, string | null>): string[] {
  const restored: string[] = [];
  for (const [rel, b64] of Object.entries(files)) {
    const full = join(root, rel);
    if (b64 === null) {
      if (pathState(root, rel) === "file") unlinkSync(full);
    } else {
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, Buffer.from(b64, "base64"));
    }
    restored.push(rel);
  }
  return restored;
}

export async function rollback(request: { repositoryPath: string; token: string }): Promise<RollbackResult> {
  try {
    const r = request as Partial<{ repositoryPath: string; token: string }> | null;
    if (!r || !isProcessString(r.repositoryPath) || typeof r.token !== "string" || !DIGEST_PATTERN.test(r.token) || !existsSync(r.repositoryPath)) {
      return { disposition: "refused", restored: [], refusals: [{ kind: "invalid_input", detail: "repositoryPath and a rollback token are required" }] };
    }
    const dir = gitDir(r.repositoryPath);
    const stateFile = dir === null ? null : join(dir, ROLLBACK_DIR, `${r.token}.json`);
    if (stateFile === null || !existsSync(stateFile)) {
      return { disposition: "refused", restored: [], refusals: [{ kind: "stale_preview", detail: "unknown rollback token" }] };
    }
    const raw = readFileSync(stateFile, "utf8");
    const parsed: unknown = JSON.parse(raw);
    const files = (parsed as { files?: unknown } | null)?.files;
    // L-037: stored state is untrusted — the token must be the digest of the bytes,
    // and every entry must be a managed relative path with base64 or null.
    if (
      sha256(raw) !== r.token ||
      typeof files !== "object" ||
      files === null ||
      !Object.entries(files).every(([k, v]) => [ROUTER_PATH, POLICY_PATH, MANIFEST_PATH].includes(k) && (v === null || typeof v === "string"))
    ) {
      return { disposition: "refused", restored: [], refusals: [{ kind: "invalid_input", detail: "rollback state is corrupt" }] };
    }
    for (const rel of Object.keys(files)) {
      if (pathState(r.repositoryPath, rel) === "conflict") {
        return { disposition: "refused", restored: [], refusals: [{ kind: "path_conflict", detail: `not a regular file path: ${rel}` }] };
      }
    }
    if (isClean(r.repositoryPath, Object.keys(files)) !== true) {
      return { disposition: "refused", restored: [], refusals: [{ kind: "dirty_tree", detail: "working tree has uncommitted changes outside the upgraded files; commit or stash before rollback" }] };
    }
    const restored = restore(r.repositoryPath, files as Record<string, string | null>);
    unlinkSync(stateFile);
    return { disposition: "restored", restored, refusals: [] };
  } catch (error) {
    return { disposition: "refused", restored: [], refusals: [{ kind: "invalid_input", detail: error instanceof Error ? error.message : String(error) }] };
  }
}

export async function gc(request: GcRequest): Promise<GcResult> {
  try {
    const r = request as Partial<GcRequest> | null;
    if (!r || !isProcessString(r.repositoryPath) || (r.mode !== "preview" && r.mode !== "apply") || !existsSync(r.repositoryPath)) {
      return { pruned: [], kept: [], refusals: [{ kind: "invalid_input", detail: "repositoryPath and mode are required" }] };
    }
    const root = r.repositoryPath;
    const listed = git(root, ["for-each-ref", "--format=%(refname)", RUNS_PREFIX]);
    if (listed === null) return { pruned: [], kept: [], refusals: [{ kind: "invalid_input", detail: "could not list refs/factory/runs/*" }] };
    const store = openGitRefStore(root);
    const runs: RetentionRun[] = [];
    const byId = new Map<string, { oid: string; specId: string | null }>();
    for (const ref of listed.split("\n").filter((l) => l !== "")) {
      const runId = ref.slice(RUNS_PREFIX.length);
      const state = readRunState(store, runId);
      if (state.kind !== "found") {
        runs.push({ runId, terminal: false }); // L-037: unreadable keeps
        continue;
      }
      // OI-15: through `unknown`. RunState and Record<string, unknown> do not
      // overlap structurally, and the fields read below (`spec_id`,
      // `completed_at`, `retention_class`) are exactly the ones RunState does
      // not declare — every read is already guarded by a typeof check.
      const run = state.run as unknown as Record<string, unknown>;
      byId.set(runId, { oid: state.oid, specId: typeof run.spec_id === "string" ? run.spec_id : null });
      runs.push({
        runId,
        status: state.run.status,
        terminal: state.run.status === TERMINAL_STATUS,
        completedAt: typeof run.completed_at === "string" ? run.completed_at : undefined,
        retentionClass: typeof run.retention_class === "string" ? run.retention_class : undefined,
      });
    }
    const eligibility = gcEligibility({ runs, policy: r.policy as RetentionPolicy, now: r.now as string });
    if (r.mode === "preview") return { pruned: [...eligibility.prune], kept: [...eligibility.keep], refusals: [] };
    const pruned: string[] = [];
    const kept = [...eligibility.keep];
    for (const runId of eligibility.prune) {
      const info = byId.get(runId);
      if (info === undefined || store.delete(runRef(runId), info.oid).disposition !== "deleted") {
        kept.push({ runId, reason: "cas_mismatch" });
        continue;
      }
      pruned.push(runId);
      // Owner decision 2: drop the spec index only when it points at this run.
      if (info.specId !== null && isProcessString(info.specId)) {
        const specRef = `${SPECS_PREFIX}${info.specId}`;
        const index = store.read(specRef);
        if (index !== null) {
          try {
            const entry: unknown = JSON.parse(index.files["index.json"] ?? "");
            if ((entry as { run_id?: unknown } | null)?.run_id === runId) store.delete(specRef, index.oid);
          } catch {
            /* unreadable index stays */
          }
        }
      }
    }
    return { pruned, kept, refusals: [] };
  } catch (error) {
    return { pruned: [], kept: [], refusals: [{ kind: "invalid_input", detail: error instanceof Error ? error.message : String(error) }] };
  }
}
