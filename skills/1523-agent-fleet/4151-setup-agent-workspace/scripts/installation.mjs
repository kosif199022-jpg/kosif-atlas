import { createHash } from "node:crypto"
import { readFile, writeFile, mkdir, rm } from "node:fs/promises"
import { hostname } from "node:os"
import { join, dirname } from "node:path"

import { template, tooling, skill, filesUnder, safePath, stat, run, fail } from "./init.mjs"
import { runtimeBuild, entrypointPath } from "./runtime-build.mjs"

export const manifestPath = ".agents/agent-workspace/install-manifest.json"
export const maintenancePath = ".agents/agent-workspace/runtime/maintenance.json"
export const skillNames = ["unattended-work", "visual-evidence-review"]
export const compatibility = { workspaceSchema: 1, runtimeSchema: 1 }
export const hash = (value) => createHash("sha256").update(value).digest("hex")
export const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`
const blockPaths = ["AGENTS.md", "CLAUDE.md", ".gitignore"]

export function managedPath(path) {
  return (
    typeof path === "string" &&
    !/[\\\0\r\n]/.test(path) &&
    !path.split("/").some((part) => !part || part === "." || part === ".." || part.toLowerCase() === ".git") &&
    (path === "AGENT-WORKSPACE.md" ||
      path === `${tooling}/schema.json` ||
      [`${tooling}/scripts/`, `${tooling}/tests/`, ...skillNames.map((name) => `.agents/skills/${name}/`)].some(
        (prefix) => path.startsWith(prefix)
      ))
  )
}

export async function templateFiles(mode) {
  return (await filesUnder(template)).filter((path) => {
    if (!managedPath(path)) fail(`Unexpected template path: ${path}`)
    return mode === "local" || !path.startsWith(".agents/skills/")
  })
}

export async function releaseData() {
  const release = JSON.parse(await readFile(join(skill, "release.json"), "utf8"))
  if (
    release.manifestVersion !== 1 ||
    !/^\d+\.\d+\.\d+$/.test(release.release) ||
    JSON.stringify(release.compatibility) !== JSON.stringify(compatibility)
  )
    fail("Unsupported release compatibility.")
  const actual = {}
  const build = await runtimeBuild(template)
  if (release.runtimeBuild !== build.id || build.embedded !== build.id)
    fail("Runtime build identity differs. Maintainers must run bundle.mjs --write, then --check.")
  for (const path of await templateFiles("local")) actual[path] = hash(await readFile(join(template, path)))
  if (JSON.stringify(actual) !== JSON.stringify(release.files))
    fail("Template release hashes differ. Maintainers must run bundle.mjs --write, then --check.")
  return release
}

export function extractBlock(path, content) {
  const start = path === ".gitignore" ? "# BEGIN agent-workspace" : "<!-- BEGIN agent-workspace -->"
  const end = path === ".gitignore" ? "# END agent-workspace" : "<!-- END agent-workspace -->"
  const text = content.toString()
  const first = text.indexOf(start)
  if (first === -1) {
    if (text.includes(end)) fail(`Malformed managed block in ${path}`)
    return null
  }
  const last = text.indexOf(end, first + start.length)
  if (last === -1 || text.indexOf(start, first + start.length) !== -1 || text.indexOf(end, last + end.length) !== -1)
    fail(`Malformed or duplicated managed block in ${path}`)
  return text.slice(first, last + end.length)
}

export async function installedManifest(entries, mode) {
  const release = await releaseData()
  const files = {},
    blocks = {}
  for (const entry of entries) {
    if (managedPath(entry.path)) files[entry.path] = hash(entry.content)
    else if (blockPaths.includes(entry.path)) blocks[entry.path] = hash(extractBlock(entry.path, entry.content))
  }
  return {
    manifestVersion: 1,
    release: release.release,
    compatibility: release.compatibility,
    runtimeBuild: release.runtimeBuild,
    skillsMode: mode,
    files,
    blocks,
  }
}

export function validateManifest(value) {
  if (
    !value ||
    value.manifestVersion !== 1 ||
    !/^\d+\.\d+\.\d+$/.test(value.release) ||
    !["local", "external"].includes(value.skillsMode) ||
    !/^[a-f0-9]{64}$/.test(value.runtimeBuild) ||
    JSON.stringify(value.compatibility) !== JSON.stringify(compatibility) ||
    !value.files ||
    Array.isArray(value.files) ||
    !value.blocks ||
    Array.isArray(value.blocks)
  )
    fail("Unsupported or malformed install manifest; explicit migration is required.")
  for (const [path, digest] of Object.entries(value.files))
    if (!managedPath(path) || !/^[a-f0-9]{64}$/.test(digest)) fail(`Unsafe or malformed managed file: ${path}`)
  for (const [path, digest] of Object.entries(value.blocks))
    if (!blockPaths.includes(path) || !/^[a-f0-9]{64}$/.test(digest)) fail(`Unsafe or malformed managed block: ${path}`)
  return value
}

export function assertNotStaged(root, entries) {
  const staged = new Set(run("git", ["diff", "--cached", "--name-only", "-z"], root).stdout.split("\0").filter(Boolean))
  for (const entry of entries)
    if (entry.action !== "unchanged" && staged.has(entry.path))
      fail(`Refusing to modify staged managed file: ${entry.path}. Preserve the user's checkpoint.`)
}

export async function assertIdle(root) {
  const path = await safePath(root, `${tooling}/runtime/state.json`)
  if (!(await stat(path))) return
  const state = JSON.parse(await readFile(path, "utf8"))
  if (state.schemaVersion !== 1 || !state.sessions || !state.claims)
    fail("Unsupported or corrupt runtime state; preserve it for inspection.")
  if (
    Object.keys(state.claims).length ||
    Object.keys(state.runs ?? {}).length ||
    Object.values(state.sessions).some((session) => session.status === "active")
  )
    fail("Active runs, sessions, or claims prevent maintenance. Release and stop them before applying updates.")
}

export function publicationOrder(entries) {
  const order = (path) => (path === manifestPath ? 2 : path === entrypointPath ? 1 : 0)
  return [...entries].sort((a, b) => order(a.path) - order(b.path))
}

export async function beginMaintenance(root, entries) {
  const incoming = JSON.parse(entries.find((entry) => entry.path === manifestPath).content)
  const path = await safePath(root, maintenancePath)
  const existing = await stat(path)
  if (existing) {
    if (!existing.isFile()) fail("Unexpected maintenance marker type; preserve it for recovery.")
    const marker = JSON.parse(await readFile(path, "utf8"))
    if (
      marker.manifestVersion !== 1 ||
      marker.runtimeBuild !== incoming.runtimeBuild ||
      marker.release !== incoming.release ||
      marker.installationHash !== hash(serialize(incoming))
    )
      fail("An incomplete update targets another release. Resume that exact release before another update.")
  } else
    await writeFile(
      path,
      serialize({
        manifestVersion: 1,
        runtimeBuild: incoming.runtimeBuild,
        release: incoming.release,
        installationHash: hash(serialize(incoming)),
        pid: process.pid,
        host: hostname(),
        startedAt: new Date().toISOString(),
      }),
      { flag: "wx" }
    )
}

export async function finishMaintenance(root) {
  await rm(await safePath(root, maintenancePath))
}

// The existing registry lock serializes setup/update with all CLI mutations,
// including older installed runtimes. Never infer an abandoned lock from age.
export async function withMaintenance(root, callback) {
  const lock = await safePath(root, `${tooling}/runtime/locks/write.lock`)
  await mkdir(dirname(lock), { recursive: true })
  try {
    await mkdir(lock)
  } catch (error) {
    if (error.code === "EEXIST")
      fail(`Registry maintenance lock exists: ${lock}. Inspect the owner; never remove a live lock.`)
    throw error
  }
  try {
    await writeFile(
      join(lock, "owner.json"),
      serialize({
        pid: process.pid,
        host: hostname(),
        command: "workspace-maintenance",
        startedAt: new Date().toISOString(),
      })
    )
    await assertIdle(root)
    return await callback()
  } finally {
    await rm(lock, { recursive: true, force: true })
  }
}
