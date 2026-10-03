import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { test } from "node:test"

import { captureBaseline, prepareSnapshot } from "../scripts/agent-git.mjs"
import { trackTask, assertTrackedTask, fileDigest } from "../scripts/agent-tracker.mjs"

function fixture(t) {
  const root = mkdtempSync(resolve(tmpdir(), "workspace-tracker-"))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const git = (...args) => {
    const result = spawnSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" },
    })
    assert.equal(result.status, 0, result.stderr)
  }
  git("init", "--quiet")
  git("config", "user.name", "Fixture")
  git("config", "user.email", "fixture@example.invalid")
  git("config", "commit.gpgsign", "false")
  git("config", "core.hooksPath", resolve(root, ".git/hooks"))
  mkdirSync(resolve(root, "backlog/tasks"), { recursive: true })
  const task = { path: "backlog/tasks/task-1.md" }
  const write = (value) => writeFileSync(resolve(root, task.path), value)
  const commit = () => {
    git("add", task.path)
    git("commit", "--quiet", "-m", "Fixture task")
  }
  write("original\n")
  commit()
  const run = { repositories: [{ path: ".", readOnly: false }], tracker: {} }
  return { root, task, run, write, commit }
}

test("exact shared provenance survives handoffs while unknown edits and pending writes fail closed", (t) => {
  const f = fixture(t)
  const entry = trackTask(f)
  f.write("known native update\n")
  entry.hash = fileDigest(f.root, f.task.path)
  const nextRun = { repositories: f.run.repositories, tracker: f.run.tracker }
  assert.equal(trackTask({ ...f, run: nextRun }), entry)
  assert.equal(assertTrackedTask({ ...f, run: nextRun }), entry)
  f.write("unowned update\n")
  assert.throws(() => trackTask(f), /outside its recorded writer/)
  assert.throws(() => assertTrackedTask(f), /outside the recorded writer/)
  f.write("known native update\n")
  entry.pending = true
  assert.throws(() => trackTask(f), /interrupted write/)
  assert.throws(() => assertTrackedTask(f), /outside the recorded writer/)
})

test("inherited task dirt is not adopted; a later clean human commit establishes a safe baseline", (t) => {
  const f = fixture(t)
  f.write("human work\n")
  assert.equal(trackTask(f).eligible, false)
  assert.throws(() => assertTrackedTask(f), /already dirty/)
  f.commit()
  assert.equal(trackTask(f).eligible, true)
  f.write("new human work\n")
  f.commit()
  assert.equal(trackTask(f).hash, fileDigest(f.root, f.task.path))
  assert.doesNotThrow(() => assertTrackedTask(f))
})

test("a wrapper-created task carries its pre-create clean baseline into an exact metadata snapshot", (t) => {
  const f = fixture(t)
  const baseline = captureBaseline({ root: f.root, repositories: f.run.repositories })
  const task = { path: "backlog/tasks/task-2.md" }
  writeFileSync(resolve(f.root, task.path), "new native task\n")
  const entry = trackTask({ ...f, task, baseline, created: true })
  assert.equal(entry.eligible, true)
  const snapshot = prepareSnapshot({
    root: f.root,
    repoPath: ".",
    repositories: f.run.repositories,
    paths: [task.path],
    scopes: [task.path],
    baseline: entry.baseline,
  })
  assert.deepEqual(
    snapshot.files.map((file) => file.path),
    [task.path]
  )
})

test("task evidence paths reject traversal and symlink ancestors", (t) => {
  const f = fixture(t)
  assert.throws(() => fileDigest(f.root, "backlog/../backlog/tasks/task-1.md"), /literal/)
  symlinkSync(resolve(f.root, "backlog/tasks"), resolve(f.root, "alias"))
  assert.throws(() => fileDigest(f.root, "alias/task-1.md"), /Symlink/)
})
