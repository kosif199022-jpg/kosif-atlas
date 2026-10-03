import { createHash } from "node:crypto"
import { readFile, readdir } from "node:fs/promises"
import { join } from "node:path"

const marker = /const RUNTIME_BUILD = "([a-f0-9]{64}|BUILD_PLACEHOLDER)"/
export const entrypointPath = ".agents/agent-workspace/scripts/agents.mjs"

// Normalize only the embedded identity to avoid hashing the identity into itself.
// The identity covers the entrypoint and every shipped helper dependency.
export async function runtimeBuild(template) {
  const root = join(template, ".agents/agent-workspace/scripts")
  const entries = []
  async function visit(directory, prefix = "") {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) await visit(join(directory, entry.name), path)
      else if (entry.isFile()) entries.push(path)
      else throw new Error(`Unsupported runtime entry: ${path}`)
    }
  }
  await visit(root)
  const digest = createHash("sha256")
  let source, embedded
  for (const path of entries.sort()) {
    let content = await readFile(join(root, path))
    if (path === "agents.mjs") {
      source = content.toString()
      embedded = source.match(marker)?.[1]
      if (!embedded) throw new Error("Runtime entrypoint is missing its generated RUNTIME_BUILD marker.")
      content = Buffer.from(source.replace(marker, 'const RUNTIME_BUILD = "BUILD_PLACEHOLDER"'))
    }
    digest.update(`${path}\0${content.length}\0`).update(content)
  }
  if (!source) throw new Error("Runtime entrypoint is missing.")
  const id = digest.digest("hex")
  return { id, embedded, source: source.replace(marker, `const RUNTIME_BUILD = "${id}"`) }
}
