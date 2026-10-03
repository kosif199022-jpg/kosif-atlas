import { randomUUID } from "node:crypto";

import type { AdapterSurface } from "../kernel/adapters/types.ts";
import { validateApproval, type LocalApprovalPolicy } from "../kernel/approval.ts";
import { checkTargetFreshness, evaluateEvidenceManifest } from "../kernel/evidence/manifest.ts";
import { isRecord } from "../kernel/guards.ts";
import { openGitRefStore, type GitRefStore } from "../kernel/state/git-ref-store.ts";
import {
  computeIntegratedDiffDigest,
  parked,
  UNMINTABLE_HUMAN_TOKENS,
  type DriveStageWorker,
  type DriveTrailEntry,
} from "./drive.ts";
import { agentVerdictDigest, reviewRequirement } from "./agent-verdict.ts";
import {
  computeControllerIdentity,
  controllerDriftOverrideActive,
  controllerDriftReason,
  controllerDriftRecord,
  recordedControllerDigest,
  type ControllerDriftRecord,
} from "./controller-identity.ts";
import { appendRunEvent, countRunEvents } from "./events.ts";
import { publishCandidateRef, type CandidateRefResult } from "./candidate-ref.ts";
import { markPrReady, type CandidateRecord } from "./effects/pull-request.ts";
import { SDLC_LIFECYCLE } from "./lifecycle.ts";
import { walkLifecycle } from "./lifecycle-walk.ts";
import { runStage } from "./run-stage.ts";

// Packet P19: accept a human review verdict and resume a parked run to a
// reviewed candidate (FR-K7 resume; FR-K2 verdict-as-approval-record). A P18
// drive parks needs_owner:approve_review at review with
// reviewer.review-verdict-approved unmet. acceptVerdict is the ONLY source of
// that token, and only from a kernel-validated approval envelope whose
// subject_kind is "review_verdict" and whose subject_digest equals the digest
// of the integrated diff the reviewer actually read (stale-diff protection).
// The resume reuses the same runStage/walkLifecycle mechanics as drive.ts —
// no second lifecycle, no retry, one stage at a time, fail-closed.
//
// Packet P20 hardening: when the drive left a durable park record under
// refs/factory/runs/<runId> (FR-K8), that record — not the caller — is the
// authority. The integrated-diff digest is recomputed from the repository and
// a disagreeing caller claim is rejected; resume tokens derive from the
// recorded satisfied set, never from caller-supplied priorSatisfied; a
// validated approve envelope is recorded durably in the run ref; and a
// replayed event_id is rejected before anything runs again.

// The one gate only a human reviewer may satisfy (review's H requirement).
const HUMAN_REVIEW_GATE = "reviewer.review-verdict-approved";

// OI-15: widened for the same reason as drive.ts's copy — every lookup here
// takes a stage name read out of a durable run record or a walk result, i.e. an
// arbitrary string, not a literal.
const STAGE_NAMES: readonly string[] = SDLC_LIFECYCLE.map((s) => s.stage);
const REVIEW_INDEX = STAGE_NAMES.indexOf("review");

// The unmintable rule is drive.ts's F2 set, imported so both loops strip the
// same tokens: grader output can never mint an unconditional human-class
// token. Here the only tokens that survive the strip are the ones carried in
// from the parked run plus the reviewer token granted from the validated
// envelope.

export interface VerdictSidecar {
  readonly path: string;
  readonly envelope: unknown;
}

export interface VerdictRequest {
  readonly repositoryPath: string;
  readonly runId: string;
  readonly surface: string;
  // Gate tokens satisfied when the P18 drive parked. P20: used only when no
  // durable park record exists; a recorded run overrides this entirely.
  readonly priorSatisfied: readonly string[];
  // 40-hex digest of the integrated diff the reviewer read; the envelope must
  // be bound to exactly this, and (P20) it must equal the digest recomputed
  // from the repository when a durable park record exists.
  readonly integratedDiffDigest: string;
  readonly verdictSidecar: VerdictSidecar;
  readonly policy: LocalApprovalPolicy;
  readonly stages: Readonly<Record<string, DriveStageWorker>>;
  // C5 packet 3a: the owner's contest reason. Required (non-empty) when the
  // owner's verdict disagrees with the standing review_agent decision; refused
  // when present with nothing to contest. Default null. The CLI flag is 3b.
  readonly contest?: string | null;
}

export interface VerdictStatus {
  readonly disposition: "complete" | "failed" | "recorded";
  readonly stage: string;
  readonly missing: readonly string[];
  readonly reason?: string;
  // C9 packet 1: outcome of the post-approval candidate-ref delivery. Never
  // changes `disposition` — a failed push is reported, not raised.
  readonly candidate_ref?: CandidateRefResult;
}

export interface VerdictResult {
  readonly trail: readonly DriveTrailEntry[];
  readonly status: VerdictStatus;
}


// ---------------------------------------------------------------------------
// FR-K10/OI-21: controller-owned candidate gate. On a governance:"controller"
// run the candidate stage's three predicates are granted FROM the durable run
// record's recorded evidence — the kernel evidence manifest — never from
// worker/agent text (the same P32 rule drive.ts applies to baseline/quality/
// reconcile). Worker-governed fixture runs keep the defer-to-worker seam.
// ---------------------------------------------------------------------------

const CANDIDATE_PRIOR = "candidate.prior-gates-complete";
const CANDIDATE_EVIDENCE = "candidate.evidence-complete";
const CANDIDATE_FRESH = "candidate.target-fresh";

// The §10 approval-critical evidence classes a governed park record carries.
const REQUIRED_EVIDENCE = ["red-proof", "green-suite", "quality-profile"] as const;

function asSha(value: unknown): string | null {
  return typeof value === "string" && /^[0-9a-f]{40}$/.test(value) ? value : null;
}

function controllerCandidateTokens(
  record: Record<string, unknown>,
  satisfiedWithoutCandidate: ReadonlySet<string>,
): { tokens: readonly string[]; reason?: string } {
  const tokens: string[] = [];

  // Prior gates: with candidate's own tokens set aside, the walk must block
  // exactly at candidate — every earlier stage's gate fully satisfied.
  if (walkLifecycle(satisfiedWithoutCandidate).blockedAt === "candidate") {
    tokens.push(CANDIDATE_PRIOR);
  }

  // Evidence completeness (evaluateEvidenceManifest): the record's red/green
  // commits and quality verdict are the required capabilities; the recorded
  // criterion→evidence map covers every recorded criterion. Missing fields
  // simply produce no entry and fail closed as "missing"/"unmapped".
  const parkedAt = typeof record.parked_at === "string" ? record.parked_at : null;
  const entries: unknown[] = [];
  const redSha = asSha(record.red_sha);
  const greenSha = asSha(record.green_sha);
  const entry = (capability: string, kind: string, digest: string | null): void => {
    if (digest === null || parkedAt === null) return;
    entries.push({ capability, kind, producedAt: parkedAt, digest, approvalCritical: true });
  };
  entry("red-proof", "commit", redSha);
  entry("green-suite", "commit", greenSha);
  if (isRecord(record.quality_evidence) && record.quality_evidence.passed === true) {
    entry("quality-profile", "report", greenSha);
  }
  const verdict = evaluateEvidenceManifest({
    now: new Date().toISOString(),
    requiredCapabilities: [...REQUIRED_EVIDENCE],
    criteria: Array.isArray(record.criterion_ids) ? record.criterion_ids : [],
    criterionMap: Array.isArray(record.criterion_map) ? record.criterion_map : [],
    entries,
  });
  if (verdict.ready) tokens.push(CANDIDATE_EVIDENCE);

  // Target freshness (checkTargetFreshness): in Kernel v1 the base is frozen
  // under the run lease and no separate movable target ref exists, so the
  // "current" target head is the recorded base snapshot — the same pinned
  // tautology as drive.ts runControllerReconcile (OI-2). A record with no
  // valid base_sha fails closed to "reconcile".
  const base = asSha(record.base_sha);
  if (checkTargetFreshness({ recordedTargetHead: base, currentTargetHead: base }).fresh) {
    tokens.push(CANDIDATE_FRESH);
  }

  return {
    tokens,
    reason: verdict.ready
      ? undefined
      : `evidence incomplete: ${verdict.failed
          .map((f) => `${f.subject} (${f.reason})`)
          .join(", ")}`,
  };
}

// Authoritative sidecar location for a run's review verdict, mirroring the
// spec-approval convention in spec.ts (`.aai/specs/<spec_id>.approval.json`).
// The run name is the runId without its attempt suffix (`invoice-rounding:1`
// → `invoice-rounding`).
function expectedSidecarPath(runId: string): string {
  const runName = runId.split(":")[0] ?? "";
  return `.aai/runs/${runName}/review-verdict.approval.json`;
}

// P20: the drive's durable park record, when one exists. Absence (no repo, no
// ref, unreadable record) falls back to the pre-P20 caller-supplied contract —
// there is nothing recorded to be more honest than.
interface DurableRun {
  readonly store: GitRefStore;
  readonly ref: string;
  readonly oid: string;
  readonly record: Record<string, unknown>;
}

function readDurableRun(repositoryPath: string, runId: string): DurableRun | null {
  try {
    const store = openGitRefStore(repositoryPath);
    const ref = `refs/factory/runs/${runId}`;
    const snapshot = store.read(ref);
    if (snapshot === null) return null;
    const text = snapshot.files["run.json"];
    if (typeof text !== "string") return null;
    const parsed: unknown = JSON.parse(text);
    if (!isRecord(parsed)) return null;
    return { store, ref, oid: snapshot.oid, record: parsed };
  } catch {
    return null;
  }
}

async function accept(request: VerdictRequest): Promise<VerdictResult> {
  const trail: DriveTrailEntry[] = [];

  // controller-pin-reject-gate: the drift gate is ONE gate at the entry of the
  // durable-record path, not a branch-local check. It originally lived on the
  // approve path only, which left the reject branch — a durable-record writer
  // in its own right — honoring a verdict tendered by controller code
  // different from the code that parked the run; the class defect is "two
  // paths, one gate", so the gate moved to before either branch diverges. It
  // runs BEFORE the reject branch's binding validation: a drifted caller
  // learns of the drift — the more diagnostic fact — whether or not the
  // envelope is bound, and before any CAS write of review_verdict or
  // disposition, so a refused run stays parked and decidable and the owner's
  // decision is not spent. The durable run is read here once and shared by
  // both branches.
  const durable = readDurableRun(request.repositoryPath, request.runId);
  // controller-pin-run-record: set when the record's pin drifted and the owner
  // overrode the refusal; written onto every record write below (the reject
  // write included) so the override is recorded, never silent.
  let controllerDrift: ControllerDriftRecord | null = null;
  // controller-pin-run-record (LIM-05): the record's pin names the
  // controller that parked this run; the running controller must be it.
  // A record with no pin field never refuses: pre-pin records predate the
  // field, and the run that ships this spec is one of them (its record is
  // written by pre-pin code while its verdict runs post-pin code). Drift is
  // judged on the DIGEST alone — `controller.commit` disambiguates a dirty
  // working tree for an operator, but same content is same controller.
  if (durable !== null) {
    const pinnedDigest = recordedControllerDigest(durable.record);
    if (pinnedDigest !== null) {
      const running = computeControllerIdentity();
      if (pinnedDigest !== running.digest) {
        if (!controllerDriftOverrideActive()) {
          return parked(trail, "review", [], {
            disposition: "failed",
            missing: [HUMAN_REVIEW_GATE],
            reason: controllerDriftReason(pinnedDigest, running.digest),
          });
        }
        controllerDrift = controllerDriftRecord(
          pinnedDigest,
          running.digest,
          request.policy.localOperatorPrincipal,
        );
      }
    }
  }

  // C5 packet 1: who may tender a verdict is gated by `review_requirement`. A
  // malformed value fails closed for EVERY verdict — owner included — before
  // either branch runs, so the refusal is byte-identical (no write).
  const requirement = reviewRequirement(request.repositoryPath);
  if (requirement === "invalid") {
    return parked(trail, "review", [], {
      disposition: "failed",
      missing: [HUMAN_REVIEW_GATE],
      reason: `.aai/policy/factory.yaml: review_requirement must be "human" or "both"`,
    });
  }

  // C5 packet 1: a `review_agent` verdict is RECORDED beside the owner's
  // without advancing the run — only under `both` mode, only bound to this run
  // record. It never mints HUMAN_REVIEW_GATE and never touches status /
  // disposition / stage / satisfied / review_verdict: the write spreads the
  // record and overrides `verdicts` alone. Placed before the reject branch so
  // it owns both agent decisions (approve and reject).
  const tendered = request.verdictSidecar?.envelope;
  if (isRecord(tendered) && tendered.principal === "review_agent") {
    if (requirement !== "both") {
      return parked(trail, "review", [], {
        disposition: "failed",
        missing: [HUMAN_REVIEW_GATE],
        reason: `review_requirement is not "both", so a review_agent verdict cannot be recorded`,
      });
    }
    // A parked run always carries a durable record here (the CLI addresses it
    // from the ref store); a missing one fails closed through the outer catch,
    // so no null branch is carried.
    const record = durable!.record;
    if (tendered.auth_source !== "controller_invocation") {
      return parked(trail, "review", [], {
        disposition: "failed",
        missing: [HUMAN_REVIEW_GATE],
        reason: "review_agent verdict auth_source must be controller_invocation",
      });
    }
    // C5 packet 2: fail closed on every malformed envelope field the mint
    // fixes — one table so a wrong subject_kind/decision/policy_version/
    // canonicalization_version is refused by name, not recorded verbatim.
    const fieldChecks: ReadonlyArray<readonly [string, boolean]> = [
      ["subject_kind", tendered.subject_kind !== "review_verdict"],
      ["decision", tendered.decision !== "approve" && tendered.decision !== "reject"],
      ["policy_version", tendered.policy_version !== request.policy.policyVersion],
      ["canonicalization_version", tendered.canonicalization_version !== 1],
    ];
    const badField = fieldChecks.find(([, failed]) => failed);
    if (badField !== undefined) {
      return parked(trail, "review", [], {
        disposition: "failed",
        missing: [HUMAN_REVIEW_GATE],
        reason: `review_agent verdict ${badField[0]} is invalid`,
      });
    }
    if (tendered.subject_digest !== agentVerdictDigest(record)) {
      return parked(trail, "review", [], {
        disposition: "failed",
        missing: [HUMAN_REVIEW_GATE],
        reason: "review_agent verdict subject_digest is not bound to this run record",
      });
    }
    const priorVerdicts = Array.isArray(record.verdicts) ? record.verdicts : [];
    if (priorVerdicts.some((v) => (v as { event_id?: unknown }).event_id === tendered.event_id)) {
      return parked(trail, "review", [], {
        disposition: "failed",
        missing: [HUMAN_REVIEW_GATE],
        reason: `review_agent verdict event_id ${String(tendered.event_id)} is already recorded in verdicts[]`,
      });
    }
    durable!.store.compareAndSwap(durable!.ref, durable!.oid, {
      "run.json": JSON.stringify({ ...record, verdicts: [...priorVerdicts, tendered] }),
    });
    return {
      trail,
      status: { disposition: "recorded", stage: "review", missing: [HUMAN_REVIEW_GATE] },
    };
  }

  // C5 packet 3a: an owner (local_operator) verdict that DISAGREES with the
  // standing agent decision must carry a `--contest` reason; a contest with
  // nothing to contest is refused. Checked once here — after the review_agent
  // branch, before any write below — so a refusal leaves the record
  // byte-identical. When honored, `contestFields` (built once) is spread into
  // every owner write. The standing decision is the last `review_agent` entry
  // in the recorded verdicts[]; absent key / no such entry → no standing.
  let contestFields: Record<string, unknown> = {};
  {
    const ownerTendered = request.verdictSidecar?.envelope;
    const contest = typeof request.contest === "string" ? request.contest : null;
    const hasContest = contest !== null && contest !== "";
    if (isRecord(ownerTendered) && ownerTendered.principal === request.policy.localOperatorPrincipal) {
      const verdicts =
        durable !== null && Array.isArray(durable.record.verdicts) ? durable.record.verdicts : [];
      let agentEntry: Record<string, unknown> | null = null;
      for (let i = verdicts.length - 1; i >= 0; i -= 1) {
        const v = verdicts[i];
        if (isRecord(v) && v.principal === "review_agent") {
          agentEntry = v;
          break;
        }
      }
      const standing = agentEntry === null ? null : agentEntry.decision;
      const decision = ownerTendered.decision;
      // (a) standing exists and differs, no non-empty contest → refuse.
      if (standing !== null && standing !== decision && !hasContest) {
        return parked(trail, "review", [], {
          disposition: "failed",
          missing: [HUMAN_REVIEW_GATE],
          reason: `owner verdict "${String(decision)}" disagrees with the standing review_agent decision "${String(standing)}"; pass --contest "<reason>" to record the override`,
        });
      }
      // (b) contest with nothing to contest (no standing, or it agrees) → refuse.
      if (hasContest && (standing === null || standing === decision)) {
        return parked(trail, "review", [], {
          disposition: "failed",
          missing: [HUMAN_REVIEW_GATE],
          reason: `--contest given but there is nothing to contest`,
        });
      }
      // (c) honored disagreement: record the contest beside the agent verdict.
      if (hasContest) {
        contestFields = {
          review_contest: {
            reason: contest,
            contested_event_id: agentEntry!.event_id,
            decision,
          },
        };
      }
    }
  }

  // A reject verdict is a legitimate reviewer decision, not a malformed
  // envelope, so it branches before the kernel validator (which only ever
  // accepts decision "approve"): park the run failed at review, no resume.
  const envelope = request.verdictSidecar?.envelope;
  if (isRecord(envelope) && envelope.decision === "reject") {
    // F2 (P19 review): a reject is honored only when the envelope is bound to
    // this run's subject — same kind, same integrated-diff digest, same
    // principal — otherwise an unauthenticated blob could park the run.
    const bound =
      envelope.subject_kind === "review_verdict" &&
      envelope.subject_digest === request.integratedDiffDigest &&
      envelope.principal === request.policy.localOperatorPrincipal &&
      envelope.policy_version === request.policy.policyVersion;
    if (!bound) {
      return parked(trail, "review", [], {
        disposition: "failed",
        missing: [HUMAN_REVIEW_GATE],
        reason: "reject verdict not bound to this run's integrated diff and policy",
      });
    }
    // OI-41: the check above compares two values the CALLER supplied — the
    // envelope's `subject_digest` and `request.integratedDiffDigest` — so a
    // caller handing in a digest matching their own envelope authenticated a
    // reject without the repository ever being consulted, while an approve on
    // the same subject is authenticated against the recorded objects (OI-20).
    // Recompute from the record's own `green_sha` and refuse a reject the
    // record does not vouch for. With NO readable record there is nothing to be
    // more honest than, so the caller-supplied comparison above stands alone.
    // The record is the entry read above — drift-gated there before this
    // branch's binding validation ran.
    if (durable !== null) {
      const recordedGreen = asSha(durable.record.green_sha);
      let recomputed: string;
      try {
        recomputed =
          recordedGreen === null
            ? computeIntegratedDiffDigest(request.repositoryPath)
            : computeIntegratedDiffDigest(request.repositoryPath, recordedGreen);
      } catch (error) {
        // OI-56: an unverifiable recorded commit vouches for nothing, so this
        // still refuses — but it is a DIFFERENT failure from a digest that was
        // computed and disagreed. Collapsing both into the mismatch sentence
        // below asserted a comparison that never happened and sent the operator
        // to check an envelope when the commit was the problem. Same two-case
        // split the approve path already makes.
        return parked(trail, "review", [], {
          disposition: "failed",
          missing: [HUMAN_REVIEW_GATE],
          reason: `run's recorded green commit is not verifiable: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
      if (envelope.subject_digest !== recomputed) {
        return parked(trail, "review", [], {
          disposition: "failed",
          missing: [HUMAN_REVIEW_GATE],
          reason:
            "reject verdict is not bound to the integrated diff recomputed from this run's recorded green commit",
        });
      }
    }
    // Record the rejection. OI-21 made a post-review park write the record;
    // that fix lives inside the resume loop, which a reject returns before
    // ever entering, so the decision that said no was returned and never
    // written down — the run kept reading `parked / needs_owner at review`,
    // indistinguishable from one nobody had answered.
    //
    // Gated on the SAME record-state check the approve path applies below,
    // because this branch returns BEFORE that guard: an ungated write here
    // rewrote a COMPLETED run to parked/review/failed and replaced its
    // accepted approve envelope with this reject one. The gate covers the
    // WRITE only — the returned rejection is unchanged on every input.
    //
    // Shape follows OI-21's park: CAS against the oid the record was read at,
    // best-effort, `status` still "parked" so the CLI's parked-run lookup
    // still finds the run for rework, and `parked_at` / `base_sha` / evidence
    // fields carried through untouched for OI-23's compatibility check.
    if (
      durable !== null &&
      durable.record.status === "parked" &&
      durable.record.disposition === "needs_owner" &&
      durable.record.stage === "review"
    ) {
      try {
        durable.store.compareAndSwap(durable.ref, durable.oid, {
          "run.json": JSON.stringify({
            ...durable.record,
            review_verdict: envelope,
            disposition: "failed",
            // C5 packet 3a: mirror the completion write — append the owner
            // envelope to verdicts[] only when the key already holds an agent
            // verdict, so a `both`-mode owner reject yields [...prior, owner].
            ...(Array.isArray(durable.record.verdicts)
              ? { verdicts: [...durable.record.verdicts, envelope] }
              : {}),
            ...contestFields,
            ...(controllerDrift === null ? {} : { controller_drift: controllerDrift }),
          }),
        });
      } catch {
        // ponytail: swallowed like the neighbouring writes — the owner's
        // decision is already returned; bookkeeping must not fail it.
      }
    }
    return parked(trail, "review", [], {
      disposition: "failed",
      missing: [HUMAN_REVIEW_GATE],
      reason: "reviewer rejected the verdict",
    });
  }

  // P20: the recorded run — not the caller — is the resume authority; read
  // once at the entry above, drift-gated there, and shared with the reject
  // branch that has already returned by this point.
  let priorSatisfied: readonly string[] = request.priorSatisfied;
  if (durable !== null) {
    const record = durable.record;

    // P37 amendment-review M2-R: revalidate a stored candidate BEFORE the
    // verdict can promote it. `acceptVerdict` never calls start(), so start()'s
    // integrity check does not cover this path: the completion write below
    // spreads `...durable.record` into `status: "complete"`, carrying whatever
    // candidate the record holds verbatim. A forged candidate on a parked
    // record reached a completed run through documented commands alone.
    // L-037: recompute against the identity the CALLER and the RECORD supply,
    // never the candidate's own claims. Amendment-2 review M2-R2: spreading
    // `...stored` made this self-consistency only — `candidateKey` hashes
    // [runId, specId, stage, attempt], so a candidate naming a different run and
    // a different spec recomputed to its own forged key and completed at exit 0.
    // `attempt` is the one field with no external source; start.ts trusts it the
    // same way, and it does not carry identity.
    // Fail closed: a run whose durable state does not survive revalidation is
    // not completable, and a run at review with NO candidate never earned one.
    {
      const stored = record.candidate;
      let valid = false;
      try {
        const expected = markPrReady({
          runId: request.runId,
          specId: record.spec_id as string,
          attempt: (stored as CandidateRecord).attempt,
          endpoint: { kind: (stored as CandidateRecord).endpoint },
        });
        valid = JSON.stringify(stored) === JSON.stringify(expected);
      } catch {
        valid = false;
      }
      if (!valid) {
        return parked(trail, "review", [], {
          disposition: "failed",
          missing: [HUMAN_REVIEW_GATE],
          reason:
            record.candidate === undefined
              ? `state_invalid: run ${request.runId} has no candidate record to complete`
              : `state_invalid: run ${request.runId} carries a candidate record that fails revalidation`,
        });
      }
    }

    // Replay protection (FR-K2): an event_id already recorded as accepted for
    // this run never runs anything again.
    const priorVerdict = isRecord(record.review_verdict) ? record.review_verdict : null;
    const eventId = isRecord(envelope) ? envelope.event_id : undefined;
    if (priorVerdict !== null && typeof eventId === "string" && priorVerdict.event_id === eventId) {
      return parked(trail, "review", [], {
        disposition: "failed",
        missing: [HUMAN_REVIEW_GATE],
        reason: `verdict event_id ${eventId} was already accepted for this run (replay rejected)`,
      });
    }

    // The recorded park must actually be awaiting the reviewer. A run recorded
    // failed at an earlier stage (or already complete) cannot be resumed by
    // fabricated tokens or a fresh envelope.
    if (record.status !== "parked" || record.disposition !== "needs_owner" || record.stage !== "review") {
      return parked(trail, "review", [], {
        disposition: "failed",
        missing: [HUMAN_REVIEW_GATE],
        reason: `recorded run state (${String(record.disposition)} at ${String(record.stage)}) is not a needs_owner park at review`,
      });
    }

    // The drift gate lived here until controller-pin-reject-gate hoisted it
    // to the entry above: a check that only this path paid for was a check
    // the reject branch did not pay, and the reject branch writes the record
    // too. Ordering relative to validateApproval and the envelope CAS write
    // is unchanged — it is still strictly before both.

    // FR-K7: the digest is computed from the repository; a caller-claimed
    // digest that merely matches its own envelope is rejected.
    // OI-20: recompute from the run's RECORDED green commit, not live HEAD, so
    // a parked run stays signable across unrelated commits. The anti-tamper
    // property survives: the diff is re-derived from the recorded objects, and
    // a recorded commit that vanished or a diff that changed still refuses —
    // now with a reason that names which of the two happened.
    const recordedGreen = asSha(record.green_sha);
    let computed: string;
    try {
      computed =
        recordedGreen === null
          ? computeIntegratedDiffDigest(request.repositoryPath)
          : computeIntegratedDiffDigest(request.repositoryPath, recordedGreen);
    } catch (error) {
      return parked(trail, "review", [], {
        disposition: "failed",
        missing: [HUMAN_REVIEW_GATE],
        reason: `run's recorded green commit is not verifiable: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
    if (request.integratedDiffDigest !== computed) {
      const recorded =
        typeof record.integrated_diff_digest === "string" ? record.integrated_diff_digest : null;
      return parked(trail, "review", [], {
        disposition: "failed",
        missing: [HUMAN_REVIEW_GATE],
        reason:
          recorded !== null && recorded !== computed
            ? `packet content changed since this run parked: the recorded digest ${recorded} no longer matches the diff recomputed from the run's commits`
            : "claimed integrated-diff digest does not match the diff recomputed from the run's recorded commits (stale or forged claim)",
      });
    }

    // OI-23: refuse UP FRONT when the record predates fields the candidate gates
    // now require, instead of accepting the verdict and failing a later gate.
    //
    // The failure mode this replaces: review genuinely advanced and minted
    // `reviewer.review-verdict-approved`, candidate then failed on absent
    // `parked_at` / `base_sha`, and — because a candidate park does not update
    // the durable record — the run was left reading `parked / needs_owner at
    // review`, indistinguishable from one nobody had answered. An owner who
    // decided it again got the identical failure, forever. Unattended automation
    // retrying "if not complete, decide again" loops without ever failing.
    //
    // These two are structural, not judgement: `controllerCandidateTokens`
    // builds every evidence entry through a helper that returns early when
    // `parked_at` is null (so all three required capabilities fail closed), and
    // an absent `base_sha` independently fails `candidate.target-fresh`. A
    // verdict on such a record cannot complete no matter who signs it, so the
    // honest answer is to say so before spending the owner's decision.
    //
    // Refusing is deliberately preferred over migrating: back-filling `parked_at`
    // would fabricate an evidence timestamp that was never recorded.
    const incompatible = [
      ...(typeof record.parked_at === "string" && record.parked_at !== "" ? [] : ["parked_at"]),
      ...(asSha(record.base_sha) === null ? ["base_sha"] : []),
    ];
    if (incompatible.length > 0) {
      return parked(trail, "review", [], {
        disposition: "failed",
        missing: [HUMAN_REVIEW_GATE],
        reason:
          `this run's record predates the candidate gate's required fields ` +
          `(${incompatible.join(", ")}), so it cannot be completed by any verdict. ` +
          `Re-run \`factory run --spec\` to produce a completable record; deciding it again ` +
          `will fail identically.`,
      });
    }

    // Resume tokens derive from the recorded run state, not the caller.
    priorSatisfied = Array.isArray(record.satisfied)
      ? record.satisfied.filter((t): t is string => typeof t === "string")
      : [];
  }

  // Every approve-path validation goes through the kernel validator: exact
  // envelope shape, subject_kind "review_verdict", subject_digest bound to the
  // integrated diff, principal/policy match. Any mismatch throws and the
  // public seam fails closed — stale digests and malformed envelopes land here.
  validateApproval({
    sidecarPath: request.verdictSidecar?.path as string,
    expectedSidecarPath: expectedSidecarPath(request.runId),
    envelope,
    expectedSubjectDigest: request.integratedDiffDigest,
    expectedSubjectKind: "review_verdict",
    policy: request.policy,
  });

  // The validated envelope is the sole evidence behind the reviewer token —
  // the analogue of drive.ts granting owner.spec-approved from the envelope
  // start() validated. Grader output never mints it.
  const granted: ReadonlySet<string> = new Set([...priorSatisfied, HUMAN_REVIEW_GATE]);
  let satisfied: ReadonlySet<string> = granted;

  // The verdict must actually unpark the run: with the reviewer token granted,
  // the walk must be blocked strictly beyond review (or not at all).
  const walk = walkLifecycle(satisfied);
  if (walk.blockedAt !== null && STAGE_NAMES.indexOf(walk.blockedAt) <= REVIEW_INDEX) {
    return parked(trail, "review", [], {
      disposition: "failed",
      missing: walk.missing,
      reason: `run is not resumable: gate unmet at ${walk.blockedAt}`,
    });
  }

  // FR-K2: record the validated approve envelope durably BEFORE anything
  // resumes, so the acceptance is evidenced even if the resume itself fails,
  // and so a replay of the same event_id is refused from the record.
  let durableOid = durable?.oid;
  if (durable !== null) {
    const advanced = durable.store.compareAndSwap(durable.ref, durable.oid, {
      "run.json": JSON.stringify({
        ...durable.record,
        review_verdict: envelope,
        ...contestFields,
        ...(controllerDrift === null ? {} : { controller_drift: controllerDrift }),
      }),
    });
    if (advanced.disposition !== "advanced") {
      return parked(trail, "review", [], {
        disposition: "failed",
        missing: [HUMAN_REVIEW_GATE],
        reason: "run record advanced concurrently; verdict not recorded",
      });
    }
    durableOid = advanced.oid;
  }
  trail.push({ stage: "review", tokens: [HUMAN_REVIEW_GATE], disposition: "advanced" });

  // Resume the remaining stages with the same mechanics as drive.ts.
  for (let index = REVIEW_INDEX + 1; index < STAGE_NAMES.length; index += 1) {
    const stageName = STAGE_NAMES[index]!;
    const worker = request.stages[stageName];
    if (worker === undefined) {
      return parked(trail, stageName, [], {
        disposition: "failed",
        missing: [],
        reason: `no worker injected for stage ${stageName}`,
      });
    }

    let result;
    try {
      result = await runStage({
        role: worker.role,
        roleProcedure: worker.roleProcedure,
        jobContext: worker.jobContext,
        adapter: worker.adapter,
        grade: worker.grade,
        invocation: {
          jobId: `${request.runId}:${stageName}`,
          requestId: randomUUID(),
          surface: request.surface as AdapterSurface,
          workingDirectory: request.repositoryPath,
        },
        priorSatisfied: satisfied,
        // LIM-21: forward the recorded run's mode; no durable record → fixture,
        // never inferred from repository state.
        governance: durable?.record.governance === "controller" ? "controller" : "fixture",
      });
    } catch (error) {
      return parked(trail, stageName, [], {
        disposition: "failed",
        missing: [],
        reason: `stage ${stageName} threw: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    if (result.outcome !== "success") {
      return parked(trail, stageName, [], {
        disposition: "failed",
        missing: result.walk.missing,
        reason: `adapter invocation failed (${result.outcome}) at ${stageName}`,
      });
    }

    let stageTokens = [`agent:${worker.role}`, ...(result.grade?.tokens ?? [])];
    // Strip any human-class token a grader tried to mint (drive.ts F2 rule);
    // only tokens already granted from real evidence survive.
    satisfied = new Set(
      [...result.satisfied].filter((t) => !UNMINTABLE_HUMAN_TOKENS.has(t) || granted.has(t)),
    );
    // FR-K10/OI-21: on a controller-governed run the candidate gate is
    // controller-owned — worker-minted candidate.* tokens are stripped and the
    // three predicates are granted from the durable record's evidence.
    let controllerReason: string | undefined;
    if (stageName === "candidate" && durable !== null && durable.record.governance === "controller") {
      const withoutCandidate: ReadonlySet<string> = new Set(
        [...satisfied].filter((t) => !t.startsWith("candidate.")),
      );
      const controller = controllerCandidateTokens(durable.record, withoutCandidate);
      controllerReason = controller.reason;
      satisfied = new Set([...withoutCandidate, ...controller.tokens]);
      stageTokens = [`agent:${worker.role}`, ...controller.tokens];
    }
    const stageWalk = walkLifecycle(satisfied);

    // Advanced iff the walk is now blocked strictly beyond this stage.
    if (stageWalk.blockedAt === null || STAGE_NAMES.indexOf(stageWalk.blockedAt) > index) {
      trail.push({ stage: stageName, tokens: stageTokens, disposition: "advanced" });
      continue;
    }
    // OI-21: persist the post-review park, so the durable record stops
    // contradicting the trail the command just returned. Before this, a
    // candidate park left the record reading `parked / needs_owner at review` —
    // a run that had genuinely walked past review, with an accepted verdict,
    // still presenting as one nobody had answered.
    //
    // The shape is chosen to be honest WITHOUT blocking anything:
    //   * `status` stays "parked", so the run is still discovered by the CLI's
    //     parked-run lookup and a corrected verdict can still be applied. A
    //     terminal status here would strand a run that is genuinely recoverable.
    //   * `satisfied` keeps the reviewer token, so a re-verdict re-walks from
    //     the same place rather than re-litigating review.
    //   * `parked_at` / `base_sha` / evidence fields are carried through
    //     untouched — OI-23's up-front compatibility check reads them, and
    //     dropping them here would turn a recoverable run into a refused one.
    // Best-effort and CAS-bound, exactly like the completion write below: the
    // verdict is already decided, and bookkeeping must not crash it.
    const parkDisposition = "failed";
    if (durable !== null && durableOid !== undefined) {
      try {
        durable.store.compareAndSwap(durable.ref, durableOid, {
          "run.json": JSON.stringify({
            ...durable.record,
            review_verdict: envelope,
            status: "parked",
            stage: stageName,
            disposition: parkDisposition,
            missing: [...stageWalk.missing],
            satisfied: [...satisfied].sort(),
            ...(controllerReason ?? result.grade?.reason
              ? { reason: controllerReason ?? result.grade?.reason }
              : {}),
            ...contestFields,
            ...(controllerDrift === null ? {} : { controller_drift: controllerDrift }),
          }),
        });
      } catch {
        // ponytail: swallowed for the same reason the completion write is — the
        // returned trail is the verdict; this is evidence bookkeeping.
      }
    }
    return parked(trail, stageName, stageTokens, {
      disposition: parkDisposition,
      missing: stageWalk.missing,
      reason: controllerReason ?? result.grade?.reason,
    });
  }

  const lastStage = STAGE_NAMES[STAGE_NAMES.length - 1]!;

  // FR-K8: the durable record stays honest through completion — the run is no
  // longer parked awaiting review. Best-effort: the verdict evidence above is
  // already durable.
  let candidateRef: CandidateRefResult | undefined;
  if (durable !== null && durableOid !== undefined) {
    const completeRecord = {
      ...durable.record,
      review_verdict: envelope,
      status: "complete",
      stage: lastStage,
      disposition: "complete",
      missing: [],
      satisfied: [...satisfied].sort(),
      // C5 packet 1: append the owner verdict to verdicts[] only when the key
      // already holds a recorded agent verdict; absent key stays byte-identical.
      ...(Array.isArray(durable.record.verdicts)
        ? { verdicts: [...durable.record.verdicts, envelope] }
        : {}),
      ...contestFields,
      ...(controllerDrift === null ? {} : { controller_drift: controllerDrift }),
    };
    let completeOid: string | undefined;
    try {
      const written = durable.store.compareAndSwap(durable.ref, durableOid, {
        "run.json": JSON.stringify(completeRecord),
      });
      if (written.disposition === "advanced") completeOid = written.oid;
    } catch {
      // ponytail: swallowed — completion reporting must not crash on evidence
      // bookkeeping; the accepted verdict is already recorded.
    }

    // C9 packet 1: deliver the candidate ref AFTER the run is durably complete.
    // The ref points at the recorded green commit the reviewer approved; the
    // attempt is the candidate's own. Gated inside publishCandidateRef.
    const greenSha = asSha(durable.record.green_sha);
    const attempt = (durable.record.candidate as CandidateRecord | undefined)?.attempt;
    if (greenSha !== null && typeof attempt === "number") {
      candidateRef = publishCandidateRef(request.repositoryPath, {
        runId: request.runId,
        attempt,
        sha: greenSha,
      });
      if (completeOid !== undefined) {
        try {
          durable.store.compareAndSwap(durable.ref, completeOid, {
            "run.json": JSON.stringify({ ...completeRecord, candidate_ref: candidateRef }),
          });
        } catch {
          // ponytail: swallowed — the returned status carries the result.
        }
      }
    }
  }

  // Every remaining gate satisfied: reviewed_candidate-equivalent completion
  // on the simulated endpoint.
  return {
    trail,
    status: {
      disposition: "complete",
      stage: lastStage,
      missing: [],
      ...(candidateRef === undefined ? {} : { candidate_ref: candidateRef }),
    },
  };
}

// P25's mirror only had one writer (driveRun), so a completed run's log ended
// at run-parked forever. Mirror the resume's trail the same way: one line per
// trail entry, then the run outcome. Best-effort pure output — appended after
// the resume so it can never change the verdict; seq continues the run's
// existing log so the file stays contiguous.
function mirrorResumeTrail(request: unknown, result: VerdictResult): void {
  try {
    const req = request as Partial<VerdictRequest>;
    if (typeof req?.repositoryPath !== "string" || typeof req?.runId !== "string") return;
    if (result.trail.length === 0) return;
    let seq = countRunEvents(req.repositoryPath, req.runId);
    const emit = (kind: "stage-advanced" | "stage-parked" | "run-parked" | "run-complete", stage: string, extra?: { tokens?: readonly string[]; missing?: readonly string[]; disposition?: string }) =>
      appendRunEvent(req.repositoryPath as string, req.runId as string, {
        ts: new Date().toISOString(),
        run_id: req.runId as string,
        seq: seq++,
        stage,
        kind,
        ...extra,
      });
    for (const entry of result.trail) {
      if (entry.disposition === "advanced") emit("stage-advanced", entry.stage, { tokens: entry.tokens });
      else emit("stage-parked", entry.stage, { tokens: entry.tokens, missing: result.status.missing, disposition: result.status.disposition });
    }
    if (result.status.disposition === "complete") emit("run-complete", result.status.stage);
    else emit("run-parked", result.status.stage, { disposition: result.status.disposition });
  } catch {
    // ponytail: swallowed — the mirror is evidence, never the verdict.
  }
}

export async function acceptVerdict(request: unknown): Promise<VerdictResult> {
  try {
    const result = await accept(request as VerdictRequest);
    mirrorResumeTrail(request, result);
    return result;
  } catch (error) {
    // Fail closed at the review gate: no validation or resume error escapes
    // the public seam, and nothing resumes on a bad envelope.
    return {
      trail: [],
      status: {
        disposition: "failed",
        stage: "review",
        missing: [HUMAN_REVIEW_GATE],
        reason: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
