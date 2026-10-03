import type { GitRefStore, MaterializedSnapshot } from "./git-ref-store.ts";

const ACTIVE_REF = "refs/factory/active";

export interface LeaseRecord {
  readonly run_id: string;
  readonly holder_id: string;
  // OI-18: the holder process's pid, so a stale lease is PROVABLY stale
  // (signal-0 probe) instead of assumed so. Optional so leases written before
  // this field still parse — those stay unprovable and are never force-cleared.
  readonly holder_pid?: number;
  readonly surface: string;
  readonly workflow_run_id?: string;
  readonly acquired_at: string;
}

export type AcquireLeaseResult =
  | {
      readonly disposition: "acquired";
      readonly oid: string;
      readonly lease: LeaseRecord;
    }
  | {
      readonly disposition: "run_in_progress";
      readonly current: { readonly oid: string; readonly lease: LeaseRecord };
    };

export type ReleaseLeaseResult =
  | { readonly disposition: "released" }
  | {
      readonly disposition: "cas_mismatch";
      readonly current: { readonly oid: string; readonly lease: LeaseRecord } | null;
    };

// Diverges from kernel/guards.ts isRecord: additionally requires a plain
// prototype (Object.prototype or null), so it stays local.
function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return [Object.prototype, null].includes(Object.getPrototypeOf(value));
}

function isWellFormedString(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.charCodeAt(index);
    if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (index + 1 >= value.length || next < 0xdc00 || next > 0xdfff) {
        return false;
      }
      index += 1;
    } else if (codePoint >= 0xdc00 && codePoint <= 0xdfff) {
      return false;
    }
  }
  return true;
}

function isSafeString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    isWellFormedString(value) &&
    !/[\0-\x1f\x7f]/.test(value)
  );
}

function validateLease(value: unknown): LeaseRecord {
  if (!isRecord(value)) throw new Error("Lease record is malformed");

  const expectedKeys = ["acquired_at", "holder_id", "run_id", "surface"];
  if (Object.hasOwn(value, "workflow_run_id")) expectedKeys.push("workflow_run_id");
  if (Object.hasOwn(value, "holder_pid")) expectedKeys.push("holder_pid");
  expectedKeys.sort();

  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key !== "string")) {
    throw new Error("Lease record has missing or unknown fields");
  }
  const actualKeys = (ownKeys as string[]).sort();
  if (
    actualKeys.length !== expectedKeys.length ||
    actualKeys.some((key, index) => key !== expectedKeys[index])
  ) {
    throw new Error("Lease record has missing or unknown fields");
  }

  if (
    !isSafeString(value.run_id) ||
    !isSafeString(value.holder_id) ||
    !isSafeString(value.surface) ||
    !isSafeString(value.acquired_at) ||
    Number.isNaN(Date.parse(value.acquired_at)) ||
    new Date(value.acquired_at).toISOString() !== value.acquired_at ||
    (Object.hasOwn(value, "workflow_run_id") && !isSafeString(value.workflow_run_id)) ||
    (Object.hasOwn(value, "holder_pid") &&
      !(Number.isSafeInteger(value.holder_pid) && (value.holder_pid as number) > 0))
  ) {
    throw new Error("Lease record contains invalid values");
  }

  return {
    run_id: value.run_id,
    holder_id: value.holder_id,
    ...(value.holder_pid === undefined ? {} : { holder_pid: value.holder_pid as number }),
    surface: value.surface,
    // OI-15: narrow through the predicate rather than relying on the guard
    // above. That guard is `hasOwn(...) && !isSafeString(...)` inside a throwing
    // `if`, which rejects a bad value at runtime but tells the type system
    // nothing here — so the field arrived as `{} | null | undefined`. Same
    // check, same rejected inputs; the narrowing is now visible.
    ...(isSafeString(value.workflow_run_id) ? { workflow_run_id: value.workflow_run_id } : {}),
    acquired_at: value.acquired_at,
  };
}

function materializeLease(
  snapshot: MaterializedSnapshot | null,
): { readonly oid: string; readonly lease: LeaseRecord } | null {
  if (snapshot === null) return null;
  if (Object.keys(snapshot.files).length !== 1 || !Object.hasOwn(snapshot.files, "lease.json")) {
    throw new Error("Lease snapshot is incomplete or contains unknown records");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(snapshot.files["lease.json"]);
  } catch {
    throw new Error("Lease snapshot contains invalid JSON");
  }
  const lease = validateLease(parsed);
  if (JSON.stringify(lease) !== snapshot.files["lease.json"]) {
    throw new Error("Lease snapshot is not canonical");
  }
  return { oid: snapshot.oid, lease };
}

function assertStoreMethod(
  store: unknown,
  method: "create" | "delete",
): asserts store is GitRefStore {
  if (!isRecord(store) || typeof store[method] !== "function") {
    throw new Error("Git ref store is malformed");
  }
}

export function acquireLease(
  store: GitRefStore,
  input: unknown,
): AcquireLeaseResult {
  assertStoreMethod(store, "create");
  const lease = validateLease(input);
  const result = store.create(ACTIVE_REF, {
    "lease.json": JSON.stringify(lease),
  });
  if (result.disposition === "created") {
    return { disposition: "acquired", oid: result.oid, lease };
  }
  if (result.disposition !== "cas_mismatch") {
    throw new Error("Lease acquisition returned an invalid disposition");
  }

  const current = materializeLease(result.current);
  if (current === null) {
    throw new Error("Lease acquisition failed without a current holder");
  }
  return { disposition: "run_in_progress", current };
}

export function releaseLease(
  store: GitRefStore,
  expectedOid: string,
): ReleaseLeaseResult {
  assertStoreMethod(store, "delete");
  const result = store.delete(ACTIVE_REF, expectedOid);
  if (result.disposition === "deleted") return { disposition: "released" };
  if (result.disposition !== "cas_mismatch") {
    throw new Error("Lease release returned an invalid disposition");
  }
  return {
    disposition: "cas_mismatch",
    current: materializeLease(result.current),
  };
}

// P37 amendment-6 review MINOR 2: `factory abandon` holds the singleton lease
// for an orphan sweep when no single run id resolves, so the lease's run_id can
// be this LABEL rather than a run. Every message that renders a lease holder
// goes through describeLeaseRun, or it prints "run orphan-sweep is already held
// by ..." and sends an operator hunting for a run by that name. The `run` vs
// sweep collision is the one operators actually hit.
export const ORPHAN_SWEEP_LEASE = "orphan-sweep";

export function describeLeaseRun(runId: string): string {
  return runId === ORPHAN_SWEEP_LEASE ? "an orphan sweep" : `run ${runId}`;
}

// OI-18: is the lease's recorded holder process still alive?
//   true  — a process with that pid exists (or we lack permission to signal
//           it, which still means SOMETHING live holds the pid): never clear.
//   false — signal-0 raised ESRCH: provably no such process; safe to clear.
//   null  — the lease predates holder_pid: unprovable, never force-cleared.
// ponytail: pid reuse after a reboot reads a stranger's process as "alive"
// and refuses to clear — the safe direction; a boot-scoped identity is the
// upgrade path if that refusal is ever hit in practice.
export function leaseHolderAlive(lease: LeaseRecord): boolean | null {
  if (lease.holder_pid === undefined) return null;
  try {
    process.kill(lease.holder_pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "ESRCH" ? false : true;
  }
}
