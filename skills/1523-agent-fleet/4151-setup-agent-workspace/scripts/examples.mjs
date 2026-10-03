const tooling = ".agents/agent-workspace"

export const layouts = ["single-repo", "monorepo", "multi-repo", "submodules"]

export function exampleConfig(layout) {
  if (!layouts.includes(layout)) throw new Error(`Unknown layout ${layout}; choose ${layouts.join(", ")}.`)
  const repositories = [
    {
      path: ".",
      readOnly: false,
      purpose:
        layout === "monorepo"
          ? "Application monorepo, including apps and packages, plus shared planning"
          : "Project source and shared planning",
      checks: [
        { name: "installed-tooling", command: ["node", `${tooling}/scripts/check-installation.mjs`] },
        {
          name: "workspace-schema",
          command: [
            "npx",
            "--yes",
            "--prefer-offline",
            "--package=ajv-cli@5.0.0",
            "ajv",
            "validate",
            "--spec=draft7",
            "--strict=true",
            "--all-errors",
            "--errors=text",
            "-s",
            `${tooling}/schema.json`,
            "-d",
            "agent-workspace.json",
          ],
        },
        {
          name: "coordination-tests",
          command: [
            "node",
            "--test",
            ...[
              "agents",
              "agents.integration",
              "agent-policy",
              "agent-git",
              "agent-tracker",
              "agent-visual",
              "agent-state",
            ].map((name) => `${tooling}/tests/${name}.test.mjs`),
          ],
        },
        { name: "backlog-consistency", command: ["backlog", "doctor"] },
        { name: "diff-whitespace", command: ["git", "diff", "--check"] },
      ],
    },
  ]
  if (layout === "multi-repo")
    repositories.push(
      { path: "reference", readOnly: true, purpose: "Independent reference repository" },
      {
        path: "app",
        readOnly: false,
        purpose: "Independent implementation repository; configure its actual checks",
      }
    )
  if (layout === "submodules")
    repositories.push(
      { path: "modules/library", readOnly: true, purpose: "Initialized reference submodule" },
      {
        path: "modules/app",
        readOnly: false,
        purpose: "Initialized implementation submodule; configure its actual checks",
      }
    )
  return {
    $schema: `./${tooling}/schema.json`,
    schemaVersion: 1,
    project: "My Project",
    defaultAgent: "coordinator",
    staleAfterMinutes: 30,
    executionPolicy: {
      defaultProfile: "assisted",
      profiles: {
        assisted: {
          delegation: "single",
          maxAgents: 1,
          review: "self",
          commits: "on-request",
          onHumanInput: "ask",
          maxTasks: 10,
          maxMinutes: 120,
        },
        unattended: {
          delegation: "as-needed",
          maxAgents: 3,
          review: "independent",
          commits: "automatic",
          onHumanInput: "defer",
          maxTasks: 10,
          maxMinutes: 120,
        },
      },
      permissions: { push: false, merge: false, tags: false, deployment: false },
    },
    agents: [
      {
        name: "coordinator",
        role: "Coordinator",
        focus: "Scope, planning, integration, and human handoffs",
      },
      { name: "builder", role: "Builder", focus: "Approved implementation" },
      {
        name: "reviewer",
        role: "Reviewer",
        focus: "Independent correctness and maintainability review",
      },
    ],
    repositories,
    backlog: {
      command: "backlog",
      testedVersion: "1.51.0",
      todoStatus: "To Do",
      activeStatus: "In Progress",
      doneStatus: "Done",
      reviewLabel: "needs-review",
    },
  }
}
