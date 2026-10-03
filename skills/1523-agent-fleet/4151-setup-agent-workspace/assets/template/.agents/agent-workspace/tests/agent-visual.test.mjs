import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve, dirname } from "node:path"
import { test } from "node:test"

import { visualRecord, assertVisual } from "../scripts/agent-visual.mjs"

const webp = Buffer.from("UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=", "base64")
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC",
  "base64"
)
function fixture(t) {
  const root = mkdtempSync(resolve(tmpdir(), "workspace-visual-"))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const task = {
    id: "TASK-1",
    path: "backlog/tasks/task-1 - Example.md",
    implementationNotes: "Existing evidence",
  }
  const claim = {
    scopes: ["backlog/assets/task-1"],
    snapshots: {
      ".": { head: "before", files: [{ path: "ui.mjs", hash: "first", mode: "100644" }] },
    },
  }
  const write = (path, bytes = webp) => {
    mkdirSync(dirname(resolve(root, path)), { recursive: true })
    writeFileSync(resolve(root, path), bytes)
    return path
  }
  const register = (args = {}) => {
    const result = visualRecord({
      root,
      task,
      claim,
      kind: "no-ui",
      note: "Inspected actual change",
      ...args,
    })
    claim.visual = result.record
    task.implementationNotes = result.notes
    return result
  }
  return { root, task, claim, write, register }
}

test("comparisons embed relative WebP links, preserve notes, and bind artifacts to source content", (t) => {
  const f = fixture(t)
  const path = f.write("backlog/assets/task-1/menu.webp")
  f.register({ kind: "comparison", files: [path] })
  assert.match(f.task.implementationNotes, /Existing evidence/)
  assert.match(f.task.implementationNotes, /!\[Before and after: menu\]\(<\.\.\/assets\/task-1\/menu.webp>\)/)
  assert.doesNotThrow(() => assertVisual(f))
  f.claim.snapshots["."].head = "after-commit"
  assert.doesNotThrow(() => assertVisual(f))
  f.claim.snapshots["."].files[0].hash = "changed"
  assert.throws(() => assertVisual(f), /content changed/)
  f.register({ kind: "comparison", files: [path] })
  const changed = Buffer.from(webp)
  changed[changed.length - 1] ^= 1
  f.write(path, changed)
  assert.throws(() => assertVisual(f), /comparison changed/)
})

test("enforce three-image budget, claimed paths, valid containers, and exact retained evidence", (t) => {
  const f = fixture(t)
  const files = ["a", "b", "c", "d"].map((name) => f.write(`backlog/assets/task-1/${name}.webp`))
  assert.throws(() => f.register({ kind: "comparison", files }), /1-3/)
  assert.throws(() => f.register({ kind: "comparison", files: files.slice(0, 3) }), /at most three/)
  rmSync(resolve(f.root, files[3]))
  assert.throws(() => f.register({ kind: "comparison", files: files.slice(0, 2) }), /Every retained/)
  f.claim.scopes = ["src"]
  assert.throws(() => f.register({ kind: "comparison", files: files.slice(0, 3) }), /Claim/)
  f.claim.scopes = ["backlog/assets/task-1"]
  f.task.description = "![existing](old.webp)"
  assert.throws(() => f.register({ kind: "comparison", files: files.slice(0, 3) }), /at most three/)
  f.task.description = ""
  f.register({ kind: "comparison", files: files.slice(0, 3) })
  f.task.implementationNotes = f.task.implementationNotes.replace("../assets/task-1/a.webp", "missing.webp")
  assert.throws(() => assertVisual(f), /relative comparison/)
  f.write(files[0], "not an image")
  assert.throws(() => f.register({ kind: "comparison", files: files.slice(0, 3) }), /WebP container/)
})

test("explicit exemptions retain reasons and no-visible-change requires a stable local PNG overlay", (t) => {
  const f = fixture(t)
  for (const kind of ["no-ui", "text-only"]) {
    f.register({ kind })
    assert.doesNotThrow(() => assertVisual(f))
    assert.equal(f.claim.visual.images.length, 0)
  }
  assert.throws(() => f.register({ kind: "no-visible-change" }), /inspected --onion/)
  const onion = f.write(".local/onion.png", "plain text")
  assert.throws(() => f.register({ kind: "no-visible-change", onion }), /PNG onion/)
  f.write(onion, png)
  f.register({ kind: "no-visible-change", onion })
  assert.doesNotThrow(() => assertVisual(f))
  f.write(onion, Buffer.concat([png, Buffer.from("modified")]))
  assert.throws(() => assertVisual(f), /onion-skin evidence changed/)
  assert.throws(() => f.register({ note: " " }), /inspection/)
})

test("comparison evidence rejects path escapes and symlinks", (t) => {
  const f = fixture(t)
  assert.throws(() => f.register({ kind: "comparison", files: ["backlog/assets/task-1/../other.webp"] }), /slug/)
  const path = f.write(".local/real.webp")
  mkdirSync(resolve(f.root, "backlog/assets/task-1"), { recursive: true })
  symlinkSync(resolve(f.root, path), resolve(f.root, "backlog/assets/task-1/alias.webp"))
  assert.throws(() => f.register({ kind: "comparison", files: ["backlog/assets/task-1/alias.webp"] }), /Symlink/)
})
