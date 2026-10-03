# bymax-pm

Engineering Project Manager for multi-agent development. The /bymax-pm:pm command turns the current session into a PM/TPM that coordinates INDEPENDENT Claude Code peer sessions: discovers agents via ListAgents, delegates structured task contracts via SendMessage, tracks a deterministic task lifecycle (assignment → acknowledgement → evidence → independent review → PM verification), detects stuck agents through one-shot idle notices instead of polling, resolves blockers between agents before escalating, and keeps all project truth in a persistent, git-friendly .claude/pm/ workspace that survives session restarts. Evidence-driven: a worker saying done is never enough — DONE requires diffs, tests, CI and PM verification. The PM coordinates; it does not implement.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/bymaxone/bymax-agent-kit/tree/0aa49987c1f84bac7f8071fde4e5d48caf2e19e9/plugins/bymax-pm
- Commit: `0aa49987c1f84bac7f8071fde4e5d48caf2e19e9`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
