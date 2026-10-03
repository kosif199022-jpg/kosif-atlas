import assert from "node:assert/strict"
import { spawnSync, spawn } from "node:child_process"
import { mkdtemp, mkdir, readFile, writeFile, readdir, cp, rm, symlink, readlink, access } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

import { exampleConfig } from "../scripts/examples.mjs"
import { withMaintenance } from "../scripts/installation.mjs"

const source = fileURLToPath(new URL("..", import.meta.url))
const tooling = ".agents/agent-workspace"
const managed = `${tooling}/scripts/agent-policy.mjs`
const manifest = `${tooling}/install-manifest.json`
const git = (root, ...args) => cmd(root, "git", args)

function cmd(root, binary, args, expected = 0) {
  const value = spawnSync(binary, args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, BACKLOG_CWD: root },
    timeout: 120000,
  })
  if (expected !== null) assert.equal(value.status, expected, `${args.join(" ")}\n${value.stdout}\n${value.stderr}`)
  return value
}
async function tree(root, prefix = "") {
  const result = {}
  for (const item of await readdir(join(root, prefix), { withFileTypes: true })) {
    if (item.name === ".git") continue
    const path = prefix ? `${prefix}/${item.name}` : item.name
    if (item.isDirectory()) Object.assign(result, await tree(root, path))
    else
      result[path] = item.isSymbolicLink()
        ? `link:${await readlink(join(root, path))}`
        : (await readFile(join(root, path))).toString("base64")
  }
  return result
}
async function fixture(t, mode = "local") {
  const temp = await mkdtemp(join(tmpdir(), "workspace-updater-"))
  t.after(() => rm(temp, { recursive: true, force: true }))
  const skill = join(temp, "skills/setup-agent-workspace")
  await cp(source, skill, { recursive: true })
  for (const name of ["unattended-work", "visual-evidence-review"])
    await cp(join(source, "..", name), join(temp, "skills", name), { recursive: true })
  const root = join(temp, "project")
  await mkdir(root)
  git(root, "init", "--quiet")
  const config = join(temp, "config.json")
  await writeFile(config, JSON.stringify(exampleConfig("single-repo"), null, 2))
  const scripts = join(skill, "scripts")
  cmd(temp, process.execPath, [
    join(scripts, "init.mjs"),
    "--target",
    root,
    "--config",
    config,
    "--skills",
    mode,
    "--offline",
    "--apply",
  ])
  return {
    temp,
    root,
    skill,
    scripts,
    template: join(skill, "assets/template"),
    update: (...args) =>
      cmd(temp, process.execPath, [join(scripts, "update.mjs"), "--target", root, "--offline", ...args], null),
    publish: (version = "0.2.0") =>
      cmd(temp, process.execPath, [join(scripts, "bundle.mjs"), "--write", "--version", version]),
    agent: (...args) => cmd(root, process.execPath, [join(root, tooling, "scripts/agents.mjs"), ...args], null),
  }
}
function okay(value) {
  assert.equal(value.status, 0, `${value.stdout}\n${value.stderr}`)
  return value
}

test("portable release upgrades and deletes managed files, preserves configuration/runtime/backlog/index, and is idempotent", async (t) => {
  const f = await fixture(t)
  await writeFile(join(f.root, "sentinel.txt"), "staged checkpoint\n")
  git(f.root, "add", "sentinel.txt")
  const index = await readFile(join(f.root, ".git/index"))
  const config = await readFile(join(f.root, "agent-workspace.json"))
  const backlog = await tree(join(f.root, "backlog"))
  await mkdir(join(f.root, tooling, "runtime/history"))
  await writeFile(join(f.root, tooling, "runtime/history/retained.json"), "retained history")
  const runtime = await tree(join(f.root, tooling, "runtime"))
  await writeFile(
    join(f.root, "AGENTS.md"),
    `Human preface\n${await readFile(join(f.root, "AGENTS.md"), "utf8")}Human postscript\n`
  )
  await writeFile(
    join(f.template, managed),
    `${await readFile(join(f.template, managed), "utf8")}\n// New release fixture.\n`
  )
  await rm(join(f.template, tooling, "tests/agent-policy.test.mjs"))
  f.publish()
  const before = await tree(f.root)
  assert.equal(f.update("--check").status, 2)
  const preview = JSON.parse(okay(f.update("--dry-run")).stdout)
  assert.ok(preview.files.some((entry) => entry.action === "delete"))
  assert.deepEqual(
    preview.files.slice(-2).map((entry) => entry.path),
    [`${tooling}/scripts/agents.mjs`, manifest]
  )
  assert.deepEqual(await tree(f.root), before)
  okay(f.update("--apply"))
  assert.deepEqual(await readFile(join(f.root, ".git/index")), index)
  assert.deepEqual(await readFile(join(f.root, "agent-workspace.json")), config)
  assert.deepEqual(await tree(join(f.root, "backlog")), backlog)
  assert.deepEqual(await tree(join(f.root, tooling, "runtime")), runtime)
  assert.match(await readFile(join(f.root, "AGENTS.md"), "utf8"), /^Human preface\n[\s\S]*Human postscript\n$/)
  assert.equal(JSON.parse(await readFile(join(f.root, manifest), "utf8")).release, "0.2.0")
  const after = await tree(f.root)
  okay(f.update("--apply"))
  okay(f.update("--check"))
  cmd(f.root, process.execPath, [join(f.root, tooling, "scripts/check-installation.mjs")])
  assert.deepEqual(await tree(f.root), after)
})

test("local changes and staged managed files fail before writes", async (t) => {
  const f = await fixture(t)
  const original = await readFile(join(f.root, managed))
  await writeFile(join(f.root, managed), "Human source edit\n")
  assert.match(
    cmd(f.root, process.execPath, [join(f.root, tooling, "scripts/check-installation.mjs")], null).stderr,
    /Installed tooling drift/
  )
  const before = await tree(f.root)
  assert.match(f.update("--apply").stderr, /Local managed file conflict/)
  assert.deepEqual(await tree(f.root), before)
  await writeFile(join(f.root, managed), original)
  git(f.root, "add", managed)
  await writeFile(join(f.template, managed), `${original}\n// Incoming change\n`)
  f.publish()
  const stagedBefore = await tree(f.root)
  const index = await readFile(join(f.root, ".git/index"))
  assert.match(f.update("--apply").stderr, /staged managed file/)
  assert.deepEqual(await tree(f.root), stagedBefore)
  assert.deepEqual(await readFile(join(f.root, ".git/index")), index)
})

test("adoption verifies a legacy baseline, preserves user instructions, and refuses divergent files", async (t) => {
  const f = await fixture(t)
  await rm(join(f.root, manifest))
  const legacy = join(f.temp, "legacy-template")
  await cp(f.template, legacy, { recursive: true })
  await writeFile(join(f.template, managed), `${await readFile(join(f.template, managed), "utf8")}\n// Upgraded\n`)
  f.publish()
  const before = await tree(f.root)
  assert.match(f.update("--apply").stderr, /No install manifest/)
  assert.match(f.update("--adopt", "--apply").stderr, /Legacy baseline conflict/)
  assert.deepEqual(await tree(f.root), before)
  okay(f.update("--adopt", "--baseline-template", legacy, "--apply"))
  okay(f.update("--check"))
})

test("local and external skill modes remove only unmodified managed copies and remain portable", async (t) => {
  const f = await fixture(t)
  await mkdir(join(f.root, ".agents/skills/custom"))
  await writeFile(join(f.root, ".agents/skills/custom/SKILL.md"), "User skill")
  okay(f.update("--skills", "external", "--apply"))
  assert.equal(JSON.parse(await readFile(join(f.root, manifest), "utf8")).skillsMode, "external")
  assert.equal(await readFile(join(f.root, ".agents/skills/custom/SKILL.md"), "utf8"), "User skill")
  assert.deepEqual(await tree(join(f.root, ".agents/skills/unattended-work")), {})
  okay(f.update("--skills", "local", "--apply"))
  await rm(join(f.temp, "skills/unattended-work"), { recursive: true })
  await rm(join(f.temp, "skills/visual-evidence-review"), { recursive: true })
  cmd(f.temp, process.execPath, [join(f.scripts, "bundle.mjs"), "--check"])
  okay(f.update("--check"))
})

test("external fresh setup skips operating skill copies and provider symlinks", async (t) => {
  const f = await fixture(t, "external")
  const files = await tree(f.root)
  assert.ok(!Object.keys(files).some((path) => path.startsWith(".agents/skills/") || path === ".claude/skills"))
  okay(f.update("--check"))
  okay(f.update("--skills", "local", "--apply"))
  assert.equal(await readlink(join(f.root, ".claude/skills")), "../.agents/skills")
})

test("active runs and shared maintenance locks prevent writes; queued commands reject changed releases", async (t) => {
  const f = await fixture(t)
  const session = JSON.parse(okay(f.agent("start", "--provider", "codex", "--context", "Maintenance test")).stdout)
  const active = await tree(f.root)
  assert.match(f.update("--apply").stderr, /Active runs/)
  assert.deepEqual(await tree(f.root), active)
  okay(f.agent("stop", "--session", session.id))
  let completion
  await withMaintenance(f.root, async () => {
    assert.match(f.update("--apply").stderr, /maintenance lock exists/)
    const child = spawn(
      process.execPath,
      [
        join(f.root, tooling, "scripts/agents.mjs"),
        "start",
        "--provider",
        "codex",
        "--context",
        "Queued during upgrade",
      ],
      { cwd: f.root, env: { ...process.env, BACKLOG_CWD: f.root } }
    )
    completion = new Promise((resolve) => {
      let stderr = ""
      child.stderr.on("data", (data) => {
        stderr += data
      })
      child.on("close", (code) => resolve({ code, stderr }))
    })
    await new Promise((resolve) => setTimeout(resolve, 500))
    const value = JSON.parse(await readFile(join(f.root, manifest), "utf8"))
    value.release = "0.2.0"
    await writeFile(join(f.root, manifest), JSON.stringify(value))
  })
  const completed = await completion
  assert.equal(completed.code, 1)
  assert.match(completed.stderr, /tooling changed while this command waited/)
  const state = JSON.parse(await readFile(join(f.root, tooling, "runtime/state.json"), "utf8"))
  assert.deepEqual(state.sessions, {})
})

test("malformed manifests, schema migrations, block conflicts and symlink escapes preserve target bytes", async (t) => {
  const f = await fixture(t)
  const original = await readFile(join(f.root, manifest))
  for (const mutation of [
    (value) => {
      value.files["../outside"] = "a".repeat(64)
    },
    (value) => {
      value.files[`${tooling}/runtime/state.json`] = "a".repeat(64)
    },
    (value) => {
      value.compatibility.workspaceSchema = 2
    },
  ]) {
    const value = JSON.parse(original)
    mutation(value)
    await writeFile(join(f.root, manifest), JSON.stringify(value))
    const before = await tree(f.root)
    assert.equal(f.update("--apply").status, 1)
    assert.deepEqual(await tree(f.root), before)
  }
  await writeFile(join(f.root, manifest), original)
  const instructions = await readFile(join(f.root, "AGENTS.md"))
  await writeFile(join(f.root, "AGENTS.md"), instructions.toString().replace("Read [", "Human changed ["))
  const before = await tree(f.root)
  assert.match(f.update("--apply").stderr, /managed block conflict/)
  assert.deepEqual(await tree(f.root), before)
  await writeFile(join(f.root, "AGENTS.md"), instructions)
  const outside = join(f.temp, "outside.mjs")
  await writeFile(outside, "outside")
  await rm(join(f.root, managed))
  await symlink(outside, join(f.root, managed))
  assert.match(f.update("--apply").stderr, /Refusing symlink/)
  assert.equal(await readFile(outside, "utf8"), "outside")
})

test("canonical sibling changes and modified template bytes require deliberate bundle regeneration", async (t) => {
  const f = await fixture(t)
  const canonical = join(f.temp, "skills/unattended-work/SKILL.md")
  await writeFile(canonical, `${await readFile(canonical, "utf8")}\nNew documented workflow.\n`)
  assert.match(cmd(f.temp, process.execPath, [join(f.scripts, "bundle.mjs"), "--check"], null).stderr, /bundle drift/)
  f.publish()
  cmd(f.temp, process.execPath, [join(f.scripts, "bundle.mjs"), "--check"])
  await writeFile(join(f.template, managed), "Unreleased changes")
  assert.match(f.update("--apply").stderr, /release hashes differ|Runtime build identity differs/)
})

test("zero-byte managed resources are installed and removed by release updates", async (t) => {
  const f = await fixture(t)
  const path = `${tooling}/tests/empty.fixture`
  await writeFile(join(f.template, path), "")
  f.publish("0.1.0")
  okay(f.update("--apply"))
  assert.equal((await readFile(join(f.root, path))).length, 0)
  await rm(join(f.template, path))
  f.publish()
  okay(f.update("--apply"))
  await assert.rejects(readFile(join(f.root, path)), { code: "ENOENT" })
})

test("a process loaded before its first manifest read cannot mutate an upgraded runtime", async (t) => {
  const f = await fixture(t)
  const paused = join(f.temp, "paused"),
    resume = join(f.temp, "resume")
  const preload = join(f.temp, "pause-first-read.mjs")
  await writeFile(
    preload,
    `import fs from 'node:fs'; import {syncBuiltinESMExports} from 'node:module'; const original=fs.promises.readFile; let held=false; fs.promises.readFile=async function(path,...args){if(!held && String(path).endsWith('/install-manifest.json')){held=true;fs.writeFileSync(${JSON.stringify(paused)},'paused');while(!fs.existsSync(${JSON.stringify(resume)})) await new Promise(r=>setTimeout(r,10));}return original.call(this,path,...args)};syncBuiltinESMExports();`
  )
  const child = spawn(
    process.execPath,
    [
      "--import",
      preload,
      join(f.root, tooling, "scripts/agents.mjs"),
      "start",
      "--provider",
      "codex",
      "--context",
      "Loaded old entrypoint",
    ],
    { cwd: f.root }
  )
  t.after(() => child.kill())
  const completed = new Promise((resolve) => {
    let stderr = ""
    child.stderr.on("data", (data) => {
      stderr += data
    })
    child.on("close", (code) => resolve({ code, stderr }))
  })
  for (let attempt = 0; ; attempt++) {
    try {
      await access(paused)
      break
    } catch {
      assert.ok(attempt < 300, "Old process did not pause")
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }
  const before = JSON.parse(await readFile(join(f.root, manifest), "utf8")).runtimeBuild
  await writeFile(
    join(f.template, managed),
    `${await readFile(join(f.template, managed), "utf8")}\n// New dependency build\n`
  )
  f.publish()
  okay(f.update("--apply"))
  assert.notEqual(JSON.parse(await readFile(join(f.root, manifest), "utf8")).runtimeBuild, before)
  await writeFile(resume, "resume")
  const result = await completed
  assert.equal(result.code, 1)
  assert.match(result.stderr, /Loaded runtime build differs/)
  const fresh = JSON.parse(okay(f.agent("start", "--provider", "codex", "--context", "Fresh release")).stdout)
  okay(f.agent("stop", "--session", fresh.id))
})

test("interrupted updates and legacy adoption retain mutation guard and resume exact incoming deletions", async (t) => {
  for (const adopt of [false, true]) {
    const f = await fixture(t)
    const legacy = join(f.temp, "legacy")
    await cp(f.template, legacy, { recursive: true })
    if (adopt) {
      await rm(join(f.root, manifest))
      await rm(join(f.root, "AGENT-WORKSPACE.md"))
    }
    const entrypoint = `${tooling}/scripts/agents.mjs`
    const oldEntrypoint = await readFile(join(f.root, entrypoint))
    await writeFile(
      join(f.template, managed),
      `${await readFile(join(f.template, managed), "utf8")}\n// Changed helper before entrypoint\n`
    )
    const removed = `${tooling}/tests/agent-policy.test.mjs`
    await rm(join(f.template, removed))
    f.publish()
    const preload = join(f.temp, "fail-entrypoint-publication.mjs")
    await writeFile(
      preload,
      `import fs from 'node:fs'; import {syncBuiltinESMExports} from 'node:module'; const original=fs.promises.rename;fs.promises.rename=async function(from,to,...args){if(String(to).endsWith('/scripts/agents.mjs'))throw new Error('INJECTED_PUBLICATION_FAILURE');return original.call(this,from,to,...args)};syncBuiltinESMExports();`
    )
    const args = adopt ? ["--adopt", "--baseline-template", legacy] : []
    const failure = cmd(
      f.root,
      process.execPath,
      ["--import", preload, join(f.scripts, "update.mjs"), "--target", f.root, "--offline", "--apply", ...args],
      null
    )
    assert.match(failure.stderr, /INJECTED_PUBLICATION_FAILURE/)
    assert.deepEqual(await readFile(join(f.root, entrypoint)), oldEntrypoint)
    await assert.rejects(readFile(join(f.root, removed)), { code: "ENOENT" })
    assert.match(
      f.agent("start", "--provider", "codex", "--context", "During incomplete update").stderr,
      /Incomplete workspace maintenance/
    )
    okay(f.update("--apply", ...args))
    await assert.rejects(readFile(join(f.root, tooling, "runtime/maintenance.json")), { code: "ENOENT" })
    okay(f.update("--check"))
    const session = JSON.parse(
      okay(f.agent("start", "--provider", "codex", "--context", "Recovered complete update")).stdout
    )
    okay(f.agent("stop", "--session", session.id))
  }
})
