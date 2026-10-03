import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import { strengthenedRepositories, assertLegacyReceipts, restoreOwnedBaseline } from "../scripts/agent-handoff.mjs"
import {
  ASSISTED,
  resolveSelection,
  newRun,
  joinRun,
  runLimit,
  gateLabels,
  assertCommitPolicy,
  assertEvidence,
} from "../scripts/agent-policy.mjs"

const config = JSON.parse(await readFile(new URL("./fixtures/workspace.json", import.meta.url), "utf8"))

test("check refresh adds real checks without changing existing checks or repository policy", () => {
  const first = { name: "first", command: ["node", "check.mjs"] }
  const second = { name: "second", command: ["node", "test.mjs"] }
  const old = [{ path: ".", readOnly: false, purpose: "original", checks: [first] }]
  const incoming = [{ ...old[0], purpose: "changed", checks: [first, second] }]
  const next = strengthenedRepositories(old, incoming, ".")
  assert.deepEqual(next[0].checks, [first, second])
  assert.equal(next[0].purpose, "original")
  assert.deepEqual(old[0].checks, [first])
  for (const checks of [
    [],
    [second],
    [{ ...first, command: ["true"] }],
    [first, first],
    [first, { name: "bad", command: [] }],
  ])
    assert.throws(() => strengthenedRepositories(old, [{ ...old[0], checks }], "."))
  assert.throws(
    () =>
      strengthenedRepositories([{ ...old[0], checks: [first, second] }], [{ ...old[0], checks: [second, first] }], "."),
    /reorder/
  )
  assert.throws(() => strengthenedRepositories(old, [{ ...incoming[0], readOnly: true }], "."))
  assert.throws(() => strengthenedRepositories(old, incoming, "other"))
  assert.deepEqual(strengthenedRepositories([{ path: ".", readOnly: false }], incoming, ".")[0].checks, [first, second])
})

test("legacy recovery requires matching original claim and snapshot CLI receipts", () => {
  const claim = { id: "fixture", task: "TASK-1" }
  const snapshot = { fingerprint: "fixture-output" }
  const receipt = {
    claim,
    snapshots: [snapshot],
    source: "Synthetic test tool outputs",
    receipts: [
      { command: "node agents.mjs claim --task TASK-1", output: JSON.stringify(claim) },
      { command: "node agents.mjs snapshot --task TASK-1", output: JSON.stringify(snapshot) },
    ],
  }
  assert.doesNotThrow(() => assertLegacyReceipts(receipt))
  assert.throws(() => assertLegacyReceipts({ ...receipt, source: "" }))
  assert.throws(() => assertLegacyReceipts({ ...receipt, receipts: receipt.receipts.slice(1) }))
  assert.throws(() => assertLegacyReceipts({ ...receipt, snapshots: [{ fingerprint: "invented" }] }))
})

test("handoff rejects mismatched identities, unauthorized tasks, changed boundaries, and absent proof", () => {
  const repositories = [{ path: ".", readOnly: false, checks: [] }]
  const claim = { id: "claim-one", task: "TASK-1", session: "source", scopes: ["src"], repositories }
  const args = {
    root: "/unused",
    task: "TASK-1",
    scopes: ["src"],
    baseline: {},
    receipt: { claim, snapshots: [] },
    previousRun: { id: "old", allowedTasks: ["TASK-1"], repositories },
    previousSession: { id: "source", runId: "old", status: "closed" },
    run: { repositories },
  }
  assert.throws(() => restoreOwnedBaseline(args), /No exact snapshots/)
  assert.throws(() => restoreOwnedBaseline({ ...args, task: "TASK-2" }), /matching stopped source/)
  assert.throws(
    () => restoreOwnedBaseline({ ...args, previousRun: { ...args.previousRun, allowedTasks: ["TASK-2"] } }),
    /outside/
  )
  assert.throws(
    () => restoreOwnedBaseline({ ...args, previousRun: { ...args.previousRun, completedTasks: ["TASK-1"] } }),
    /Completed/
  )
  assert.throws(
    () => restoreOwnedBaseline({ ...args, previousSession: { ...args.previousSession, runId: "other" } }),
    /matching stopped source/
  )
  assert.throws(
    () => restoreOwnedBaseline({ ...args, run: { repositories: [{ path: ".", readOnly: true }] } }),
    /boundaries/
  )
  assert.throws(
    () => restoreOwnedBaseline({ ...args, previousRun: { ...args.previousRun, repositories: [] } }),
    /recorded source run/
  )
})
const unattended = () => resolveSelection(config, { profile: "unattended" })
const scopedRun = (selection = unattended()) =>
  newRun(selection, {
    coordinator: "lead",
    allowedTasks: ["TASK-1", "TASK-2"],
    authorization: "User: implement these tasks unattended, local commits",
    repositories: config.repositories,
  })

test("named-agent and profile precedence is explicit override, agent default, project default", () => {
  const changed = structuredClone(config)
  changed.executionPolicy.defaultProfile = "unattended"
  assert.equal(resolveSelection(changed, { agent: "Goku" }).profileName, "assisted")
  assert.equal(resolveSelection(changed, { agent: "GOKU", profile: "unattended" }).profileName, "unattended")
  assert.equal(resolveSelection(changed, { agent: "birch" }).profileName, "unattended")
  assert.equal(resolveSelection(config, { agent: "goku" }).policy.commits, "on-request")
  assert.throws(() => resolveSelection(config, { agent: "vegeta" }), /Unknown agent/)
})

test("profiles have independent controls and run snapshots do not mutate other sessions", () => {
  const selection = resolveSelection(config, { profile: "unattended", commits: "never" })
  const run = scopedRun(selection)
  selection.policy.commits = "automatic"
  config.executionPolicy.profiles.unattended.maxTasks = 11
  assert.equal(run.policy.commits, "never")
  assert.equal(run.policy.maxTasks, 10)
  config.executionPolicy.profiles.unattended.maxTasks = 10
  const solo = resolveSelection(config, { commits: "automatic", review: "self" })
  assert.equal(solo.policy.delegation, "single")
  assert.equal(solo.policy.commits, "automatic")
  assert.throws(() => resolveSelection(config, { "max-agents": "3" }), /Single-agent/)
  assert.throws(() => resolveSelection(config, { review: "independent" }), /separate reviewer/)
})

test("executionPolicy must be explicitly configured", () => {
  const missing = structuredClone(config)
  delete missing.executionPolicy
  assert.throws(() => resolveSelection(missing), /Missing or invalid executionPolicy/)
  for (const executionPolicy of [null, [], "assisted"])
    assert.throws(() => resolveSelection({ ...config, executionPolicy }), /Missing or invalid executionPolicy/)
})

test("automatic runs require explicit authorization and a bounded task set", () => {
  assert.throws(() => newRun(unattended(), { coordinator: "lead", allowedTasks: ["TASK-1"] }), /authorization/)
  assert.throws(() => newRun(unattended(), { coordinator: "lead", authorization: "Run unattended" }), /scope/)
  const run = scopedRun()
  assert.equal(runLimit(run, "TASK-99"), "TASK-99 is outside the authorized run scope.")
  run.policy.maxTasks = 1
  run.touchedTasks.push("TASK-1")
  assert.match(runLimit(run, "TASK-2"), /task limit/)
  assert.equal(runLimit(run, "TASK-1"), null)
  assert.match(runLimit(run, "TASK-1", Date.parse(run.startedAt) + run.policy.maxMinutes * 60000), /time limit/)
})

test("worker joins inherit policy and enforce counts including coordinator and reviewer", () => {
  const run = scopedRun()
  const sessions = { lead: { id: "lead", runId: run.id, status: "active" } }
  joinRun(run, sessions)
  assert.throws(() => joinRun(run, sessions, { commits: "automatic" }), /inherit/)
  sessions.worker = { id: "worker", runId: run.id, status: "active" }
  sessions.reviewer = { id: "reviewer", runId: run.id, status: "active" }
  assert.throws(() => joinRun(run, sessions), /agent limit/)
  sessions.reviewer.status = "closed"
  joinRun(run, sessions)
  sessions.lead.status = "closed"
  assert.throws(() => joinRun(run, sessions), /coordinator/)
})

test("human labels stay gates regardless of execution profile", () => {
  assert.deepEqual(
    gateLabels({
      labels: ["workspace", "needs-review", "needs-decision", "needs-human-review", "approval-required", "blocked"],
    }),
    ["needs-decision", "needs-human-review", "approval-required", "blocked"]
  )
  const run = scopedRun()
  assertCommitPolicy(run)
  run.policy.commits = "never"
  assert.throws(() => assertCommitPolicy(run, "User asked"), /disabled/)
  run.policy.commits = "on-request"
  assert.throws(() => assertCommitPolicy(run), /explicit/)
  assertCommitPolicy(run, "User explicitly said commit this task")
})

test("evidence must match the exact snapshot and independent author identity", () => {
  const run = scopedRun()
  const snapshot = { fingerprint: "content-v2" }
  const claim = {
    session: "author",
    verification: { fingerprint: "content-v2", passed: true },
    review: { session: "reviewer", fingerprint: "content-v2", verdict: "pass" },
  }
  const sessions = { author: { runId: run.id }, reviewer: { runId: run.id } }
  assertEvidence(run, claim, snapshot, sessions)
  assert.throws(() => assertEvidence(run, claim, { fingerprint: "content-v3" }, sessions), /exact snapshot/)
  claim.review.session = "author"
  assert.throws(() => assertEvidence(run, claim, snapshot, sessions), /different/)
  claim.review.session = "reviewer"
  sessions.reviewer.runId = "another-run"
  assert.throws(() => assertEvidence(run, claim, snapshot, sessions), /authorized run/)
  run.policy = { ...ASSISTED }
  claim.review.session = "author"
  assertEvidence(run, claim, snapshot, sessions)
})
