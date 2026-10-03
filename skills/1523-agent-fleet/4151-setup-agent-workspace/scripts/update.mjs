#!/usr/bin/env node
import { randomUUID } from "node:crypto"
import { realpathSync } from "node:fs"
import { readFile, writeFile, mkdir, mkdtemp, rename, rm, realpath, lstat, readlink, symlink } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve, join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

import {
  template,
  tooling,
  filesUnder,
  safePath,
  stat,
  validateConfig,
  repositoryLayout,
  run,
  block,
  assertUnchanged,
} from "./init.mjs"
import {
  hash,
  serialize,
  manifestPath,
  managedPath,
  templateFiles,
  releaseData,
  validateManifest,
  extractBlock,
  assertIdle,
  assertNotStaged,
  withMaintenance,
  publicationOrder,
  beginMaintenance,
  finishMaintenance,
  maintenancePath,
} from "./installation.mjs"

const HELP = `Usage: node /path/to/setup-agent-workspace/scripts/update.mjs --target PATH [options]

  --check                  Check drift; exit 2 when a safe update is available
  --dry-run                Print the full update plan without target writes (default)
  --apply                  Apply after preflight; all updater modes require closed runs
  --skills local|external  Keep local operating skills (default: installed mode), or
                           use installed Agent Fleet plugin/user skills without local copies
  --adopt                  Adopt a pre-manifest project after exact baseline verification
  --baseline-template PATH Legacy assets/template directory for --adopt (default: this release)
  --offline                Require a complete cached ajv-cli@5.0.0 dependency set
  --help                   Show this help

Root configuration, Backlog, runtime/history, and user instruction text are preserved.
Locally modified or staged managed files conflict. No force overwrite or Git mutation.
Resolve files deliberately or retain the prior release; unsupported schema migrations fail.
`
const fail = (message) => {
  throw new Error(message)
}

function options(args) {
  const result = {}
  for (let i = 0; i < args.length; i++) {
    const name = args[i]
    if (["--check", "--dry-run", "--apply", "--adopt", "--offline", "--help"].includes(name))
      result[name.slice(2)] = true
    else if (["--target", "--skills", "--baseline-template"].includes(name)) {
      if (!args[i + 1] || args[i + 1].startsWith("--")) fail(`Missing value for ${name}`)
      result[name.slice(2)] = args[++i]
    } else fail(`Unknown option ${name}`)
  }
  if ([result.check, result["dry-run"], result.apply].filter(Boolean).length > 1)
    fail("Choose one of --check, --dry-run, or --apply.")
  if (result.skills && !["local", "external"].includes(result.skills)) fail("--skills must be local or external.")
  if (result["baseline-template"] && !result.adopt) fail("--baseline-template requires --adopt.")
  return result
}

async function currentFile(root, path) {
  const full = await safePath(root, path)
  const info = await stat(full)
  if (info && !info.isFile()) fail(`Expected regular managed file: ${path}`)
  return info ? readFile(full) : null
}

async function baseline(root, opts, release) {
  const content = await currentFile(root, manifestPath)
  if (content) {
    if (opts.adopt) fail("Project already has an install manifest; omit --adopt.")
    return { value: validateManifest(JSON.parse(content)), content }
  }
  if (!opts.adopt)
    fail("No install manifest. Use init.mjs for new projects or --adopt with a verified legacy template.")
  const source = await realpath(resolve(opts["baseline-template"] ?? template))
  const pendingContent = await currentFile(root, maintenancePath)
  const pending = pendingContent ? JSON.parse(pendingContent) : null
  const resuming = pending?.runtimeBuild === release.runtimeBuild && pending?.release === release.release
  const files = {}
  for (const path of await filesUnder(source)) {
    if (!managedPath(path)) fail(`Unsafe legacy baseline path: ${path}`)
    const expected = hash(await readFile(join(source, path)))
    const actual = await currentFile(root, path)
    if (actual === null) {
      if (path === "AGENT-WORKSPACE.md") continue
      if (resuming && !Object.hasOwn(release.files, path)) {
        files[path] = expected
        continue
      }
      fail(`Legacy baseline file missing: ${path}. Inspect the incomplete installation before adopting.`)
    }
    const incoming = resuming ? await currentFile(template, path) : null
    if (hash(actual) !== expected && !(incoming && actual.equals(incoming)))
      fail(`Legacy baseline conflict: ${path}. Inspect and integrate before adopting; no overwrite was performed.`)
    files[path] = expected
  }
  if (!Object.keys(files).length) fail("No installed template files matched; use init.mjs for a new project.")
  return {
    value: {
      manifestVersion: 1,
      release: release.release,
      compatibility: release.compatibility,
      skillsMode: opts.skills ?? "local",
      files,
      blocks: {},
    },
    content: null,
  }
}

async function plan(root, opts) {
  const release = await releaseData()
  const { value: previous, content: manifestBefore } = await baseline(root, opts, release)
  const mode = opts.skills ?? previous.skillsMode
  const configBefore = await readFile(await safePath(root, "agent-workspace.json"))
  const config = JSON.parse(configBefore)
  const staging = await mkdtemp(join(tmpdir(), "agent-fleet-update-"))
  let repositories
  try {
    await validateConfig(config, staging, opts.offline)
    repositories = await repositoryLayout(root, config)
  } finally {
    await rm(staging, { recursive: true, force: true })
  }
  const desired = new Map()
  for (const path of await templateFiles(mode)) desired.set(path, await readFile(join(template, path)))
  const entries = [],
    files = {},
    blocks = {}
  for (const path of new Set([...Object.keys(previous.files), ...desired.keys()])) {
    const before = await currentFile(root, path)
    const content = desired.get(path) ?? null
    const oldHash = previous.files[path]
    if ((content !== null && before?.equals(content)) || (before === null && content === null)) {
      entries.push({ path, action: "unchanged", before, content })
    } else {
      if (oldHash ? before === null || hash(before) !== oldHash : before !== null)
        fail(`Local managed file conflict: ${path}. Review and integrate explicitly before updating.`)
      entries.push({
        path,
        action: content === null ? "delete" : before === null ? "create" : "update",
        before,
        content,
      })
    }
    if (content !== null) files[path] = hash(content)
  }
  const desiredBlocks = {
    "AGENTS.md": block(
      "agent-workspace",
      "Read [AGENT-WORKSPACE.md](AGENT-WORKSPACE.md) and `agent-workspace.json` before coordinated project work. Project-specific instructions elsewhere in this file still apply."
    ),
    "CLAUDE.md": block("agent-workspace", "@AGENTS.md\n@AGENT-WORKSPACE.md"),
    ".gitignore": [
      "# BEGIN agent-workspace",
      `/${tooling}/runtime/`,
      `/${tooling}/**/__pycache__/`,
      "/.local/",
      ...repositories.filter((repo) => repo.kind === "independent").map((repo) => `/${repo.path}/`),
      "# END agent-workspace",
    ].join("\n"),
  }
  for (const [path, desiredBlock] of Object.entries(desiredBlocks)) {
    const before = await currentFile(root, path)
    const currentBlock = before === null ? null : extractBlock(path, before)
    const oldHash = previous.blocks[path]
    if (
      currentBlock !== desiredBlock &&
      (oldHash ? currentBlock === null || hash(currentBlock) !== oldHash : currentBlock !== null)
    )
      fail(
        `Local managed block conflict: ${path}. Preserve surrounding instructions and integrate the block explicitly.`
      )
    const content = Buffer.from(
      currentBlock === desiredBlock
        ? before
        : currentBlock
          ? before.toString().replace(currentBlock, () => desiredBlock)
          : `${before?.toString() ?? ""}${before?.length ? (before.toString().endsWith("\n") ? "\n" : "\n\n") : ""}${desiredBlock}\n`
    )
    entries.push({
      path,
      before,
      content,
      action: before?.equals(content) ? "unchanged" : before === null ? "create" : "update",
    })
    blocks[path] = hash(desiredBlock)
  }
  const next = {
    manifestVersion: 1,
    release: release.release,
    compatibility: release.compatibility,
    runtimeBuild: release.runtimeBuild,
    skillsMode: mode,
    files: Object.fromEntries(
      Object.keys(files)
        .sort()
        .map((path) => [path, files[path]])
    ),
    blocks,
  }
  if (mode === "local") {
    const path = ".claude/skills"
    const full = await safePath(root, path, { leafSymlink: true })
    const info = await stat(full)
    if (info && (!info.isSymbolicLink() || (await readlink(full)) !== "../.agents/skills"))
      fail("Existing .claude/skills conflicts with local skill sharing; integrate it explicitly before updating.")
    entries.push({ path, action: info ? "unchanged" : "symlink", target: "../.agents/skills" })
  }
  const manifestContent = Buffer.from(serialize(next))
  entries.push({
    path: manifestPath,
    before: manifestBefore,
    content: manifestContent,
    action: manifestBefore?.equals(manifestContent) ? "unchanged" : manifestBefore === null ? "create" : "update",
  })
  for (const entry of entries) {
    if (entry.action === "delete" || entry.content === null) continue
    if (run("git", ["check-ignore", "--no-index", "--quiet", "--", entry.path], root, { optional: true }).status === 0)
      fail(`Git ignore rules hide managed tracked file: ${entry.path}. Narrow them explicitly before updating.`)
  }
  assertNotStaged(root, entries)
  await assertIdle(root)
  return {
    root,
    entries: publicationOrder(entries),
    release: release.release,
    previous: manifestBefore ? previous.release : "unversioned",
    skillsMode: mode,
    configBefore,
  }
}

export async function updateWorkspace(root, opts = {}) {
  const result = await plan(await realpath(resolve(root)), opts)
  if (opts.apply)
    await withMaintenance(result.root, async () => {
      assertNotStaged(result.root, result.entries)
      const configPath = await safePath(result.root, "agent-workspace.json")
      if (!(await readFile(configPath)).equals(result.configBefore))
        fail("Configuration changed since preview; retry maintenance.")
      for (const entry of result.entries) await assertUnchanged(result.root, entry)
      await beginMaintenance(result.root, result.entries)
      for (const entry of result.entries) {
        if (entry.action === "unchanged") continue
        const path = await assertUnchanged(result.root, entry)
        if (entry.action === "delete") await rm(path)
        else if (entry.action === "symlink") {
          await mkdir(dirname(path), { recursive: true })
          await symlink(entry.target, path)
        } else {
          await mkdir(dirname(path), { recursive: true })
          if (entry.action === "create") await writeFile(path, entry.content, { flag: "wx" })
          else {
            const temporary = `${path}.${randomUUID()}.tmp`
            try {
              await writeFile(temporary, entry.content, { flag: "wx", mode: (await lstat(path)).mode })
              await assertUnchanged(result.root, entry)
              await rename(temporary, path)
            } finally {
              await rm(temporary, { force: true })
            }
          }
        }
      }
      await finishMaintenance(result.root)
    })
  return result
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  Promise.resolve()
    .then(async () => {
      const opts = options(process.argv.slice(2))
      if (opts.help) {
        process.stdout.write(HELP)
        return
      }
      if (!opts.target) fail("--target is required. See --help.")
      if (Number(process.versions.node.split(".")[0]) < 22) fail("Node.js 22 or later is required.")
      const result = await updateWorkspace(opts.target, opts)
      const changed = result.entries.filter((entry) => entry.action !== "unchanged").length
      process.stdout.write(
        serialize({
          mode: opts.apply ? "apply" : opts.check ? "check" : "preview",
          root: result.root,
          from: result.previous,
          to: result.release,
          skillsMode: result.skillsMode,
          changed,
          files: result.entries.map(({ path, action }) => ({ path, action })),
        })
      )
      if (opts.check && changed) process.exitCode = 2
    })
    .catch((error) => {
      process.stderr.write(`${error.message}\n`)
      process.exitCode = 1
    })
}
