import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
  symlinkSync,
  chmodSync,
  realpathSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { test } from "node:test"

import { captureBaseline, prepareSnapshot, commitSnapshot, authorizeCommitRequest } from "../scripts/agent-git.mjs"

function submoduleFixture(t) {
  const f = fixture(t)
  const child = fixture(t)
  f.git("-c", "protocol.file.allow=always", "submodule", "add", "--quiet", child.root, "modules/library")
  f.git("commit", "--quiet", "-m", "Fixture submodule")
  const childGit = (...args) => f.git("-C", "modules/library", ...args)
  childGit("config", "user.name", "Fixture Agent")
  childGit("config", "user.email", "fixture@example.invalid")
  childGit("config", "commit.gpgsign", "false")
  const repositories = [
    { path: ".", readOnly: false },
    { path: "modules/library", readOnly: false },
  ]
  const baseline = captureBaseline({ root: f.root, repositories })
  const prepare = (repoPath, paths) =>
    prepareSnapshot({
      root: f.root,
      repoPath,
      paths,
      scopes: ["modules/library"],
      repositories,
      baseline,
    })
  return { ...f, childGit, repositories, baseline, prepare }
}

test("submodule changes commit inside the child before an independently reviewed parent gitlink", (t) => {
  const f = submoduleFixture(t)
  f.write("modules/library/src/existing.txt", "updated child\n")
  assert.throws(() => f.prepare(".", ["modules/library/src/existing.txt"]), /repository boundary/)
  assert.throws(() => f.prepare(".", ["modules/library"]), /Submodule must be clean/)
  const child = f.commit(f.prepare("modules/library", ["modules/library/src/existing.txt"]))
  assert.equal(f.childGit("show", "HEAD:src/existing.txt"), "updated child\n")
  const parent = f.prepare(".", ["modules/library"])
  assert.equal(parent.files[0].mode, "160000")
  assert.equal(parent.files[0].blob, child.commit)
  f.commit(parent)
  assert.equal(f.git("ls-tree", "HEAD", "modules/library").split(/\s+/)[2], child.commit)
  assert.equal(f.git("status", "--porcelain"), "")
})

test("submodule pointer snapshots reject dirty, replaced, uninitialized and read-only children", (t) => {
  const f = submoduleFixture(t)
  f.write("modules/library/src/existing.txt", "second\n")
  f.childGit("add", "src/existing.txt")
  assert.throws(() => f.prepare(".", ["modules/library"]), /pre-existing staged work/)
  f.childGit("commit", "--quiet", "-m", "Changed pointer")
  const parent = f.prepare(".", ["modules/library"])
  f.write("modules/library/untracked.txt", "not reviewed")
  assert.throws(() => f.commit(parent), /Submodule must be clean/)
  rmSync(resolve(f.root, "modules/library/untracked.txt"))
  f.childGit("commit", "--allow-empty", "--quiet", "-m", "Changed again after review")
  assert.throws(() => f.commit(parent), /Snapshot changed/)
  assert.throws(
    () =>
      prepareSnapshot({
        root: f.root,
        repoPath: ".",
        paths: ["modules/library"],
        scopes: ["modules/library"],
        baseline: f.baseline,
        repositories: [
          { path: ".", readOnly: false },
          { path: "modules/library", readOnly: true },
        ],
      }),
    /repository boundary/
  )
  f.git("submodule", "deinit", "--force", "modules/library")
  assert.throws(() => f.prepare(".", ["modules/library"]), /independent Git repository/)
})

function fixture(t, { existing = true, repoPath = "." } = {}) {
  const root = mkdtempSync(resolve(tmpdir(), "workspace-agent-git-"))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const cwd = resolve(root, repoPath)
  mkdirSync(cwd, { recursive: true })
  const git = (...args) => {
    const result = spawnSync("git", ["-C", cwd, ...args], {
      encoding: "utf8",
      env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" },
    })
    assert.equal(result.status, 0, result.stderr)
    return result.stdout
  }
  git("init", "--quiet")
  git("config", "user.name", "Fixture Agent")
  git("config", "user.email", "fixture@example.invalid")
  git("config", "commit.gpgsign", "false")
  git("config", "core.hooksPath", resolve(cwd, ".git/hooks"))
  const write = (path, value = "new\n") => {
    mkdirSync(resolve(cwd, path, ".."), { recursive: true })
    writeFileSync(resolve(cwd, path), value)
  }
  write(".gitignore", ".local/\nignored/\n")
  if (existing) {
    write("src/existing.txt", "original\n")
    git("add", ".")
    git("commit", "--quiet", "-m", "Fixture baseline")
  } else {
    // The initial .gitignore belongs to the fixture and is deliberately not selected.
    rmSync(resolve(cwd, ".gitignore"))
  }
  const repositories = [{ path: repoPath, readOnly: false }]
  const baseline = captureBaseline({ root, repositories })
  const workspacePath = (path) => (repoPath === "." ? path : `${repoPath}/${path}`)
  const prepare = (paths, overrides = {}) =>
    prepareSnapshot({
      root,
      repoPath,
      paths: paths.map(workspacePath),
      scopes: [workspacePath("src")],
      repositories,
      baseline,
      ...overrides,
    })
  const commit = (snapshot, overrides = {}) =>
    commitSnapshot({
      root,
      snapshot,
      message: "test: owned task change",
      journalPath: resolve(root, `.local/journals/${snapshot.fingerprint}.json`),
      ...overrides,
    })
  const hook = (name, source) => {
    const path = resolve(cwd, ".git/hooks", name)
    writeFileSync(path, `#!/bin/sh\n${source}\n`, { mode: 0o700 })
  }
  return { root, cwd, git, write, repositories, baseline, prepare, commit, hook, workspacePath }
}

test("human commit handoff preserves dirty provenance and authorizes only exact inspected bytes", (t) => {
  const f = fixture(t)
  f.write("src/existing.txt", "approved handoff\n")
  f.write("src/unknown.txt", "unapproved\n")
  const original = captureBaseline({ root: f.root, repositories: f.repositories })
  const options = {
    root: f.root,
    repoPath: ".",
    paths: ["src/existing.txt"],
    scopes: ["src"],
    baseline: original,
    repositories: f.repositories,
  }
  assert.throws(() => prepareSnapshot(options), /already dirty/)
  assert.throws(() => authorizeCommitRequest(options, ""), /explicit human/)
  const baseline = authorizeCommitRequest(options, "User: commit the reviewed assisted implementation")
  assert.deepEqual(baseline.repositories, original.repositories)
  assert.equal(original.commitRequest, undefined)
  assert.throws(
    () => prepareSnapshot({ ...options, baseline, paths: ["src/unknown.txt"] }),
    /matching human commit request/
  )
  f.write("src/existing.txt", "changed after authorization\n")
  assert.throws(() => prepareSnapshot({ ...options, baseline }), /matching human commit request/)
  f.write("src/existing.txt", "approved handoff\n")
  const snapshot = prepareSnapshot({ ...options, baseline })
  f.commit(snapshot)
  assert.equal(f.git("show", "HEAD:src/existing.txt"), "approved handoff\n")
  assert.match(f.git("status", "--porcelain"), /src\/unknown.txt/)
})

test("multi-repository commit requests preserve per-repository byte, index and HEAD guards", (t) => {
  const f = fixture(t)
  f.write(".gitignore", ".local/\nignored/\ne/\n")
  f.git("add", ".gitignore")
  f.git("commit", "-qm", "Ignore independent engine")
  f.write("e/src/existing.txt", "original child\n")
  const childGit = (...args) => f.git("-C", "e", ...args)
  childGit("init", "--quiet")
  childGit("config", "user.name", "Fixture Agent")
  childGit("config", "user.email", "fixture@example.invalid")
  childGit("config", "commit.gpgsign", "false")
  childGit("add", ".")
  childGit("commit", "-qm", "Child baseline")
  f.write("src/existing.txt", "approved root\n")
  f.write("e/src/existing.txt", "approved child\n")
  f.write("src/unknown.txt", "unapproved root\n")
  f.write("e/src/unknown.txt", "unapproved child\n")
  const repositories = [
    { path: ".", readOnly: false },
    { path: "e", readOnly: false },
  ]
  const original = captureBaseline({ root: f.root, repositories })
  const options = {
    root: f.root,
    repoPaths: [".", "e"],
    paths: ["src/existing.txt", "e/src/existing.txt"],
    scopes: ["src", "e/src"],
    baseline: original,
    repositories,
  }
  const request = () => authorizeCommitRequest(options, "User: checkpoint both inspected repositories")
  for (const [git, path] of [
    [f.git, "src/unknown.txt"],
    [childGit, "src/unknown.txt"],
  ]) {
    git("add", path)
    const index = git("ls-files", "--stage")
    assert.throws(request, /staged work/)
    assert.equal(git("ls-files", "--stage"), index)
    git("reset", "--quiet", "HEAD", "--", path) // Fixture owns the checkpoint.
  }
  assert.throws(
    () =>
      authorizeCommitRequest(
        { ...options, repositories: [repositories[0], { path: "e", readOnly: true }] },
        "User request"
      ),
    /read-only/
  )
  assert.throws(
    () => authorizeCommitRequest({ ...options, repoPaths: [".", "missing"] }, "User request"),
    /outside the explicitly requested/
  )
  const baseline = request()
  assert.deepEqual(baseline.repositories, original.repositories)
  assert.equal(original.commitRequests, undefined)
  const prepare = (repoPath, paths) => prepareSnapshot({ ...options, repoPath, paths, baseline })
  assert.throws(() => prepare(".", ["src/unknown.txt"]), /matching human commit request/)
  assert.throws(() => prepare("e", ["e/src/unknown.txt"]), /matching human commit request/)
  assert.throws(() => prepare(".", ["e/src/existing.txt"]), /repository boundary/)
  for (const [path, repo] of [
    ["src/existing.txt", "."],
    ["e/src/existing.txt", "e"],
  ]) {
    const saved = readFileSync(resolve(f.root, path))
    f.write(path, "changed after approval\n")
    assert.throws(() => prepare(repo, [path]), /matching human commit request/)
    f.write(path, saved)
  }
  f.git("commit", "--allow-empty", "-qm", "Changed root HEAD")
  assert.throws(() => prepare(".", ["src/existing.txt"]), /matching human commit request/)
  assert.equal(prepare("e", ["e/src/existing.txt"]).repoPath, "e")
  childGit("commit", "--allow-empty", "-qm", "Changed child HEAD")
  assert.throws(() => prepare("e", ["e/src/existing.txt"]), /matching human commit request/)
})

test("human commit handoff retains index, boundary, path and HEAD guards", (t) => {
  const f = fixture(t)
  f.write("src/existing.txt", "approved handoff\n")
  const options = {
    root: f.root,
    repoPath: ".",
    paths: ["src/existing.txt"],
    scopes: ["src"],
    baseline: captureBaseline({ root: f.root, repositories: f.repositories }),
    repositories: f.repositories,
  }
  f.git("add", "src/existing.txt")
  assert.throws(() => authorizeCommitRequest(options, "User request"), /staged work/)
  f.git("reset", "--quiet", "--", "src/existing.txt") // Fixture owns this index.
  assert.throws(
    () => authorizeCommitRequest({ ...options, repositories: [{ path: ".", readOnly: true }] }, "User request"),
    /read-only/
  )
  assert.throws(() => authorizeCommitRequest({ ...options, paths: ["src"] }, "User request"), /explicit regular files/)
  assert.throws(() => authorizeCommitRequest({ ...options, paths: ["../outside"] }, "User request"), /escapes/)
  const baseline = authorizeCommitRequest(options, "User request")
  f.git("commit", "--allow-empty", "--quiet", "-m", "Fixture changes HEAD")
  assert.throws(() => prepareSnapshot({ ...options, baseline }), /matching human commit request/)
})

test("initial repository commits only selected owned files and replays its journal without another commit", (t) => {
  const f = fixture(t, { existing: false })
  f.write("src/new.txt")
  f.write("unrelated.txt", "not ours")
  const snapshot = f.prepare(["src/new.txt"])
  assert.equal(snapshot.head, null)
  const result = f.commit(snapshot)
  assert.deepEqual(f.git("ls-tree", "-r", "--name-only", "HEAD").trim().split("\n"), ["src/new.txt"])
  assert.equal(f.git("rev-list", "--count", "HEAD").trim(), "1")
  assert.equal(f.commit(snapshot).replayed, true)
  assert.equal(f.git("rev-list", "--count", "HEAD").trim(), "1")
  assert.equal(JSON.parse(readFileSync(result.journalPath)).phase, "committed")
  assert.equal(existsSync(resolve(f.cwd, ".git/agent-commit.lock")), false)
})

test("existing history supports edits and deletions while preserving unrelated working changes", (t) => {
  const f = fixture(t)
  rmSync(resolve(f.cwd, "src/existing.txt"))
  f.write("src/new.txt")
  f.write("unrelated.txt")
  const result = f.commit(f.prepare(["src/existing.txt", "src/new.txt"]))
  assert.equal(f.git("rev-parse", "HEAD").trim(), result.commit)
  assert.match(f.git("status", "--porcelain"), /unrelated.txt/)
  assert.equal(f.git("diff", "--cached", "--name-only"), "")
  assert.equal(f.git("show", "HEAD:src/new.txt"), "new\n")
})

test("pre-existing staged work and intent-to-add remain untouched", (t) => {
  for (const intent of [false, true]) {
    const f = fixture(t)
    f.write("checkpoint.txt", "user checkpoint")
    f.git("add", ...(intent ? ["-N"] : []), "checkpoint.txt")
    const indexBefore = readFileSync(resolve(f.cwd, ".git/index"))
    f.write("src/new.txt")
    assert.throws(() => f.prepare(["src/new.txt"]), /pre-existing staged work/)
    assert.deepEqual(readFileSync(resolve(f.cwd, ".git/index")), indexBefore)
  }
})

test("dirty-at-claim files cannot be adopted into an automatic commit", (t) => {
  const f = fixture(t)
  f.write("src/existing.txt", "user edit\n")
  f.write("src/inherited.txt", "untracked user file\n")
  const baseline = captureBaseline(f)
  f.write("src/existing.txt", "user plus agent edit\n")
  for (const path of ["src/existing.txt", "src/inherited.txt"]) {
    assert.throws(() => f.prepare([path], { baseline }), /already dirty/)
  }
})

test("unowned, ignored, unchanged, directories, metadata and escaping paths are refused", (t) => {
  const f = fixture(t)
  f.write("other.txt")
  f.write("ignored/file.txt")
  for (const [path, scopes, expected] of [
    ["other.txt", ["src"], /Unowned/],
    ["ignored/file.txt", ["ignored"], /unchanged or ignored/],
    ["src/existing.txt", ["src"], /unchanged or ignored/],
    ["src", ["src"], /explicit regular files/],
    [".git/config", ["."], /Git metadata/],
    ["../outside", ["."], /escapes/],
  ])
    assert.throws(() => f.prepare([path], { scopes }), expected)
})

test("literal names including pathspec syntax, whitespace and leading dash are safe", (t) => {
  const f = fixture(t)
  const names = ["src/:(glob)*.txt", "src/space name.txt", "src/line\nbreak.txt", "src/-option.txt"]
  for (const path of names) f.write(path, path)
  f.write("src/not-selected.txt")
  f.commit(f.prepare(names))
  const tracked = f.git("ls-tree", "-r", "--name-only", "-z", "HEAD").split("\0")
  for (const path of names) assert.ok(tracked.includes(path))
  assert.ok(!tracked.includes("src/not-selected.txt"))
})

test("leaf symlinks are snapshotted as links, while symlink ancestors are rejected", (t) => {
  const f = fixture(t)
  symlinkSync("../../outside", resolve(f.cwd, "src/link"))
  symlinkSync(resolve(f.cwd, "src"), resolve(f.cwd, "alias"), "dir")
  f.write("src/new.txt")
  assert.throws(() => f.prepare(["alias/new.txt"], { scopes: ["alias"] }), /Symlink ancestor/)
  const snapshot = f.prepare(["src/link"])
  assert.equal(snapshot.files[0].mode, "120000")
  f.commit(snapshot)
  assert.equal(f.git("show", "HEAD:src/link"), "../../outside")
})

test("nested repositories use their own identity and read-only boundaries remain enforced", (t) => {
  const f = fixture(t, { repoPath: "engine" })
  f.write("src/new.txt")
  const snapshot = f.prepare(["src/new.txt"])
  assert.equal(snapshot.repoPath, "engine")
  f.commit(snapshot)
  assert.throws(() => f.prepare(["src/new.txt"], { repositories: [{ path: "engine", readOnly: true }] }), /read-only/)
})

test("configured and unconfigured nested repositories cannot be committed as outer files", (t) => {
  const f = fixture(t)
  mkdirSync(resolve(f.cwd, "src/child"))
  assert.equal(spawnSync("git", ["init", "--quiet", resolve(f.cwd, "src/child")]).status, 0)
  f.write("src/child/file.txt")
  assert.throws(() => f.prepare(["src/child/file.txt"]), /nested repository boundary/)
  assert.throws(
    () =>
      f.prepare(["src/child/file.txt"], {
        repositories: [...f.repositories, { path: "src/child", readOnly: false }],
      }),
    /repository boundary/
  )
})

test("content, mode and HEAD changes invalidate a prepared snapshot before staging", (t) => {
  for (const mutate of [
    (f) => f.write("src/new.txt", "changed\n"),
    (f) => chmodSync(resolve(f.cwd, "src/new.txt"), 0o755),
    (f) => {
      f.write("head-change.txt")
      f.git("add", "head-change.txt")
      f.git("commit", "--quiet", "-m", "Other commit")
    },
  ]) {
    const f = fixture(t)
    f.write("src/new.txt")
    const snapshot = f.prepare(["src/new.txt"])
    mutate(f)
    assert.throws(() => f.commit(snapshot), /changed since snapshot|Snapshot changed/)
    assert.equal(f.git("diff", "--cached", "--name-only"), "")
  }
})

test("staging after snapshot by another actor blocks committing and preserves the checkpoint", (t) => {
  const f = fixture(t)
  f.write("src/new.txt")
  const snapshot = f.prepare(["src/new.txt"])
  f.write("checkpoint.txt")
  f.git("add", "checkpoint.txt")
  const indexBefore = readFileSync(resolve(f.cwd, ".git/index"))
  assert.throws(() => f.commit(snapshot), /pre-existing staged work/)
  assert.deepEqual(readFileSync(resolve(f.cwd, ".git/index")), indexBefore)
})

test("failed hooks retain the exact staged work, journal and lock, and cannot replay blindly", (t) => {
  const f = fixture(t)
  f.write("src/new.txt")
  const snapshot = f.prepare(["src/new.txt"])
  f.hook("pre-commit", "exit 1")
  assert.throws(() => f.commit(snapshot), /Original pre-commit hook failed.*index preserved/s)
  assert.equal(f.git("rev-parse", "HEAD").trim(), snapshot.head)
  assert.equal(f.git("diff", "--cached", "--name-only").trim(), "src/new.txt")
  const journal = JSON.parse(readFileSync(resolve(f.root, `.local/journals/${snapshot.fingerprint}.json`)))
  assert.equal(journal.phase, "failed")
  assert.equal(existsSync(resolve(f.cwd, ".git/agent-commit.lock/owner.json")), true)
  assert.throws(() => f.commit(snapshot), /Incomplete commit journal/)
})

test("each hook that can change a proposed commit is followed by a snapshot guard", (t) => {
  for (const name of ["pre-commit", "prepare-commit-msg", "commit-msg"]) {
    const f = fixture(t)
    f.write("src/new.txt")
    const snapshot = f.prepare(["src/new.txt"])
    f.hook(name, "printf 'unreviewed' > injected.txt\ngit add injected.txt")
    assert.throws(() => f.commit(snapshot), /Staged files differ.*index preserved/s)
    assert.equal(f.git("rev-parse", "HEAD").trim(), snapshot.head)
    assert.match(f.git("diff", "--cached", "--name-only"), /injected.txt/)
  }
})

test("normal hooks execute and may edit the commit message without changing reviewed files", (t) => {
  const f = fixture(t)
  f.write("src/new.txt")
  f.hook("commit-msg", 'printf "test: message formatted by hook\\n" > "$1"')
  f.hook("post-commit", "printf 'ran' > .git/hook-ran")
  f.commit(f.prepare(["src/new.txt"]))
  assert.equal(f.git("log", "-1", "--format=%s").trim(), "test: message formatted by hook")
  assert.equal(readFileSync(resolve(f.cwd, ".git/hook-ran"), "utf8"), "ran")
})

test("post-commit content changes leave an uncertain journal instead of claiming success", (t) => {
  const f = fixture(t)
  f.write("src/new.txt")
  const snapshot = f.prepare(["src/new.txt"])
  f.hook("post-commit", "printf 'changed after commit' > src/new.txt")
  assert.throws(() => f.commit(snapshot), /Working file changed during commit/)
  assert.notEqual(f.git("rev-parse", "HEAD").trim(), snapshot.head)
  assert.equal(
    JSON.parse(readFileSync(resolve(f.root, `.local/journals/${snapshot.fingerprint}.json`))).phase,
    "failed"
  )
})

test("missing repositories are recorded unavailable without blocking assisted claims", (t) => {
  const f = fixture(t)
  const baseline = captureBaseline({
    root: f.root,
    repositories: [...f.repositories, { path: "missing" }],
  })
  assert.equal(baseline.repositories["."].available, true)
  assert.equal(baseline.repositories.missing.available, false)
  f.write("src/new.txt")
  assert.throws(() => f.prepare(["src/new.txt"], { baseline: { repositories: {} } }), /matching repository baseline/)
})

test("pre-existing repository locks and incomplete crash journals are never stolen or replayed", (t) => {
  const f = fixture(t)
  f.write("src/new.txt")
  const snapshot = f.prepare(["src/new.txt"])
  mkdirSync(resolve(f.cwd, ".git/agent-commit.lock"))
  assert.throws(() => f.commit(snapshot), /never steal by age/)
  const journalPath = resolve(f.root, ".local/incomplete.json")
  mkdirSync(resolve(f.root, ".local"))
  writeFileSync(
    journalPath,
    JSON.stringify({
      root: realpathSync(f.root),
      phase: "committing",
      snapshot,
      message: "test: owned task change",
    })
  )
  assert.throws(() => f.commit(snapshot, { journalPath }), /Incomplete commit journal/)
  assert.equal(f.git("diff", "--cached", "--name-only"), "")
})

test("post-commit hook failures and reference transaction hooks are preserved", (t) => {
  const f = fixture(t)
  f.write("src/new.txt")
  f.hook("reference-transaction", 'printf "%s\\n" "$1" >> .git/reference-calls')
  f.hook("post-commit", "exit 7")
  assert.throws(() => f.commit(f.prepare(["src/new.txt"])), /Original post-commit hook failed/)
  const calls = readFileSync(resolve(f.cwd, ".git/reference-calls"), "utf8").trim().split("\n")
  assert.ok(calls.includes("prepared"))
  assert.ok(calls.includes("committed"))
})

test("existing Git operations are refused before staging or creating a journal", (t) => {
  const f = fixture(t)
  f.write("src/new.txt")
  writeFileSync(resolve(f.cwd, ".git/MERGE_HEAD"), f.git("rev-parse", "HEAD"))
  assert.throws(() => f.prepare(["src/new.txt"]), /existing Git operation/)
  assert.equal(f.git("diff", "--cached", "--name-only"), "")
  assert.equal(existsSync(resolve(f.cwd, ".git/agent-commit.lock")), false)
})

test("ambient Git path overrides cannot redirect snapshots or commits", (t) => {
  const f = fixture(t)
  const other = fixture(t)
  f.write("src/new.txt")
  const keys = ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE"]
  const old = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
  try {
    process.env.GIT_DIR = resolve(other.cwd, ".git")
    process.env.GIT_WORK_TREE = other.cwd
    process.env.GIT_INDEX_FILE = resolve(other.cwd, ".git/index")
    const snapshot = f.prepare(["src/new.txt"])
    f.commit(snapshot)
  } finally {
    for (const key of keys)
      if (old[key] === undefined) delete process.env[key]
      else process.env[key] = old[key]
  }
  assert.equal(f.git("show", "HEAD:src/new.txt"), "new\n")
  assert.equal(other.git("rev-list", "--count", "HEAD").trim(), "1")
})
