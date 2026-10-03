#!/usr/bin/env node
import { createHash } from "node:crypto"
import { readFile, lstat, realpath } from "node:fs/promises"
import { resolve, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"

const tooling = ".agents/agent-workspace"
const digest = (value) => createHash("sha256").update(value).digest("hex")
const fail = (message) => {
  throw new Error(message)
}

async function main() {
  const { values } = parseArgs({ options: { root: { type: "string" }, help: { type: "boolean" } } })
  if (values.help) {
    process.stdout.write(
      "Usage: node .agents/agent-workspace/scripts/check-installation.mjs [--root PATH]\nChecks the installed release baseline without a plugin, network, or runtime writes.\n"
    )
    return
  }
  const root = await realpath(resolve(values.root ?? resolve(dirname(fileURLToPath(import.meta.url)), "../../..")))
  async function safeRead(path) {
    if (
      typeof path !== "string" ||
      /[\\\0\r\n]/.test(path) ||
      path.split("/").some((part) => !part || part === "." || part === ".." || part.toLowerCase() === ".git")
    )
      fail(`Unsafe installation path: ${path}`)
    const parts = path.split("/")
    for (let i = 0; i < parts.length; i++) {
      const info = await lstat(join(root, ...parts.slice(0, i + 1)))
      if (info.isSymbolicLink() || (i === parts.length - 1 ? !info.isFile() : !info.isDirectory()))
        fail(`Unexpected installation path type: ${path}`)
    }
    return readFile(join(root, path))
  }
  const manifest = JSON.parse(await safeRead(`${tooling}/install-manifest.json`))
  if (
    manifest.manifestVersion !== 1 ||
    !/^[a-f0-9]{64}$/.test(manifest.runtimeBuild) ||
    manifest.compatibility?.workspaceSchema !== 1 ||
    manifest.compatibility?.runtimeSchema !== 1 ||
    !["local", "external"].includes(manifest.skillsMode) ||
    !/^\d+\.\d+\.\d+$/.test(manifest.release) ||
    !manifest.files ||
    Array.isArray(manifest.files) ||
    !manifest.blocks ||
    Array.isArray(manifest.blocks)
  )
    fail("Unsupported or malformed installation manifest.")
  for (const [path, expected] of Object.entries(manifest.files)) {
    if (
      !(
        path === "AGENT-WORKSPACE.md" ||
        path === `${tooling}/schema.json` ||
        [
          `${tooling}/scripts/`,
          `${tooling}/tests/`,
          ".agents/skills/unattended-work/",
          ".agents/skills/visual-evidence-review/",
        ].some((prefix) => path.startsWith(prefix))
      )
    )
      fail(`Unmanaged installation path: ${path}`)
    if (!/^[a-f0-9]{64}$/.test(expected) || digest(await safeRead(path)) !== expected)
      fail(`Installed tooling drift: ${path}. Integrate the template change and run the updater.`)
  }
  for (const [path, expected] of Object.entries(manifest.blocks)) {
    if (!["AGENTS.md", "CLAUDE.md", ".gitignore"].includes(path)) fail(`Unmanaged instruction block: ${path}`)
    const text = (await safeRead(path)).toString()
    const start = path === ".gitignore" ? "# BEGIN agent-workspace" : "<!-- BEGIN agent-workspace -->"
    const end = path === ".gitignore" ? "# END agent-workspace" : "<!-- END agent-workspace -->"
    const first = text.indexOf(start),
      last = text.indexOf(end, first + start.length)
    if (
      first < 0 ||
      last < 0 ||
      text.indexOf(start, first + start.length) !== -1 ||
      text.indexOf(end, last + end.length) !== -1 ||
      !/^[a-f0-9]{64}$/.test(expected) ||
      digest(text.slice(first, last + end.length)) !== expected
    )
      fail(`Installed instruction block drift: ${path}`)
  }
  process.stdout.write(
    `Installed release ${manifest.release}: ${Object.keys(manifest.files).length} files and ${Object.keys(manifest.blocks).length} instruction blocks match.\n`
  )
}
main().catch((error) => {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
})
