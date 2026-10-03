import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtemp, mkdir, readFile, writeFile, readdir, readlink, symlink, rm, access } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

import { exampleConfig, layouts } from "../scripts/examples.mjs"

const cli = fileURLToPath(new URL("../scripts/init.mjs", import.meta.url))
const bundled = fileURLToPath(new URL("../assets/template", import.meta.url))
const runtime = ".agents/agent-workspace/runtime"

function command(cwd, executable, args, expected = 0) {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, BACKLOG_CWD: cwd },
    timeout: 120000,
    maxBuffer: 10 * 1024 * 1024,
  })
  if (expected !== null)
    assert.equal(
      result.status,
      expected,
      `${executable} ${args.join(" ")}\n${result.stdout}\n${result.stderr}\n${result.error ?? ""}`
    )
  return result
}
const git = (cwd, ...args) => command(cwd, "git", args).stdout.trim()
const native = (cwd, ...args) => command(cwd, "backlog", args).stdout
const agent = (cwd, ...args) =>
  JSON.parse(command(cwd, process.execPath, [join(cwd, ".agents/agent-workspace/scripts/agents.mjs"), ...args]).stdout)

async function tree(root, path = "") {
  const result = {}
  for (const item of await readdir(join(root, path), { withFileTypes: true })) {
    if (item.name === ".git") continue
    const rel = path ? `${path}/${item.name}` : item.name
    if (item.isDirectory()) {
      result[`${rel}/`] = "directory"
      Object.assign(result, await tree(root, rel))
    } else if (item.isSymbolicLink()) result[rel] = `link:${await readlink(join(root, rel))}`
    else result[rel] = (await readFile(join(root, rel))).toString("base64")
  }
  return result
}

async function fixture(t, layout = "single-repo") {
  const temp = await mkdtemp(join(tmpdir(), "agent-workspace-installer-"))
  t.after(() => rm(temp, { recursive: true, force: true }))
  const root = join(temp, "project")
  await mkdir(root)
  git(root, "init", "--quiet")
  const config = exampleConfig(layout)
  config.project = `Disposable ${layout}`
  const configPath = join(temp, "input.json")
  const save = () => writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`)
  await save()
  return {
    temp,
    root,
    config,
    configPath,
    save,
    init: (...args) =>
      command(temp, process.execPath, [cli, "--target", root, "--config", configPath, "--offline", ...args], null),
  }
}

function okay(result) {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}\n${result.error ?? ""}`)
  return result
}

test("help and examples work without target setup", () => {
  assert.match(command(tmpdir(), process.execPath, [cli, "--help"]).stdout, /--dry-run/)
  for (const layout of layouts)
    assert.deepEqual(
      JSON.parse(command(tmpdir(), process.execPath, [cli, "--example", layout]).stdout),
      exampleConfig(layout)
    )
})

test("preview is read-only; apply preserves staged checkpoint, instructions and hooks; replay is idempotent", async (t) => {
  const f = await fixture(t)
  await writeFile(join(f.root, "AGENTS.md"), "User project instructions.\n")
  await writeFile(join(f.root, "CLAUDE.md"), "User Claude instructions.\n")
  await writeFile(join(f.root, ".gitignore"), ".cache/\n")
  await writeFile(join(f.root, "sentinel.txt"), "Reviewed checkpoint\n")
  git(f.root, "add", "sentinel.txt")
  const index = await readFile(join(f.root, ".git/index"))
  const gitConfig = await readFile(join(f.root, ".git/config"))
  const hookPath = join(f.root, ".git/hooks/pre-commit")
  await writeFile(hookPath, "#!/bin/sh\nexit 88\n", { mode: 0o755 })
  const before = await tree(f.root)
  const preview = JSON.parse(okay(f.init("--dry-run")).stdout)
  assert.equal(preview.mode, "preview")
  assert.ok(preview.files.find((file) => file.path === "AGENTS.md").addition)
  assert.deepEqual(await tree(f.root), before)
  okay(f.init("--apply"))
  assert.deepEqual(await readFile(join(f.root, ".git/index")), index)
  assert.deepEqual(await readFile(join(f.root, ".git/config")), gitConfig)
  assert.equal(await readFile(hookPath, "utf8"), "#!/bin/sh\nexit 88\n")
  assert.match(await readFile(join(f.root, "AGENTS.md"), "utf8"), /^User project instructions\.\n/)
  assert.match(await readFile(join(f.root, "CLAUDE.md"), "utf8"), /^User Claude instructions\.\n/)
  assert.equal(await readlink(join(f.root, ".claude/skills")), "../.agents/skills")
  assert.equal(command(f.root, "git", ["check-ignore", `${runtime}/state.json`], null).status, 0)
  assert.equal(command(f.root, "git", ["check-ignore", ".agents/agent-workspace/scripts/agents.mjs"], null).status, 1)
  assert.equal(command(f.root, "git", ["check-ignore", ".agents/skills/unattended-work/SKILL.md"], null).status, 1)
  assert.equal(command(f.root, "git", ["check-ignore", ".claude/skills"], null).status, 1)
  await assert.rejects(access(join(f.root, "node_modules")))
  await assert.rejects(access(join(f.root, "package.json")))
  const first = await tree(f.root)
  const again = okay(f.init("--apply"))
  assert.match(again.stdout, /"action": "unchanged"/)
  assert.deepEqual(await tree(f.root), first)
  native(f.root, "doctor")
})

test("generated project completes a real assisted coordination lifecycle and retains history", async (t) => {
  const f = await fixture(t, "monorepo")
  await mkdir(join(f.root, "apps"))
  await mkdir(join(f.root, "packages"))
  await writeFile(join(f.root, "package.json"), '{"private":true,"packageManager":"pnpm@10.0.0"}\n')
  await writeFile(join(f.root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n  - packages/*\n")
  okay(f.init("--apply"))
  assert.equal(
    await readFile(join(f.root, "package.json"), "utf8"),
    '{"private":true,"packageManager":"pnpm@10.0.0"}\n'
  )
  const session = agent(f.root, "start", "--provider", "codex", "--context", "Disposable standalone setup lifecycle")
  command(f.root, process.execPath, [
    join(f.root, ".agents/agent-workspace/scripts/agents.mjs"),
    "backlog",
    "--session",
    session.id,
    "--",
    "task",
    "create",
    "Verify installed coordination",
    "--ac",
    "Task completes in installed workspace",
    "--plain",
  ])
  agent(f.root, "claim", "--session", session.id, "--task", "TASK-1", "--scope", "apps")
  agent(
    f.root,
    "visual",
    "--session",
    session.id,
    "--task",
    "TASK-1",
    "--kind",
    "no-ui",
    "--note",
    "Only coordination lifecycle in a disposable fixture"
  )
  command(f.root, process.execPath, [
    join(f.root, ".agents/agent-workspace/scripts/agents.mjs"),
    "backlog",
    "--session",
    session.id,
    "--",
    "task",
    "edit",
    "TASK-1",
    "--check-ac",
    "1",
    "--final-summary",
    "Installed CLI claimed, recorded evidence, and completed this disposable task.",
  ])
  agent(
    f.root,
    "release",
    "--session",
    session.id,
    "--task",
    "TASK-1",
    "--outcome",
    "done",
    "--note",
    "Real Backlog lifecycle passed"
  )
  agent(f.root, "stop", "--session", session.id)
  assert.equal(JSON.parse(native(f.root, "task", "view", "TASK-1", "--json")).task.status, "Done")
  assert.deepEqual(JSON.parse(await readFile(join(f.root, runtime, "state.json"), "utf8")).claims, {})
  assert.equal(agent(f.root, "history", "--session", session.id).status, "closed")
  assert.equal(command(f.root, "git", ["rev-parse", "HEAD"], null).status, 128)
})

test("independent nested repositories remain separate and are ignored only in the parent", async (t) => {
  const f = await fixture(t, "multi-repo")
  for (const path of ["reference", "app"]) {
    await mkdir(join(f.root, path))
    git(join(f.root, path), "init", "--quiet")
  }
  const childConfig = await readFile(join(f.root, "app/.git/config"))
  const preview = JSON.parse(okay(f.init("--dry-run")).stdout)
  assert.deepEqual(
    preview.repositories.map((repo) => repo.kind),
    ["root", "independent", "independent"]
  )
  okay(f.init("--apply"))
  assert.equal(command(f.root, "git", ["check-ignore", "app/src.js"], null).status, 0)
  assert.deepEqual(await readFile(join(f.root, "app/.git/config")), childConfig)
  const session = agent(f.root, "start", "--provider", "claude", "--context", "Provider-neutral registration fixture")
  agent(f.root, "stop", "--session", session.id)
})

test("initialized Git submodules are recognized without changing .gitmodules, pointers or child Git state", async (t) => {
  const f = await fixture(t, "submodules")
  const source = join(f.temp, "source")
  await mkdir(source)
  git(source, "init", "--quiet")
  await writeFile(join(source, "source.txt"), "Submodule source\n")
  git(source, "add", "source.txt")
  git(
    source,
    "-c",
    "user.name=Fixture",
    "-c",
    "user.email=fixture@example.invalid",
    "commit",
    "--quiet",
    "-m",
    "Initial fixture"
  )
  for (const path of ["modules/library", "modules/app"])
    git(f.root, "-c", "protocol.file.allow=always", "submodule", "add", "--quiet", source, path)
  const index = await readFile(join(f.root, ".git/index"))
  const modules = await readFile(join(f.root, ".gitmodules"))
  const childHead = git(join(f.root, "modules/app"), "rev-parse", "HEAD")
  const preview = JSON.parse(okay(f.init("--dry-run")).stdout)
  assert.deepEqual(
    preview.repositories.map((repo) => repo.kind),
    ["root", "submodule", "submodule"]
  )
  okay(f.init("--apply"))
  assert.deepEqual(await readFile(join(f.root, ".git/index")), index)
  assert.deepEqual(await readFile(join(f.root, ".gitmodules")), modules)
  assert.equal(git(join(f.root, "modules/app"), "rev-parse", "HEAD"), childHead)
  assert.equal(command(f.root, "git", ["check-ignore", "--no-index", "modules/app"], null).status, 1)
})

test("existing Backlog tasks/configuration are preserved with mapped statuses", async (t) => {
  const f = await fixture(t)
  okay(f.init("--apply"))
  const configFile = join(f.root, "backlog/config.yml")
  // Fixture represents an existing human-configured tracker. Backlog 1.51.0
  // explicitly directs status-list changes to its config file, not config set.
  await writeFile(
    configFile,
    (await readFile(configFile, "utf8"))
      .replace(/^statuses:.*$/m, 'statuses: ["Ready", "Building", "Shipped"]')
      .replace(/^default_status:.*$/m, 'default_status: "Ready"')
  )
  native(f.root, "task", "create", "Existing human task", "--status", "Ready", "--plain")
  const tracker = await tree(join(f.root, "backlog"))
  await rm(join(f.root, "agent-workspace.json"))
  f.config.backlog.todoStatus = "Ready"
  f.config.backlog.activeStatus = "Building"
  f.config.backlog.doneStatus = "Shipped"
  await f.save()
  okay(f.init("--apply"))
  assert.deepEqual(await tree(join(f.root, "backlog")), tracker)
})

test("invalid inputs, conflicting files, and symlink escapes fail before target changes", async (t) => {
  const f = await fixture(t)
  f.config.agents[1].name = f.config.agents[0].name
  await f.save()
  let before = await tree(f.root)
  assert.match(f.init("--apply").stderr, /unique/)
  assert.deepEqual(await tree(f.root), before)
  f.config.agents[1].name = "builder"
  await f.save()
  await writeFile(join(f.root, "agent-workspace.json"), "Human configuration\n")
  before = await tree(f.root)
  assert.match(f.init("--apply").stderr, /Refusing to overwrite/)
  assert.deepEqual(await tree(f.root), before)
  await rm(join(f.root, "agent-workspace.json"))
  const outside = join(f.temp, "outside")
  await mkdir(outside)
  await symlink(outside, join(f.root, ".agents"))
  before = await tree(f.root)
  assert.match(f.init("--apply").stderr, /Refusing symlink/)
  assert.deepEqual(await tree(f.root), before)
  assert.deepEqual(await readdir(outside), [])
})

test("blanket ignores are not weakened and literal repository paths cannot inject ignore patterns", async (t) => {
  const f = await fixture(t)
  await mkdir(join(f.root, ".agents"))
  await writeFile(join(f.root, ".agents/private.json"), "Private ignored local data\n")
  await writeFile(join(f.root, ".gitignore"), ".agents/\n.claude/\n")
  const before = await tree(f.root)
  assert.match(f.init("--apply").stderr, /Existing Git ignore rules hide/)
  assert.deepEqual(await tree(f.root), before)
  assert.equal(command(f.root, "git", ["check-ignore", ".agents/private.json"], null).status, 0)
  for (const path of ["repo*", "repo\nexposed", ".AGENTS/child"]) {
    f.config.repositories.push({ path, readOnly: false })
    await f.save()
    assert.match(f.init("--apply").stderr, /literal repository path|overlaps workspace tooling|path must match pattern/)
    assert.deepEqual(await tree(f.root), before)
    f.config.repositories.pop()
  }
})

test("payload contains no live runtime, installer recursion, or source-project references", async () => {
  const files = await tree(bundled)
  assert.equal(
    Object.keys(files).some((path) => path.includes("/runtime/") || path.includes("setup-agent-workspace/")),
    false
  )
  for (const [path, value] of Object.entries(files)) {
    if (value === "directory") continue
    assert.doesNotMatch(
      Buffer.from(value, "base64").toString(),
      /newbark|\.local\/agents|agent-workspace\.schema\.json|\/Users\/javi/i,
      path
    )
  }
})

test("a new Git project nested beneath another Backlog gets its own tracker without ancestor writes", async (t) => {
  const f = await fixture(t)
  native(f.temp, "init", "Ancestor tracker", "--defaults", "--no-git", "--integration-mode", "none")
  const ancestor = await tree(join(f.temp, "backlog"))
  assert.match(native(f.root, "config", "get", "projectName"), /Ancestor tracker/)
  const before = await tree(f.root)
  const preview = JSON.parse(okay(f.init("--dry-run")).stdout)
  assert.equal(preview.backlog, "new")
  assert.deepEqual(await tree(f.root), before)
  assert.deepEqual(await tree(join(f.temp, "backlog")), ancestor)
  okay(f.init("--apply"))
  assert.match(native(f.root, "config", "get", "projectName"), /Disposable single-repo/)
  assert.deepEqual(await tree(join(f.temp, "backlog")), ancestor)
  native(f.root, "doctor")
})
