import { spawnSync } from "node:child_process"
import { createHash, randomUUID } from "node:crypto"
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { dirname, isAbsolute, relative, resolve, sep } from "node:path"

const digest = (value) => createHash("sha256").update(value).digest("hex")
const inside = (path, scope) => scope === "." || path === scope || path.startsWith(`${scope}/`)
const foldedInside = (path, scope) => inside(path.toLowerCase(), scope.toLowerCase())

function literalPath(value, allowRoot = false) {
  if (typeof value !== "string" || !value || isAbsolute(value) || value.includes("\\") || value.includes("\0")) {
    throw new Error("Paths must be literal workspace-relative paths")
  }
  const parts = value.split("/").filter((part) => part && part !== ".")
  if (parts.some((part) => part === ".." || part.toLowerCase() === ".git")) {
    throw new Error("Path escapes or Git metadata are forbidden")
  }
  const path = parts.join("/") || "."
  if (path === "." && !allowRoot) throw new Error("Select explicit files, not the workspace root")
  return path
}

function assertAncestors(root, path, includeLeaf = false) {
  const parts = path === "." ? [] : path.split("/")
  let current = root
  for (const part of includeLeaf ? parts : parts.slice(0, -1)) {
    current = resolve(current, part)
    try {
      const stat = lstatSync(current)
      if (stat.isSymbolicLink()) throw new Error(`Symlink ancestor is forbidden: ${current}`)
      if (!stat.isDirectory()) throw new Error(`Non-directory ancestor: ${current}`)
    } catch (error) {
      if (error.code === "ENOENT") break
      throw error
    }
  }
}

function gitEnvironment() {
  const env = { ...process.env, GIT_LITERAL_PATHSPECS: "1", GIT_TERMINAL_PROMPT: "0" }
  for (const key of Object.keys(env)) {
    if (
      /^GIT_(DIR|WORK_TREE|COMMON_DIR|INDEX_FILE|OBJECT_DIRECTORY|ALTERNATE_OBJECT_DIRECTORIES|CONFIG.*|NAMESPACE|PREFIX|CEILING_DIRECTORIES|DISCOVERY_ACROSS_FILESYSTEM|SHALLOW_FILE)$/.test(
        key
      )
    )
      delete env[key]
  }
  return env
}

function git(repo, args, { input, allowFailure = false } = {}) {
  const result = spawnSync("git", ["--literal-pathspecs", "-C", repo, ...args], {
    input,
    env: gitEnvironment(),
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  })
  if (result.error || result.signal || result.status !== 0) {
    if (allowFailure && !result.error && !result.signal) return null
    throw new Error(`git ${args[0]} failed: ${result.error?.message || result.signal || result.stderr.trim()}`)
  }
  return result.stdout
}

function repository(root, repoPath, repositories, writable = true) {
  root = realpathSync(root)
  repoPath = literalPath(repoPath, true)
  const configured = repositories.map((entry) => ({
    ...entry,
    path: literalPath(entry.path, true),
  }))
  const entry = configured.find((item) => item.path === repoPath)
  if (!entry) throw new Error(`Repository is not configured: ${repoPath}`)
  if (writable && configured.some((item) => item.readOnly && foldedInside(repoPath, item.path))) {
    throw new Error(`Repository is read-only: ${repoPath}`)
  }
  assertAncestors(root, repoPath, true)
  const cwd = realpathSync(resolve(root, repoPath))
  if (realpathSync(git(cwd, ["rev-parse", "--show-toplevel"]).trim()) !== cwd) {
    throw new Error(`Path is not an independent Git repository: ${repoPath}`)
  }
  return {
    root,
    repoPath,
    cwd,
    repositories: configured,
    identity: { cwd, gitDir: realpathSync(git(cwd, ["rev-parse", "--absolute-git-dir"]).trim()) },
  }
}

const head = (repo) => git(repo, ["rev-parse", "--verify", "HEAD"], { allowFailure: true })?.trim() || null
const splitZero = (value) => value.split("\0").filter(Boolean)

function dirtyPaths(repo) {
  return splitZero(git(repo, ["status", "--porcelain=v1", "-z", "--untracked-files=all", "--no-renames"])).map(
    (entry) => entry.slice(3)
  )
}

function emptyIndex(repo) {
  if (
    git(repo, ["diff", "--cached", "--name-only", "-z"]) ||
    git(repo, ["ls-files", "--unmerged", "-z"]) ||
    // Intent-to-add entries are invisible to the ordinary cached diff.
    git(repo, ["diff", "--cached", "--ita-visible-in-index", "--name-only", "-z"])
  ) {
    throw new Error("Repository index contains pre-existing staged work; preserve it and request inspection")
  }
}

function noPendingGitOperation(repo) {
  for (const marker of ["MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "rebase-merge", "rebase-apply", "sequencer"]) {
    if (existsSync(git(repo, ["rev-parse", "--path-format=absolute", "--git-path", marker]).trim())) {
      throw new Error(`An existing Git operation requires inspection before committing: ${marker}`)
    }
  }
}

export function captureBaseline({ root, repositories }) {
  const baseline = { version: 1, repositories: {} }
  for (const configured of repositories) {
    const repoPath = literalPath(configured.path, true)
    try {
      const repo = repository(root, repoPath, repositories, false)
      baseline.repositories[repoPath] = {
        available: true,
        head: head(repo.cwd),
        repoIdentity: repo.identity,
        dirtyPaths: dirtyPaths(repo.cwd).map((path) => (repoPath === "." ? path : `${repoPath}/${path}`)),
      }
    } catch (error) {
      baseline.repositories[repoPath] = { available: false, error: error.message }
    }
  }
  return baseline
}

function trackedGitlink(repo, path) {
  const local = relative(repo.cwd, resolve(repo.root, path)).split(sep).join("/")
  return git(repo.cwd, ["ls-files", "--stage", "-z", "--", local]).startsWith("160000 ")
}

function fileSnapshot(repo, path) {
  assertAncestors(repo.root, path)
  const absolute = resolve(repo.root, path)
  const local = relative(repo.cwd, absolute).split(sep).join("/")
  if (trackedGitlink(repo, path)) {
    // A gitlink selects one initialized repository's exact commit, never its files.
    const child = repository(repo.root, path, repo.repositories)
    emptyIndex(child.cwd)
    noPendingGitOperation(child.cwd)
    if (dirtyPaths(child.cwd).length) throw new Error(`Submodule must be clean: ${path}`)
    const commit = head(child.cwd)
    if (!commit) throw new Error(`Submodule has no commit: ${path}`)
    return {
      path,
      repoPath: local,
      mode: "160000",
      hash: digest(`gitlink:${commit}`),
      blob: commit,
      submoduleIdentity: child.identity,
    }
  }
  let current = dirname(absolute)
  while (!existsSync(current)) current = dirname(current)
  if (realpathSync(git(current, ["rev-parse", "--show-toplevel"]).trim()) !== repo.cwd) {
    throw new Error(`File crosses a nested repository boundary: ${path}`)
  }
  let stat
  try {
    stat = lstatSync(absolute)
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  if (!stat) return { path, repoPath: local, mode: null, hash: null, blob: null }
  if (!stat.isFile() && !stat.isSymbolicLink()) throw new Error(`Select explicit regular files or symlinks: ${path}`)
  const bytes = stat.isSymbolicLink() ? Buffer.from(readlinkSync(absolute)) : readFileSync(absolute)
  let mode = stat.isSymbolicLink() ? "120000" : stat.mode & 0o111 ? "100755" : "100644"
  if (
    !stat.isSymbolicLink() &&
    git(repo.cwd, ["config", "--get", "core.filemode"], { allowFailure: true })?.trim() === "false"
  ) {
    mode = git(repo.cwd, ["ls-files", "--stage", "--", local]).slice(0, 6) || "100644"
  }
  const blob = git(
    repo.cwd,
    ["hash-object", ...(stat.isSymbolicLink() ? ["--no-filters"] : [`--path=${local}`]), "--stdin"],
    { input: bytes }
  ).trim()
  return { path, repoPath: local, mode, hash: digest(bytes), blob }
}

function snapshotFingerprint(snapshot) {
  const { fingerprint, ...data } = snapshot
  return digest(JSON.stringify(data))
}

export function prepareSnapshot({ root, repoPath, paths, scopes, baseline, repositories }) {
  return buildSnapshot({ root, repoPath, paths, scopes, baseline, repositories })
}

// An explicit later human commit request can take ownership of an inspected
// assisted handoff. Keep the dirty baseline truthful and bind approval to bytes.
export function authorizeCommitRequest(options, authorization) {
  if (typeof authorization !== "string" || !authorization.trim())
    throw new Error("An explicit human commit request is required.")
  if (options.repoPaths?.length > 1) {
    const repoPaths = [...new Set(options.repoPaths.map((path) => literalPath(path, true)))]
    const groups = new Map(repoPaths.map((path) => [path, []]))
    const configured = options.repositories
      .map((entry) => literalPath(entry.path, true))
      .sort((a, b) => (a === "." ? 1 : b === "." ? -1 : b.length - a.length))
    for (const input of options.paths) {
      const path = literalPath(input)
      const repoPath = configured.find((repo) => inside(path, repo))
      if (!groups.has(repoPath)) throw new Error(`File is outside the explicitly requested repositories: ${path}`)
      groups.get(repoPath).push(path)
    }
    const commitRequests = Object.create(null)
    for (const [repoPath, paths] of groups) {
      // A comparison may already be committed in another repository. Bind its
      // exact bytes for evidence ownership; unchanged files remain unsnapshotable.
      const snapshot = buildSnapshot({ ...options, repoPath, paths }, true, true)
      commitRequests[repoPath] = {
        authorization,
        repoIdentity: snapshot.repoIdentity,
        head: snapshot.head,
        files: snapshot.files,
      }
    }
    return { ...structuredClone(options.baseline), commitRequests }
  }
  const snapshot = buildSnapshot(options, true)
  return {
    ...structuredClone(options.baseline),
    commitRequest: {
      authorization,
      repoIdentity: snapshot.repoIdentity,
      head: snapshot.head,
      files: snapshot.files,
    },
  }
}

function buildSnapshot(
  { root, repoPath, paths, scopes, baseline, repositories },
  approving = false,
  allowUnchanged = false
) {
  const repo = repository(root, repoPath, repositories)
  const inherited = baseline?.repositories?.[repo.repoPath]
  if (!inherited?.available || JSON.stringify(inherited.repoIdentity) !== JSON.stringify(repo.identity)) {
    throw new Error("An available matching repository baseline from the task claim is required")
  }
  emptyIndex(repo.cwd)
  noPendingGitOperation(repo.cwd)
  const selected = [...new Set(paths.map((path) => literalPath(path)))].sort()
  if (!selected.length) throw new Error("Select at least one changed file")
  const owned = scopes.map((scope) => literalPath(scope, true))
  const dirty = new Set(dirtyPaths(repo.cwd))
  const files = selected.map((path) => {
    if (!owned.some((scope) => foldedInside(path, scope))) throw new Error(`Unowned file: ${path}`)
    if (!inside(path, repo.repoPath) || path === repo.repoPath) throw new Error(`File is outside repository: ${path}`)
    if (
      repo.repositories.some(
        (entry) =>
          entry.path !== repo.repoPath &&
          foldedInside(path, entry.path) &&
          (entry.readOnly ||
            (inside(entry.path, repo.repoPath) && !(entry.path === path && trackedGitlink(repo, path))))
      )
    )
      throw new Error(`File crosses a repository boundary: ${path}`)
    const file = fileSnapshot(repo, path)
    const approval = baseline.commitRequests?.[repo.repoPath] ?? baseline.commitRequest
    if (
      !approving &&
      (approval || inherited.dirtyPaths.some((old) => foldedInside(path, old) || foldedInside(old, path)))
    ) {
      if (
        !approval?.authorization?.trim() ||
        approval.head !== head(repo.cwd) ||
        JSON.stringify(approval.repoIdentity) !== JSON.stringify(repo.identity) ||
        !approval.files.some((approved) => JSON.stringify(approved) === JSON.stringify(file))
      )
        throw new Error(
          `File was already dirty or changed after approval and has no matching human commit request: ${path}`
        )
    }
    if (!dirty.has(file.repoPath) && (!allowUnchanged || !git(repo.cwd, ["ls-files", "--", file.repoPath])))
      throw new Error(`File is unchanged or ignored: ${path}`)
    if (!file.mode && !git(repo.cwd, ["ls-files", "--", file.repoPath]))
      throw new Error(`Deleted file was not tracked: ${path}`)
    return file
  })
  const snapshot = {
    version: 1,
    repoPath: repo.repoPath,
    repoIdentity: repo.identity,
    head: head(repo.cwd),
    files,
    scopes: owned,
    repositories: repo.repositories,
    baseline: JSON.parse(JSON.stringify(baseline)),
  }
  return { ...snapshot, fingerprint: snapshotFingerprint(snapshot) }
}

function assertSnapshot(root, snapshot, { staged = false } = {}) {
  if (snapshot.version !== 1 || snapshotFingerprint(snapshot) !== snapshot.fingerprint)
    throw new Error("Invalid snapshot fingerprint")
  const repo = repository(root, snapshot.repoPath, snapshot.repositories)
  if (JSON.stringify(repo.identity) !== JSON.stringify(snapshot.repoIdentity) || head(repo.cwd) !== snapshot.head) {
    throw new Error("Repository identity or HEAD changed since snapshot")
  }
  if (!staged) emptyIndex(repo.cwd)
  noPendingGitOperation(repo.cwd)
  for (const file of snapshot.files) {
    if (JSON.stringify(fileSnapshot(repo, file.path)) !== JSON.stringify(file))
      throw new Error(`Snapshot changed: ${file.path}`)
  }
  return repo
}

function assertStaged(repo, snapshot, expectedTree) {
  const changed = splitZero(git(repo.cwd, ["diff", "--cached", "--name-only", "-z", "--no-renames"])).sort()
  const selected = snapshot.files.map((file) => file.repoPath).sort()
  if (JSON.stringify(changed) !== JSON.stringify(selected))
    throw new Error("Staged files differ from the reviewed snapshot")
  for (const file of snapshot.files) {
    const entry = git(repo.cwd, ["ls-files", "--stage", "-z", "--", file.repoPath])
    const expected = file.mode ? `${file.mode} ${file.blob} 0\t${file.repoPath}\0` : ""
    if (entry !== expected) throw new Error(`Staged content differs from snapshot: ${file.path}`)
  }
  const tree = git(repo.cwd, ["write-tree"]).trim()
  if (expectedTree && tree !== expectedTree) throw new Error("Index tree changed after staging")
  return tree
}

function saveJournal(path, journal, initial = false) {
  if (initial) writeFileSync(path, `${JSON.stringify(journal, null, 2)}\n`, { flag: "wx", mode: 0o600 })
  else {
    const temporary = `${path}.${randomUUID()}.tmp`
    writeFileSync(temporary, `${JSON.stringify(journal, null, 2)}\n`, { flag: "wx", mode: 0o600 })
    renameSync(temporary, path)
  }
}

function verifyResult(repo, journal) {
  const commit = head(repo.cwd)
  if (
    !commit ||
    (journal.result && commit !== journal.result.commit) ||
    git(repo.cwd, ["show", "-s", "--format=%P", commit]).trim() !== (journal.snapshot.head || "") ||
    git(repo.cwd, ["show", "-s", "--format=%T", commit]).trim() !== journal.expectedTree
  ) {
    throw new Error("Commit result differs from the reviewed HEAD/tree; inspect Git and the journal")
  }
  emptyIndex(repo.cwd)
  for (const file of journal.snapshot.files) {
    if (JSON.stringify(fileSnapshot(repo, file.path)) !== JSON.stringify(file))
      throw new Error(`Working file changed during commit: ${file.path}`)
  }
  return commit
}

// Every standard commit hook still executes. Guards run after hooks capable of
// changing the index, before Git can create a commit from an unreviewed tree.
export function runCommitHook({ journalPath, hookName, args }) {
  const journal = JSON.parse(readFileSync(journalPath, "utf8"))
  try {
    const original = resolve(journal.originalHooksDirectory, hookName)
    if (existsSync(original) && statSync(original).isFile() && statSync(original).mode & 0o111) {
      const result = spawnSync(original, args, {
        cwd: journal.snapshot.repoIdentity.cwd,
        env: process.env,
        stdio: "inherit",
      })
      if (result.error || result.signal || result.status !== 0)
        throw new Error(`Original ${hookName} hook failed (${result.error?.message || result.signal || result.status})`)
    }
    if (["pre-commit", "prepare-commit-msg", "commit-msg"].includes(hookName)) {
      const repo = assertSnapshot(journal.root, journal.snapshot, { staged: true })
      assertStaged(repo, journal.snapshot, journal.expectedTree)
    }
  } catch (error) {
    journal.hookFailure = { hookName, error: error.message }
    saveJournal(journalPath, journal)
    throw error
  }
}

export function commitSnapshot({ root, snapshot, message, journalPath }) {
  if (typeof message !== "string" || !message.trim()) throw new Error("A nonempty commit message is required")
  const journalRelative = relative(resolve(root), resolve(journalPath)).split(sep).join("/")
  literalPath(journalRelative)
  root = realpathSync(root)
  journalPath = resolve(root, journalRelative)
  assertAncestors(root, journalRelative)
  if (existsSync(journalPath) && lstatSync(journalPath).isSymbolicLink())
    throw new Error("Journal symlinks are forbidden")
  if (snapshot.files.some((file) => file.path === journalRelative))
    throw new Error("Journal cannot be part of its own commit")
  if (existsSync(journalPath)) {
    const journal = JSON.parse(readFileSync(journalPath, "utf8"))
    if (journal.snapshot.fingerprint !== snapshot.fingerprint || journal.message !== message || journal.root !== root) {
      throw new Error("Existing journal belongs to another commit operation")
    }
    if (journal.phase !== "committed")
      throw new Error(
        `Incomplete commit journal (${journal.phase}); inspect the journal, index and process before recovery: ${journalPath}`
      )
    const repo = repository(root, snapshot.repoPath, snapshot.repositories)
    verifyResult(repo, journal)
    return { ...journal.result, replayed: true }
  }
  const repo = assertSnapshot(root, snapshot)
  const lockPath = resolve(repo.identity.gitDir, "agent-commit.lock")
  try {
    mkdirSync(lockPath)
  } catch (error) {
    if (error.code === "EEXIST")
      throw new Error(`Repository commit lock exists; inspect its owner, never steal by age: ${lockPath}`)
    throw error
  }
  let journal
  let stagingStarted = false
  let completed = false
  try {
    writeFileSync(
      resolve(lockPath, "owner.json"),
      JSON.stringify({ pid: process.pid, journalPath, startedAt: new Date().toISOString() })
    )
    assertSnapshot(root, snapshot)
    mkdirSync(dirname(journalPath), { recursive: true })
    journal = {
      version: 1,
      phase: "prepared",
      root,
      snapshot,
      message,
      lockPath,
      startedAt: new Date().toISOString(),
      originalHooksDirectory: git(repo.cwd, ["rev-parse", "--path-format=absolute", "--git-path", "hooks"]).trim(),
    }
    saveJournal(journalPath, journal, true)
    journal.phase = "staging"
    saveJournal(journalPath, journal)
    stagingStarted = true
    git(repo.cwd, ["add", "--", ...snapshot.files.map((file) => file.repoPath)])
    assertSnapshot(root, snapshot, { staged: true })
    journal.expectedTree = assertStaged(repo, snapshot)
    journal.phase = "staged"
    saveJournal(journalPath, journal)
    const hooks = resolve(lockPath, "hooks")
    mkdirSync(hooks)
    const originalHooks = existsSync(journal.originalHooksDirectory)
      ? readdirSync(journal.originalHooksDirectory).filter((name) =>
          statSync(resolve(journal.originalHooksDirectory, name)).isFile()
        )
      : []
    for (const hookName of new Set([
      "pre-commit",
      "prepare-commit-msg",
      "commit-msg",
      "post-commit",
      ...originalHooks,
    ])) {
      writeFileSync(
        resolve(hooks, hookName),
        `#!${process.execPath}\nimport { runCommitHook } from ${JSON.stringify(import.meta.url)};\ntry { runCommitHook({journalPath:${JSON.stringify(journalPath)},hookName:${JSON.stringify(hookName)},args:process.argv.slice(2)}); } catch (error) { console.error(error.message); process.exitCode=1; }\n`,
        { mode: 0o700 }
      )
    }
    journal.phase = "committing"
    saveJournal(journalPath, journal)
    git(repo.cwd, ["-c", `core.hooksPath=${hooks}`, "commit", "-m", message])
    journal = JSON.parse(readFileSync(journalPath, "utf8"))
    if (journal.hookFailure) throw new Error(journal.hookFailure.error)
    const commit = verifyResult(repo, journal)
    journal.result = {
      commit,
      repoPath: snapshot.repoPath,
      files: snapshot.files.map((file) => file.path),
      fingerprint: snapshot.fingerprint,
      journalPath,
      replayed: false,
    }
    journal.phase = "committed"
    journal.completedAt = new Date().toISOString()
    saveJournal(journalPath, journal)
    completed = true
    return journal.result
  } catch (error) {
    if (journal) {
      journal.previousPhase = journal.phase
      journal.phase = "failed"
      journal.error = error.message
      saveJournal(journalPath, journal)
    }
    throw new Error(
      `${error.message}${stagingStarted ? `; index preserved, inspect journal and retained repository lock: ${journalPath}` : ""}`
    )
  } finally {
    if (completed || !stagingStarted) rmSync(lockPath, { recursive: true })
  }
}
