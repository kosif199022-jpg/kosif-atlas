#!/usr/bin/env node
import { realpathSync } from "node:fs"
import { readFile, writeFile, mkdir, rm, access } from "node:fs/promises"
import { join, dirname, resolve } from "node:path"
import { pathToFileURL, fileURLToPath } from "node:url"

import { template, skill, filesUnder } from "./init.mjs"
import { hash, compatibility, serialize, skillNames, templateFiles } from "./installation.mjs"
import { runtimeBuild, entrypointPath } from "./runtime-build.mjs"

export async function bundle({ write = false, version } = {}) {
  const releasePath = join(skill, "release.json")
  let previous
  try {
    previous = JSON.parse(await readFile(releasePath, "utf8"))
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  const release = version ?? previous?.release ?? "0.1.0"
  if (!/^\d+\.\d+\.\d+$/.test(release)) throw new Error("Release must be a semantic version without a prefix.")
  for (const name of skillNames) {
    const canonical = resolve(skill, "..", name)
    const destination = join(template, ".agents/skills", name)
    try {
      await access(canonical)
    } catch (error) {
      if (error.code === "ENOENT" && !write) continue // Standalone copied skill validates its bundled release below.
      throw new Error(`Canonical sibling ${name} is required to regenerate the bundle.`)
    }
    const paths = await filesUnder(canonical)
    const current = await filesUnder(destination)
    for (const path of new Set([...paths, ...current])) {
      const incoming = paths.includes(path) ? await readFile(join(canonical, path)) : null
      let installed = null
      try {
        installed = await readFile(join(destination, path))
      } catch (error) {
        if (error.code !== "ENOENT") throw error
      }
      if ((incoming !== null && installed !== null && incoming.equals(installed)) || (!incoming && !installed)) continue
      if (!write) throw new Error(`Operating skill bundle drift: ${name}/${path}. Run bundle.mjs --write.`)
      if (!incoming) await rm(join(destination, path))
      else {
        await mkdir(dirname(join(destination, path)), { recursive: true })
        await writeFile(join(destination, path), incoming)
      }
    }
  }
  const build = await runtimeBuild(template)
  if (build.embedded !== build.id) {
    if (!write) throw new Error("Runtime build identity drift. Run bundle.mjs --write after reviewing script changes.")
    await writeFile(join(template, entrypointPath), build.source)
  }
  const files = {}
  for (const path of await templateFiles("local")) files[path] = hash(await readFile(join(template, path)))
  const metadata = { manifestVersion: 1, release, compatibility, runtimeBuild: build.id, files }
  if (write) await writeFile(releasePath, serialize(metadata))
  else if (JSON.stringify(previous) !== JSON.stringify(metadata))
    throw new Error("Template release drift. Run bundle.mjs --write after reviewing template changes.")
  return metadata
}

if (process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url) {
  const args = process.argv.slice(2)
  if (
    args.some(
      (arg, i) => !["--write", "--check", "--version", "--quiet"].includes(arg) && args[i - 1] !== "--version"
    ) ||
    (args.includes("--write") && args.includes("--check"))
  ) {
    process.stderr.write("Usage: bundle.mjs --check | --write [--version 0.1.0] [--quiet]\n")
    process.exitCode = 1
  } else
    bundle({
      write: args.includes("--write"),
      version: args.includes("--version") ? args[args.indexOf("--version") + 1] : undefined,
    })
      .then((value) => {
        if (!args.includes("--quiet"))
          process.stdout.write(
            `Release ${value.release}: ${Object.keys(value.files).length} verified template files.\n`
          )
      })
      .catch((error) => {
        process.stderr.write(`${error.message}\n`)
        process.exitCode = 1
      })
}
