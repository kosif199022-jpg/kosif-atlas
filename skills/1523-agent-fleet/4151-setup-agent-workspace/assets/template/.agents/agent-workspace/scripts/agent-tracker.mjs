import { createHash } from "node:crypto"
import { lstatSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { captureBaseline } from "./agent-git.mjs"

export function fileDigest(root, path) {
  if (
    !path ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.split("/").some((part) => !part || part === ".." || part === ".")
  )
    throw new Error("Expected a literal workspace-relative evidence path.")
  let current = root
  for (const part of path.split("/")) {
    current = resolve(current, part)
    if (lstatSync(current).isSymbolicLink()) throw new Error(`Symlink evidence path: ${path}`)
  }
  if (!lstatSync(current).isFile()) throw new Error(`Expected a regular file: ${path}`)
  return createHash("sha256").update(readFileSync(current)).digest("hex")
}

export function trackTask({ root, run, task, baseline, created = false }) {
  // Test doubles without filesystem task records cannot provide Git provenance.
  if (!task.path) return null
  const hash = fileDigest(root, task.path)
  run.tracker ??= {}
  const previous = run.tracker[task.path]
  if (previous) {
    if (previous.pending)
      throw new Error(
        `Task record changed outside its recorded writer or has an interrupted write: ${task.path}. Preserve it for inspection.`
      )
    if (previous.hash === hash && previous.eligible) return previous
    // A human may have committed a reviewed record between sessions. A clean
    // repository file can establish a new baseline; dirty unknown bytes cannot.
    baseline ??= captureBaseline({ root, repositories: run.repositories })
    const repo = baseline.repositories["."]
    if (!repo?.available || repo.dirtyPaths.includes(task.path)) {
      if (previous.hash !== hash)
        throw new Error(`Task record changed outside its recorded writer: ${task.path}. Preserve it for inspection.`)
      return previous
    }
  }
  baseline ??= captureBaseline({ root, repositories: run.repositories })
  const repo = baseline.repositories["."]
  const eligible = Boolean(repo?.available && (created || !repo.dirtyPaths.includes(task.path)))
  const entry = { path: task.path, hash, baseline, eligible, pending: false }
  run.tracker[task.path] = entry
  return entry
}

export function assertTrackedTask({ root, run, task }) {
  const entry = run.tracker?.[task.path]
  if (!entry?.eligible)
    throw new Error("Task bookkeeping was already dirty or lacks owned provenance; preserve it for inspection.")
  if (entry.pending || entry.hash !== fileDigest(root, task.path))
    throw new Error("Task bookkeeping changed outside the recorded writer; preserve it for inspection.")
  return entry
}
