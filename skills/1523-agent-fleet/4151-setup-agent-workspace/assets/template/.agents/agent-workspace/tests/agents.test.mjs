import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdtemp, readFile, writeFile, mkdir, rm, symlink } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const cli = fileURLToPath(new URL("../scripts/agents.mjs", import.meta.url))
const baseConfig = JSON.parse(await readFile(new URL("./fixtures/workspace.json", import.meta.url), "utf8"))

async function fixture(t, changes = {}) {
  const root = await mkdtemp(resolve(tmpdir(), "workspace-agents-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const fake = resolve(root, "fake-backlog.mjs")
  await writeFile(
    fake,
    `
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const args = process.argv.slice(2);
const path = 'tasks.json';
const tasks = JSON.parse(readFileSync(path, 'utf8'));
if (args[0] !== 'task') process.exit(0);
if (args[1] === 'list') {
  console.log(JSON.stringify({schemaVersion:1, tasks:Object.values(tasks).map(task=>({...task, isReady:task.readiness.isReady && task.status!=='Done'}))}));
  process.exit(0);
}
const task = tasks[args[2].toUpperCase()];
if (!task) { console.error('No task'); process.exit(1); }
if (args[1] === 'view') {
  console.log(JSON.stringify({schemaVersion: 1, task}));
} else if (args[1] === 'edit') {
  if (existsSync('fail-before')) { console.error('Injected failure'); process.exit(1); }
  for (let i = 3; i < args.length; i += 2) {
    const [key, value] = args.slice(i, i + 2);
    if (key === '-s') task.status = value;
    if (key === '-a') task.assignees = [value];
    if (key === '--notes') task.implementationNotes = value;
    if (key === '--append-notes') task.implementationNotes = [task.implementationNotes, value].filter(Boolean).join('\\n\\n');
    if (key === '--final-summary') task.finalSummary = value;
    if (key === '--check-ac') task.acceptanceCriteria[Number(value) - 1].checked = true;
    if (key === '--add-label') task.labels = [...new Set([...task.labels, value])];
    if (key === '--remove-label') task.labels = task.labels.filter(label => label !== value);
  }
  writeFileSync(path, JSON.stringify(tasks));
  if (existsSync('signal-after')) process.kill(process.pid, 'SIGTERM');
  if (existsSync('fail-after')) { console.error('Injected uncertain outcome'); process.exit(1); }
  console.log('Updated');
}
`
  )
  const config = {
    ...baseConfig,
    ...changes,
    backlog: { ...baseConfig.backlog, command: process.execPath, args: [fake], ...changes.backlog },
  }
  await writeFile(resolve(root, "agent-workspace.json"), JSON.stringify(config))
  const tasks = Object.fromEntries(
    [1, 2, 3].map((id) => [
      `TASK-${id}`,
      {
        id: `TASK-${id}`,
        status: config.backlog.todoStatus,
        assignees: [],
        labels: ["keep-me"],
        readiness: { isReady: true },
        acceptanceCriteria: [{ index: 1, checked: false }],
        definitionOfDone: [],
        implementationNotes: "Existing evidence",
        finalSummary: null,
      },
    ])
  )
  await writeFile(resolve(root, "tasks.json"), JSON.stringify(tasks))
  const run = (...args) =>
    new Promise((done, reject) => {
      const child = spawn(process.execPath, [cli, ...args, "--root", root])
      let out = "",
        err = ""
      child.stdout.on("data", (chunk) => {
        out += chunk
      })
      child.stderr.on("data", (chunk) => {
        err += chunk
      })
      child.on("error", reject)
      child.on("close", (code) => done({ code, out, err }))
    })
  // --root must precede the native-CLI separator.
  const native = (...args) =>
    new Promise((done, reject) => {
      const child = spawn(process.execPath, [cli, "--root", root, ...args])
      let out = "",
        err = ""
      child.stdout.on("data", (chunk) => {
        out += chunk
      })
      child.stderr.on("data", (chunk) => {
        err += chunk
      })
      child.on("error", reject)
      child.on("close", (code) => done({ code, out, err }))
    })
  const ok = async (...args) => {
    const result = await run(...args)
    assert.equal(result.code, 0, result.err)
    return JSON.parse(result.out)
  }
  const start = (agent = config.defaultAgent, provider = "codex") =>
    ok("start", "--agent", agent, "--provider", provider, "--context", "test session")
  const registry = async () =>
    JSON.parse(await readFile(resolve(root, ".agents/agent-workspace/runtime/state.json"), "utf8"))
  const data = async () => JSON.parse(await readFile(resolve(root, "tasks.json"), "utf8"))
  return { root, run, native, ok, start, registry, data }
}

test("independent processes cannot claim the same task; identical names still have unique sessions", async (t) => {
  const f = await fixture(t)
  const [a, b] = await Promise.all([f.start(), f.start("oak", "claude")])
  assert.notEqual(a.id, b.id)
  const results = await Promise.all(
    [a, b].map((owner) => f.run("claim", "--session", owner.id, "--task", "TASK-1", "--scope", "src"))
  )
  assert.deepEqual(results.map((result) => result.code).sort(), [0, 1])
  const registry = await f.registry()
  assert.equal(Object.keys(registry.claims).length, 1)
  const task = (await f.data())["TASK-1"]
  assert.deepEqual(task.labels, ["keep-me", `working:${registry.claims["TASK-1"].session}`])
})

test("native Backlog assignees with or without @ resolve to the same project agent", async (t) => {
  const f = await fixture(t)
  const owner = await f.start()
  const tasks = await f.data()
  tasks["TASK-1"].assignees = ["oak"]
  await writeFile(resolve(f.root, "tasks.json"), JSON.stringify(tasks))
  await f.ok("claim", "--session", owner.id, "--task", "TASK-1")
})

test("ancestor paths conflict across tasks; siblings and disjoint claims can proceed", async (t) => {
  const f = await fixture(t)
  const [a, b] = await Promise.all([f.start(), f.start("birch")])
  const results = await Promise.all([
    f.run("claim", "--session", a.id, "--task", "TASK-1", "--scope", "apps/web"),
    f.run("claim", "--session", b.id, "--task", "TASK-2", "--scope", "apps/web/src/main.ts"),
  ])
  assert.deepEqual(results.map((result) => result.code).sort(), [0, 1])
  await f.ok("claim", "--session", a.id, "--task", "TASK-3", "--scope", "apps/website")
})

test("scope validation protects reference repositories, Git, registry, escapes, symlink aliases, and case variants", async (t) => {
  const f = await fixture(t)
  const owner = await f.start()
  await mkdir(resolve(f.root, "src"))
  await symlink(resolve(f.root, "src"), resolve(f.root, "alias"), "dir")
  for (const scope of [
    "reference/Assets",
    ".git/config",
    "implementation/.git",
    ".agents/agent-workspace/runtime",
    ".agents/agent-workspace",
    ".agents/agent-workspace/runtime/locks",
    "../elsewhere",
    ".",
    "alias/code.js",
    "/tmp",
    "src/*.js",
  ]) {
    const result = await f.run("claim", "--session", owner.id, "--task", "TASK-1", "--scope", scope)
    assert.equal(result.code, 1, `must reject ${scope}`)
  }
  await f.ok("claim", "--session", owner.id, "--task", "TASK-1", "--scope", "Future/File")
  assert.equal((await f.run("claim", "--session", owner.id, "--task", "TASK-2", "--scope", "future/file")).code, 1)
})

test("stale is advisory: ownership blocks new claims until explicitly recovered, and old owners cannot resume", async (t) => {
  const f = await fixture(t)
  const [a, b] = await Promise.all([f.start(), f.start("elm", "claude")])
  await f.ok("claim", "--session", a.id, "--task", "TASK-1")
  const state = await f.registry()
  state.sessions[a.id].lastSeenAt = "2000-01-01T00:00:00.000Z"
  await writeFile(resolve(f.root, ".agents/agent-workspace/runtime/state.json"), JSON.stringify(state))
  const status = await f.ok("status", "--json")
  assert.equal(status.sessions.find((item) => item.id === a.id).stale, true)
  assert.equal((await f.run("claim", "--session", b.id, "--task", "TASK-1")).code, 1)
  assert.equal((await f.run("recover", "--session", a.id, "--by", b.id, "--note", "Stopped thread")).code, 1)
  await f.ok(
    "recover",
    "--session",
    a.id,
    "--by",
    b.id,
    "--confirm-stopped",
    "--note",
    "Owning thread verified stopped"
  )
  assert.equal((await f.data())["TASK-1"].status, "To Do")
  assert.equal((await f.registry()).sessions[a.id], undefined)
  assert.equal((await f.ok("history", "--session", a.id)).status, "recovered")
  assert.equal((await f.run("heartbeat", "--session", a.id)).code, 1)
  assert.deepEqual((await f.data())["TASK-1"].labels, ["keep-me"])
})

test("uncertain tracker writes retain reservations; reconciliation replays release without duplicate notes", async (t) => {
  const f = await fixture(t)
  const a = await f.start()
  await writeFile(resolve(f.root, "fail-before"), "")
  assert.equal((await f.run("claim", "--session", a.id, "--task", "TASK-1", "--scope", "src")).code, 1)
  assert.equal((await f.registry()).claims["TASK-1"].phase, "claiming")
  assert.equal((await f.run("stop", "--session", a.id)).code, 1)
  await rm(resolve(f.root, "fail-before"))
  await f.ok("reconcile", "--session", a.id)
  await writeFile(resolve(f.root, "fail-after"), "")
  assert.equal(
    (
      await f.run(
        "release",
        "--session",
        a.id,
        "--task",
        "TASK-1",
        "--outcome",
        "review",
        "--note",
        "Please inspect evidence"
      )
    ).code,
    1
  )
  assert.equal((await f.registry()).claims["TASK-1"].phase, "releasing")
  await rm(resolve(f.root, "fail-after"))
  await f.ok("reconcile", "--session", a.id)
  const task = (await f.data())["TASK-1"]
  assert.equal(task.implementationNotes.match(/Please inspect evidence/g).length, 1)
  assert.ok(task.implementationNotes.startsWith("Existing evidence"))
  assert.deepEqual(task.labels, ["keep-me", "needs-review"])
  assert.deepEqual((await f.registry()).claims, {})
  await f.ok("stop", "--session", a.id)
})

test("finish requires evidence, preserves assignee, and wrapper rejects unowned task edits", async (t) => {
  const f = await fixture(t)
  const a = await f.start()
  await f.ok("claim", "--session", a.id, "--task", "TASK-1")
  assert.equal(
    (await f.run("release", "--session", a.id, "--task", "TASK-1", "--outcome", "done", "--note", "Verified")).code,
    1
  )
  assert.equal(
    (await f.native("backlog", "--session", a.id, "--", "task", "edit", "TASK-2", "--final-summary", "Wrong task"))
      .code,
    1
  )
  const edit = await f.native(
    "backlog",
    "--session",
    a.id,
    "--",
    "task",
    "edit",
    "TASK-1",
    "--check-ac",
    "1",
    "--final-summary",
    "Behavior verified"
  )
  assert.equal(edit.code, 0, edit.err)
  await f.ok(
    "visual",
    "--session",
    a.id,
    "--task",
    "TASK-1",
    "--kind",
    "no-ui",
    "--note",
    "Coordination-only fixture has no UI"
  )
  await f.ok("release", "--session", a.id, "--task", "TASK-1", "--outcome", "done", "--note", "Verified")
  const task = (await f.data())["TASK-1"]
  assert.equal(task.status, "Done")
  assert.deepEqual(task.assignees, ["@oak"])
  assert.deepEqual(task.labels, ["keep-me"])
})

test("project-specific names, statuses, and single-repo layout require no pnpm or nested repositories", async (t) => {
  const f = await fixture(t, {
    defaultAgent: "lead",
    agents: [{ name: "lead", role: "Maintainer" }],
    repositories: [{ path: ".", readOnly: false }],
    backlog: { todoStatus: "Ready", activeStatus: "Doing", doneStatus: "Finished" },
  })
  const a = await f.start("lead", "custom-provider")
  await f.ok("claim", "--session", a.id, "--task", "TASK-1", "--scope", "packages/shared")
  assert.equal((await f.data())["TASK-1"].status, "Doing")
  await f.ok("release", "--session", a.id, "--task", "TASK-1", "--outcome", "paused", "--note", "Handoff")
  assert.equal((await f.data())["TASK-1"].status, "Ready")
})

test("blocked dependencies, approval gates, wrong assignments, and foreign working labels block claims", async (t) => {
  const f = await fixture(t)
  const a = await f.start()
  for (const change of [
    { readiness: { isReady: false } },
    { labels: ["approval-required"] },
    { assignees: ["@elm"] },
    { labels: ["working:foreign"] },
  ]) {
    const data = await f.data()
    Object.assign(data["TASK-1"], { readiness: { isReady: true }, labels: [], assignees: [] }, change)
    await writeFile(resolve(f.root, "tasks.json"), JSON.stringify(data))
    assert.equal((await f.run("claim", "--session", a.id, "--task", "TASK-1")).code, 1)
  }
})

test("orphaned transaction locks fail closed; no age-based lock stealing", async (t) => {
  const f = await fixture(t)
  const lock = resolve(f.root, ".agents/agent-workspace/runtime/locks/write.lock")
  await mkdir(lock, { recursive: true })
  await writeFile(resolve(lock, "owner.json"), JSON.stringify({ pid: -1, startedAt: "2000-01-01" }))
  const result = await f.run("start", "--provider", "codex", "--context", "must not steal")
  assert.equal(result.code, 1)
  assert.match(result.err, /Never delete a live lock/)
  assert.ok(await readFile(resolve(lock, "owner.json")))
})

test("only the coordinator can record an approval gate; evidence persists without claiming or completing work", async (t) => {
  const f = await fixture(t)
  const [a, b] = await Promise.all([f.start(), f.start("elm")])
  const data = await f.data()
  data["TASK-1"].labels.push("approval-required")
  await writeFile(resolve(f.root, "tasks.json"), JSON.stringify(data))
  assert.equal((await f.run("approve", "--session", b.id, "--task", "TASK-1", "--note", "User accepted")).code, 1)
  await f.ok(
    "approve",
    "--session",
    a.id,
    "--task",
    "TASK-1",
    "--note",
    "User explicitly approved template in test fixture"
  )
  const task = (await f.data())["TASK-1"]
  assert.equal(task.status, "To Do")
  assert.deepEqual(task.labels, ["keep-me"])
  assert.match(task.implementationNotes, /explicitly approved template/)
  assert.deepEqual((await f.registry()).claims, {})
})

test("read-only repository paths are normalized before checking scope boundaries", async (t) => {
  for (const path of ["./reference", "reference/", "reference/./nested/.."]) {
    const f = await fixture(t, { repositories: [{ path, readOnly: true }] })
    const result = await f.run("start", "--provider", "codex", "--context", "path validation")
    if (path.includes("..")) {
      assert.equal(result.code, 1)
      continue
    }
    assert.equal(result.code, 0, result.err)
    const owner = JSON.parse(result.out)
    assert.equal(
      (await f.run("claim", "--session", owner.id, "--task", "TASK-1", "--scope", "reference/file.txt")).code,
      1
    )
  }
  const f = await fixture(t, { repositories: [{ path: "reference/./nested", readOnly: true }] })
  const owner = await f.start()
  assert.equal(
    (await f.run("claim", "--session", owner.id, "--task", "TASK-1", "--scope", "reference/nested/file.txt")).code,
    1
  )
})

test("coordinator can reassign unclaimed work with evidence, but cannot override existing claims", async (t) => {
  const f = await fixture(t)
  const [a, b] = await Promise.all([f.start(), f.start("elm")])
  const data = await f.data()
  data["TASK-1"].assignees = ["@elm"]
  await writeFile(resolve(f.root, "tasks.json"), JSON.stringify(data))
  assert.equal(
    (await f.run("assign", "--session", b.id, "--task", "TASK-1", "--agent", "oak", "--note", "Handoff")).code,
    1
  )
  await f.ok(
    "assign",
    "--session",
    a.id,
    "--task",
    "TASK-1",
    "--agent",
    "oak",
    "--note",
    "Elm completed research; Oak integrates"
  )
  assert.match((await f.data())["TASK-1"].implementationNotes, /Oak integrates/)
  await f.ok("claim", "--session", a.id, "--task", "TASK-1")
  assert.equal(
    (await f.run("assign", "--session", a.id, "--task", "TASK-1", "--agent", "elm", "--note", "Must not override"))
      .code,
    1
  )
})

test("terminated tracker writers retain the transaction lock until process inspection and recovery", async (t) => {
  const f = await fixture(t)
  const owner = await f.start()
  await writeFile(resolve(f.root, "signal-after"), "")
  const result = await f.run("claim", "--session", owner.id, "--task", "TASK-1", "--scope", "src")
  assert.equal(result.code, 1)
  assert.match(result.err, /Transaction lock retained/)
  assert.equal((await f.registry()).claims["TASK-1"].phase, "claiming")
  assert.ok(await readFile(resolve(f.root, ".agents/agent-workspace/runtime/locks/write.lock/owner.json")))
  // The disposable child has exited; no descendants were launched by this fixture.
  await rm(resolve(f.root, ".agents/agent-workspace/runtime/locks/write.lock"), {
    recursive: true,
  })
  await rm(resolve(f.root, "signal-after"))
  await f.ok("reconcile", "--session", owner.id)
  assert.equal((await f.registry()).claims["TASK-1"].phase, "active")
})

test("CLI named-agent defaults, bounded runs, inherited workers, and deferred decisions compose", async (t) => {
  const f = await fixture(t)
  const goku = await f.start("Goku")
  assert.equal(goku.agent, "goku")
  assert.equal(goku.profile, "assisted")
  assert.equal(goku.policy.commits, "on-request")
  const lead = await f.ok(
    "start",
    "--provider",
    "codex",
    "--context",
    "user requested scope",
    "--profile",
    "unattended",
    "--allow-task",
    "TASK-1",
    "--allow-task",
    "TASK-2",
    "--authorization",
    "User authorized these two tasks unattended"
  )
  const worker = await f.ok(
    "start",
    "--agent",
    "elm",
    "--provider",
    "claude",
    "--context",
    "delegated work",
    "--run",
    lead.runId
  )
  const reviewer = await f.ok(
    "start",
    "--agent",
    "rowan",
    "--provider",
    "codex",
    "--context",
    "review",
    "--run",
    lead.runId
  )
  assert.deepEqual(worker.policy, lead.policy)
  assert.equal(
    (await f.run("start", "--agent", "birch", "--provider", "codex", "--context", "too many", "--run", lead.runId))
      .code,
    1
  )
  assert.equal((await f.run("claim", "--session", worker.id, "--task", "TASK-3")).code, 1)
  await f.ok("claim", "--session", worker.id, "--task", "TASK-1")
  await f.ok(
    "defer",
    "--session",
    worker.id,
    "--task",
    "TASK-1",
    "--kind",
    "decision",
    "--question",
    "Which save format?",
    "--option",
    "Versioned JSON",
    "--option",
    "Binary format",
    "--recommendation",
    "Versioned JSON",
    "--note",
    "Architecture decision changes persistence contract"
  )
  const queue = await f.ok("queue")
  assert.equal(queue.items.length, 1)
  assert.match(queue.items[0].notes, /Which save format/)
  assert.deepEqual(
    (await f.ok("ready", "--session", lead.id)).tasks.map((task) => task.id),
    ["TASK-2"]
  )
  assert.equal((await f.run("claim", "--session", worker.id, "--task", "TASK-1")).code, 1)
  await f.ok(
    "resolve",
    "--session",
    lead.id,
    "--task",
    "TASK-1",
    "--kind",
    "decision",
    "--note",
    "User chose versioned JSON in fixture"
  )
  assert.equal((await f.ok("queue")).items.length, 0)
  await f.ok("claim", "--session", worker.id, "--task", "TASK-1")
  await f.ok(
    "defer",
    "--session",
    worker.id,
    "--task",
    "TASK-1",
    "--kind",
    "approval",
    "--question",
    "Approve the prepared migration?",
    "--recommendation",
    "Review the prepared artifact",
    "--note",
    "Prepared artifact requires actual approval"
  )
  assert.deepEqual((await f.ok("queue")).items[0].labels, ["approval-required"])
  await f.ok("approve", "--session", lead.id, "--task", "TASK-1", "--note", "Synthetic explicit user approval")
  assert.equal((await f.run("stop", "--session", lead.id)).code, 1)
  await f.ok("stop", "--session", worker.id)
  await f.ok("stop", "--session", reviewer.id)
  await f.ok("stop", "--session", lead.id)
  await f.ok("stop", "--session", goku.id)
})

test("automatic Done cannot bypass commit gates, including direct status edits", async (t) => {
  const f = await fixture(t)
  const owner = await f.ok(
    "start",
    "--provider",
    "codex",
    "--context",
    "auto",
    "--profile",
    "unattended",
    "--allow-task",
    "TASK-1",
    "--authorization",
    "User scoped auto work"
  )
  await f.ok("claim", "--session", owner.id, "--task", "TASK-1")
  assert.equal((await f.native("backlog", "--session", owner.id, "--", "task", "edit", "TASK-1", "-s", "Done")).code, 1)
  assert.equal(
    (
      await f.native(
        "backlog",
        "--session",
        owner.id,
        "--",
        "task",
        "edit",
        "TASK-1",
        "--check-ac",
        "1",
        "--final-summary",
        "Synthetic verified work"
      )
    ).code,
    0
  )
  await f.ok("visual", "--session", owner.id, "--task", "TASK-1", "--kind", "no-ui", "--note", "No UI in fixture")
  const release = await f.run(
    "release",
    "--session",
    owner.id,
    "--task",
    "TASK-1",
    "--outcome",
    "done",
    "--note",
    "no commit yet"
  )
  assert.equal(release.code, 1)
  assert.match(release.err, /verified commits/)
  assert.equal((await f.registry()).claims["TASK-1"].phase, "active")
})

test("serialized compaction preserves concurrent starts and archives only closed history", async (t) => {
  const f = await fixture(t)
  const old = await f.start()
  await f.ok("stop", "--session", old.id)
  const [owner, compacted] = await Promise.all([f.start(), f.ok("compact")])
  assert.equal(compacted.claims, 0)
  assert.equal((await f.registry()).sessions[owner.id].status, "active")
  assert.equal((await f.ok("history", "--session", old.id)).status, "closed")
  assert.equal((await f.ok("history", "--run", old.runId)).id, old.runId)
  await f.ok("stop", "--session", owner.id)
  assert.deepEqual((await f.registry()).sessions, {})
  assert.deepEqual((await f.registry()).runs, {})
})

test("archive failure persists closed status and compact finishes without reviving the session", async (t) => {
  const f = await fixture(t)
  const owner = await f.start()
  const obstacle = resolve(f.root, ".agents/agent-workspace/runtime/history/sessions")
  await mkdir(resolve(obstacle, ".."), { recursive: true })
  await writeFile(obstacle, "fixture obstacle")
  const stopped = await f.run("stop", "--session", owner.id)
  assert.equal(stopped.code, 1)
  assert.equal((await f.registry()).sessions[owner.id].status, "closed")
  await rm(obstacle)
  await f.ok("compact")
  assert.equal((await f.ok("history", "--session", owner.id)).status, "closed")
  assert.equal((await f.registry()).sessions[owner.id], undefined)
  assert.equal((await f.run("heartbeat", "--session", owner.id)).code, 1)
})
