import { randomUUID } from "node:crypto";

import { createKernelRegistries } from "../kernel/registries.ts";
import { isProcessSafe } from "../kernel/guards.ts";
import { acquireLease, releaseLease, ORPHAN_SWEEP_LEASE } from "../kernel/state/lease.ts";
import { openGitRefStore, type GitRefStore } from "../kernel/state/git-ref-store.ts";
import {
  CANDIDATE_EFFECT,
  PULL_REQUEST_EFFECT,
  markPrReady,
  type CandidateRecord,
} from "./effects/pull-request.ts";
import { SDLC_EFFECTS, SDLC_PREDICATES, SDLC_ROLES } from "./lifecycle.ts";
import { deriveApprovedSpecPlan, type DeriveApprovedSpecPlanRequest } from "./spec.ts";

// Packet P06: programmatic `factory start --spec` spine (FR-K4). Approval →
// run create-or-reuse → lease → candidate effect via the kernel registry →
// release. All state lives under refs/factory/* in the target repository.

export interface StartRequest extends DeriveApprovedSpecPlanRequest {
  readonly repositoryPath: string;
  readonly holderId: string;
  readonly surface: string;
  readonly candidateEndpoint: unknown;
}

export type StartResult =
  | { readonly disposition: "candidate_ready"; readonly runId: string; readonly candidate: CandidateRecord }
  // OI-10 (P37): the run exists and is PARKED — resumable state, not a finished
  // candidate and not invalid state. Carries no candidate: the parked record's
  // candidate is stale evidence of an attempt that did not earn it.
  | { readonly disposition: "reentered"; readonly runId: string }
  | { readonly disposition: "run_in_progress"; readonly runId: string; readonly holderId: string }
  | { readonly disposition: "rejected"; readonly reason: string };

interface RunRecord {
  readonly run_id: string;
  readonly spec_id: string;
  readonly spec_digest: string;
  // "intake" | "candidate_ready" from this module; "parked" (drive.ts persistPark)
  // and "complete" (verdict.ts) are written by the stages downstream of it.
  readonly status: string;
  readonly candidate?: CandidateRecord;
}


function specRef(specId: string): string {
  return `refs/factory/specs/${specId}`;
}

function runRef(runId: string): string {
  return `refs/factory/runs/${runId}`;
}

function parseJson(files: Readonly<Record<string, string>>, name: string): Record<string, unknown> {
  const text = files[name];
  if (typeof text !== "string") throw new Error(`state ref is missing ${name}`);
  const parsed: unknown = JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${name} is not a record`);
  }
  return parsed as Record<string, unknown>;
}

const SPEC_DIGEST_CONFLICT = "A different spec digest already owns this spec_id";

function mintRun(
  specId: string,
  specDigest: string,
  store: GitRefStore,
): { readonly runId: string; readonly runRefName: string; readonly oid: string } {
  const runId = randomUUID();
  const runRefName = runRef(runId);
  const minted = store.create(runRefName, {
    "run.json": JSON.stringify({ run_id: runId, spec_id: specId, spec_digest: specDigest, status: "intake" }),
  });
  if (minted.disposition !== "created") throw new Error("run ref collision on a freshly minted run id");
  return { runId, runRefName, oid: minted.oid };
}

// Amendment-4 review MINOR: check the result, and survive a throw. After four
// rounds in which an ignored delete result WAS the blocking defect, this was the
// last unchecked one. A leaked ref here is recoverable — `abandon`'s sweep clears
// run refs naming this spec that no index points at — so report the leak rather
// than failing the run.
function retractRun(store: GitRefStore, runRefName: string, oid: string, specId: string): void {
  let retracted = false;
  try {
    retracted = store.delete(runRefName, oid).disposition === "deleted";
  } catch {
    retracted = false;
  }
  if (!retracted) {
    process.stderr.write(
      `factory: could not retract run ref ${runRefName} after losing the spec-index race; ` +
        `run \`factory abandon --spec\` for ${specId} to clear it\n`,
    );
  }
}

// A terminally failed run is the ONLY shape supersession accepts. Both failure
// paths — drive.ts persistPark and verdict.ts:586-594 — record status "parked"
// with disposition "failed"; status "parked" is kept deliberately so a genuinely
// recoverable run is not stranded, and NO code path here ever writes status
// "failed". A missing ref or a malformed run.json returns false: fail closed.
function isTerminalFailed(store: GitRefStore, indexedRunId: unknown): boolean {
  if (!isProcessSafe(indexedRunId)) return false;
  const snapshot = store.read(runRef(indexedRunId as string));
  if (snapshot === null) return false;
  let record: Record<string, unknown>;
  try {
    record = parseJson(snapshot.files, "run.json");
  } catch {
    return false;
  }
  return record.status === "parked" && record.disposition === "failed";
}

// §4: re-triggers of the same approved digest are idempotent (same run).
// refs/factory/specs/<spec_id> is the digest → run_id index; created once by CAS.
//
// P37 amendment-3 review B1-R3: the run ref is published BEFORE the index that
// points at it. The original order left a window — index written here, run ref
// not created until after the lease was taken — in which a concurrent
// `factory abandon` saw an index whose run ref did not exist, read that as a
// dangling index, and cleared it. The stalled start() then created its run ref
// into a world with no index: an orphan, no way to resolve it, and
// `factory verdict` permanently undisambiguatable. That is the original OI-10
// B1 terminal state, and it survived three amendments because `abandon` was
// patched and this ordering was not. Publishing the ref first makes "an index
// exists" imply "its run ref exists", which is what `abandon` (and
// persistPark's fail-closed park) already assumed.
function resolveRunId(store: GitRefStore, specId: string, specDigest: string): string {
  const ref = specRef(specId);
  if (store.read(ref) === null) {
    const { runId, runRefName, oid } = mintRun(specId, specDigest, store);
    const created = store.create(ref, {
      "spec.json": JSON.stringify({ spec_id: specId, spec_digest: specDigest, run_id: runId }),
    });
    if (created.disposition === "created") return runId;
    // Lost the index race to a concurrent start. We are the ONLY owner of the
    // ref we just minted (a fresh uuid nothing else has seen), so retracting it
    // is safe — and leaving it would be the orphan this ordering exists to
    // prevent. Then fall through and use the run the winner recorded.
    // Amendment-4 review MINOR: check the result, and survive a throw. After
    // four rounds in which an ignored delete result WAS the blocking defect,
    // this was the last unchecked one. A leaked ref here is recoverable —
    // `abandon`'s sweep clears run refs naming this spec that no index points
    // at — so report the leak rather than failing the run.
    retractRun(store, runRefName, oid, specId);
  }
  const index = store.read(ref);
  const current = parseJson(index?.files ?? {}, "spec.json");
  if (current.spec_digest !== specDigest) {
    // OI-63: reject -> revise -> rerun is the loop's normal path. If the indexed
    // run is terminally failed, release the binding IN PLACE rather than forcing
    // `abandon --spec`, which deletes the rejected run's evidence ref and breaks
    // the spec ref's ancestry (the diverged-refs the publisher rejects). Anything
    // else — a live run, a missing or unreadable run record — still fails closed:
    // absence of evidence is not evidence of termination, and rebinding a LIVE
    // run's spec_id would orphan the lease-holder.
    // ponytail: supersession only; spec_superseded parking (§4) is a later packet.
    if (index === null || !isTerminalFailed(store, current.run_id)) {
      throw new Error(SPEC_DIGEST_CONFLICT);
    }
    const { runId, runRefName, oid } = mintRun(specId, specDigest, store);
    const swapped = store.compareAndSwap(ref, index.oid, {
      "spec.json": JSON.stringify({ spec_id: specId, spec_digest: specDigest, run_id: runId }),
    });
    if (swapped.disposition === "advanced") return runId;
    // Lost the race to a concurrent start that superseded first. Retract the run
    // we minted — we are its only owner — so a cas_mismatch never leaves an
    // orphan, then defer to the winner exactly as the create path does.
    retractRun(store, runRefName, oid, specId);
    const winner = parseJson(store.read(ref)?.files ?? {}, "spec.json");
    if (winner.spec_digest !== specDigest) throw new Error(SPEC_DIGEST_CONFLICT);
    if (!isProcessSafe(winner.run_id)) throw new Error("spec index has no run_id");
    return winner.run_id;
  }
  if (!isProcessSafe(current.run_id)) throw new Error("spec index has no run_id");
  return current.run_id;
}

function createRegistries() {
  const registries = createKernelRegistries();
  for (const p of SDLC_PREDICATES) registries.predicates.register(p);
  for (const r of SDLC_ROLES) registries.roles.register(r);
  // lifecycle.ts still carries the unavailable placeholder; P06 owns the real effect.
  for (const e of SDLC_EFFECTS) if (e.name !== CANDIDATE_EFFECT) registries.effects.register(e);
  registries.effects.register(PULL_REQUEST_EFFECT);
  return registries;
}

function run(request: StartRequest): StartResult {
  const plan = deriveApprovedSpecPlan(request);
  if (!isProcessSafe(request.repositoryPath)) throw new Error("Repository path is malformed");
  if (!isProcessSafe(request.holderId) || !isProcessSafe(request.surface)) {
    throw new Error("holderId and surface are required");
  }

  const store = openGitRefStore(request.repositoryPath);
  const runId = resolveRunId(store, plan.specId, plan.specDigest);
  const ref = runRef(runId);

  const lease = acquireLease(store, {
    run_id: runId,
    holder_id: request.holderId,
    holder_pid: process.pid,
    surface: request.surface,
    acquired_at: new Date().toISOString(),
  });
  if (lease.disposition === "run_in_progress") {
    // P37 amendment-7 review MINOR 2: the lease's run_id may be `abandon`'s
    // orphan-sweep LABEL rather than a run. Never emit it in a public runId
    // field — a caller would take it for a run that does not exist.
    const heldRun = lease.current.lease.run_id;
    return {
      disposition: "run_in_progress",
      runId: heldRun === ORPHAN_SWEEP_LEASE ? "" : heldRun,
      holderId: lease.current.lease.holder_id,
    };
  }

  try {
    // P37 amendment-4 review B1-R4: re-read the index NOW THAT THE LEASE IS
    // HELD. The index was resolved before the lease, so a `factory abandon` that
    // held the lease in between may have cleared the pair — and `store.create`
    // below would cheerfully re-publish the run ref into a world with no index,
    // the exact converse of the persistPark resurrection. The invariant that
    // makes abandon safe is not "an index never exists without its run", it is
    // "a run ref is never published into a world where its index is gone".
    const indexNow = store.read(specRef(plan.specId));
    const indexRunId =
      indexNow === null ? null : (parseJson(indexNow.files, "spec.json").run_id as unknown);
    if (indexRunId !== runId) {
      // Amendment-5 review MINOR: say so. If this run minted the ref moments ago
      // it is still there, recoverable by `abandon`'s sweep but otherwise
      // invisible — the same warning resolveRunId's retract already emits.
      process.stderr.write(
        `factory: run ${runId} was abandoned while this run waited for the lease; ` +
          `if refs/factory/runs/${runId} survives, run \`factory abandon --spec\` for ${plan.specId} to clear it\n`,
      );
      throw new Error(`state_invalid: run ${runId} was abandoned while this run waited for the lease`);
    }

    const initial: RunRecord = { run_id: runId, spec_id: plan.specId, spec_digest: plan.specDigest, status: "intake" };
    const created = store.create(ref, { "run.json": JSON.stringify(initial) });
    let oid: string;
    let record: RunRecord;
    if (created.disposition === "created") {
      oid = created.oid;
      record = initial;
    } else {
      if (created.current === null) throw new Error("run ref vanished");
      oid = created.current.oid;
      record = parseJson(created.current.files, "run.json") as unknown as RunRecord;
    }
    if (record.run_id !== runId || record.spec_digest !== plan.specDigest) {
      throw new Error("run ref does not match its spec index");
    }

    // L-037: state read back from refs is untrusted; recompute a stored
    // candidate from its own claimed (runId, specId, attempt) and require an
    // exact match.
    // P37 review M2: this integrity check runs BEFORE the status branch, so it
    // covers a PARKED record too. Until this amendment, `reentered` returned
    // first and a forged candidate on a parked record was never revalidated by
    // any live path — it rode the park through review and verdict.ts promoted
    // it verbatim into `status: complete`.
    let storedCandidate: CandidateRecord | null = null;
    if (record.candidate !== undefined) {
      const stored = record.candidate as Partial<CandidateRecord>;
      const expected = markPrReady({
        runId,
        specId: plan.specId,
        attempt: stored.attempt as number,
        endpoint: request.candidateEndpoint,
      });
      // Amendment-review MINOR: `endpoint` comes from the REQUEST here, so a
      // programmatic caller re-entering a parked run with a different endpoint
      // is refused rather than re-entered. Correct fail-closed behaviour, and
      // unreachable from the CLI, which always passes {kind:"simulated"}.
      if (JSON.stringify(stored) !== JSON.stringify(expected)) {
        // ponytail: reject, not repair; state_invalid parking is a later packet.
        throw new Error("state_invalid: stored candidate record fails revalidation");
      }
      storedCandidate = expected;
    }

    // OI-10 (P37): a PARKED run is re-enterable, not bricked. Key this on the
    // recorded STATUS, never on the mere presence of `candidate`: persistPark
    // deliberately carries the candidate into the park (drive.ts P20-F1), and
    // dropping it there brings back the clobber that fix closed. Returning
    // before the candidate effect is what keeps the honest park intact — with
    // or without a stale (but verified) candidate attached to it.
    if (record.status === "parked") {
      return { disposition: "reentered", runId };
    }

    // Reconcile-by-lookup (§9.1): duplicate delivery reuses the stored record.
    if (storedCandidate !== null) {
      if (record.status !== "candidate_ready") {
        // P37 review MINOR: a COMPLETE run is finished, not corrupt. OI-10's
        // message blamed the candidate for every non-candidate_ready status,
        // which sent operators hunting for corruption that was not there.
        throw new Error(
          record.status === "complete"
            ? `state_invalid: run ${runId} is already complete; \`factory abandon --spec\` it to run this spec again`
            : `state_invalid: run record status ${JSON.stringify(record.status)} cannot carry a candidate`,
        );
      }
      return { disposition: "candidate_ready", runId, candidate: storedCandidate };
    }

    const effect = createRegistries().effects.get(CANDIDATE_EFFECT);
    if (effect === undefined) throw new Error("candidate effect is not registered");
    const candidate = effect.execute({
      runId,
      specId: plan.specId,
      attempt: 1,
      endpoint: request.candidateEndpoint,
    }) as CandidateRecord;

    const next: RunRecord = { ...record, status: "candidate_ready", candidate };
    const advanced = store.compareAndSwap(ref, oid, { "run.json": JSON.stringify(next) });
    if (advanced.disposition !== "advanced") throw new Error("run ref advanced concurrently; reload and retry");
    return { disposition: "candidate_ready", runId, candidate };
  } finally {
    releaseLease(store, lease.oid);
  }
}

export async function start(request: unknown): Promise<StartResult> {
  try {
    return run(request as StartRequest);
  } catch (error) {
    // Fail closed: no spawn or validation error escapes the public seam.
    return { disposition: "rejected", reason: error instanceof Error ? error.message : String(error) };
  }
}
