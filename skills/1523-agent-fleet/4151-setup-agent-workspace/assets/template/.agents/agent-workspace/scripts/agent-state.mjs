import { createHash, randomUUID } from "node:crypto"
import { mkdir, readFile, writeFile, rename } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { isDeepStrictEqual } from "node:util"

// Call mutations only under the coordination CLI's shared writer lock.
export async function readJSON(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"))
  } catch (error) {
    if (error.code === "ENOENT" && arguments.length > 1) return fallback
    throw error
  }
}

export async function writeJSON(path, value) {
  await mkdir(dirname(path), { recursive: true })
  const temporary = `${path}.${randomUUID()}.tmp`
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" })
  await rename(temporary, path)
}

function historyPath(local, kind, id) {
  if (!["runs", "sessions", "claims"].includes(kind) || !/^[a-z0-9][a-z0-9-]*$/i.test(id))
    throw new Error("History requires an exact run, session or claim ID.")
  return resolve(local, "history", kind, `${id}.json`)
}

async function publishOnce(path, value) {
  const saved = await readJSON(path, undefined)
  if (saved !== undefined) {
    if (!isDeepStrictEqual(saved, value))
      throw new Error(`Archive/provenance conflict; preserve both records for inspection: ${path}`)
    return
  }
  await writeJSON(path, value)
}

export async function readHistory(local, kind, id) {
  const record = await readJSON(historyPath(local, kind, id))
  if (!record || record.id !== id) throw new Error("History record identity mismatch; inspect before use.")
  return record
}

export async function archiveClaim(local, claim, run) {
  // Archive stable ownership proof, not retry-specific verification/finalization
  // errors. A release replay must publish the same record after a crash.
  const retained = Object.fromEntries(
    [
      "id",
      "task",
      "session",
      "scopes",
      "claimedAt",
      "repositories",
      "baseline",
      "outcome",
      "note",
      "handoff",
      "resumedFrom",
      "commitRequest",
    ]
      .filter((key) => Object.hasOwn(claim, key))
      .map((key) => [key, claim[key]])
  )
  await publishOnce(historyPath(local, "claims", claim.id), {
    id: claim.id,
    version: 1,
    runId: run.id,
    source: "Recorded by Agent Fleet before releasing ownership",
    claim: retained,
    snapshots: Object.values(claim.snapshots ?? {}),
  })
}

export async function archiveFinished(local, state) {
  const terminal = (session) => ["closed", "recovered"].includes(session.status)
  const protectedSessions = new Set()
  for (const claim of Object.values(state.claims)) {
    protectedSessions.add(claim.session)
    if (claim.review?.session) protectedSessions.add(claim.review.session)
    for (const review of Object.values(claim.reviews ?? {})) protectedSessions.add(review.session)
  }
  if ([...protectedSessions].some((id) => !state.sessions[id]))
    throw new Error("Claim references a missing session; preserve registry for inspection.")
  const protectedRuns = new Set(
    Object.values(state.sessions)
      .filter((session) => !terminal(session) || protectedSessions.has(session.id))
      .map((session) => session.runId)
  )
  const runs = Object.entries(state.runs ?? {}).filter(([id]) => !protectedRuns.has(id))
  const finishedRuns = new Set(runs.map(([id]) => id))
  const sessions = Object.entries(state.sessions).filter(
    ([id, session]) =>
      terminal(session) && !protectedSessions.has(id) && (!session.runId || finishedRuns.has(session.runId))
  )
  if (!runs.length && !sessions.length) return state
  // Publish every record before removing any reference. If interrupted before
  // state.json is replaced, the next transaction verifies and reuses the copies.
  for (const [id, run] of runs) await publishOnce(historyPath(local, "runs", id), run)
  for (const [id, session] of sessions) await publishOnce(historyPath(local, "sessions", id), session)
  const next = { ...state, sessions: { ...state.sessions }, runs: { ...state.runs } }
  for (const [id] of sessions) delete next.sessions[id]
  for (const [id] of runs) delete next.runs[id]
  return next
}

export async function saveState(local, state, taskRecords) {
  await taskRecords.flush()
  const path = resolve(local, "state.json")
  // Freeze terminal timestamps/status on disk before publishing immutable
  // history. A crash during archival must replay those exact terminal records.
  await writeJSON(path, state)
  const compacted = await archiveFinished(local, state)
  if (compacted !== state) await writeJSON(path, compacted)
  return compacted
}

export class TaskRecords {
  constructor(local) {
    this.local = local
    this.records = Object.create(null)
    this.loaded = new Set()
    this.saved = new Map()
  }

  path(taskPath) {
    const key = createHash("sha256").update(taskPath).digest("hex")
    return resolve(this.local, "tasks", `${key}.json`)
  }

  async import(records) {
    for (const [path, record] of Object.entries(records)) {
      if (record.path !== path) throw new Error("Task provenance identity mismatch.")
      await publishOnce(this.path(path), record)
    }
  }

  async context(run, task) {
    if (task.path && !this.loaded.has(task.path)) {
      const record = await this.read(task.path)
      if (record !== null) {
        this.records[task.path] = record
        this.saved.set(task.path, JSON.stringify(record))
      }
      this.loaded.add(task.path)
    }
    return { repositories: run.repositories, tracker: this.records }
  }

  async read(path) {
    const record = await readJSON(this.path(path), undefined)
    if (record === undefined) return null
    if (!record || record.path !== path) throw new Error("Task provenance identity mismatch.")
    return record
  }

  async flush() {
    // Only records touched by this invocation are loaded or rewritten. Pending
    // markers are flushed before native writes, exactly as in the shared ledger.
    for (const [path, record] of Object.entries(this.records)) {
      const value = JSON.stringify(record)
      if (value !== this.saved.get(path)) {
        await writeJSON(this.path(path), record)
        this.saved.set(path, value)
      }
    }
  }
}
