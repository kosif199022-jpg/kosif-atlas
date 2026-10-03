import assert from "node:assert/strict"
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { test } from "node:test"

import {
  archiveFinished,
  archiveClaim,
  readHistory,
  readJSON,
  saveState,
  TaskRecords,
  writeJSON,
} from "../scripts/agent-state.mjs"
import { fileDigest, assertTrackedTask } from "../scripts/agent-tracker.mjs"

async function fixture(t) {
  const local = await mkdtemp(resolve(tmpdir(), "workspace-agent-state-"))
  t.after(() => rm(local, { recursive: true, force: true }))
  return local
}
const session = (id, runId, status = "closed") => ({
  id,
  runId,
  status,
  endedAt: "2026-01-01T00:00:00Z",
})
const empty = () => ({ schemaVersion: 1, sessions: {}, runs: {}, claims: {} })

test("released claims preserve exact ownership outside active state and replay after finalization retry", async (t) => {
  const local = await fixture(t)
  const claim = {
    id: "claim-one",
    task: "TASK-1",
    session: "oak-one",
    scopes: ["src"],
    baseline: { repositories: {} },
    outcome: "paused",
    snapshots: { ".": { fingerprint: "exact-hash" } },
    finalization: { error: "interrupted" },
  }
  await archiveClaim(local, claim, { id: "run-one" })
  claim.finalization = { commit: "finished" }
  await archiveClaim(local, claim, { id: "run-one" })
  const receipt = await readHistory(local, "claims", claim.id)
  assert.equal(receipt.claim.finalization, undefined)
  assert.deepEqual(receipt.snapshots, [{ fingerprint: "exact-hash" }])
  claim.baseline.repositories.changed = true
  await assert.rejects(archiveClaim(local, claim, { id: "run-one" }), /conflict/)
})

test("archives completed history larger than 10 MB without retaining an index in active state", async (t) => {
  const local = await fixture(t)
  const state = empty()
  for (let i = 0; i < 180; i++) {
    state.runs[`run-${i}`] = { id: `run-${i}`, authorization: "e".repeat(60000) }
    state.sessions[`worker-${i}`] = session(`worker-${i}`, `run-${i}`)
  }
  assert.ok(Buffer.byteLength(JSON.stringify(state)) > 10_000_000)
  state.runs.live = { id: "live" }
  state.sessions.author = session("author", "live", "active")
  state.sessions.reviewer = session("reviewer", "live")
  const next = await saveState(local, state, new TaskRecords(local))
  assert.deepEqual(Object.keys(next.runs), ["live"])
  assert.deepEqual(Object.keys(next.sessions), ["author", "reviewer"])
  assert.ok(Buffer.byteLength(await readFile(resolve(local, "state.json"))) < 1000)
  assert.equal((await readdir(resolve(local, "history/runs"))).length, 180)
  assert.deepEqual(await readHistory(local, "runs", "run-42"), state.runs["run-42"])
  assert.deepEqual(await readHistory(local, "sessions", "worker-42"), state.sessions["worker-42"])
  // Unrelated historical corruption cannot affect normal saves or be loaded by them.
  await writeFile(resolve(local, "history/runs/run-42.json"), "broken historical file")
  assert.deepEqual(await saveState(local, next, new TaskRecords(local)), next)
})

test("unresolved claims and their reviewer identities are never archived, regardless of age or terminal flags", async (t) => {
  const local = await fixture(t)
  const state = empty()
  state.runs.r1 = { id: "r1" }
  state.runs.r2 = { id: "r2" }
  state.sessions.author = session("author", "r1")
  state.sessions.reviewer = session("reviewer", "r2")
  state.claims["TASK-1"] = {
    session: "author",
    phase: "finalizing",
    reviews: { hash: { session: "reviewer" } },
  }
  assert.equal(await archiveFinished(local, state), state)
  delete state.sessions.author
  await assert.rejects(archiveFinished(local, state), /missing session/)
})

test("a stopped reviewer remains in active state until the entire run closes", async (t) => {
  const local = await fixture(t)
  const state = empty()
  state.runs.r1 = { id: "r1" }
  state.sessions.author = session("author", "r1", "active")
  state.sessions.reviewer = session("reviewer", "r1")
  assert.equal(await archiveFinished(local, state), state)
  state.sessions.author.status = "closed"
  const next = await archiveFinished(local, state)
  assert.deepEqual(next, empty())
  assert.equal((await readHistory(local, "sessions", "reviewer")).runId, "r1")
})

test("interrupted archival preserves terminal state and replays immutable copies before removing references", async (t) => {
  const local = await fixture(t)
  const state = empty()
  state.runs.r1 = { id: "r1" }
  state.sessions.author = session("author", "r1")
  await mkdir(resolve(local, "history"))
  await writeFile(resolve(local, "history/sessions"), "fixture obstacle")
  await assert.rejects(saveState(local, state, new TaskRecords(local)), /EEXIST|ENOTDIR/)
  const persisted = await readJSON(resolve(local, "state.json"))
  assert.deepEqual(persisted, state)
  assert.deepEqual(await readHistory(local, "runs", "r1"), state.runs.r1)
  await rm(resolve(local, "history/sessions"))
  // Simulate a second interruption after archive publication, before compact state.
  await archiveFinished(local, persisted)
  assert.deepEqual(await readJSON(resolve(local, "state.json")), state)
  assert.deepEqual(await saveState(local, persisted, new TaskRecords(local)), empty())
  assert.equal((await readHistory(local, "sessions", "author")).endedAt, state.sessions.author.endedAt)
})

test("conflicting history blocks removal and malformed history IDs cannot escape its directory", async (t) => {
  const local = await fixture(t)
  const state = empty()
  state.runs.r1 = { id: "r1", authorization: "actual" }
  state.sessions.author = session("author", "r1")
  await writeJSON(resolve(local, "history/runs/r1.json"), { id: "r1", authorization: "other" })
  await assert.rejects(saveState(local, state, new TaskRecords(local)), /conflict/)
  assert.deepEqual(await readJSON(resolve(local, "state.json")), state)
  assert.equal((await readHistory(local, "runs", "r1")).authorization, "other")
  await assert.rejects(readHistory(local, "runs", "../../state"), /exact run/)
})

test("task records load only the addressed task and preserve pending/hash provenance across sessions", async (t) => {
  const local = await fixture(t)
  const task = { path: "task.md" }
  await writeFile(resolve(local, task.path), "known bytes")
  const entry = {
    path: task.path,
    hash: fileDigest(local, task.path),
    pending: false,
    eligible: true,
    baseline: { repositories: {} },
  }
  const store = new TaskRecords(local)
  await store.import({ [task.path]: entry })
  await writeFile(store.path("unrelated.md"), "unrelated malformed record")
  const run = await store.context({ repositories: [] }, task)
  assert.deepEqual(Object.keys(run.tracker), [task.path])
  assert.doesNotThrow(() => assertTrackedTask({ root: local, run, task }))
  run.tracker[task.path].pending = true
  await store.flush()
  const later = new TaskRecords(local)
  const context = await later.context({ repositories: [] }, task)
  assert.throws(() => assertTrackedTask({ root: local, run: context, task }), /outside the recorded writer/)
  context.tracker[task.path].pending = false
  await later.flush()
  const final = await new TaskRecords(local).context({ repositories: [] }, task)
  assert.doesNotThrow(() => assertTrackedTask({ root: local, run: final, task }))
  await writeFile(resolve(local, task.path), "unknown bytes")
  assert.throws(() => assertTrackedTask({ root: local, run: final, task }), /outside the recorded writer/)
})

test("initial task-ledger split can replay identical files but refuses conflicting provenance", async (t) => {
  const local = await fixture(t)
  const entry = { path: "task.md", hash: "first", pending: true }
  const store = new TaskRecords(local)
  await store.import({ [entry.path]: entry })
  await store.import({ [entry.path]: entry })
  await assert.rejects(store.import({ [entry.path]: { ...entry, hash: "unknown" } }), /conflict/)
  assert.deepEqual(await readJSON(store.path(entry.path)), entry)
})
