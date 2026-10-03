# agent-harness

Turn any domain folder of skills into a bounded agentic loop: a manifest builder inventories a domain's skills/tools/checks, a goal compiler turns a goal into a verifiable task plan (refusing vague goals with forcing questions), and a JSON-backed loop controller drives execute->verify->close with retry caps, controller-run verification (no verification theater), human escalation on exhausted budgets, and a close gate that refuses while any task is unverified. Ships 3 stdlib Python tools, 18 committed per-domain harness manifests + JSON schema, 3 references citing the 2024-2026 agent-harness canon, harness-runner agent + /cs:harness command. Use when an agent should pick up a goal and drive it to a verified close across a domain.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/alirezarezvani/claude-skills/tree/19392f7a08264ed00486a251f5b2098321771f94/engineering/agent-harness
- Commit: `19392f7a08264ed00486a251f5b2098321771f94`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 3). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
