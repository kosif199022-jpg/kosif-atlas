#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import { randomUUID } from "node:crypto"
import { realpathSync } from "node:fs"
import {
  mkdir,
  mkdtemp,
  lstat,
  readFile,
  writeFile,
  readdir,
  readlink,
  realpath,
  rm,
  rename,
  symlink,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, resolve, relative, join, sep } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { exampleConfig, layouts } from "./examples.mjs"
import {
  installedManifest,
  manifestPath,
  templateFiles,
  withMaintenance,
  assertNotStaged,
  publicationOrder,
  beginMaintenance,
  finishMaintenance,
} from "./installation.mjs"

const skill = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const template = resolve(skill, "assets/template")
const tooling = ".agents/agent-workspace"
const HELP = `Usage: node /path/to/setup-agent-workspace/scripts/init.mjs [options]

  --help                 Show this help; no prerequisites required
  --example LAYOUT       Print a complete editable root config and exit
                         ${layouts.join(" | ")}
  --target PATH          Existing Git workspace root to initialize
  --config PATH          Full agent-workspace.json input; required with --target
  --dry-run              Validate and print the plan without target writes (default)
  --apply                Apply the validated additive plan; never overwrite conflicts
  --offline              Require cached ajv-cli@5.0.0; prohibit npm network access
  --skills MODE          local (default) copies operating skills; external uses plugin skills

Requires Node 22+, Git, Backlog 1.51.0 and npm/npx. No agent is required.
All configured repositories must already exist, including initialized submodules.
Preview uses disposable staging outside the target; npm may populate its cache.
Existing instructions receive visible additive blocks; existing content is preserved.
No staging, commits, hooks, remotes, source scaffolding, or project dependencies change.
`
const fail = (message) => {
  throw new Error(message)
}

function options(args) {
  const result = {}
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (["--help", "--dry-run", "--apply", "--offline"].includes(arg)) result[arg.slice(2)] = true
    else if (["--target", "--config", "--example", "--skills"].includes(arg)) {
      if (!args[i + 1] || args[i + 1].startsWith("--")) fail(`Missing value for ${arg}.`)
      result[arg.slice(2)] = args[++i]
    } else fail(`Unknown option ${arg}. See --help.`)
  }
  if (result.apply && result["dry-run"]) fail("Choose --dry-run or --apply, not both.")
  if (result.skills && !["local", "external"].includes(result.skills)) fail("--skills must be local or external.")
  return result
}

function run(command, args, cwd, { optional = false } = {}) {
  const env = { ...process.env, BACKLOG_CWD: cwd }
  for (const key of ["GIT_DIR", "GIT_WORK_TREE", "GIT_COMMON_DIR", "GIT_INDEX_FILE"]) delete env[key]
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: "utf8",
    timeout: 120000,
    maxBuffer: 8 * 1024 * 1024,
  })
  if (!optional && (result.error || result.status !== 0))
    fail(`${command} ${args.join(" ")} failed:\n${result.error?.message ?? result.stderr ?? result.stdout}`)
  return result
}

async function stat(path) {
  try {
    return await lstat(path)
  } catch (error) {
    if (error.code === "ENOENT") return null
    throw error
  }
}

async function safePath(root, path, { leafSymlink = false } = {}) {
  const full = resolve(root, path)
  const rel = relative(root, full)
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || rel.startsWith(sep)) fail(`Unsafe output path: ${path}`)
  const parts = rel.split(sep)
  for (let i = 0; i < parts.length; i++) {
    const item = join(root, ...parts.slice(0, i + 1))
    const info = await stat(item)
    if (!info) break
    if (info.isSymbolicLink() && !(leafSymlink && i === parts.length - 1)) fail(`Refusing symlink path: ${item}`)
    if (i < parts.length - 1 && !info.isDirectory()) fail(`Expected directory: ${item}`)
  }
  return full
}

async function filesUnder(dir, prefix = "") {
  const files = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isSymbolicLink()) fail(`Template contains unsupported symlink: ${path}`)
    if (entry.isDirectory()) files.push(...(await filesUnder(join(dir, entry.name), path)))
    else if (entry.isFile()) files.push(path)
    else fail(`Template contains unsupported entry: ${path}`)
  }
  return files.sort()
}

async function validateConfig(config, staging, offline) {
  const path = join(staging, "agent-workspace.json")
  await writeFile(path, JSON.stringify(config))
  run(
    "npx",
    [
      "--yes",
      offline ? "--offline" : "--prefer-offline",
      "--package=ajv-cli@5.0.0",
      "ajv",
      "validate",
      "--spec=draft7",
      "--strict=true",
      "--all-errors",
      "--errors=text",
      "-s",
      join(template, tooling, "schema.json"),
      "-d",
      path,
    ],
    staging
  )
  const { executionConfig } = await import(pathToFileURL(join(template, tooling, "scripts/agent-policy.mjs")))
  executionConfig(config)
  const names = config.agents.map((agent) => agent.name)
  if (new Set(names).size !== names.length || !names.includes(config.defaultAgent))
    fail("Agent names must be unique and include defaultAgent.")
  const paths = config.repositories.map((repo) => repo.path)
  if (!paths.includes(".") || new Set(paths.map((path) => path.toLowerCase())).size !== paths.length)
    fail("Repositories must include . and have unique paths.")
  if (config.repositories.find((repo) => repo.path === ".").readOnly)
    fail("The root repository must allow workspace planning and coordination changes.")
  for (const path of paths) {
    if (/[\r\n*?\[\]{}#!]/.test(path))
      fail(`Use a literal repository path without glob, newline, or gitignore metacharacters: ${path}`)
    if (
      path !== "." &&
      (path.startsWith("./") ||
        path.endsWith("/") ||
        path.split("/").some((part) => !part || part === "." || part === ".git" || part === ".."))
    )
      fail(`Use a canonical workspace-relative repository path: ${path}`)
    if (
      path !== "." &&
      [".agents", ".claude", ".local", "backlog"].some(
        (reserved) => path.toLowerCase() === reserved || path.toLowerCase().startsWith(`${reserved}/`)
      )
    )
      fail(`Repository path overlaps workspace tooling: ${path}`)
  }
  const statuses = [config.backlog.todoStatus, config.backlog.activeStatus, config.backlog.doneStatus]
  if (new Set(statuses).size !== 3 || statuses.some((value) => value.includes(",") || value.includes("\n")))
    fail("Use three distinct Backlog status names without commas or newlines.")
}

async function repositoryLayout(root, config) {
  const result = []
  for (const repo of config.repositories) {
    const path = repo.path === "." ? root : await safePath(root, repo.path)
    if (!(await stat(path))?.isDirectory())
      fail(
        `Repository missing: ${repo.path}. Initialize/clone it before setup; submodules must already be initialized.`
      )
    const top = run("git", ["rev-parse", "--show-toplevel"], path, { optional: true })
    if (top.status !== 0 || (await realpath(top.stdout.trim())) !== (await realpath(path)))
      fail(
        `${repo.path} must be its own initialized Git repository, not just a folder in its parent. Missing submodules must be initialized before setup.`
      )
    const superproject = run("git", ["rev-parse", "--show-superproject-working-tree"], path).stdout.trim()
    result.push({
      path: repo.path,
      kind: repo.path === "." ? "root" : superproject ? "submodule" : "independent",
    })
  }
  return result
}

async function trackerFiles(root, config, staging) {
  const native = (args, cwd = root, optional = false) =>
    run(config.backlog.command, [...(config.backlog.args ?? []), ...args], cwd, { optional })
  const version = native(["--version"]).stdout.trim()
  if (version !== "1.51.0")
    fail(
      `Backlog ${version} is installed; this bundle is verified with 1.51.0. Validate another version before adapting this check.`
    )
  const desired = [config.backlog.todoStatus, config.backlog.activeStatus, config.backlog.doneStatus]
  // Native config discovery walks ancestors, even across nested Git roots.
  // Establish target ownership before calling it; never adopt an ancestor tracker.
  for (const path of ["backlog.config.yml", "backlog.config.yaml", ".backlog"])
    if (await stat(join(root, path)))
      fail(
        "This bundle supports existing backlog/config.yml projects. A custom Backlog directory or root-config layout needs explicit adaptation; no existing tracker files were changed."
      )
  const standardConfig = await safePath(root, "backlog/config.yml")
  if ((await stat(standardConfig))?.isFile()) {
    const existing = native(["config", "get", "statuses"])
    const listing = native(["config", "list"]).stdout
    if (!/^\s*taskPrefix:\s*task(?:\s|$)/m.test(listing))
      fail(
        "This bundle currently requires Backlog's task prefix (TASK IDs). A custom prefix needs explicit adaptation; no tracker files were changed."
      )
    const statuses = existing.stdout.trim().split(/,\s*/)
    if (desired.some((value) => !statuses.includes(value)))
      fail(
        `Existing Backlog statuses are ${existing.stdout.trim()}; map todoStatus, activeStatus, and doneStatus to those names. Existing tracker configuration was not changed.`
      )
    for (const key of ["filesystemOnly", "autoCommit"])
      if (native(["config", "get", key]).stdout.trim() !== "false")
        fail(
          `Existing Backlog ${key} must be false for guarded coordination. Review that tracker policy before changing it; setup leaves it untouched.`
        )
    return { kind: "existing", files: [] }
  }
  if (await stat(join(root, "backlog")))
    fail(
      "A backlog directory exists without a readable native configuration. Inspect it before setup; it will not be overwritten."
    )
  if (JSON.stringify(desired) !== JSON.stringify(["To Do", "In Progress", "Done"]))
    fail(
      "Fresh Backlog initialization uses To Do, In Progress, and Done. Use those mappings for a new tracker; custom mappings are supported for existing trackers with matching statuses."
    )
  const fresh = join(staging, "tracker")
  await mkdir(fresh)
  native(
    [
      "init",
      config.project,
      "--defaults",
      "--no-git",
      "--integration-mode",
      "none",
      "--check-branches",
      "false",
      "--include-remote",
      "false",
      "--auto-open-browser",
      "false",
      "--backlog-dir",
      "backlog",
      "--config-location",
      "folder",
    ],
    fresh
  )
  native(["config", "set", "autoCommit", "false"], fresh)
  native(["config", "set", "filesystemOnly", "false"], fresh)
  return {
    kind: "new",
    files: await Promise.all(
      (await filesUnder(join(fresh, "backlog"))).map(async (path) => ({
        path: `backlog/${path}`,
        content: await readFile(join(fresh, "backlog", path)),
      }))
    ),
  }
}

function block(name, text) {
  return `<!-- BEGIN ${name} -->\n${text}\n<!-- END ${name} -->`
}

async function filePlan(root, path, content, { append = false } = {}) {
  const full = await safePath(root, path)
  const info = await stat(full)
  if (info && !info.isFile()) fail(`Existing destination is not a regular file: ${path}`)
  const before = info ? await readFile(full) : null
  const expected = Buffer.isBuffer(content) ? content : Buffer.from(content)
  if (before?.equals(expected) || (append && before?.toString().includes(expected.toString())))
    return { path, action: "unchanged", before, content: before }
  if (before && !append)
    fail(`Refusing to overwrite existing ${path}; compare and integrate it explicitly, then preview again.`)
  if (before && append && /BEGIN agent-workspace/.test(before.toString()))
    fail(`Existing agent-workspace block differs in ${path}; review it explicitly before rerunning setup.`)
  return {
    path,
    action: before ? "append" : "create",
    before,
    content: before
      ? Buffer.concat([
          before,
          Buffer.from(before.toString().endsWith("\n") ? "\n" : "\n\n"),
          expected,
          Buffer.from("\n"),
        ])
      : Buffer.concat([expected, append ? Buffer.from("\n") : Buffer.alloc(0)]),
    addition: append ? expected.toString() : undefined,
  }
}

async function plan(root, config, staging, skillsMode = "local") {
  const repositories = await repositoryLayout(root, config)
  const tracker = await trackerFiles(root, config, staging)
  const entries = []
  for (const path of await templateFiles(skillsMode))
    entries.push(await filePlan(root, path, await readFile(join(template, path))))
  entries.push(await filePlan(root, "agent-workspace.json", `${JSON.stringify(config, null, 2)}\n`))
  for (const file of tracker.files) entries.push(await filePlan(root, file.path, file.content))
  entries.push(
    await filePlan(
      root,
      "AGENTS.md",
      block(
        "agent-workspace",
        "Read [AGENT-WORKSPACE.md](AGENT-WORKSPACE.md) and `agent-workspace.json` before coordinated project work. Project-specific instructions elsewhere in this file still apply."
      ),
      { append: true }
    )
  )
  entries.push(
    await filePlan(root, "CLAUDE.md", block("agent-workspace", "@AGENTS.md\n@AGENT-WORKSPACE.md"), {
      append: true,
    })
  )
  const ignores = [
    "# BEGIN agent-workspace",
    `/${tooling}/runtime/`,
    `/${tooling}/**/__pycache__/`,
    "/.local/",
    ...repositories.filter((repo) => repo.kind === "independent").map((repo) => `/${repo.path}/`),
    "# END agent-workspace",
  ].join("\n")
  entries.push(await filePlan(root, ".gitignore", ignores, { append: true }))
  if (skillsMode === "local") {
    const link = ".claude/skills"
    const linkPath = await safePath(root, link, { leafSymlink: true })
    const linkInfo = await stat(linkPath)
    if (linkInfo && (!linkInfo.isSymbolicLink() || (await readlink(linkPath)) !== "../.agents/skills"))
      fail(
        "Existing .claude/skills conflicts; preserve it and deliberately merge its skills into canonical .agents/skills before setup."
      )
    entries.push({
      path: link,
      action: linkInfo ? "unchanged" : "symlink",
      target: "../.agents/skills",
    })
  }
  entries.push(
    await filePlan(root, manifestPath, `${JSON.stringify(await installedManifest(entries, skillsMode), null, 2)}\n`)
  )
  for (const entry of entries) {
    if (
      run("git", ["check-ignore", "--no-index", "--quiet", "--", entry.path], root, {
        optional: true,
      }).status === 0
    )
      fail(
        `Existing Git ignore rules hide generated tracked file ${entry.path}. Deliberately narrow those rules while preserving unrelated ignored files, then rerun preview; setup will not unignore them broadly.`
      )
  }
  await safePath(root, `${tooling}/runtime/locks/setup.lock`)
  return { root, repositories, tracker: tracker.kind, entries: publicationOrder(entries) }
}

async function assertUnchanged(root, entry) {
  const path = await safePath(root, entry.path, { leafSymlink: Boolean(entry.target) })
  const info = await stat(path)
  if (entry.target) {
    if (entry.action === "symlink" ? info !== null : !info?.isSymbolicLink() || (await readlink(path)) !== entry.target)
      fail(`Destination changed since preview: ${entry.path}`)
  } else if (entry.before === null ? info !== null : !info?.isFile() || !(await readFile(path)).equals(entry.before))
    fail(`Destination changed since preview: ${entry.path}`)
  return path
}

async function apply(plan) {
  await withMaintenance(plan.root, async () => {
    assertNotStaged(plan.root, plan.entries)
    for (const entry of plan.entries) await assertUnchanged(plan.root, entry)
    await beginMaintenance(plan.root, plan.entries)
    for (const entry of plan.entries) {
      if (entry.action === "unchanged") continue
      const path = await assertUnchanged(plan.root, entry)
      await mkdir(dirname(path), { recursive: true })
      if (entry.action === "symlink") await symlink(entry.target, path)
      else if (entry.action === "create") await writeFile(path, entry.content, { flag: "wx" })
      else {
        const temporary = `${path}.${randomUUID()}.tmp`
        try {
          await writeFile(temporary, entry.content, { flag: "wx", mode: (await lstat(path)).mode })
          await assertUnchanged(plan.root, entry)
          await rename(temporary, path)
        } finally {
          await rm(temporary, { force: true })
        }
      }
    }
    await finishMaintenance(plan.root)
  })
}

async function main() {
  const opts = options(process.argv.slice(2))
  if (opts.help) {
    process.stdout.write(HELP)
    return
  }
  if (opts.example) {
    if (opts.target || opts.config || opts.apply)
      fail("--example only prints a configuration; use it separately from setup.")
    process.stdout.write(`${JSON.stringify(exampleConfig(opts.example), null, 2)}\n`)
    return
  }
  if (!opts.target || !opts.config) fail("--target and --config are required. See --help or --example.")
  if (Number(process.versions.node.split(".")[0]) < 22) fail("Node.js 22 or later is required.")
  const root = await realpath(resolve(opts.target))
  const config = JSON.parse(await readFile(resolve(opts.config), "utf8"))
  config.$schema = `./${tooling}/schema.json`
  const staging = await mkdtemp(join(tmpdir(), "agent-workspace-setup-"))
  try {
    await validateConfig(config, staging, opts.offline)
    const result = await plan(root, config, staging, opts.skills ?? "local")
    process.stdout.write(
      `${JSON.stringify({ mode: opts.apply ? "apply" : "preview", root, repositories: result.repositories, backlog: result.tracker, files: result.entries.map(({ path, action, addition, target }) => ({ path, action, ...(addition ? { addition } : {}), ...(target ? { target } : {}) })) }, null, 2)}\n`
    )
    if (opts.apply) {
      await apply(result)
      process.stdout.write(
        "Applied. Git index/HEAD/hooks/config were not changed. Read AGENT-WORKSPACE.md for validation and first-session commands.\n"
      )
    }
  } finally {
    await rm(staging, { recursive: true, force: true })
  }
}

export {
  skill,
  template,
  tooling,
  fail,
  run,
  stat,
  safePath,
  filesUnder,
  validateConfig,
  repositoryLayout,
  block,
  filePlan,
  assertUnchanged,
  apply,
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  })
