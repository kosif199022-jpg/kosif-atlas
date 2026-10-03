import { isDeepStrictEqual } from "node:util"

import { prepareSnapshot } from "./agent-git.mjs"

export function assertLegacyReceipts(receipt) {
  if (!receipt?.source?.trim() || !Array.isArray(receipt.receipts))
    throw new Error("Legacy recovery requires inspected original CLI receipts and their source.")
  const outputs = receipt.receipts.map((entry) => ({
    command: entry.command,
    value: JSON.parse(entry.output),
  }))
  if (
    !outputs.some(
      ({ command, value }) => command.includes("agents.mjs claim ") && isDeepStrictEqual(value, receipt.claim)
    )
  )
    throw new Error("Original claim output is missing or differs from the recovery record.")
  for (const snapshot of receipt.snapshots ?? []) {
    if (
      !outputs.some(
        ({ command, value }) => command.includes("agents.mjs snapshot ") && isDeepStrictEqual(value, snapshot)
      )
    )
      throw new Error("Original snapshot output is missing or differs from the recovery record.")
  }
}

// Refresh only checks, never the run's permissions, scope, limits or repository boundaries.
export function strengthenedRepositories(previous, configured, repoPath) {
  const old = previous.find((repo) => repo.path === repoPath)
  const current = configured.find((repo) => repo.path === repoPath)
  if (!old || !current || old.readOnly || current.readOnly)
    throw new Error("Check refresh requires an existing writable repository.")
  const checks = current.checks ?? []
  const names = new Set()
  for (const check of checks) {
    if (
      !check.name ||
      names.has(check.name) ||
      !Array.isArray(check.command) ||
      !check.command.length ||
      check.command.some((part) => typeof part !== "string")
    )
      throw new Error("Checks must have unique names and nonempty command arrays.")
    names.add(check.name)
  }
  if (!checks.length) throw new Error("Configure at least one real repository check first.")
  // Preserve complete existing definitions and their execution order.
  let offset = 0
  for (const check of old.checks ?? []) {
    const index = checks.findIndex((value, i) => i >= offset && isDeepStrictEqual(value, check))
    if (index < 0) throw new Error("Check refresh cannot remove, change or reorder existing checks.")
    offset = index + 1
  }
  return previous.map((repo) =>
    repo.path === repoPath ? { ...structuredClone(repo), checks: structuredClone(checks) } : structuredClone(repo)
  )
}

// A resumed claim starts with today's dirty baseline. Only byte-identical files
// proven by an earlier clean-at-claim snapshot become eligible again.
export function restoreOwnedBaseline({ root, receipt, previousRun, previousSession, run, baseline, scopes, task }) {
  const claim = receipt?.claim
  if (
    !claim?.id ||
    claim.task !== task ||
    claim.session !== previousSession?.id ||
    previousSession.runId !== previousRun?.id ||
    !["closed", "recovered"].includes(previousSession.status)
  )
    throw new Error("Handoff requires the matching stopped source session and task.")
  if (claim.outcome === "done" || previousRun.completedTasks?.includes(task))
    throw new Error("Completed work cannot be resumed as an uncommitted handoff.")
  if (previousRun.allowedTasks && !previousRun.allowedTasks.includes(task))
    throw new Error("Source task was outside its recorded run scope.")
  if (!isDeepStrictEqual(claim.repositories, previousRun.repositories))
    throw new Error("Handoff repositories differ from the recorded source run.")
  const boundaries = (repos) => repos.map(({ path, readOnly }) => ({ path, readOnly: Boolean(readOnly) }))
  if (!isDeepStrictEqual(boundaries(claim.repositories), boundaries(run.repositories)))
    throw new Error("Repository boundaries changed; inspect the handoff before resuming.")
  if (!isDeepStrictEqual(scopes, claim.scopes)) throw new Error("Resume must use exactly the original claim scopes.")
  const snapshots = receipt.snapshots
  if (!Array.isArray(snapshots) || !snapshots.length)
    throw new Error("No exact snapshots retained; unknown dirty files cannot be adopted.")
  const next = structuredClone(baseline)
  const restored = []
  const repositories = new Set()
  for (const snapshot of snapshots) {
    if (
      repositories.has(snapshot.repoPath) ||
      !isDeepStrictEqual(snapshot.baseline, claim.baseline) ||
      !isDeepStrictEqual(snapshot.scopes, claim.scopes) ||
      !isDeepStrictEqual(snapshot.repositories, claim.repositories)
    )
      throw new Error("Inconsistent or duplicate handoff snapshot.")
    repositories.add(snapshot.repoPath)
    const actual = prepareSnapshot({
      root,
      repoPath: snapshot.repoPath,
      paths: snapshot.files.map((file) => file.path),
      scopes: claim.scopes,
      baseline: claim.baseline,
      repositories: claim.repositories,
    })
    if (actual.fingerprint !== snapshot.fingerprint)
      throw new Error("Handoff files or HEAD changed; preserved snapshots must match exactly.")
    const proven = new Set(snapshot.files.map((file) => file.path))
    const target = next.repositories[snapshot.repoPath]
    if (!target?.available || !isDeepStrictEqual(target.repoIdentity, snapshot.repoIdentity))
      throw new Error("Handoff repository identity no longer matches.")
    target.dirtyPaths = target.dirtyPaths.filter((path) => !proven.has(path))
    restored.push(...snapshot.files.map(({ path, hash }) => ({ path, hash })))
  }
  return { baseline: next, restored }
}
