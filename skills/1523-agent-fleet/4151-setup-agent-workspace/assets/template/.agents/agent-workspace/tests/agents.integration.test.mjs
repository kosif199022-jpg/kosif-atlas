import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const cli = fileURLToPath(new URL("../scripts/agents.mjs", import.meta.url))

test("explicit later commit request finalizes an assisted Done task without adopting unrelated dirt", async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), "workspace-assisted-commit-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const invoke = (command, args) =>
    spawnSync(command, args, {
      cwd: root,
      env: { ...process.env, BACKLOG_CWD: root },
      encoding: "utf8",
      timeout: 30000,
    })
  const run = (command, args) => {
    const result = invoke(command, args)
    assert.equal(result.status, 0, `${args.join(" ")}\n${result.stderr}\n${result.stdout}`)
    return result.stdout
  }
  const git = (...args) => run("git", args)
  const native = (...args) => run("backlog", args)
  const raw = (...args) => run(process.execPath, [cli, "--root", root, ...args])
  const agent = (...args) => JSON.parse(raw(...args))
  const rejected = (...args) => {
    const result = invoke(process.execPath, [cli, "--root", root, ...args])
    assert.equal(result.status, 1, result.stdout)
    return result.stderr
  }
  git("init", "--quiet")
  git("config", "user.name", "Fixture Agent")
  git("config", "user.email", "fixture@example.invalid")
  git("config", "commit.gpgsign", "false")
  await mkdir(resolve(root, "backlog"))
  await mkdir(resolve(root, "src"))
  await writeFile(
    resolve(root, "backlog/config.yml"),
    await readFile(new URL("./fixtures/backlog.yml", import.meta.url))
  )
  await writeFile(resolve(root, ".gitignore"), ".agents/agent-workspace/runtime/\n")
  const config = JSON.parse(await readFile(new URL("./fixtures/workspace.json", import.meta.url), "utf8"))
  config.repositories = [
    {
      path: ".",
      readOnly: false,
      checks: [{ name: "syntax", command: [process.execPath, "--check", "src/feature.mjs"] }],
    },
  ]
  await writeFile(resolve(root, "agent-workspace.json"), JSON.stringify(config))
  await writeFile(resolve(root, "src/feature.mjs"), "export const value = 1;\n")
  native("task", "create", "Assisted fixture", "--ac", "Feature verified")
  const taskPath = JSON.parse(native("task", "view", "TASK-1", "--json")).task.path
  git("add", ".")
  git("commit", "-qm", "Fixture baseline")
  const start = (...extra) =>
    agent(
      "start",
      "--provider",
      "codex",
      "--context",
      "Assisted fixture",
      "--allow-task",
      "TASK-1",
      "--authorization",
      "Synthetic user request",
      ...extra
    )
  let owner = start()
  const args = () => ["--session", owner.id, "--task", "TASK-1"]
  assert.match(
    rejected(
      "claim",
      ...args(),
      "--commit-request",
      "--repo",
      ".",
      "--file",
      "src/feature.mjs",
      "--authorization",
      "Synthetic request"
    ),
    /unchanged/
  )
  agent("claim", ...args(), "--scope", "src")
  await writeFile(resolve(root, "src/feature.mjs"), "export const value = 2;\n")
  run(process.execPath, ["--check", "src/feature.mjs"])
  raw(
    "backlog",
    "--session",
    owner.id,
    "--",
    "task",
    "edit",
    "TASK-1",
    "--check-ac",
    "1",
    "--final-summary",
    "Checked assisted feature; intentionally uncommitted"
  )
  agent("visual", ...args(), "--kind", "no-ui", "--note", "Source fixture only")
  agent("release", ...args(), "--outcome", "done", "--note", "Assisted checks passed; await commit request")
  agent("stop", "--session", owner.id)
  await writeFile(resolve(root, "human.txt"), "Unrelated human work\n")
  owner = start("--commits", "automatic")
  const request = ["--commit-request", "--repo", ".", "--file", "src/feature.mjs"]
  assert.match(rejected("claim", ...args(), ...request, "--authorization", "Synthetic user request"), /on-request/)
  agent("stop", "--session", owner.id)
  owner = start()
  assert.match(rejected("claim", ...args(), "--scope", "src"), /completed/)
  assert.match(rejected("claim", ...args(), ...request), /authorization/)
  assert.match(
    rejected("claim", ...args(), ...request, "--scope", "src", "--authorization", "Synthetic user request"),
    /without scopes/
  )
  assert.match(
    rejected("claim", ...args(), ...request, "--file", taskPath, "--authorization", "Synthetic user request"),
    /finalized separately/
  )
  const claim = agent("claim", ...args(), ...request, "--authorization", "User: please commit the reviewed feature")
  assert.ok(claim.baseline.repositories["."].dirtyPaths.includes("src/feature.mjs"))
  assert.equal(JSON.parse(native("task", "view", "TASK-1", "--json")).task.status, "Done")
  agent(
    "release",
    ...args(),
    "--outcome",
    "paused",
    "--note",
    "Fixture interruption before commit leaves completed work Done"
  )
  assert.equal(JSON.parse(native("task", "view", "TASK-1", "--json")).task.status, "Done")
  agent("claim", ...args(), ...request, "--authorization", "User: please commit the reviewed feature")
  assert.match(rejected("snapshot", ...args(), "--repo", ".", "--file", "human.txt"), /explicitly approved/)
  await writeFile(resolve(root, "src/feature.mjs"), "export const value = 3;\n")
  assert.match(
    rejected("snapshot", ...args(), "--repo", ".", "--file", "src/feature.mjs"),
    /matching human commit request/
  )
  await writeFile(resolve(root, "src/feature.mjs"), "export const value = 2;\n")
  const snapshot = agent("snapshot", ...args(), "--repo", ".", "--file", "src/feature.mjs")
  agent("visual", ...args(), "--kind", "no-ui", "--note", "Inspected source fixture only")
  agent("verify", ...args())
  agent(
    "review",
    ...args(),
    "--fingerprint",
    snapshot.fingerprint,
    "--verdict",
    "pass",
    "--note",
    "Self-reviewed exact assisted handoff and syntax results"
  )
  assert.match(
    rejected("commit", ...args(), "--message", "feat(TASK-1): commit assisted work"),
    /authorization|explicit/i
  )
  agent(
    "commit",
    ...args(),
    "--message",
    "feat(TASK-1): commit assisted work",
    "--authorization",
    "User: please commit the reviewed feature"
  )
  agent(
    "release",
    ...args(),
    "--outcome",
    "done",
    "--note",
    "Requested guarded implementation and bookkeeping commits complete"
  )
  agent("stop", "--session", owner.id)
  assert.equal(git("show", "HEAD~1:src/feature.mjs"), "export const value = 2;\n")
  assert.equal(git("rev-list", "--count", "HEAD").trim(), "3")
  assert.equal(git("status", "--porcelain"), "?? human.txt\n")
  assert.deepEqual(agent("status", "--json").claims, {})
})

test("cross-repository checkpoints bind engine changes and visual evidence without adopting other files", async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), "workspace-cross-repo-checkpoint-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const invoke = (command, args) =>
    spawnSync(command, args, {
      cwd: root,
      env: { ...process.env, BACKLOG_CWD: root },
      encoding: "utf8",
      timeout: 30000,
    })
  const run = (command, args) => {
    const result = invoke(command, args)
    assert.equal(result.status, 0, `${args.join(" ")}\n${result.stderr}\n${result.stdout}`)
    return result.stdout
  }
  const git = (...args) => run("git", args)
  const native = (...args) => run("backlog", args)
  const raw = (...args) => run(process.execPath, [cli, "--root", root, ...args])
  const agent = (...args) => JSON.parse(raw(...args))
  const rejected = (...args) => {
    const result = invoke(process.execPath, [cli, "--root", root, ...args])
    assert.equal(result.status, 1, result.stdout)
    return result.stderr
  }
  for (const repo of [".", "engine"]) {
    await mkdir(resolve(root, repo), { recursive: true })
    git("-C", repo, "init", "--quiet")
    git("-C", repo, "config", "user.name", "Fixture Agent")
    git("-C", repo, "config", "user.email", "fixture@example.invalid")
    git("-C", repo, "config", "commit.gpgsign", "false")
  }
  await mkdir(resolve(root, "backlog"))
  await writeFile(
    resolve(root, "backlog/config.yml"),
    await readFile(new URL("./fixtures/backlog.yml", import.meta.url))
  )
  await writeFile(resolve(root, ".gitignore"), "engine/\n.agents/agent-workspace/runtime/\n")
  const config = JSON.parse(await readFile(new URL("./fixtures/workspace.json", import.meta.url), "utf8"))
  config.repositories = [
    {
      path: ".",
      readOnly: false,
      checks: [{ name: "root-check", command: [process.execPath, "-e", "process.exit(0)"] }],
    },
    {
      path: "engine",
      readOnly: false,
      checks: [{ name: "syntax", command: [process.execPath, "--check", "feature.mjs"] }],
    },
  ]
  await writeFile(resolve(root, "agent-workspace.json"), JSON.stringify(config))
  await writeFile(resolve(root, "engine/feature.mjs"), "export const value = 1;\n")
  native("task", "create", "Unfinished world fixture", "--ac", "Complete gameplay verified")
  git("add", ".")
  git("commit", "-qm", "Fixture baseline")
  git("-C", "engine", "add", ".")
  git("-C", "engine", "commit", "-qm", "Engine baseline")
  const image = "backlog/assets/task-1/world.webp"
  await mkdir(resolve(root, "backlog/assets/task-1"), { recursive: true })
  // The guard checks the WebP container; visual inspection is an operator attestation.
  const webp = Buffer.from("524946460c000000574542505650382000000000", "hex")
  await writeFile(resolve(root, image), webp)
  await writeFile(resolve(root, "engine/feature.mjs"), "export const value = 2;\n")
  await writeFile(resolve(root, "human.txt"), "Unrelated root work\n")
  await writeFile(resolve(root, "engine/human.txt"), "Unrelated child work\n")
  const authorization = [
    "--authorization",
    "User: checkpoint the inspected world and its evidence in both repositories",
  ]
  const owner = agent(
    "start",
    "--provider",
    "codex",
    "--context",
    "Cross-repository checkpoint",
    "--profile",
    "unattended",
    "--commits",
    "on-request",
    "--allow-task",
    "TASK-1",
    ...authorization
  )
  const reviewer = agent(
    "start",
    "--agent",
    "rowan",
    "--provider",
    "codex",
    "--context",
    "Independent review",
    "--run",
    owner.runId
  )
  const args = ["--session", owner.id, "--task", "TASK-1"]
  const request = [
    "--commit-request",
    "--repo",
    ".",
    "--repo",
    "engine",
    "--file",
    image,
    "--file",
    "engine/feature.mjs",
    ...authorization,
  ]
  git("-C", "engine", "add", "human.txt")
  const staged = git("-C", "engine", "ls-files", "--stage")
  assert.match(rejected("claim", ...args, ...request), /index|staged/i)
  assert.equal(git("-C", "engine", "ls-files", "--stage"), staged)
  git("-C", "engine", "reset", "--quiet", "HEAD", "--", "human.txt") // Fixture-owned staging only.
  const claim = agent("claim", ...args, ...request)
  assert.deepEqual(Object.keys(claim.baseline.commitRequests).sort(), [".", "engine"])
  assert.ok(claim.scopes.includes(image))
  assert.ok(claim.baseline.repositories["engine"].dirtyPaths.includes("engine/feature.mjs"))
  assert.match(rejected("snapshot", ...args, "--repo", ".", "--file", "human.txt"), /explicitly approved/)
  assert.match(rejected("snapshot", ...args, "--repo", ".", "--file", "engine/feature.mjs"), /explicitly approved/)
  await writeFile(resolve(root, "engine/feature.mjs"), "export const value = 3;\n")
  assert.match(
    rejected("snapshot", ...args, "--repo", "engine", "--file", "engine/feature.mjs"),
    /matching human commit request/
  )
  await writeFile(resolve(root, "engine/feature.mjs"), "export const value = 2;\n")
  const snapshots = {}
  for (const [repo, path] of [
    [".", image],
    ["engine", "engine/feature.mjs"],
  ])
    snapshots[repo] = agent("snapshot", ...args, "--repo", repo, "--file", path)
  agent(
    "visual",
    ...args,
    "--kind",
    "comparison",
    "--file",
    image,
    "--note",
    "Inspected checkpoint comparison; gameplay remains unfinished"
  )
  await writeFile(resolve(root, image), Buffer.concat([webp.subarray(0, 19), Buffer.from([1])]))
  assert.match(
    rejected(
      "review",
      "--session",
      reviewer.id,
      "--task",
      "TASK-1",
      "--fingerprint",
      snapshots.engine.fingerprint,
      "--verdict",
      "pass",
      "--note",
      "Stale image"
    ),
    /comparison changed/
  )
  await writeFile(resolve(root, image), webp)
  const sources = agent("status", "--json").claims["TASK-1"].visual.sources
  for (const [repo, path] of [
    ["engine", "engine/feature.mjs"],
    [".", image],
  ]) {
    const snapshot = agent("snapshot", ...args, "--repo", repo, "--file", path)
    assert.equal(snapshot.fingerprint, snapshots[repo].fingerprint)
    agent("verify", ...args)
    assert.match(
      rejected("review", ...args, "--fingerprint", snapshot.fingerprint, "--verdict", "pass", "--note", "Self review"),
      /self-approved/
    )
    agent(
      "review",
      "--session",
      reviewer.id,
      "--task",
      "TASK-1",
      "--fingerprint",
      snapshot.fingerprint,
      "--verdict",
      "pass",
      "--note",
      "Exact checkpoint, combined visual evidence and passing repository checks reviewed"
    )
    agent("commit", ...args, "--message", `chore(TASK-1): checkpoint ${repo}`, ...authorization)
  }
  assert.equal(agent("status", "--json").claims["TASK-1"].visual.sources, sources)
  assert.equal(git("-C", "engine", "show", "HEAD:feature.mjs"), "export const value = 2;\n")
  assert.deepEqual(git("diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD").trim().split("\n"), [image])
  assert.deepEqual(git("-C", "engine", "diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD").trim().split("\n"), [
    "feature.mjs",
  ])
  assert.match(rejected("release", ...args, "--outcome", "done", "--note", "Only a checkpoint"), /cannot complete/)
  agent(
    "release",
    ...args,
    "--outcome",
    "paused",
    "--note",
    "Both reviewed checkpoints committed; full gameplay remains unfinished"
  )
  const task = JSON.parse(native("task", "view", "TASK-1", "--json")).task
  assert.equal(task.status, "To Do")
  assert.equal(task.acceptanceCriteriaCompleted, 0)
  assert.match(git("status", "--porcelain"), /human.txt/)
  assert.equal(git("-C", "engine", "status", "--porcelain"), "?? human.txt\n")
  // A later checkpoint can reuse the now-committed workspace image without
  // manufacturing a dirty image or another workspace implementation commit.
  await writeFile(resolve(root, "engine/feature.mjs"), "export const value = 3;\n")
  agent("claim", ...args, ...request)
  assert.match(rejected("snapshot", ...args, "--repo", ".", "--file", image), /unchanged/)
  const next = agent("snapshot", ...args, "--repo", "engine", "--file", "engine/feature.mjs")
  await writeFile(resolve(root, image), Buffer.concat([webp.subarray(0, 19), Buffer.from([1])]))
  assert.match(
    rejected("visual", ...args, "--kind", "comparison", "--file", image, "--note", "Changed evidence"),
    /matching human commit request/
  )
  await writeFile(resolve(root, image), webp)
  agent(
    "visual",
    ...args,
    "--kind",
    "comparison",
    "--file",
    image,
    "--note",
    "Reinspected committed image for exact follow-up checkpoint; feature remains incomplete"
  )
  agent("verify", ...args)
  agent(
    "review",
    "--session",
    reviewer.id,
    "--task",
    "TASK-1",
    "--fingerprint",
    next.fingerprint,
    "--verdict",
    "pass",
    "--note",
    "Exact follow-up checkpoint and immutable committed comparison reviewed"
  )
  agent("commit", ...args, "--message", "chore(TASK-1): checkpoint follow-up engine", ...authorization)
  agent(
    "release",
    ...args,
    "--outcome",
    "paused",
    "--note",
    "Follow-up checkpoint reuses committed evidence without new workspace commit"
  )
  assert.equal(git("rev-list", "--count", "HEAD").trim(), "2")
  assert.equal(git("-C", "engine", "show", "HEAD:feature.mjs"), "export const value = 3;\n")
  agent("stop", "--session", reviewer.id)
  agent("stop", "--session", owner.id)
})

for (const initialStatus of ["To Do", "In Progress"])
  test(`explicit unfinished checkpoint preserves ${initialStatus} and all Git/review guards`, async (t) => {
    const root = await mkdtemp(resolve(tmpdir(), "workspace-unfinished-checkpoint-"))
    t.after(() => rm(root, { recursive: true, force: true }))
    const invoke = (command, args) =>
      spawnSync(command, args, {
        cwd: root,
        env: { ...process.env, BACKLOG_CWD: root },
        encoding: "utf8",
        timeout: 30000,
      })
    const run = (command, args) => {
      const result = invoke(command, args)
      assert.equal(result.status, 0, `${args.join(" ")}\n${result.stderr}\n${result.stdout}`)
      return result.stdout
    }
    const git = (...args) => run("git", args)
    const native = (...args) => run("backlog", args)
    const raw = (...args) => run(process.execPath, [cli, "--root", root, ...args])
    const agent = (...args) => JSON.parse(raw(...args))
    const rejected = (...args) => {
      const result = invoke(process.execPath, [cli, "--root", root, ...args])
      assert.equal(result.status, 1, result.stdout)
      return result.stderr
    }
    git("init", "--quiet")
    git("config", "user.name", "Fixture Agent")
    git("config", "user.email", "fixture@example.invalid")
    git("config", "commit.gpgsign", "false")
    await mkdir(resolve(root, "backlog"))
    await mkdir(resolve(root, "src"))
    await writeFile(
      resolve(root, "backlog/config.yml"),
      await readFile(new URL("./fixtures/backlog.yml", import.meta.url))
    )
    await writeFile(resolve(root, ".gitignore"), ".agents/agent-workspace/runtime/\n")
    const config = JSON.parse(await readFile(new URL("./fixtures/workspace.json", import.meta.url), "utf8"))
    config.repositories = [
      {
        path: ".",
        readOnly: false,
        checks: [{ name: "syntax", command: [process.execPath, "--check", "src/feature.mjs"] }],
      },
    ]
    await writeFile(resolve(root, "agent-workspace.json"), JSON.stringify(config))
    await writeFile(resolve(root, "src/feature.mjs"), "export const value = 1;\n")
    native("task", "create", "Unfinished fixture", "--ac", "Complete behavior verified", "-s", initialStatus)
    const task = () => JSON.parse(native("task", "view", "TASK-1", "--json")).task
    git("add", ".")
    git("commit", "-qm", "Fixture baseline")
    await writeFile(resolve(root, "src/feature.mjs"), "export const value = 2;\n")
    await writeFile(resolve(root, "human.txt"), "Unrelated human work\n")
    const owner = agent(
      "start",
      "--provider",
      "codex",
      "--context",
      "Checkpoint fixture",
      "--profile",
      "unattended",
      "--commits",
      "on-request",
      "--allow-task",
      "TASK-1",
      "--authorization",
      "User explicitly asks to commit unfinished work and continue"
    )
    const reviewer = agent(
      "start",
      "--agent",
      "rowan",
      "--provider",
      "claude",
      "--context",
      "Independent checkpoint review",
      "--run",
      owner.runId
    )
    const args = ["--session", owner.id, "--task", "TASK-1"]
    const request = ["--commit-request", "--repo", ".", "--file", "src/feature.mjs"]
    const authorization = ["--authorization", "User explicitly asks to commit unfinished work and continue"]
    assert.match(rejected("claim", ...args, ...request), /authorization/)
    git("add", "src/feature.mjs")
    assert.match(rejected("claim", ...args, ...request, ...authorization), /index|staged/i)
    git("reset", "--quiet", "HEAD", "--", "src/feature.mjs")
    const claim = agent("claim", ...args, ...request, ...authorization)
    assert.equal(claim.commitRequest.taskStatus, initialStatus)
    assert.ok(claim.baseline.repositories["."].dirtyPaths.includes("src/feature.mjs"))
    assert.equal(task().status, initialStatus)
    assert.match(rejected("release", ...args, "--outcome", "done", "--note", "Incomplete work"), /cannot complete/)
    const snapshotArgs = ["snapshot", ...args, "--repo", ".", "--file", "src/feature.mjs"]
    await writeFile(resolve(root, "src/feature.mjs"), "export const value = 3;\n")
    assert.match(rejected(...snapshotArgs), /matching human commit request/)
    await writeFile(resolve(root, "src/feature.mjs"), "export const value = 2;\n")
    assert.match(rejected("snapshot", ...args, "--repo", ".", "--file", "human.txt"), /explicitly approved/)
    const snapshot = agent(...snapshotArgs)
    agent("visual", ...args, "--kind", "no-ui", "--note", "Inspected source-only unfinished checkpoint")
    const commit = ["commit", ...args, "--message", "chore(TASK-1): checkpoint unfinished source", ...authorization]
    assert.match(rejected(...commit), /verif|check/i)
    agent("verify", ...args)
    assert.match(rejected(...commit), /review/i)
    assert.match(
      rejected("review", ...args, "--fingerprint", snapshot.fingerprint, "--verdict", "pass", "--note", "Self review"),
      /self-approved/
    )
    agent(
      "review",
      "--session",
      reviewer.id,
      "--task",
      "TASK-1",
      "--fingerprint",
      snapshot.fingerprint,
      "--verdict",
      "pass",
      "--note",
      "Exact checkpoint bytes and passing syntax reviewed; feature remains incomplete"
    )
    git("add", "human.txt")
    assert.match(rejected(...commit), /index|staged/i)
    git("reset", "--quiet", "HEAD", "--", "human.txt")
    agent(...commit)
    assert.equal(task().status, initialStatus)
    assert.equal(task().acceptanceCriteriaCompleted, 0)
    assert.equal(task().acceptanceCriteriaCount, 1)
    raw(
      "backlog",
      "--session",
      owner.id,
      "--",
      "task",
      "edit",
      "TASK-1",
      "--check-ac",
      "1",
      "--final-summary",
      "Fixture attempts completion during a checkpoint claim"
    )
    assert.match(
      rejected("release", ...args, "--outcome", "done", "--note", "Checked criteria cannot promote a checkpoint"),
      /cannot complete/
    )
    raw("backlog", "--session", owner.id, "--", "task", "edit", "TASK-1", "--uncheck-ac", "1")
    agent(
      "release",
      ...args,
      "--outcome",
      "paused",
      "--note",
      "Checkpoint committed; implementation remains unfinished"
    )
    assert.equal(task().status, initialStatus)
    assert.equal(git("show", "HEAD:src/feature.mjs"), "export const value = 2;\n")
    assert.equal(git("rev-list", "--count", "HEAD").trim(), "2")
    assert.ok(git("status", "--porcelain").includes("?? human.txt"))
    // Continue through normal ownership against the clean implementation baseline.
    agent("claim", ...args, "--scope", "src")
    await writeFile(resolve(root, "src/feature.mjs"), "export const value = 3;\n")
    agent(...snapshotArgs)
    assert.match(
      rejected("release", ...args, "--outcome", "done", "--note", "Still incomplete"),
      /acceptance|criteria/i
    )
    agent("release", ...args, "--outcome", "paused", "--note", "Fixture continuation proven")
    agent("stop", "--session", reviewer.id)
    agent("stop", "--session", owner.id)
  })

for (const proofMode of ["archive", "legacy"])
  test(`bootstrap checks and exact-content stopped-run recovery (${proofMode})`, async (t) => {
    const root = await mkdtemp(resolve(tmpdir(), "workspace-bootstrap-recovery-"))
    t.after(() => rm(root, { recursive: true, force: true }))
    const invoke = (command, args) =>
      spawnSync(command, args, {
        cwd: root,
        env: { ...process.env, BACKLOG_CWD: root },
        encoding: "utf8",
        timeout: 30000,
      })
    const run = (command, args) => {
      const result = invoke(command, args)
      assert.equal(result.status, 0, `${command} ${args.join(" ")}\n${result.stderr}\n${result.stdout}`)
      return result.stdout
    }
    const git = (...args) => run("git", args)
    const native = (...args) => run("backlog", args)
    const agent = (...args) => JSON.parse(run(process.execPath, [cli, "--root", root, ...args]))
    const rejected = (...args) => {
      const result = invoke(process.execPath, [cli, "--root", root, ...args])
      assert.equal(result.status, 1, result.stdout)
      return result.stderr
    }
    git("init", "--quiet")
    git("config", "user.name", "Fixture Agent")
    git("config", "user.email", "fixture@example.invalid")
    git("config", "commit.gpgsign", "false")
    await mkdir(resolve(root, "backlog"))
    await writeFile(
      resolve(root, "backlog/config.yml"),
      await readFile(new URL("./fixtures/backlog.yml", import.meta.url))
    )
    await writeFile(resolve(root, ".gitignore"), ".agents/agent-workspace/runtime/\n.local/\n")
    const config = JSON.parse(await readFile(new URL("./fixtures/workspace.json", import.meta.url), "utf8"))
    config.repositories = [{ path: ".", readOnly: false, checks: [] }]
    const writeConfig = () => writeFile(resolve(root, "agent-workspace.json"), JSON.stringify(config))
    await writeConfig()
    native("task", "create", "Bootstrap engine", "--ac", "Runtime returns forty-two")
    git("add", ".")
    git("commit", "-qm", "Fixture baseline")
    const start = () =>
      agent(
        "start",
        "--provider",
        "codex",
        "--context",
        "Bootstrap fixture",
        "--profile",
        "unattended",
        "--allow-task",
        "TASK-1",
        "--authorization",
        "Synthetic user authorized TASK-1 local commits"
      )
    let owner = start()
    let reviewer = agent(
      "start",
      "--agent",
      "rowan",
      "--provider",
      "claude",
      "--context",
      "Fixture review",
      "--run",
      owner.runId
    )
    const args = () => ["--session", owner.id, "--task", "TASK-1"]
    const scopes = ["--scope", "src", "--scope", "agent-workspace.json"]
    agent("claim", ...args(), ...scopes)
    await mkdir(resolve(root, "src"))
    await writeFile(resolve(root, "src/app.cjs"), "module.exports = 42;\n")
    config.repositories[0].checks = [
      {
        name: "runtime",
        command: [process.execPath, "-e", "require('node:assert/strict').equal(require('./src/app.cjs'),42)"],
      },
    ]
    await writeConfig()
    const snapshot = () =>
      agent("snapshot", ...args(), "--repo", ".", "--file", "src/app.cjs", "--file", "agent-workspace.json")
    const visual = () => agent("visual", ...args(), "--kind", "no-ui", "--note", "Runtime fixture has no UI")
    const review = (snap) =>
      agent(
        "review",
        "--session",
        reviewer.id,
        "--task",
        "TASK-1",
        "--fingerprint",
        snap.fingerprint,
        "--verdict",
        "pass",
        "--note",
        "Fixture reviewer inspected exact implementation and passing runtime assertion"
      )
    snapshot()
    assert.match(rejected("verify", ...args()), /Configure repository checks/)
    const policy = agent("status", "--json").runs[owner.runId].policy
    agent("refresh-checks", ...args(), "--repo", ".", "--note", "Bootstrap adds the first meaningful runtime check")
    assert.deepEqual(agent("status", "--json").runs[owner.runId].policy, policy)
    assert.match(rejected("verify", ...args()), /snapshot/i)
    let snap = snapshot()
    visual()
    agent("verify", ...args())
    review(snap)
    config.repositories[0].checks.push({ name: "syntax", command: [process.execPath, "--check", "src/app.cjs"] })
    await writeConfig()
    agent(
      "refresh-checks",
      ...args(),
      "--repo",
      ".",
      "--note",
      "Add syntax coverage without changing the original check"
    )
    const refreshed = agent("status", "--json").claims["TASK-1"]
    assert.deepEqual(refreshed.snapshots, {})
    assert.deepEqual(refreshed.reviews, {})
    assert.deepEqual(refreshed.verifications, {})
    assert.equal(refreshed.visual, null)
    assert.match(
      rejected(
        "review",
        "--session",
        reviewer.id,
        "--task",
        "TASK-1",
        "--fingerprint",
        snap.fingerprint,
        "--verdict",
        "pass",
        "--note",
        "Stale review"
      ),
      /snapshot/i
    )
    snap = snapshot()
    visual()
    agent("verify", ...args())
    review(snap)
    run(process.execPath, [
      cli,
      "--root",
      root,
      "backlog",
      "--session",
      owner.id,
      "--",
      "task",
      "edit",
      "TASK-1",
      "--check-ac",
      "1",
      "--final-summary",
      "Runtime assertion passed before handoff; completion awaits renewed evidence and commits",
    ])
    const original = agent("status", "--json").claims["TASK-1"]
    agent("release", ...args(), "--outcome", "paused", "--note", "Preserve exact ownership for a stopped-run handoff")
    const receipt = agent("history", "--claim", original.id)
    assert.deepEqual(receipt.snapshots, [snap])
    await mkdir(resolve(root, ".local"))
    const receiptPath = resolve(root, ".local/original-receipts.json")
    await writeFile(
      receiptPath,
      JSON.stringify({
        claim: original,
        snapshots: [snap],
        source: "Synthetic original tool outputs",
        receipts: [
          { command: "node agents.mjs claim --task TASK-1", output: JSON.stringify(original) },
          { command: "node agents.mjs snapshot --task TASK-1", output: JSON.stringify(snap) },
        ],
      })
    )
    const source = owner
    const proof =
      proofMode === "archive" ? ["--from-claim", original.id] : ["--receipt", receiptPath, "--confirm-receipt"]
    // Released work still belongs to its live source until that session stops.
    owner = start()
    assert.match(rejected("claim", ...args(), ...scopes, ...proof, "--note", "Source still active"), /stopped source/)
    agent("stop", "--session", reviewer.id)
    agent("stop", "--session", source.id)
    if (proofMode === "legacy")
      assert.match(
        rejected("claim", ...args(), ...scopes, "--receipt", receiptPath, "--note", "Missing confirmation"),
        /confirm-receipt/
      )
    await writeFile(resolve(root, "src/app.cjs"), "module.exports = 43;\n")
    assert.match(rejected("claim", ...args(), ...scopes, ...proof, "--note", "Changed files"), /changed|match exactly/)
    await writeFile(resolve(root, "src/app.cjs"), "module.exports = 42;\n")
    git("add", "src/app.cjs")
    assert.match(rejected("claim", ...args(), ...scopes, ...proof, "--note", "Staged checkpoint"), /staged/)
    git("reset", "--quiet", "--", "src/app.cjs") // This disposable fixture owns the entire index.
    assert.match(
      rejected("claim", ...args(), "--scope", "src", ...proof, "--note", "Different scope"),
      /original claim scopes/
    )
    assert.deepEqual(agent("status", "--json").claims, {})
    await writeFile(resolve(root, "src/unknown.cjs"), "module.exports = 'unowned';\n")
    const resumed = agent(
      "claim",
      ...args(),
      ...scopes,
      ...proof,
      "--note",
      "Inspected exact preserved source and original receipts"
    )
    assert.equal(resumed.resumedFrom.claim, original.id)
    assert.equal(resumed.snapshot, undefined)
    assert.equal(resumed.review, undefined)
    assert.match(rejected("snapshot", ...args(), "--repo", ".", "--file", "src/unknown.cjs"), /dirty|inherited/i)
    await rm(resolve(root, "src/unknown.cjs"))
    snap = snapshot()
    visual()
    assert.match(rejected("commit", ...args(), "--message", "feat(TASK-1): bootstrap runtime"), /configured checks/i)
    agent("verify", ...args())
    assert.match(rejected("commit", ...args(), "--message", "feat(TASK-1): bootstrap runtime"), /review/i)
    reviewer = agent(
      "start",
      "--agent",
      "rowan",
      "--provider",
      "claude",
      "--context",
      "Fresh handoff review",
      "--run",
      owner.runId
    )
    review(snap)
    const commit = agent("commit", ...args(), "--message", "feat(TASK-1): bootstrap runtime")
    assert.equal(git("show", `${commit.commit}:src/app.cjs`), "module.exports = 42;\n")
    run(process.execPath, [
      cli,
      "--root",
      root,
      "backlog",
      "--session",
      owner.id,
      "--",
      "task",
      "edit",
      "TASK-1",
      "--check-ac",
      "1",
      "--final-summary",
      "Runtime assertion passed; exact restored contents independently reviewed and committed",
    ])
    agent(
      "release",
      ...args(),
      "--outcome",
      "done",
      "--note",
      "Bootstrap recovery completed through guarded implementation and bookkeeping commits"
    )
    agent("stop", "--session", reviewer.id)
    agent("stop", "--session", owner.id)
    assert.equal(JSON.parse(native("task", "view", "TASK-1", "--json")).task.status, "Done")
    assert.equal(git("status", "--porcelain"), "")
    assert.equal(git("rev-list", "--count", "HEAD").trim(), "3")
  })

test("submodule completion renews reviews for committed child and current parent snapshots", async (t) => {
  const directory = await mkdtemp(resolve(tmpdir(), "workspace-submodule-lifecycle-"))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const root = resolve(directory, "project")
  const source = resolve(directory, "source")
  await mkdir(root)
  await mkdir(source)
  const invoke = (cwd, command, args) =>
    spawnSync(command, args, {
      cwd,
      env: { ...process.env, BACKLOG_CWD: cwd },
      encoding: "utf8",
      timeout: 30000,
    })
  const run = (cwd, command, args) => {
    const result = invoke(cwd, command, args)
    assert.equal(result.status, 0, `${command} ${args.join(" ")}\n${result.stderr}\n${result.stdout}`)
    return result.stdout
  }
  const git = (cwd, ...args) => run(cwd, "git", args)
  const native = (...args) => run(root, "backlog", args)
  const agent = (...args) => JSON.parse(run(root, process.execPath, [cli, "--root", root, ...args]))
  const rejected = (...args) => {
    const result = invoke(root, process.execPath, [cli, "--root", root, ...args])
    assert.equal(result.status, 1, result.stdout)
    return result.stderr
  }
  for (const cwd of [root, source]) {
    git(cwd, "init", "--quiet")
    git(cwd, "config", "user.name", "Fixture Agent")
    git(cwd, "config", "user.email", "fixture@example.invalid")
    git(cwd, "config", "commit.gpgsign", "false")
  }
  await writeFile(resolve(source, "feature.mjs"), "export const value = 1;\n")
  git(source, "add", "feature.mjs")
  git(source, "commit", "-qm", "Fixture source")
  git(root, "-c", "protocol.file.allow=always", "submodule", "add", "--quiet", source, "modules/app")
  const child = resolve(root, "modules/app")
  git(child, "config", "user.name", "Fixture Agent")
  git(child, "config", "user.email", "fixture@example.invalid")
  git(child, "config", "commit.gpgsign", "false")
  await mkdir(resolve(root, "backlog"))
  await writeFile(
    resolve(root, "backlog/config.yml"),
    await readFile(new URL("./fixtures/backlog.yml", import.meta.url))
  )
  await writeFile(resolve(root, ".gitignore"), ".agents/agent-workspace/runtime/\n.local/\n")
  const config = JSON.parse(await readFile(new URL("./fixtures/workspace.json", import.meta.url), "utf8"))
  config.repositories = [".", "modules/app"].map((path) => ({
    path,
    readOnly: false,
    checks: [
      {
        name: "export-value",
        command: [
          process.execPath,
          "--input-type=module",
          "-e",
          `import {value} from './${path === "." ? "modules/app/" : ""}feature.mjs'; if(value!==2) throw new Error('Wrong value');`,
        ],
      },
    ],
  }))
  await writeFile(resolve(root, "agent-workspace.json"), JSON.stringify(config))
  native("task", "create", "Submodule feature", "--ac", "Export returns two")
  git(root, "add", ".")
  git(root, "commit", "-qm", "Fixture workspace and task")
  const owner = agent(
    "start",
    "--provider",
    "codex",
    "--context",
    "Submodule fixture",
    "--profile",
    "unattended",
    "--allow-task",
    "TASK-1",
    "--authorization",
    "Synthetic user authorized local fixture commits"
  )
  const reviewer = agent(
    "start",
    "--agent",
    "rowan",
    "--provider",
    "claude",
    "--context",
    "Independent fixture reviewer",
    "--run",
    owner.runId
  )
  agent("claim", "--session", owner.id, "--task", "TASK-1", "--scope", "modules/app")
  const scope = ["--session", owner.id, "--task", "TASK-1"]
  run(root, process.execPath, [
    cli,
    "--root",
    root,
    "backlog",
    "--session",
    owner.id,
    "--",
    "task",
    "edit",
    "TASK-1",
    "--plan",
    "Change and verify the export",
  ])
  await writeFile(resolve(child, "feature.mjs"), "export const value = 2;\n")
  const visual = () => agent("visual", ...scope, "--kind", "no-ui", "--note", "Export-only fixture, no rendered UI")
  const review = (fingerprint) =>
    agent(
      "review",
      "--session",
      reviewer.id,
      "--task",
      "TASK-1",
      "--fingerprint",
      fingerprint,
      "--verdict",
      "pass",
      "--note",
      "Reviewed exact fixture content and current evidence"
    )
  const childSnapshot = agent("snapshot", ...scope, "--repo", "modules/app", "--file", "modules/app/feature.mjs")
  visual()
  agent("verify", ...scope)
  review(childSnapshot.fingerprint)
  run(root, process.execPath, [
    cli,
    "--root",
    root,
    "backlog",
    "--session",
    owner.id,
    "--",
    "task",
    "edit",
    "TASK-1",
    "--check-ac",
    "1",
    "--final-summary",
    "Export behavior verified and independently reviewed before guarded commits",
  ])
  const childCommit = agent("commit", ...scope, "--message", "feat(TASK-1): return two")
  const parentSnapshot = agent("snapshot", ...scope, "--repo", ".", "--file", "modules/app")
  visual()
  agent("verify", ...scope)
  assert.match(
    rejected(
      "review",
      "--session",
      reviewer.id,
      "--task",
      "TASK-1",
      "--fingerprint",
      "unknown",
      "--verdict",
      "pass",
      "--note",
      "Invalid"
    ),
    /retained final snapshot/
  )
  review(parentSnapshot.fingerprint)
  await writeFile(resolve(child, "feature.mjs"), "export const value = 3;\n")
  assert.match(
    rejected(
      "review",
      "--session",
      reviewer.id,
      "--task",
      "TASK-1",
      "--fingerprint",
      childSnapshot.fingerprint,
      "--verdict",
      "pass",
      "--note",
      "Must reject changed committed content"
    ),
    /Working file changed/
  )
  await writeFile(resolve(child, "feature.mjs"), "export const value = 2;\n")
  review(childSnapshot.fingerprint)
  agent("commit", ...scope, "--message", "chore(TASK-1): pin reviewed child commit")
  agent("stop", "--session", reviewer.id)
  agent(
    "release",
    ...scope,
    "--outcome",
    "done",
    "--note",
    "Child and parent snapshots verified and independently reviewed; guarded final bookkeeping succeeds"
  )
  assert.equal(JSON.parse(native("task", "view", "TASK-1", "--json")).task.status, "Done")
  assert.equal(git(root, "ls-tree", "HEAD", "modules/app").split(/\s+/)[2], childCommit.commit)
  assert.equal(git(root, "status", "--porcelain"), "")
  assert.equal(git(child, "status", "--porcelain"), "")
  agent("stop", "--session", owner.id)
  assert.deepEqual(agent("status", "--json").runs, {})
})

// Opt-in integration suite: uses the installed Backlog CLI and a disposable Git
// repository. It never initializes or changes the real project's tracker/index.
test("real Backlog supports approval, reassignment, review handoff, recovery, and verified completion", async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), "workspace-backlog-integration-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const run = (command, args) => {
    const result = spawnSync(command, args, {
      cwd: root,
      env: { ...process.env, BACKLOG_CWD: root },
      encoding: "utf8",
      timeout: 30000,
    })
    assert.equal(result.status, 0, `${command} ${args.join(" ")}\n${result.error ?? result.stderr}\n${result.stdout}`)
    return result.stdout
  }
  const agent = (...args) => run(process.execPath, [cli, "--root", root, ...args])
  const native = (...args) => run("backlog", args)
  run("git", ["init", "--quiet"])
  await mkdir(resolve(root, "backlog"))
  await writeFile(
    resolve(root, "backlog/config.yml"),
    await readFile(new URL("./fixtures/backlog.yml", import.meta.url))
  )
  await writeFile(
    resolve(root, "agent-workspace.json"),
    await readFile(new URL("./fixtures/workspace.json", import.meta.url))
  )
  native(
    "task",
    "create",
    "Disposable integration task",
    "-a",
    "@elm",
    "-l",
    "keep-me,approval-required",
    "--ac",
    "Roundtrip through the real Backlog CLI succeeds",
    "--plain"
  )
  const task = () => JSON.parse(native("task", "view", "TASK-1", "--json")).task
  const oak = JSON.parse(
    agent("start", "--agent", "oak", "--provider", "codex", "--context", "disposable integration coordinator")
  ).id
  const elm = JSON.parse(
    agent("start", "--agent", "elm", "--provider", "claude", "--context", "disposable provider-neutral worker")
  ).id
  agent("approve", "--session", oak, "--task", "TASK-1", "--note", "Synthetic approval in disposable test only")
  agent("assign", "--session", oak, "--task", "TASK-1", "--agent", "oak", "--note", "Exercise native assignment")
  agent("claim", "--session", oak, "--task", "TASK-1", "--scope", "src")
  assert.equal(task().status, "In Progress")
  assert.ok(task().labels.includes(`working:${oak}`))
  agent(
    "backlog",
    "--session",
    oak,
    "--",
    "task",
    "edit",
    "TASK-1",
    "--plan",
    "Verify native CLI transitions in isolation"
  )
  agent("release", "--session", oak, "--task", "TASK-1", "--outcome", "review", "--note", "Native review handoff")
  assert.ok(task().labels.includes("needs-review"))
  assert.ok(!task().labels.some((label) => label.startsWith("working:")))
  agent("assign", "--session", oak, "--task", "TASK-1", "--agent", "elm", "--note", "Exercise cross-provider handoff")
  agent("claim", "--session", elm, "--task", "TASK-1", "--scope", "src")
  assert.ok(!task().labels.includes("needs-review"))
  agent(
    "recover",
    "--session",
    elm,
    "--by",
    oak,
    "--confirm-stopped",
    "--note",
    "Synthetic worker has no live edits; fixture recovery"
  )
  assert.equal(task().status, "To Do")
  agent("assign", "--session", oak, "--task", "TASK-1", "--agent", "oak", "--note", "Complete recovered work")
  agent("claim", "--session", oak, "--task", "TASK-1", "--scope", "src")
  agent(
    "backlog",
    "--session",
    oak,
    "--",
    "task",
    "edit",
    "TASK-1",
    "--check-ac",
    "1",
    "--final-summary",
    "Native CLI approval, ownership, handoff, recovery, and completion verified"
  )
  agent("visual", "--session", oak, "--task", "TASK-1", "--kind", "no-ui", "--note", "CLI fixture has no UI")
  agent("release", "--session", oak, "--task", "TASK-1", "--outcome", "done", "--note", "Real Backlog roundtrip passed")
  assert.equal(task().status, "Done")
  assert.deepEqual(task().labels, ["keep-me"])
  assert.match(task().implementationNotes, /Human approval recorded/)
  assert.match(task().implementationNotes, /Recovered by/)
  agent("stop", "--session", oak)
  const status = JSON.parse(agent("status", "--json"))
  assert.deepEqual(status.claims, {})
  assert.equal(status.sessions.filter((value) => value.status === "active").length, 0)
  assert.match(native("doctor"), /No duplicate IDs/)
})

for (const commitMode of ["automatic", "never"])
  test(`unattended CLI binds final content to checks and independent review (commits=${commitMode})`, async (t) => {
    const root = await mkdtemp(resolve(tmpdir(), "workspace-unattended-integration-"))
    t.after(() => rm(root, { recursive: true, force: true }))
    const invoke = (command, args) =>
      spawnSync(command, args, {
        cwd: root,
        env: { ...process.env, BACKLOG_CWD: root },
        encoding: "utf8",
        timeout: 30000,
      })
    const run = (command, args) => {
      const result = invoke(command, args)
      assert.equal(result.status, 0, `${result.error ?? result.stderr}\n${result.stdout}`)
      return result.stdout
    }
    const native = (...args) => run("backlog", args)
    const agent = (...args) => run(process.execPath, [cli, "--root", root, ...args])
    const rejected = (...args) => {
      const result = invoke(process.execPath, [cli, "--root", root, ...args])
      assert.equal(result.status, 1, result.stdout)
      return result.stderr
    }
    const git = (...args) => run("git", args)
    git("init", "--quiet")
    git("config", "user.name", "Fixture Agent")
    git("config", "user.email", "fixture@example.invalid")
    git("config", "commit.gpgsign", "false")
    await mkdir(resolve(root, "backlog"))
    await writeFile(resolve(root, ".gitignore"), ".local/\n.agents/agent-workspace/runtime/\n")
    await writeFile(
      resolve(root, "backlog/config.yml"),
      await readFile(new URL("./fixtures/backlog.yml", import.meta.url))
    )
    const config = JSON.parse(await readFile(new URL("./fixtures/workspace.json", import.meta.url), "utf8"))
    await mkdir(resolve(root, ".local"))
    const trackerWrapper = resolve(root, ".local/backlog.mjs")
    await writeFile(
      trackerWrapper,
      `import {existsSync} from 'node:fs'; import {spawnSync} from 'node:child_process'; const args=process.argv.slice(2); if(args[0]==='doctor'&&existsSync('.local/block-doctor')){console.error('Injected doctor failure');process.exit(1);} const r=spawnSync('backlog',args,{stdio:'inherit'}); process.exit(r.status??1);`
    )
    config.backlog.command = process.execPath
    config.backlog.args = [trackerWrapper]
    config.repositories = [
      {
        path: ".",
        readOnly: false,
        checks: [{ name: "syntax", command: [process.execPath, "--check", "src/feature.mjs"] }],
      },
    ]
    await writeFile(resolve(root, "agent-workspace.json"), JSON.stringify(config))
    git("add", ".gitignore", "backlog/config.yml", "agent-workspace.json")
    git("commit", "-qm", "Fixture baseline")
    native("task", "create", "Fixture feature", "--ac", "Feature verified", "--plain")
    const taskPath = JSON.parse(native("task", "view", "TASK-1", "--json")).task.path
    git("add", taskPath)
    git("commit", "-qm", "Fixture task")
    const owner = JSON.parse(
      agent(
        "start",
        "--provider",
        "codex",
        "--context",
        "authorized fixture",
        "--profile",
        "unattended",
        "--commits",
        commitMode,
        "--allow-task",
        "TASK-1",
        "--authorization",
        "Synthetic user authorized TASK-1 with configured commit mode"
      )
    )
    const reviewer = JSON.parse(
      agent(
        "start",
        "--agent",
        "rowan",
        "--provider",
        "claude",
        "--context",
        "independent fixture review",
        "--run",
        owner.runId
      )
    )
    const visual = () =>
      agent(
        "visual",
        "--session",
        owner.id,
        "--task",
        "TASK-1",
        "--kind",
        "no-ui",
        "--note",
        "Feature fixture has no UI"
      )
    agent("claim", "--session", owner.id, "--task", "TASK-1", "--scope", "src", "--scope", "backlog/tasks")
    await mkdir(resolve(root, "src"))
    await writeFile(resolve(root, "src/feature.mjs"), "export const feature = 1;\n")
    agent(
      "backlog",
      "--session",
      owner.id,
      "--",
      "task",
      "edit",
      "TASK-1",
      "--check-ac",
      "1",
      "--final-summary",
      "Fixture implementation verified"
    )
    visual()
    assert.match(
      rejected("release", "--session", owner.id, "--task", "TASK-1", "--outcome", "done", "--note", "No evidence yet"),
      /snapshot/i
    )
    assert.match(
      rejected("snapshot", "--session", owner.id, "--task", "TASK-1", "--repo", ".", "--file", taskPath),
      /live journal/
    )
    let snapshot = JSON.parse(
      agent("snapshot", "--session", owner.id, "--task", "TASK-1", "--repo", ".", "--file", "src/feature.mjs")
    )
    visual()
    assert.match(
      rejected(
        "review",
        "--session",
        owner.id,
        "--task",
        "TASK-1",
        "--fingerprint",
        snapshot.fingerprint,
        "--verdict",
        "pass",
        "--note",
        "self review disallowed"
      ),
      /Independent/
    )
    agent("verify", "--session", owner.id, "--task", "TASK-1")
    agent(
      "review",
      "--session",
      reviewer.id,
      "--task",
      "TASK-1",
      "--fingerprint",
      snapshot.fingerprint,
      "--verdict",
      "pass",
      "--note",
      "Reviewer inspected feature and syntax evidence"
    )
    agent(
      "backlog",
      "--session",
      owner.id,
      "--",
      "task",
      "edit",
      "TASK-1",
      "--check-ac",
      "1",
      "--final-summary",
      "Fixture implementation verified"
    )
    await writeFile(resolve(root, "src/feature.mjs"), "export const feature = 2;\n")
    if (commitMode === "never")
      assert.match(
        rejected("release", "--session", owner.id, "--task", "TASK-1", "--outcome", "done", "--note", "Stale evidence"),
        /changed after snapshot/
      )
    rejected("commit", "--session", owner.id, "--task", "TASK-1", "--message", "feat: verified fixture feature")
    assert.equal(git("rev-list", "--count", "HEAD").trim(), "2")
    snapshot = JSON.parse(
      agent("snapshot", "--session", owner.id, "--task", "TASK-1", "--repo", ".", "--file", "src/feature.mjs")
    )
    visual()
    rejected("commit", "--session", owner.id, "--task", "TASK-1", "--message", "feat: verified fixture feature")
    agent("verify", "--session", owner.id, "--task", "TASK-1")
    agent(
      "review",
      "--session",
      reviewer.id,
      "--task",
      "TASK-1",
      "--fingerprint",
      snapshot.fingerprint,
      "--verdict",
      "pass",
      "--note",
      "Reviewed revised content and passing check"
    )
    if (commitMode === "never") {
      agent("stop", "--session", reviewer.id)
      await writeFile(resolve(root, "src/extra.mjs"), "export const extra = 1;\n")
      assert.match(
        rejected(
          "release",
          "--session",
          owner.id,
          "--task",
          "TASK-1",
          "--outcome",
          "done",
          "--note",
          "Unreviewed extra file"
        ),
        /lack current verification/
      )
      await rm(resolve(root, "src/extra.mjs"))
      agent(
        "release",
        "--session",
        owner.id,
        "--task",
        "TASK-1",
        "--outcome",
        "done",
        "--note",
        "Current changes checked and independently reviewed; intentionally uncommitted"
      )
      assert.equal(JSON.parse(native("task", "view", "TASK-1", "--json")).task.status, "Done")
      assert.equal(git("rev-list", "--count", "HEAD").trim(), "2")
      agent("stop", "--session", owner.id)
      assert.equal(JSON.parse(agent("history", "--session", reviewer.id)).runId, owner.runId)
      return
    }
    const commit = JSON.parse(
      agent("commit", "--session", owner.id, "--task", "TASK-1", "--message", "feat: verified fixture feature")
    )
    assert.equal(git("show", `${commit.commit}:src/feature.mjs`), "export const feature = 2;\n")
    assert.deepEqual(git("diff-tree", "--no-commit-id", "--name-only", "-r", commit.commit).trim().split("\n"), [
      "src/feature.mjs",
    ])
    const replay = JSON.parse(
      agent("commit", "--session", owner.id, "--task", "TASK-1", "--message", "feat: verified fixture feature")
    )
    assert.equal(replay.commit, commit.commit)
    assert.equal(git("rev-list", "--count", "HEAD").trim(), "3")
    const journals = JSON.parse(agent("commit-status", "--session", owner.id, "--task", "TASK-1")).journals
    assert.equal(journals.length, 1)
    assert.equal(journals[0].phase, "committed")
    visual()
    assert.match(
      rejected(
        "release",
        "--session",
        owner.id,
        "--task",
        "TASK-1",
        "--outcome",
        "done",
        "--note",
        "Changed visual declaration"
      ),
      /passing review/
    )
    agent(
      "review",
      "--session",
      reviewer.id,
      "--task",
      "TASK-1",
      "--fingerprint",
      snapshot.fingerprint,
      "--verdict",
      "pass",
      "--note",
      "Reviewed renewed visual declaration against the existing committed content"
    )
    agent("stop", "--session", reviewer.id)
    await writeFile(resolve(root, "src/extra.mjs"), "export const extra = 1;\n")
    assert.match(
      rejected("release", "--session", owner.id, "--task", "TASK-1", "--outcome", "done", "--note", "premature"),
      /remain uncommitted/
    )
    await rm(resolve(root, "src/extra.mjs"))
    // Failed finalization retains ownership even after the native Done write.
    await writeFile(resolve(root, ".local/block-doctor"), "")
    assert.match(
      rejected(
        "release",
        "--session",
        owner.id,
        "--task",
        "TASK-1",
        "--outcome",
        "done",
        "--note",
        "Exact content committed and evidence recorded"
      ),
      /Injected doctor failure/
    )
    assert.equal(JSON.parse(agent("status", "--json")).claims["TASK-1"].phase, "finalizing")
    const pending = JSON.parse(agent("queue")).pendingFinalizations[0]
    assert.equal(pending.task, "TASK-1")
    assert.match(pending.error.message, /Injected doctor failure/)
    assert.equal(JSON.parse(agent("commit-status", "--session", owner.id, "--task", "TASK-1")).phase, "finalizing")
    await rm(resolve(root, ".local/block-doctor"))
    const finalBytes = await readFile(resolve(root, taskPath))
    await writeFile(resolve(root, taskPath), Buffer.concat([finalBytes, Buffer.from("\nUnowned edit\n")]))
    assert.match(rejected("reconcile", "--session", owner.id), /outside the recorded writer/)
    await writeFile(resolve(root, taskPath), finalBytes)
    await writeFile(resolve(root, "human.txt"), "Human checkpoint\n")
    git("add", "human.txt")
    const checkpoint = git("ls-files", "--stage")
    assert.match(rejected("reconcile", "--session", owner.id), /pre-existing staged work/)
    assert.equal(git("ls-files", "--stage"), checkpoint)
    // Remove only the fixture's own test checkpoint, never a real user's index.
    git("reset", "--quiet", "--", "human.txt")
    await rm(resolve(root, "human.txt"))
    const pendingClaim = JSON.parse(agent("status", "--json")).claims["TASK-1"]
    agent("reconcile", "--session", owner.id)
    const task = JSON.parse(native("task", "view", "TASK-1", "--json")).task
    assert.equal(task.status, "Done")
    assert.match(task.implementationNotes, new RegExp(commit.commit))
    assert.equal(git("rev-list", "--count", "HEAD").trim(), "4")
    assert.deepEqual(git("diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD").trim().split("\n"), [taskPath])
    assert.equal(git("status", "--porcelain"), "")
    // Simulate process loss after Git saved success but before ownership release.
    const registryPath = resolve(root, ".agents/agent-workspace/runtime/state.json")
    const registry = JSON.parse(await readFile(registryPath, "utf8"))
    const bookkeeping = registry.runs[owner.runId].commits.find((entry) => entry.kind === "bookkeeping")
    const journal = JSON.parse(await readFile(bookkeeping.journalPath, "utf8"))
    pendingClaim.finalization = {
      snapshot: journal.snapshot,
      journalPath: bookkeeping.journalPath,
      message: journal.message,
    }
    registry.claims["TASK-1"] = pendingClaim
    await writeFile(registryPath, JSON.stringify(registry))
    agent("reconcile", "--session", owner.id)
    assert.equal(git("rev-list", "--count", "HEAD").trim(), "4")
    assert.equal(git("status", "--porcelain"), "")
    agent("stop", "--session", owner.id)
    assert.deepEqual(JSON.parse(agent("status", "--json")).claims, {})
    assert.deepEqual(JSON.parse(agent("status", "--json")).runs, {})
    assert.equal(JSON.parse(agent("history", "--session", reviewer.id)).runId, owner.runId)
    const history = JSON.parse(agent("history", "--run", owner.runId))
    assert.ok(history.commits.some((entry) => entry.kind === "bookkeeping"))
    assert.equal(JSON.parse(agent("provenance", "--task", "TASK-1")).record.pending, false)
  })
