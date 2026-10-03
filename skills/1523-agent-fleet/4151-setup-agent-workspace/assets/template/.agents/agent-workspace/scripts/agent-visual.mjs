import { createHash } from "node:crypto"
import { readFileSync, readdirSync } from "node:fs"
import { relative, dirname } from "node:path"

import { fileDigest } from "./agent-tracker.mjs"

const BEGIN = "<!-- VISUAL-EVIDENCE:BEGIN -->"
const END = "<!-- VISUAL-EVIDENCE:END -->"
const section = /<!-- VISUAL-EVIDENCE:BEGIN -->[\s\S]*?<!-- VISUAL-EVIDENCE:END -->/g
const sourceDigest = (claim) =>
  createHash("sha256")
    .update(
      JSON.stringify(
        Object.values(claim.snapshots ?? {})
          .flatMap((snapshot) => snapshot.files.map(({ path, hash, mode }) => ({ path, hash, mode })))
          .sort((a, b) => a.path.localeCompare(b.path))
      )
    )
    .digest("hex")

function inspectWebp(root, path) {
  const hash = fileDigest(root, path)
  const bytes = readFileSync(`${root}/${path}`)
  if (
    bytes.length < 20 ||
    bytes.toString("ascii", 0, 4) !== "RIFF" ||
    bytes.toString("ascii", 8, 12) !== "WEBP" ||
    bytes.readUInt32LE(4) !== bytes.length - 8
  )
    throw new Error(`Expected a WebP container: ${path}`)
  return { path, hash }
}

export function visualRecord({ root, claim, task, kind, files = [], note, onion }) {
  if (!["comparison", "no-ui", "text-only", "no-visible-change"].includes(kind))
    throw new Error("Visual kind must be comparison, no-ui, text-only, or no-visible-change.")
  if (!note?.trim()) throw new Error("Visual evidence requires inspection/context in --note.")
  const directory = `backlog/assets/${task.id.toLowerCase()}`
  const selected = [...new Set(files)]
  if (kind === "comparison" ? !selected.length || selected.length > 3 : selected.length > 0)
    throw new Error("Comparisons require 1-3 WebP files; exemptions must not attach images.")
  const artifacts = selected.map((path) => {
    if (!path.startsWith(`${directory}/`) || !/^[a-z0-9][a-z0-9-]*\.webp$/.test(path.slice(directory.length + 1)))
      throw new Error(`Use ${directory}/<slug>.webp for comparison evidence.`)
    if (!claim.scopes.some((scope) => path.toLowerCase() === scope || path.toLowerCase().startsWith(`${scope}/`)))
      throw new Error(`Claim the visual evidence path before writing: ${path}`)
    const artifact = inspectWebp(root, path)
    if (claim.commitRequest) {
      const approvals = claim.baseline.commitRequests ?? { single: claim.baseline.commitRequest }
      const approved = Object.values(approvals)
        .flatMap((entry) => entry.files)
        .find((file) => file.path === path)
      if (!approved || approved.hash !== artifact.hash)
        throw new Error(`Visual comparison has no matching human commit request: ${path}`)
    }
    return artifact
  })
  let retained = []
  try {
    retained = readdirSync(`${root}/${directory}`)
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  if (retained.length > 3 || retained.some((name) => !name.endsWith(".webp")))
    throw new Error(
      "Retain at most three final WebP comparisons in the task asset directory; raw captures belong in .local."
    )
  if (retained.some((name) => !selected.includes(`${directory}/${name}`)))
    throw new Error("Every retained task comparison must be included in its visual evidence record.")
  const overlay =
    kind === "no-visible-change"
      ? (() => {
          if (!onion?.startsWith(".local/"))
            throw new Error("No-visible-change requires an inspected --onion image in .local.")
          const hash = fileDigest(root, onion)
          const bytes = readFileSync(`${root}/${onion}`)
          if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
            throw new Error("Use the inspected PNG onion image produced by compare-ui.py.")
          return { path: onion, hash }
        })()
      : null
  const images = artifacts.map(
    ({ path }) =>
      `![Before and after: ${path
        .split("/")
        .at(-1)
        .replace(
          /\.webp$/,
          ""
        )}](<${relative(dirname(task.path ?? "backlog/tasks/task.md"), path).replaceAll("\\", "/")}>)`
  )
  const outside = [task.description, (task.implementationNotes ?? "").replace(section, ""), task.finalSummary].join(
    "\n"
  )
  if ((outside.match(/!\[[^\]]*\]\(/g)?.length ?? 0) + images.length > 3)
    throw new Error("Task Markdown may render at most three visual evidence images.")
  const record = {
    kind,
    note,
    artifacts,
    overlay,
    sources: sourceDigest(claim),
    images,
    at: new Date().toISOString(),
  }
  const markdown = `${BEGIN}\n### Visual evidence\n\n${kind}: ${note}${images.length ? `\n\n${images.join("\n\n")}` : ""}\n${END}`
  const notes = [(task.implementationNotes ?? "").replace(section, "").trim(), markdown].filter(Boolean).join("\n\n")
  return { record, notes }
}

export function assertVisual({ root, claim, task }) {
  const record = claim.visual
  if (!record)
    throw new Error(
      "Declare visual evidence or an explicit exemption with the visual command before Done/commit/review."
    )
  if (record.sources !== sourceDigest(claim))
    throw new Error("Snapshot content changed after visual review; inspect and register current evidence again.")
  if (!task.implementationNotes?.includes(BEGIN)) throw new Error("Task is missing its visual evidence record.")
  for (const item of record.artifacts) {
    if (inspectWebp(root, item.path).hash !== item.hash)
      throw new Error("Visual comparison changed after inspection; register and review it again.")
  }
  if (record.images.some((image) => !task.implementationNotes.includes(image)))
    throw new Error("Task is missing a relative comparison image embed.")
  if (record.overlay && fileDigest(root, record.overlay.path) !== record.overlay.hash)
    throw new Error("Inspected onion-skin evidence changed.")
  const directory = `backlog/assets/${task.id.toLowerCase()}`
  let retained = []
  try {
    retained = readdirSync(`${root}/${directory}`)
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  if (
    retained.length !== record.artifacts.length ||
    retained.some((name) => !record.artifacts.some((item) => item.path === `${directory}/${name}`))
  )
    throw new Error("Task asset directory differs from the reviewed visual evidence.")
  const allText = [task.description, task.implementationNotes, task.finalSummary].join("\n")
  if ((allText.match(/!\[[^\]]*\]\(/g)?.length ?? 0) > 3)
    throw new Error("Task Markdown exceeds the three-image limit.")
}
