#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import { randomUUID } from "node:crypto"
import { mkdir, readFile, writeFile, rm, realpath, readdir } from "node:fs/promises"
import { hostname } from "node:os"
import { resolve, relative, dirname, isAbsolute, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs, isDeepStrictEqual } from "node:util"

import { strengthenedRepositories, restoreOwnedBaseline, assertLegacyReceipts } from "./agent-handoff.mjs"
import {
  ASSISTED,
  HUMAN_GATES,
  executionConfig,
  resolveSelection,
  newRun,
  joinRun,
  runLimit,
  gateLabels,
  assertCommitPolicy,
  assertEvidence,
} from "./agent-policy.mjs"
import { saveState, TaskRecords, readHistory, archiveClaim, writeJSON } from "./agent-state.mjs"
import { trackTask, assertTrackedTask, fileDigest } from "./agent-tracker.mjs"
import { visualRecord, assertVisual } from "./agent-visual.mjs"

// Generated from this entrypoint and its helpers by the setup skill's bundle command.
const RUNTIME_BUILD = "8f28bff0737bbe2c6b4a8e5d4883e56abeb67a356cb131091dcdab0455b2ece6"

const HELP = `Usage: node .agents/agent-workspace/scripts/agents.mjs COMMAND [options]

  start       [--agent NAME] [--profile NAME] --provider NAME --context TEXT
              [--allow-task ID ... | --milestone ID] --authorization USER-REQUEST
              [--commits never|on-request|automatic] [--review self|independent]
              [--delegation single|as-needed] [--max-agents N] [--max-tasks N]
              [--max-minutes N] [--on-human-input ask|defer]
  start       --agent NAME --provider NAME --context TEXT --run RUN-ID
  status      [--json]
  history     --run RUN-ID | --session SESSION-ID | --claim CLAIM-ID
  provenance  --task TASK-ID (inspect that task's ownership ledger)
  compact     (archive finished runs; never remove live or unresolved ownership)
  ready       --session ID
  queue       (durable human gates and handoff notes)
  heartbeat   --session ID
  claim       --session ID --task TASK-ID --scope PATH [--scope PATH ...]
              [--from-claim CLAIM-ID --note EVIDENCE]
              [--receipt FILE --confirm-receipt --note ORIGINAL-OUTPUT-SOURCE]
  claim       --session ID --task TASK-ID --commit-request --repo PATH [--repo PATH ...]
              --file PATH [--file PATH ...] --authorization ACTUAL-HUMAN-REQUEST
              (on-request commits only; checkpoint exact inspected handoff bytes)
  refresh-checks --session ID --task TASK-ID --repo PATH --note REASON
              (append checks from project config; invalidate prior evidence)
  reconcile   --session ID
  release     --session ID --task TASK-ID --outcome done|paused|review --note TEXT
  stop        --session ID
  recover     --session ID --by ID --confirm-stopped --note EVIDENCE
  approve     --session ID --task TASK-ID --note HUMAN-APPROVAL-EVIDENCE
  assign      --session ID --task TASK-ID --agent NAME --note REASON
  defer       --session ID --task TASK-ID --kind approval|decision|human-review|blocked
              --note EVIDENCE [--question TEXT --option TEXT ... --recommendation TEXT]
  resolve     --session ID --task TASK-ID --kind decision|human-review|blocked --note USER-DECISION
  snapshot    --session ID --task TASK-ID --repo PATH --file PATH [--file PATH ...]
  verify      --session ID --task TASK-ID (run repository's configured checks)
  review      --session REVIEWER-ID --task TASK-ID --fingerprint HASH --verdict pass|fail --note EVIDENCE
  commit      --session ID --task TASK-ID --message TEXT [--authorization USER-REQUEST]
  commit-status --session ID --task TASK-ID (inspect persisted Git journals)
  visual      --session ID --task TASK-ID --kind comparison|no-ui|text-only|no-visible-change
              --note INSPECTION [--file backlog/assets/task-id/slug.webp ...] [--onion .local/PATH]
  backlog     --session ID -- task edit TASK-ID ...
              (other native Backlog commands also supported)

Global: --root PATH (default: workspace containing this script).
Paths are literal workspace-relative files/directories, not globs. Read-only
research needs no scope. A claim with zero scopes is permitted for that case.
Run heartbeat at least every 10 minutes and before each editing block.
Stale sessions retain ownership. See the coordination guide for recovery.
`

const argv = process.argv.slice(2)
const split = argv.indexOf("--")
const forwarded = split === -1 ? [] : argv.slice(split + 1)
const { values: opts, positionals } = parseArgs({
  args: split === -1 ? argv : argv.slice(0, split),
  allowPositionals: true,
  options: Object.fromEntries([
    ...[
      "root",
      "agent",
      "provider",
      "context",
      "session",
      "task",
      "outcome",
      "note",
      "by",
      "profile",
      "run",
      "milestone",
      "authorization",
      "commits",
      "review",
      "delegation",
      "max-agents",
      "max-tasks",
      "max-minutes",
      "on-human-input",
      "kind",
      "question",
      "recommendation",
      "fingerprint",
      "verdict",
      "message",
      "onion",
      "claim",
      "from-claim",
      "receipt",
    ].map((key) => [key, { type: "string" }]),
    ["scope", { type: "string", multiple: true }],
    ...["allow-task", "file", "option", "repo"].map((key) => [key, { type: "string", multiple: true }]),
    ...["json", "help", "confirm-stopped", "confirm-receipt", "commit-request"].map((key) => [
      key,
      { type: "boolean" },
    ]),
  ]),
})
const command = positionals[0]
const repoPaths = opts.repo ?? []
opts.repo = repoPaths[0]
if (repoPaths.length > 1 && !(command === "claim" && opts["commit-request"]))
  throw new Error(
    "Repeated --repo is supported only for an explicit commit handoff claim; snapshots and commits remain repository-specific."
  )
const fail = (message) => {
  throw new Error(message)
}
const required = (key) => opts[key]?.trim() || fail(`Missing --${key}.`)
const now = () => new Date().toISOString()
const inside = (parent, child) => parent === child || child.startsWith(`${parent}/`)
const overlaps = (a, b) => a === "." || b === "." || inside(a, b) || inside(b, a)
const print = (value) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
const runtimePath = ".agents/agent-workspace/runtime"
let root, local, config, state, taskRecords, installationStamp
let retainLock = false

async function readJSON(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"))
  } catch (error) {
    if (error.code === "ENOENT" && fallback !== undefined) return fallback
    throw error
  }
}

async function save() {
  state = await saveState(local, state, taskRecords)
}

// One short-lived lock serializes registry transactions AND native Backlog writes.
// A killed writer leaves a lock to inspect; no timeout can safely prove it is dead.
async function transaction(fn) {
  await mkdir(resolve(local, "locks"), { recursive: true })
  const lock = resolve(local, "locks/write.lock")
  const deadline = Date.now() + 5000
  while (true) {
    try {
      await mkdir(lock)
      break
    } catch (error) {
      if (error.code !== "EEXIST") throw error
      if (Date.now() > deadline)
        fail(
          `Registry busy: ${lock}. Retry; if interrupted, inspect owner.json and follow documented recovery. Never delete a live lock.`
        )
      await new Promise((done) => setTimeout(done, 50))
    }
  }
  try {
    await writeFile(
      resolve(lock, "owner.json"),
      JSON.stringify({ pid: process.pid, host: hostname(), command, startedAt: now() })
    )
    if (await readJSON(resolve(local, "maintenance.json"), null))
      fail("Incomplete workspace maintenance; resume the exact setup/update release before running mutations.")
    const installed = await readJSON(resolve(root, ".agents/agent-workspace/install-manifest.json"), null)
    if (installed && installed.runtimeBuild !== RUNTIME_BUILD)
      fail("Loaded runtime build differs from the installed release. Retry with the installed entrypoint.")
    if (
      JSON.stringify(await readJSON(resolve(root, ".agents/agent-workspace/install-manifest.json"), null)) !==
      installationStamp
    )
      fail(
        "Workspace tooling changed while this command waited for the registry lock. Retry with the installed release."
      )
    state = await readJSON(resolve(local, "state.json"), {
      schemaVersion: 1,
      sessions: {},
      claims: {},
    })
    if (state.schemaVersion !== 1 || !state.sessions || !state.claims)
      fail("Unsupported or corrupt registry; preserve it for inspection.")
    // Existing sessions stay assisted when upgrading; never grant automatic authority.
    state.runs ??= {}
    let migrated = false
    taskRecords = new TaskRecords(local)
    if (state.tracker) {
      await taskRecords.import(state.tracker)
      delete state.tracker
      migrated = true
    }
    for (const owner of Object.values(state.sessions)) {
      if (owner.status !== "active" || owner.runId) continue
      const run = newRun(
        {
          profileName: "assisted",
          policy: ASSISTED,
          permissions: { push: false, merge: false, tags: false, deployment: false },
        },
        { coordinator: owner.id, repositories: config.repositories, legacy: true }
      )
      owner.runId = run.id
      state.runs[run.id] = run
      migrated = true
    }
    if (migrated) await save()
    return await fn()
  } finally {
    if (!retainLock) await rm(lock, { recursive: true })
  }
}

function session(id = required("session")) {
  const value = state.sessions[id]
  if (!value || value.status !== "active") fail(`No active session ${id}.`)
  return value
}

function beat(value) {
  value.lastSeenAt = now()
}

function runFor(owner) {
  return state.runs[owner.runId] ?? fail("Session has no run; preserve state and inspect before proceeding.")
}

function assertCoordinator(owner, taskId) {
  const run = runFor(owner)
  if (run.allowedTasks && !run.allowedTasks.includes(taskId)) fail("Task is outside this run's authorized scope.")
  const scopedCoordinator = run.coordinator === owner.id && run.authorization && run.allowedTasks?.includes(taskId)
  if (owner.agent !== config.defaultAgent && !scopedCoordinator)
    fail("Only the configured coordinator or authorized scoped run coordinator can perform this operation.")
}

function ownClaim(owner) {
  const claim = state.claims[required("task").toUpperCase()]
  if (!claim || claim.session !== owner.id || claim.phase !== "active")
    fail("Task must be actively owned by this session.")
  return claim
}

function taskList() {
  const view = JSON.parse(native(["task", "list", "--json"]))
  if (view.schemaVersion !== 1 || !Array.isArray(view.tasks)) fail("Unsupported Backlog task-list JSON.")
  return view.tasks
}

function requestedTasks() {
  let ids = opts["allow-task"]?.map((id) => taskView(id).id) ?? []
  if (opts.milestone) {
    const matches = taskList().filter((task) => task.milestone === opts.milestone)
    if (!matches.length) fail("Milestone has no local tasks; supply a valid milestone ID.")
    ids.push(...matches.map((task) => task.id))
  }
  return ids.length ? [...new Set(ids)] : null
}

async function gitModule() {
  return import("./agent-git.mjs")
}

async function pendingCommits(claim) {
  const directory = resolve(local, "commits", claim.id ?? "legacy-no-commits")
  let files
  try {
    files = await readdir(directory)
  } catch (error) {
    if (error.code === "ENOENT") return []
    throw error
  }
  const records = []
  for (const name of files.filter((name) => name.endsWith(".json"))) {
    const journal = await readJSON(resolve(directory, name))
    records.push({ path: relative(root, resolve(directory, name)), ...journal })
  }
  return records
}

async function currentSnapshot(claim, snapshot = claim.snapshot) {
  if (!snapshot) fail("Create a snapshot first.")
  if (claim.commits?.some((commit) => commit.fingerprint === snapshot.fingerprint)) {
    const journal = (await pendingCommits(claim)).find((item) => item.snapshot.fingerprint === snapshot.fingerprint)
    if (!journal || journal.phase !== "committed")
      fail("Committed snapshot is missing its successful journal; inspect before review.")
    // Successful journal replay only validates the existing commit and files;
    // it never stages or creates another commit. This permits renewed review.
    ;(await gitModule()).commitSnapshot({
      root,
      snapshot,
      message: journal.message,
      journalPath: resolve(root, journal.path),
    })
    return snapshot
  }
  const refreshed = (await gitModule()).prepareSnapshot({
    root,
    repoPath: snapshot.repoPath,
    paths: snapshot.files.map((file) => file.path),
    scopes: claim.scopes,
    baseline: claim.baseline,
    repositories: claim.repositories,
  })
  if (refreshed.fingerprint !== snapshot.fingerprint)
    fail("Files or HEAD changed after snapshot; create a new snapshot and repeat checks/review.")
  return snapshot
}

async function ownedChanges(claim, task) {
  const baseline = (await gitModule()).captureBaseline({ root, repositories: claim.repositories })
  const paths = []
  for (const [repoPath, repo] of Object.entries(baseline.repositories)) {
    if (repo.available === false) continue
    const inherited = claim.baseline.repositories[repoPath]?.dirtyPaths ?? []
    for (const path of repo.dirtyPaths) {
      const workspacePath = path.toLowerCase()
      // The current task is a live journal: recording its SHA/status changes it
      // after every implementation commit. Finalize it in a separate owned commit.
      if (workspacePath === task.path?.toLowerCase()) continue
      if (!inherited.includes(path) && claim.scopes.some((scope) => overlaps(scope, workspacePath))) paths.push(path)
    }
  }
  return paths
}

function native(args) {
  const result = spawnSync(config.backlog.command, [...(config.backlog.args ?? []), ...args], {
    cwd: root,
    env: { ...process.env, BACKLOG_CWD: root },
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 4 * 1024 * 1024,
  })
  if (result.error || result.status !== 0) {
    // A timed-out/killed launcher may leave a child writer alive. Keep the
    // transaction lock until an operator checks the entire process tree.
    retainLock = result.error?.code === "ETIMEDOUT" || Boolean(result.signal)
    const detail =
      result.error?.message ||
      result.stderr?.trim() ||
      (result.signal ? `terminated by ${result.signal}` : `exit ${result.status}`)
    fail(
      `Backlog failed: ${detail}\n${result.stdout?.trim() ?? ""}${retainLock ? "\nTransaction lock retained: inspect launcher and child processes before documented lock recovery." : ""}`
    )
  }
  return result.stdout
}

function taskView(id) {
  const view = JSON.parse(native(["task", "view", id, "--json"]))
  if (view.schemaVersion !== 1 || !view.task?.id)
    fail("Unsupported Backlog task JSON. Verify the installed CLI version.")
  return view.task
}

async function trackerContext(run, task) {
  // Task ownership can be handed between runs. Preserve exact provenance across
  // cooperative writers without granting ownership over unrelated dirty files.
  return taskRecords.context(run, task)
}

async function writeTasks(run, tasks, args) {
  const entries = []
  for (const task of tasks) {
    const entry = trackTask({ root, run: await trackerContext(run, task), task })
    if (entry) entries.push(entry)
  }
  for (const entry of entries) entry.pending = true
  await save()
  try {
    return native(args)
  } finally {
    // A normally exited native writer (including a partial error) is the only
    // cooperative writer here. An uncertain live child retains pending ownership.
    if (!retainLock) {
      for (const entry of entries) {
        entry.hash = fileDigest(root, entry.path)
        entry.pending = false
      }
      await save()
    }
  }
}

function needsTrackerCommit(claim) {
  const run = runFor(state.sessions[claim.session])
  return claim.outcome === "done" && (run.policy.commits === "automatic" || Boolean(claim.commitAuthorization))
}

async function trackerSnapshot(claim) {
  const run = runFor(state.sessions[claim.session])
  const task = taskView(claim.task)
  const entry = assertTrackedTask({ root, run: await trackerContext(run, task), task })
  return (await gitModule()).prepareSnapshot({
    root,
    repoPath: ".",
    paths: [task.path],
    scopes: [task.path],
    baseline: entry.baseline,
    repositories: run.repositories,
  })
}

async function finishTrackerCommit(claim) {
  try {
    await commitTaskRecord(claim)
    delete claim.finalizationError
  } catch (error) {
    claim.finalizationError = { message: error.message, at: now() }
    await save()
    throw error
  }
  await save()
}

async function commitTaskRecord(claim) {
  const run = runFor(state.sessions[claim.session])
  const task = taskView(claim.task)
  assertTrackedTask({ root, run: await trackerContext(run, task), task })
  complete(task)
  assertVisual({ root, claim, task })
  if (
    task.status !== config.backlog.doneStatus ||
    gateLabels(task).length ||
    task.labels.some((label) => label.startsWith("working:"))
  )
    fail("Final task metadata does not match the verified completion transition.")
  native(["doctor"])
  const journals = await pendingCommits(claim)
  const saved = claim.finalization
  // Before staging, a new HEAD can safely produce a new snapshot of the same
  // provenance-checked final record. Existing journals must use exact replay.
  const snapshot =
    saved && journals.some((journal) => journal.snapshot.fingerprint === saved.snapshot.fingerprint)
      ? saved.snapshot
      : await trackerSnapshot(claim)
  const journalPath = resolve(local, "commits", claim.id, `${snapshot.fingerprint}.json`)
  claim.finalization = { snapshot, journalPath, message: `chore(backlog): complete ${claim.task}` }
  await save()
  await mkdir(dirname(journalPath), { recursive: true })
  const result = (await gitModule()).commitSnapshot({
    root,
    snapshot,
    message: claim.finalization.message,
    journalPath,
  })
  claim.finalization.result = result
  if (!run.commits.some((item) => item.commit === result.commit && item.repoPath === result.repoPath))
    run.commits.push({ task: claim.task, kind: "bookkeeping", ...result })
  await save()
  // Never append this SHA to the file it just committed: the local journal and
  // Git history provide the link without recursively dirtying task metadata.
}

async function finishRelease(claim) {
  const owner = state.sessions[claim.session]
  const run = runFor(owner)
  if (claim.outcome === "done" && !run.completedTasks.includes(claim.task)) run.completedTasks.push(claim.task)
  // Publish ownership proof before deleting its live reservation. Interrupted
  // release replays the same immutable archive instead of losing snapshots.
  await archiveClaim(local, claim, run)
  delete state.claims[claim.task]
  beat(owner)
  await save()
}

async function canonicalScope(input) {
  if (!input || isAbsolute(input) || input.includes("\\") || /[*?\[\]{}]/.test(input))
    fail(`Scope must be a literal relative path: ${input}`)
  const target = resolve(root, input)
  const logical = relative(root, target)
  if (logical === ".." || logical.startsWith(`..${sep}`) || isAbsolute(logical))
    fail(`Scope escapes workspace: ${input}`)
  let ancestor = target
  while (true) {
    try {
      const actual = await realpath(ancestor)
      // Reject aliases even when they point inside the root; otherwise two spellings could claim one file.
      if (actual !== ancestor) fail(`Symlink scope is not supported: ${input}`)
      break
    } catch (error) {
      if (error.code !== "ENOENT") throw error
      ancestor = dirname(ancestor)
    }
  }
  const scope = (logical.split(sep).join("/") || ".").toLowerCase()
  const protectedPaths = [
    runtimePath,
    ".git",
    ...config.repositories.filter((repo) => repo.readOnly).map((repo) => repo.path.toLowerCase()),
  ]
  if (scope.split("/").includes(".git") || protectedPaths.some((path) => overlaps(path, scope)))
    fail(`Protected or read-only scope: ${input}`)
  return scope
}

function complete(task) {
  if (
    !task.finalSummary?.trim() ||
    !task.acceptanceCriteria?.length ||
    task.acceptanceCriteria.some((item) => !item.checked) ||
    task.definitionOfDone?.some((item) => !item.checked)
  ) {
    fail(
      `Cannot finish ${task.id}: verify/check acceptance criteria and Definition of Done, and write a final summary through Backlog first.`
    )
  }
}

// Persist the intended transition BEFORE invoking Backlog. If the process or CLI
// fails, ownership stays reserved and reconcile can replay this operation safely.
async function sync(claim) {
  if (claim.phase === "finalizing") {
    await finishTrackerCommit(claim)
    await finishRelease(claim)
    return
  }
  const task = taskView(claim.task)
  const owner = state.sessions[claim.session]
  const label = `working:${owner.id}`
  const args = ["task", "edit", claim.task]
  if (claim.phase === "claiming") {
    if (task.status === config.backlog.doneStatus && !claim.commitRequest)
      fail("Task became Done while claim was pending; inspect before reconciliation.")
    args.push(
      "-s",
      claim.commitRequest ? (claim.commitRequest.taskStatus ?? config.backlog.doneStatus) : config.backlog.activeStatus,
      "-a",
      `@${owner.agent}`,
      "--add-label",
      label,
      "--remove-label",
      config.backlog.reviewLabel
    )
  } else if (claim.phase === "releasing") {
    if (claim.outcome === "done") complete(task)
    else if (task.status === config.backlog.doneStatus && !claim.commitRequest)
      fail("Task is already Done; inspect before reconciling a nonterminal release.")
    const status =
      claim.outcome === "done"
        ? config.backlog.doneStatus
        : claim.commitRequest
          ? (claim.commitRequest.taskStatus ?? config.backlog.doneStatus)
          : claim.outcome === "paused"
            ? config.backlog.todoStatus
            : config.backlog.activeStatus
    args.push("-s", status, "--remove-label", label)
    args.push(claim.outcome === "review" ? "--add-label" : "--remove-label", config.backlog.reviewLabel)
    if (claim.handoff) args.push("--add-label", HUMAN_GATES[claim.handoff.kind])
    const marker = `[coord:${claim.operation}]`
    if (!(task.implementationNotes ?? "").includes(marker)) {
      const handoff = claim.handoff
        ? `\n\nCoordination handoff:\n\`\`\`json\n${JSON.stringify(claim.handoff, null, 2)}\n\`\`\``
        : ""
      const note = `${marker} ${now()} ${owner.agent}/${owner.id}: ${claim.outcome}. ${claim.note}${handoff}`
      args.push("--notes", [task.implementationNotes, note].filter(Boolean).join("\n\n"))
    }
  } else return
  await writeTasks(runFor(owner), [task], args)
  if (claim.phase === "releasing") {
    if (needsTrackerCommit(claim)) {
      claim.phase = "finalizing"
      await save()
      await finishTrackerCommit(claim)
    }
    await finishRelease(claim)
  } else claim.phase = "active"
  beat(owner)
  await save()
}

async function release(claim, outcome, note) {
  if (!["done", "paused", "review"].includes(outcome)) fail("Outcome must be done, paused, or review.")
  if (claim.phase !== "active") fail("Pending transition; run reconcile before releasing.")
  const task = taskView(claim.task)
  const journals = await pendingCommits(claim)
  if (journals.some((journal) => journal.phase !== "committed"))
    fail("Unfinished Git journal: inspect commit-status and recover the Git transaction before releasing ownership.")
  if (outcome === "done") {
    if (claim.commitRequest?.taskStatus && claim.commitRequest.taskStatus !== config.backlog.doneStatus)
      fail(
        "An unfinished commit checkpoint cannot complete the task; release paused and claim the clean baseline to continue."
      )
    complete(task)
    if (gateLabels(task).length) fail("Human gates must be resolved before completing a task.")
    assertVisual({ root, claim, task })
    const run = runFor(state.sessions[claim.session])
    const snapshots = Object.values(claim.snapshots ?? {})
    if (run.policy.commits === "automatic") {
      if (
        !claim.commits?.length ||
        !snapshots.length ||
        snapshots.some((snapshot) => !claim.commits.some((commit) => commit.fingerprint === snapshot.fingerprint))
      )
        fail(
          "Automatic-commit runs require verified commits for all final snapshots before Done; defer blocked work instead."
        )
      const remaining = await ownedChanges(claim, task)
      if (remaining.length)
        fail(
          `Owned changes remain uncommitted: ${remaining.join(", ")}. Snapshot/verify/review/commit them before Done.`
        )
    }
    if (run.policy.review === "independent" && !snapshots.length)
      fail("Independent review requires a verified snapshot before Done, even when commits are disabled.")
    for (const snapshot of snapshots) {
      if (!claim.commits?.some((commit) => commit.fingerprint === snapshot.fingerprint))
        await currentSnapshot(claim, snapshot)
      assertEvidence(
        run,
        {
          ...claim,
          verification: claim.verifications?.[snapshot.fingerprint],
          review: claim.reviews?.[snapshot.fingerprint],
        },
        snapshot,
        state.sessions
      )
    }
    if (snapshots.length && run.policy.commits !== "automatic") {
      const covered = new Set(
        snapshots
          .filter((snapshot) => !claim.commits?.some((commit) => commit.fingerprint === snapshot.fingerprint))
          .flatMap((snapshot) => snapshot.files.map((file) => file.path))
      )
      const uncovered = (await ownedChanges(claim, task)).filter((path) => !covered.has(path))
      if (uncovered.length)
        fail(
          `Owned changes lack current verification/review: ${uncovered.join(", ")}. Create final snapshots before Done.`
        )
    }
  } else if (task.status === config.backlog.doneStatus && !claim.commitRequest)
    fail("Task already Done; use outcome done after verifying its evidence.")
  if (
    outcome === "done" &&
    (runFor(state.sessions[claim.session]).policy.commits === "automatic" || claim.commitAuthorization)
  )
    await trackerSnapshot(claim)
  Object.assign(claim, { phase: "releasing", outcome, note, operation: randomUUID() })
  await save()
  await sync(claim)
}

async function main() {
  if (opts.help || !command) {
    process.stdout.write(HELP)
    return
  }
  if (positionals.length !== 1) fail("Unexpected arguments. See --help.")
  root = await realpath(resolve(opts.root ?? defaultRoot))
  local = resolve(root, runtimePath)
  installationStamp = JSON.stringify(
    await readJSON(resolve(root, ".agents/agent-workspace/install-manifest.json"), null)
  )
  config = await readJSON(resolve(root, "agent-workspace.json"))
  if (
    config.schemaVersion !== 1 ||
    !Array.isArray(config.agents) ||
    !Array.isArray(config.repositories) ||
    !config.backlog?.command ||
    !(config.staleAfterMinutes > 0)
  )
    fail("Invalid agent-workspace.json.")
  const names = config.agents.map((agent) => agent.name)
  if (
    names.some((name) => !/^[a-z][a-z0-9-]*$/.test(name)) ||
    new Set(names).size !== names.length ||
    !names.includes(config.defaultAgent)
  )
    fail("Invalid roster or default agent.")
  if (
    config.backlog.args !== undefined &&
    (!Array.isArray(config.backlog.args) || config.backlog.args.some((arg) => typeof arg !== "string"))
  )
    fail("Backlog args must be an array of strings.")
  if (
    ["todoStatus", "activeStatus", "doneStatus", "reviewLabel"].some(
      (key) => typeof config.backlog[key] !== "string" || !config.backlog[key].trim()
    )
  )
    fail("Missing Backlog status or review label configuration.")
  for (const repo of config.repositories) {
    if (
      typeof repo.path !== "string" ||
      !repo.path ||
      isAbsolute(repo.path) ||
      repo.path.includes("\\") ||
      repo.path.split("/").includes("..") ||
      typeof repo.readOnly !== "boolean"
    )
      fail("Repository paths must be relative and readOnly must be boolean.")
    repo.path = relative(root, resolve(root, repo.path)).split(sep).join("/") || "."
  }
  executionConfig(config)
  if (command === "provenance") {
    const task = taskView(required("task"))
    if (!task.path) fail("Backlog did not return a task file path.")
    const records = new TaskRecords(local)
    print({ path: relative(root, records.path(task.path)), record: await records.read(task.path) })
    return
  }
  if (command === "history") {
    if ([opts.run, opts.session, opts.claim].filter(Boolean).length !== 1)
      fail("Supply exactly one --run, --session or --claim ID.")
    const kind = opts.run ? "runs" : opts.session ? "sessions" : "claims"
    const id = opts.run ?? opts.session ?? opts.claim
    const current = await readJSON(resolve(local, "state.json"), {})
    const live =
      kind === "claims" ? Object.values(current.claims ?? {}).find((claim) => claim.id === id) : current[kind]?.[id]
    print(live ?? (await readHistory(local, kind, id)))
    return
  }
  if (command === "queue") {
    const tasks = taskList().filter((task) => gateLabels(task).length)
    const registry = await readJSON(resolve(local, "state.json"), { claims: {} })
    print({
      pendingFinalizations: Object.values(registry.claims)
        .filter((claim) => claim.phase === "finalizing")
        .map((claim) => ({
          task: claim.task,
          session: claim.session,
          phase: claim.phase,
          error: claim.finalizationError,
          next: "Inspect commit-status, resolve the recorded blocker, then reconcile the owner session.",
        })),
      items: tasks.map((task) => {
        const full = taskView(task.id)
        return {
          id: task.id,
          title: task.title,
          labels: gateLabels(task),
          milestone: task.milestone,
          notes: full.implementationNotes,
        }
      }),
    })
    return
  }
  if (command === "status") {
    const snapshot = await readJSON(resolve(local, "state.json"), {
      schemaVersion: 1,
      sessions: {},
      claims: {},
    })
    const sessions = Object.values(snapshot.sessions).map((value) => ({
      ...value,
      stale: value.status === "active" && Date.now() - Date.parse(value.lastSeenAt) > config.staleAfterMinutes * 60000,
    }))
    if (opts.json) print({ ...snapshot, sessions })
    else {
      for (const value of sessions)
        process.stdout.write(
          `${value.id}  ${value.agent} (${value.provider})  ${value.status}${value.stale ? " / STALE — inspect; claims retained" : ""}  ${snapshot.runs?.[value.runId]?.profileName ?? "legacy assisted"}  ${value.context}\n`
        )
      for (const claim of Object.values(snapshot.claims))
        process.stdout.write(
          `  ${claim.task} → ${claim.session} [${claim.phase}] ${claim.scopes.join(", ") || "(read-only)"}\n`
        )
      if (!sessions.length) process.stdout.write("No sessions. Run start --provider codex|claude --context TEXT.\n")
    }
    return
  }
  await transaction(async () => {
    if (command === "compact") {
      await save()
      print({
        sessions: Object.keys(state.sessions).length,
        runs: Object.keys(state.runs).length,
        claims: Object.keys(state.claims).length,
        bytes: Buffer.byteLength(`${JSON.stringify(state, null, 2)}\n`),
        history: `${runtimePath}/history`,
        taskProvenance: `${runtimePath}/tasks`,
      })
      return
    }
    if (command === "start") {
      const selection = resolveSelection(config, opts)
      const agent = selection.agent.name
      const id = `${agent}-${randomUUID()}`
      let run
      if (opts.run) {
        run = state.runs[opts.run] ?? fail("Unknown run.")
        joinRun(run, state.sessions, opts)
      } else {
        run = newRun(selection, {
          coordinator: id,
          allowedTasks: requestedTasks(),
          authorization: opts.authorization ?? "",
          repositories: config.repositories,
        })
        state.runs[run.id] = run
      }
      const value = {
        id,
        agent,
        provider: required("provider"),
        context: required("context"),
        host: hostname(),
        status: "active",
        startedAt: now(),
        lastSeenAt: now(),
        runId: run.id,
      }
      state.sessions[id] = value
      await save()
      print({
        ...value,
        profile: run.profileName,
        policy: run.policy,
        allowedTasks: run.allowedTasks,
      })
      return
    }
    if (command === "recover") {
      const owner = session()
      const actor = session(required("by"))
      if (owner.id === actor.id || !opts["confirm-stopped"])
        fail("Recovery requires a different active session and --confirm-stopped after inspecting the owning session.")
      const evidence = required("note")
      for (const claim of Object.values(state.claims).filter((item) => item.session === owner.id)) {
        if (claim.phase !== "active") await sync(claim)
        if (state.claims[claim.task]) {
          const task = taskView(claim.task)
          await release(
            claim,
            task.status === config.backlog.doneStatus ? "done" : "paused",
            `Recovered by ${actor.id}; owner confirmed stopped. ${evidence}`
          )
        }
      }
      Object.assign(owner, {
        status: "recovered",
        endedAt: now(),
        recoveryEvidence: evidence,
        recoveredBy: actor.id,
      })
      beat(actor)
      await save()
      print(owner)
      return
    }
    const owner = session()
    const run = runFor(owner)
    if (command === "ready") {
      const limit = runLimit(run)
      const tasks = limit
        ? []
        : taskList().filter(
            (task) =>
              !runLimit(run, task.id) &&
              task.isReady &&
              task.status !== config.backlog.doneStatus &&
              !gateLabels(task).length &&
              !state.claims[task.id] &&
              !task.labels.some((label) => label.startsWith("working:"))
          )
      print({ run: run.id, limit, tasks })
      return
    }
    if (command === "assign") {
      assertCoordinator(owner, required("task").toUpperCase())
      const agent = required("agent")
      const reason = required("note")
      if (!names.includes(agent)) fail("Choose an agent from the project roster.")
      const task = taskView(required("task"))
      if (
        state.claims[task.id] ||
        task.labels.some((label) => label.startsWith("working:")) ||
        task.status === config.backlog.doneStatus
      )
        fail("Release existing ownership before reassigning unfinished work.")
      await writeTasks(
        run,
        [task],
        [
          "task",
          "edit",
          task.id,
          "-a",
          `@${agent}`,
          "--append-notes",
          `Assignment changed by ${owner.id} at ${now()} to @${agent}: ${reason}`,
        ]
      )
      beat(owner)
      await save()
      print({ assigned: task.id, agent })
      return
    }
    if (command === "approve") {
      assertCoordinator(owner, required("task").toUpperCase())
      const evidence = required("note")
      const task = taskView(required("task"))
      if (
        state.claims[task.id] ||
        task.labels.some((label) => label.startsWith("working:")) ||
        !task.labels.includes("approval-required")
      )
        fail("Approval requires an unclaimed task with approval-required.")
      await writeTasks(
        run,
        [task],
        [
          "task",
          "edit",
          task.id,
          "--remove-label",
          "approval-required",
          "--append-notes",
          `Human approval recorded by ${owner.id} at ${now()}: ${evidence}`,
        ]
      )
      beat(owner)
      await save()
      print({ approved: task.id })
      return
    }
    if (command === "resolve") {
      const task = taskView(required("task"))
      assertCoordinator(owner, task.id)
      const kind = required("kind")
      if (!["decision", "human-review", "blocked"].includes(kind))
        fail("Resolve kind must be decision, human-review, or blocked; use approve for approval-required.")
      if (
        state.claims[task.id] ||
        task.labels.some((label) => label.startsWith("working:")) ||
        !task.labels.includes(HUMAN_GATES[kind])
      )
        fail("Resolve requires an unclaimed task carrying that gate.")
      await writeTasks(
        run,
        [task],
        [
          "task",
          "edit",
          task.id,
          "--remove-label",
          HUMAN_GATES[kind],
          "--append-notes",
          `${kind} resolved by ${owner.id} at ${now()}: ${required("note")}`,
        ]
      )
      beat(owner)
      await save()
      print({ resolved: task.id, kind })
      return
    }
    if (command === "defer") {
      const claim = ownClaim(owner)
      const kind = required("kind")
      if (!Object.hasOwn(HUMAN_GATES, kind)) fail("Defer kind must be approval, decision, human-review, or blocked.")
      const note = required("note")
      if (kind !== "blocked" && (!opts.question?.trim() || !opts.recommendation?.trim()))
        fail("Human handoffs require --question and --recommendation, plus evidence in --note.")
      if (kind === "decision" && (opts.option?.length ?? 0) < 2)
        fail("Decision handoffs require at least two --option values.")
      claim.handoff = {
        kind,
        question: opts.question ?? null,
        options: opts.option ?? [],
        recommendation: opts.recommendation ?? null,
        evidence: note,
        run: run.id,
        createdAt: now(),
      }
      await release(claim, "paused", note)
      print({ deferred: claim.task, kind })
      return
    }
    if (command === "visual") {
      const claim = ownClaim(owner)
      const task = taskView(claim.task)
      const { record, notes } = visualRecord({
        root,
        claim,
        task,
        kind: required("kind"),
        files: opts.file,
        note: required("note"),
        onion: opts.onion,
      })
      await writeTasks(run, [task], ["task", "edit", task.id, "--notes", notes])
      claim.visual = record
      // Review must inspect the declared visual evidence, not an earlier version.
      claim.review = null
      claim.reviews = {}
      beat(owner)
      await save()
      print(record)
      return
    }
    if (command === "refresh-checks") {
      const claim = ownClaim(owner)
      assertCoordinator(owner, claim.task)
      const note = required("note")
      if (!claim.scopes.some((scope) => overlaps(scope, "agent-workspace.json")))
        fail("Claim agent-workspace.json before refreshing repository checks.")
      const repositories = strengthenedRepositories(run.repositories, config.repositories, required("repo"))
      if (isDeepStrictEqual(repositories, run.repositories)) {
        print({ refreshed: false, reason: "Run already has these checks." })
        return
      }
      const affected = Object.values(state.claims).filter((item) => state.sessions[item.session]?.runId === run.id)
      for (const item of affected) {
        if (item.phase !== "active" || item.commits?.length || (await pendingCommits(item)).length)
          fail("Finish pending transitions/commits before changing the run's check requirements.")
      }
      run.checkRefreshes ??= []
      run.checkRefreshes.push({
        repo: required("repo"),
        by: owner.id,
        note,
        at: now(),
        previous: run.repositories.find((repo) => repo.path === required("repo"))?.checks ?? [],
        checks: repositories.find((repo) => repo.path === required("repo")).checks,
      })
      run.repositories = repositories
      // Snapshot fingerprints include repository config, so all snapshots in
      // this run need renewal. Never reuse an approval of the old check set.
      for (const item of affected)
        Object.assign(item, {
          repositories: structuredClone(repositories),
          snapshot: null,
          snapshots: {},
          verification: null,
          verifications: {},
          review: null,
          reviews: {},
          visual: null,
        })
      beat(owner)
      await save()
      print({ refreshed: true, repo: required("repo"), invalidatedTasks: affected.map((item) => item.task) })
      return
    }
    if (command === "snapshot") {
      const claim = ownClaim(owner)
      if (!claim.baseline)
        fail("This claim predates Git baselines; release and reclaim before taking a commit snapshot.")
      if (!opts.file?.length) fail("Select exact --file paths; directories and broad staging are not supported.")
      if (claim.commitRequest) {
        const repo = required("repo")
        const approved =
          claim.commitRequest.repositories?.[repo] ??
          (repo === claim.commitRequest.repo ? claim.commitRequest.files : null)
        if (!approved || opts.file.some((path) => !approved.includes(path)))
          fail("Commit handoff snapshots can select only the explicitly approved files and repository.")
      }
      const snapshot = (await gitModule()).prepareSnapshot({
        root,
        repoPath: required("repo"),
        paths: opts.file,
        scopes: claim.scopes,
        baseline: claim.baseline,
        repositories: claim.repositories,
      })
      const task = taskView(claim.task)
      if (snapshot.files.some((file) => file.path.toLowerCase() === task.path?.toLowerCase()))
        fail(
          "The active task record is a live journal; automatic completion commits it separately after the implementation snapshot."
        )
      claim.snapshot = snapshot
      claim.snapshots ??= {}
      claim.snapshots[snapshot.repoPath] = snapshot
      claim.verification = claim.verifications?.[snapshot.fingerprint] ?? null
      claim.review = claim.reviews?.[snapshot.fingerprint] ?? null
      beat(owner)
      await save()
      print(snapshot)
      return
    }
    if (command === "verify") {
      const claim = ownClaim(owner)
      const snapshot = await currentSnapshot(claim)
      const repo = run.repositories.find((repo) => repo.path === snapshot.repoPath)
      if (!repo?.checks?.length)
        fail("Configure repository checks before using guarded commits. There is no skip-checks option.")
      claim.verification = {
        fingerprint: snapshot.fingerprint,
        passed: false,
        checks: [],
        at: now(),
      }
      await save()
      for (const check of repo.checks) {
        if (
          !check.name ||
          !Array.isArray(check.command) ||
          !check.command.length ||
          check.command.some((arg) => typeof arg !== "string")
        )
          fail("Invalid repository check configuration.")
        const result = spawnSync(check.command[0], check.command.slice(1), {
          cwd: resolve(root, repo.path),
          env: { ...process.env, BACKLOG_CWD: root },
          encoding: "utf8",
          timeout: 300000,
          maxBuffer: 8 * 1024 * 1024,
        })
        const passed = !result.error && result.status === 0
        claim.verification.checks.push({
          name: check.name,
          command: check.command,
          passed,
          exitCode: result.status,
          output: `${result.stdout ?? ""}${result.stderr ?? ""}`.slice(-12000),
        })
        await save()
        if (!passed) {
          retainLock = result.error?.code === "ETIMEDOUT" || Boolean(result.signal)
          fail(
            `Check failed: ${check.name}. ${result.error?.message ?? result.stderr ?? ""}${retainLock ? " Transaction lock retained until child processes are inspected." : ""}`
          )
        }
      }
      await currentSnapshot(claim)
      claim.verification.passed = true
      claim.verifications ??= {}
      claim.verifications[snapshot.fingerprint] = structuredClone(claim.verification)
      beat(owner)
      await save()
      print(claim.verification)
      return
    }
    if (command === "review") {
      const claim = state.claims[required("task").toUpperCase()]
      if (!claim || claim.phase !== "active") fail("Review requires an active task claim.")
      const author = state.sessions[claim.session]
      const authorRun = runFor(author)
      if (owner.runId !== author.runId) fail("Reviewer must join the same authorized run.")
      if (authorRun.policy.review === "independent" && owner.id === author.id)
        fail("Independent review cannot be self-approved.")
      const selected = Object.values(claim.snapshots ?? {}).find(
        (snapshot) => snapshot.fingerprint === required("fingerprint")
      )
      if (!selected) fail("Review fingerprint does not match a retained final snapshot.")
      const snapshot = await currentSnapshot(claim, selected)
      assertVisual({ root, claim, task: taskView(claim.task) })
      const verdict = required("verdict")
      if (!["pass", "fail"].includes(verdict)) fail("Review verdict must be pass or fail.")
      const review = {
        session: owner.id,
        fingerprint: snapshot.fingerprint,
        verdict,
        note: required("note"),
        at: now(),
      }
      claim.reviews ??= {}
      claim.reviews[snapshot.fingerprint] = review
      claim.review = claim.reviews[claim.snapshot.fingerprint] ?? null
      beat(owner)
      await save()
      print(review)
      return
    }
    if (command === "commit-status") {
      const claim = state.claims[required("task").toUpperCase()]
      if (!claim || claim.session !== owner.id) fail("Task must be owned by this session.")
      print({
        phase: claim.phase,
        finalization: claim.finalization,
        error: claim.finalizationError,
        journals: await pendingCommits(claim),
      })
      return
    }
    if (command === "commit") {
      const claim = ownClaim(owner)
      assertCommitPolicy(run, opts.authorization)
      const task = taskView(claim.task)
      if (claim.commitRequest?.taskStatus && claim.commitRequest.taskStatus !== config.backlog.doneStatus) {
        if (task.status !== claim.commitRequest.taskStatus)
          fail("Checkpoint task status changed; preserve the unfinished handoff for inspection.")
      } else complete(task)
      if (gateLabels(task).length) fail("Resolve human gates before committing.")
      const snapshot = claim.snapshot ?? fail("Create a snapshot first.")
      assertVisual({ root, claim, task })
      assertTrackedTask({ root, run: await trackerContext(run, task), task })
      assertEvidence(run, claim, snapshot, state.sessions)
      const message = required("message")
      const journalPath = resolve(local, "commits", claim.id, `${snapshot.fingerprint}.json`)
      await mkdir(dirname(journalPath), { recursive: true })
      const result = (await gitModule()).commitSnapshot({ root, snapshot, message, journalPath })
      claim.commits ??= []
      if (!claim.commits.some((value) => value.commit === result.commit)) claim.commits.push(result)
      if (!run.commits.some((value) => value.commit === result.commit && value.repoPath === result.repoPath))
        run.commits.push({ task: claim.task, ...result })
      claim.commitAuthorization = opts.authorization ?? run.authorization
      await save()
      // The Git journal allows replay if this tracker update fails after the commit.
      const marker = `[commit:${result.commit}]`
      const fresh = taskView(claim.task)
      if (!(fresh.implementationNotes ?? "").includes(marker))
        await writeTasks(
          run,
          [fresh],
          [
            "task",
            "edit",
            claim.task,
            "--append-notes",
            `${marker} Local commit in ${result.repoPath}; snapshot ${result.fingerprint}. Checks and ${run.policy.review} review passed. Authorization: ${claim.commitAuthorization}`,
          ]
        )
      beat(owner)
      await save()
      print(result)
      return
    }
    if (command === "heartbeat") {
      beat(owner)
      await save()
      print(owner)
      return
    }
    if (command === "claim") {
      const task = taskView(required("task"))
      const limit = runLimit(run, task.id)
      if (limit) fail(limit)
      if (state.claims[task.id]) fail(`${task.id} already claimed by ${state.claims[task.id].session}.`)
      const commitRequest = Boolean(opts["commit-request"])
      if (commitRequest) {
        if (run.policy.commits !== "on-request") fail("Commit handoff requires an on-request commit policy.")
        if (task.status !== config.backlog.doneStatus && task.readiness?.isReady !== true)
          fail("Unfinished commit checkpoints require resolved dependencies.")
        required("authorization")
        required("repo")
        if (!opts.file?.length || opts.scope?.length || opts["from-claim"] || opts.receipt)
          fail("Commit handoff selects exact --file paths, without scopes or recovery receipts.")
        if (opts.file.some((path) => path.toLowerCase() === task.path.toLowerCase()))
          fail("The task record is finalized separately; exclude it from --file paths.")
        if (task.status === config.backlog.doneStatus) complete(task)
      } else if (task.status === config.backlog.doneStatus || task.readiness?.isReady !== true)
        fail(`${task.id} is completed or has unresolved dependencies.`)
      if (task.labels.some((label) => label.startsWith("working:")))
        fail("Backlog has an existing working label without this local claim; inspect the other workspace/session.")
      if (gateLabels(task).length) fail(`Task has unresolved gates: ${gateLabels(task).join(", ")}.`)
      if (task.assignees.some((assignee) => assignee.replace(/^@/, "").toLowerCase() !== owner.agent))
        fail(`Task assigned to ${task.assignees.join(", ")}; resolve assignment before claiming.`)
      const scopes = [
        ...new Set(await Promise.all((commitRequest ? opts.file : (opts.scope ?? [])).map(canonicalScope))),
      ]
      for (const other of Object.values(state.claims)) {
        if (scopes.some((scope) => other.scopes.some((existing) => overlaps(scope, existing))))
          fail(`Scope conflicts with ${other.task} (${other.session}).`)
      }
      const claim = {
        id: randomUUID(),
        task: task.id,
        session: owner.id,
        scopes,
        phase: "claiming",
        claimedAt: now(),
        repositories: structuredClone(run.repositories),
        baseline: (await gitModule()).captureBaseline({ root, repositories: run.repositories }),
      }
      if (commitRequest) {
        claim.baseline = (await gitModule()).authorizeCommitRequest(
          {
            root,
            repoPath: opts.repo,
            repoPaths,
            paths: opts.file,
            scopes,
            baseline: claim.baseline,
            repositories: claim.repositories,
          },
          opts.authorization
        )
        const approvals = claim.baseline.commitRequests ?? { [opts.repo]: claim.baseline.commitRequest }
        claim.commitRequest = {
          authorization: opts.authorization,
          at: now(),
          repo: opts.repo,
          files: opts.file,
          repositories: Object.fromEntries(
            Object.entries(approvals).map(([repo, approval]) => [repo, approval.files.map((file) => file.path)])
          ),
          taskStatus: task.status,
        }
      }
      if (opts["from-claim"] || opts.receipt) {
        if (opts["from-claim"] && opts.receipt) fail("Choose a recorded claim or legacy receipt, not both.")
        const note = required("note")
        let receipt
        if (opts.receipt) {
          if (!opts["confirm-receipt"])
            fail("Legacy recovery requires --confirm-receipt after inspecting original CLI outputs.")
          receipt = await readJSON(resolve(root, opts.receipt))
          assertLegacyReceipts(receipt)
        } else receipt = await readHistory(local, "claims", opts["from-claim"])
        const source = receipt.claim ?? fail("Missing handoff claim.")
        const previousSession = state.sessions[source.session] ?? (await readHistory(local, "sessions", source.session))
        const previousRun =
          state.runs[previousSession.runId] ?? (await readHistory(local, "runs", previousSession.runId))
        const restored = restoreOwnedBaseline({
          root,
          receipt,
          previousRun,
          previousSession,
          run,
          baseline: claim.baseline,
          scopes,
          task: task.id,
        })
        claim.baseline = restored.baseline
        // Preserve legacy receipts durably rather than depending on scratch or
        // changing the old run. All checks, visuals and review start afresh.
        const proofPath = resolve(local, "recovery", `${claim.id}.json`)
        await writeJSON(proofPath, receipt)
        claim.resumedFrom = {
          claim: source.id,
          run: previousRun.id,
          session: source.session,
          proof: relative(root, proofPath),
          note,
          at: now(),
          files: restored.restored,
        }
      }
      if (!run.touchedTasks.includes(task.id)) run.touchedTasks.push(task.id)
      state.claims[task.id] = claim
      beat(owner)
      await save()
      await sync(claim)
      print(claim)
      return
    }
    if (command === "reconcile") {
      for (const claim of Object.values(state.claims).filter((item) => item.session === owner.id)) await sync(claim)
      beat(owner)
      await save()
      print({ reconciled: owner.id })
      return
    }
    if (command === "release") {
      const claim = state.claims[required("task").toUpperCase()]
      if (!claim || claim.session !== owner.id) fail("Task is not owned by this session.")
      await release(claim, required("outcome"), required("note"))
      print({ released: claim.task })
      return
    }
    if (command === "stop") {
      if (Object.values(state.claims).some((claim) => claim.session === owner.id))
        fail("Release or reconcile all claims before stopping.")
      if (
        run.coordinator === owner.id &&
        Object.values(state.sessions).some(
          (value) => value.runId === run.id && value.id !== owner.id && value.status === "active"
        )
      )
        fail("Close all worker/reviewer sessions before stopping the run coordinator.")
      Object.assign(owner, { status: "closed", endedAt: now() })
      await save()
      print(owner)
      return
    }
    if (command === "backlog") {
      if (!forwarded.length) fail("Supply native Backlog arguments after --.")
      let editedTasks = []
      if (["task", "tasks"].includes(forwarded[0]) && forwarded[1] === "edit") {
        if (forwarded.some((arg) => arg === "-s" || arg === "--status" || arg.startsWith("--status=")))
          fail("Use release/defer for status transitions so evidence and commit gates are enforced.")
        const editArgs = forwarded.slice(2)
        const optionIndex = editArgs.findIndex((arg) => arg.startsWith("-"))
        const ids = optionIndex < 0 ? editArgs : editArgs.slice(0, optionIndex)
        if (!ids.length) fail("Put task IDs before edit options.")
        for (const id of ids) {
          const claim = state.claims[id.toUpperCase()]
          if (!claim || claim.session !== owner.id || claim.phase !== "active")
            fail(`Claim ${id} before editing it through the wrapper.`)
        }
        editedTasks = ids.map(taskView)
      }
      // CLI operations remain cooperative: caller must own edited task/file scopes.
      // Serializing all writes also protects tracker ID creation across providers.
      let output
      if (editedTasks.length) output = await writeTasks(run, editedTasks, forwarded)
      else if (["task", "tasks"].includes(forwarded[0]) && forwarded[1] === "create") {
        const before = new Set(taskList().map((task) => task.id))
        const baseline = (await gitModule()).captureBaseline({
          root,
          repositories: run.repositories,
        })
        output = native(forwarded)
        for (const created of taskList().filter((task) => !before.has(task.id))) {
          const task = taskView(created.id)
          trackTask({
            root,
            run: await trackerContext(run, task),
            task,
            baseline,
            created: true,
          })
        }
      } else output = native(forwarded)
      beat(owner)
      await save()
      process.stdout.write(output)
      return
    }
    fail(`Unknown command ${command}. See --help.`)
  })
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
})
