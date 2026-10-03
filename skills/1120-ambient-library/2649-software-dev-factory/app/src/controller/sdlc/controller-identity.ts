import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

// Packet controller-pin-run-record (LIM-05): the identity of the controller
// that governs a run. A parked run is resumed by whatever controller code is
// on disk when verdict or a re-entered run executes; without a recorded
// identity, a self-build run can be completed by different controller code
// than the code that governed it. This module computes that identity so it can
// be pinned on every park record (drive.ts) and re-verified at verdict and
// re-entry (verdict.ts, drive.ts) — refusal on drift lives at those seams,
// not here: this module only answers "who is running".
//
// The surface is exactly what a process of this controller loads at startup:
// the code root (src/**, recursive), the role packages
// (.ailib/factory/roles/**, recursive — buildRoleStages silently omits a stage
// whose package fails validation, so a digest over code alone would miss
// exactly that hazard), and the provenance lock (the one pinned file, not the
// upstream tree it pins — a changed upstream file without a lock change
// already fails validateRolePackage closed). All three resolve from THIS
// module's import.meta.url, never process.cwd(): a drive into a throwaway
// fixture repository must hash this controller, not the target.
const CONTROLLER_ROOT = fileURLToPath(new URL("../../..", import.meta.url));

const DIGEST_ROOTS: readonly string[] = [
  "src",
  join(".ailib", "factory", "roles"),
];
const LOCK_FILE = join(".agents", "skills", "factory-bootstrap", "source-lock.yaml");

export interface ControllerIdentity {
  // 64-hex sha256 over the pinned surface: sorted repository-relative paths,
  // hashed as a path/content chain. No mtimes, no environment input, no walk
  // outside the pinned roots — the cost and the value are both bounded to the
  // code surface, not the target repository.
  readonly digest: string;
  // 40-hex HEAD of the controller checkout, null when the controller root is
  // not a git checkout (an installed distro bundle). The digest is the
  // always-present identity; the commit disambiguates the dirty-working-tree
  // case (same commit, different bytes) for an operator reading both fields.
  readonly commit: string | null;
}

// The chain's exact byte layout is not observable without re-implementing it;
// what IS pinned by tests is its consequences — stability across processes,
// across environment changes, across mtime-only changes, and movement when
// content under any pinned root changes. Layout: for each sorted relative
// path, `path \0 content \0`. Paths cannot contain NUL, so the framing is
// unambiguous.
function digestOfSurface(): string {
  const files: string[] = [];
  const collect = (rootRelative: string): void => {
    let entries;
    try {
      entries = readdirSync(join(CONTROLLER_ROOT, rootRelative), { withFileTypes: true });
    } catch {
      // A missing root contributes nothing: an installed bundle without the
      // roles tree still has a stable identity over what is present.
      return;
    }
    for (const entry of entries) {
      const relative = `${rootRelative}/${entry.name}`;
      if (entry.isDirectory()) collect(relative);
      else if (entry.isFile()) files.push(relative);
    }
  };
  for (const root of DIGEST_ROOTS) collect(root);
  const lock = statSync(join(CONTROLLER_ROOT, LOCK_FILE));
  if (lock.isFile()) files.push(LOCK_FILE);
  files.sort();

  const hash = createHash("sha256");
  for (const relative of files) {
    hash.update(relative, "utf8");
    hash.update("\0");
    hash.update(readFileSync(join(CONTROLLER_ROOT, relative)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

const OID_PATTERN = /^[0-9a-f]{40}$/;

// HEAD of the controller's own checkout, named by git itself rather than
// re-implemented here (packet controller-pin-resolution-1). A hand-rolled
// reader of .git/HEAD, gitdir files, commondir, loose refs, and packed-refs
// is a second implementation of git's repository-layout contract, and it
// disagreed with git on shapes git itself writes (a relative gitdir pointer).
// Git is already a factory runtime dependency (the kernel spawns it for the
// authority store), so the oracle costs one bounded `rev-parse` per identity
// computation. Resolved on EVERY call — never cached — because the factory
// can move HEAD during self-hosted work between two calls.
function commitOfCheckout(): string | null {
  try {
    const proc = spawnSync("git", ["-C", CONTROLLER_ROOT, "rev-parse", "HEAD"], {
      encoding: "utf8",
    });
    // Fail closed on every way this can go wrong: an unspawnable git
    // (proc.error, e.g. no git on PATH), a signal, a nonzero exit (an unborn
    // HEAD, a non-checkout), or output that is not exactly one 40-hex object
    // id. Anything less certain than git's own answer yields null — the
    // commit is the disambiguator, not the identity, so an unresolvable
    // checkout degrades to a digest-only pin rather than refusing the run
    // (and never a guessed or stale commit).
    if (proc.error !== undefined || proc.status !== 0) return null;
    const head = proc.stdout.trim();
    return OID_PATTERN.test(head) ? head : null;
  } catch {
    return null;
  }
}

export function computeControllerIdentity(): ControllerIdentity {
  return { digest: digestOfSurface(), commit: commitOfCheckout() };
}

// ---------------------------------------------------------------------------
// The pin/drift vocabulary shared by the two seams that enforce it (drive.ts
// re-entry, verdict.ts). Kept here so both refuse on — and record — exactly
// the same shape.
// ---------------------------------------------------------------------------

// The owner override. Honored only when the value is exactly "1": a present
// but unrecognized value still refuses. Stopgap by spec — unsigned and
// ambient, to be retired by an envelope-shaped override in kernel approval
// validation — which is why every use is recorded with the deciding
// principal, not merely the fact that it happened.
export const CONTROLLER_DRIFT_OVERRIDE_ENV = "FACTORY_ALLOW_CONTROLLER_DRIFT";

export function controllerDriftOverrideActive(): boolean {
  return process.env[CONTROLLER_DRIFT_OVERRIDE_ENV] === "1";
}

// The pin a park record carries, as a digest: null when the record has no pin
// field. A record with no pin never refuses — it predates the field, and the
// run that ships this spec is one of them (its record is written by pre-pin
// code while its verdict runs post-pin code). Absent means pre-pin, not
// untrustworthy. A malformed pin (not 64-hex) reads the same way: pin
// presence is evidence of post-pin authorship, not a tamper seal.
export function recordedControllerDigest(record: Record<string, unknown>): string | null {
  const controller: unknown = record.controller;
  if (typeof controller !== "object" || controller === null || Array.isArray(controller)) {
    return null;
  }
  const digest: unknown = (controller as Record<string, unknown>).digest;
  return typeof digest === "string" && /^[0-9a-f]{64}$/.test(digest) ? digest : null;
}

// What a drift refusal names, and everything it may name: the two digests and
// the override env-var name. No absolute paths, no environment values — house
// redaction style; a reason that must be safe to print anywhere carries
// nothing but hex and fixed text.
export function controllerDriftReason(recordedDigest: string, runningDigest: string): string {
  return (
    `controller drift: this run was parked by controller digest ${recordedDigest} ` +
    `but the running controller computes digest ${runningDigest} — different controller ` +
    `code is governing the run than the code that parked it. ` +
    `Set ${CONTROLLER_DRIFT_OVERRIDE_ENV}=1 to override; every override is recorded ` +
    `in the run record with both digests and the deciding principal`
  );
}

// The recorded override: never silent. Carries both digests so the period
// stays auditable, and the principal from the run's approval policy so the
// record says WHO decided, not merely that it happened.
export interface ControllerDriftRecord {
  readonly recorded_digest: string;
  readonly running_digest: string;
  readonly overridden: true;
  readonly principal: string;
}

export function controllerDriftRecord(
  recordedDigest: string,
  runningDigest: string,
  principal: string,
): ControllerDriftRecord {
  return {
    recorded_digest: recordedDigest,
    running_digest: runningDigest,
    overridden: true,
    principal,
  };
}
