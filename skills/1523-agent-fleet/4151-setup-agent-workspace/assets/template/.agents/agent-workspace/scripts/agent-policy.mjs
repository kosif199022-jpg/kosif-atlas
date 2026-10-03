import { randomUUID } from "node:crypto"

export const HUMAN_GATES = {
  approval: "approval-required",
  decision: "needs-decision",
  "human-review": "needs-human-review",
  blocked: "blocked",
}
export const ASSISTED = {
  delegation: "single",
  maxAgents: 1,
  review: "self",
  commits: "on-request",
  onHumanInput: "ask",
  maxTasks: 10,
  maxMinutes: 120,
}
const reject = (message) => {
  throw new Error(message)
}
const copy = (value) => structuredClone(value)

export function validatePolicy(policy) {
  for (const [key, allowed] of Object.entries({
    delegation: ["single", "as-needed"],
    review: ["self", "independent"],
    commits: ["never", "on-request", "automatic"],
    onHumanInput: ["ask", "defer"],
  }))
    if (!allowed.includes(policy[key])) reject(`Invalid execution ${key}.`)
  for (const key of ["maxAgents", "maxTasks", "maxMinutes"]) {
    if (!Number.isSafeInteger(policy[key]) || policy[key] < 1) reject(`Execution ${key} must be a positive integer.`)
  }
  if (policy.delegation === "single" && policy.maxAgents !== 1) reject("Single-agent delegation requires maxAgents=1.")
  if (policy.review === "independent" && policy.maxAgents < 2)
    reject("Independent review requires room for a separate reviewer (maxAgents >= 2).")
  return policy
}

export function executionConfig(config) {
  const execution = config.executionPolicy
  if (!execution || typeof execution !== "object" || Array.isArray(execution))
    reject("Missing or invalid executionPolicy.")
  if (!execution.profiles || !Object.hasOwn(execution.profiles, execution.defaultProfile))
    reject("Unknown default execution profile.")
  for (const profile of Object.values(execution.profiles)) validatePolicy(profile)
  for (const agent of config.agents) {
    if (agent.defaultProfile && !Object.hasOwn(execution.profiles, agent.defaultProfile))
      reject(`Unknown profile for ${agent.name}.`)
  }
  return execution
}

export function resolveSelection(config, opts = {}) {
  const execution = executionConfig(config)
  const name = (opts.agent ?? config.defaultAgent).toLowerCase()
  const agent = config.agents.find((value) => value.name === name)
  if (!agent) reject(`Unknown agent ${name}; choose ${config.agents.map((value) => value.name).join(", ")}.`)
  const profileName = opts.profile ?? agent.defaultProfile ?? execution.defaultProfile
  if (!Object.hasOwn(execution.profiles, profileName)) reject(`Unknown profile ${profileName}.`)
  const policy = copy(execution.profiles[profileName])
  for (const [option, key] of Object.entries({
    commits: "commits",
    review: "review",
    delegation: "delegation",
    "on-human-input": "onHumanInput",
    "max-agents": "maxAgents",
    "max-tasks": "maxTasks",
    "max-minutes": "maxMinutes",
  }))
    if (opts[option] !== undefined) policy[key] = key.startsWith("max") ? Number(opts[option]) : opts[option]
  validatePolicy(policy)
  // Remote/external actions have no implementation here and cannot be enabled by a profile.
  return {
    agent: copy(agent),
    profileName,
    policy,
    permissions: { push: false, merge: false, tags: false, deployment: false },
  }
}

export function newRun(
  selection,
  { coordinator, allowedTasks = null, authorization = "", repositories = [], legacy = false }
) {
  const automatic =
    selection.profileName === "unattended" ||
    selection.policy.commits === "automatic" ||
    selection.policy.onHumanInput === "defer"
  if (!legacy && automatic && (!authorization.trim() || !allowedTasks?.length))
    reject(
      "Unattended/automatic runs require --authorization with the user's actual request and a nonempty --allow-task/--milestone scope."
    )
  const run = {
    id: `run-${randomUUID()}`,
    coordinator,
    profileName: selection.profileName,
    policy: copy(selection.policy),
    permissions: copy(selection.permissions),
    allowedTasks: allowedTasks ? [...new Set(allowedTasks.map((id) => id.toUpperCase()))] : null,
    authorization,
    repositories: copy(repositories),
    startedAt: new Date().toISOString(),
    touchedTasks: [],
    completedTasks: [],
    commits: [],
  }
  return run
}

export function runLimit(run, taskId, clock = Date.now()) {
  if (clock - Date.parse(run.startedAt) >= run.policy.maxMinutes * 60000)
    return "Run time limit reached; finish cleanup and report remaining work."
  if (taskId && run.allowedTasks && !run.allowedTasks.includes(taskId))
    return `${taskId} is outside the authorized run scope.`
  if (taskId && !run.touchedTasks.includes(taskId) && run.touchedTasks.length >= run.policy.maxTasks)
    return "Run task limit reached."
  return null
}

export function joinRun(run, sessions, opts = {}) {
  const limit = runLimit(run)
  if (limit) reject(limit)
  if (
    [
      "profile",
      "commits",
      "review",
      "delegation",
      "on-human-input",
      "max-agents",
      "max-tasks",
      "max-minutes",
      "authorization",
      "milestone",
      "allow-task",
    ].some((key) => opts[key] !== undefined)
  )
    reject("Workers inherit the existing run's scope and policy; do not supply overrides with --run.")
  const active = Object.values(sessions).filter((value) => value.runId === run.id && value.status === "active")
  if (!active.some((value) => value.id === run.coordinator))
    reject("Run coordinator is no longer active; start a new authorized run.")
  if (active.length >= run.policy.maxAgents) reject("Run agent limit reached (includes coordinator and reviewers).")
  if (run.policy.delegation === "single") reject("This run is configured for a single agent.")
}

export function gateLabels(task) {
  return task.labels.filter((label) => Object.values(HUMAN_GATES).includes(label))
}

export function assertCommitPolicy(run, authorization) {
  if (run.policy.commits === "never") reject("Commits are disabled for this run.")
  if (run.policy.commits === "on-request" && !authorization?.trim())
    reject("Assisted commits require --authorization recording the user's explicit commit request.")
}

export function assertEvidence(run, claim, snapshot, sessions) {
  if (!claim.verification || claim.verification.fingerprint !== snapshot.fingerprint || !claim.verification.passed)
    reject("Run configured checks against this exact snapshot before committing.")
  const review = claim.review
  if (!review || review.fingerprint !== snapshot.fingerprint || review.verdict !== "pass")
    reject("A passing review of this exact snapshot is required.")
  if (run.policy.review === "independent") {
    if (review.session === claim.session || !sessions[review.session])
      reject("Independent review requires a different registered session.")
    if (sessions[review.session].runId !== run.id) reject("Independent reviewer must join the authorized run.")
  }
}
