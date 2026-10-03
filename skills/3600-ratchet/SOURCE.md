# ratchet

Ratchet — Goal-driven multi-agent persistent optimization system. Combines Goal-Driven master/subagent separation with AutoResearch signal design methodology. Implements an 'independent evaluation + kill-and-restart + ratchet progress' autonomous loop: master only judges, subagent only executes; if a subagent stalls or claims success without meeting acceptance criteria, it is killed and replaced. Suitable for long-running autonomous coding tasks that require verifiable deliverables and explicit termination conditions.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/xrensiu/claude-code-forge/tree/1c8ee484ea94dde7a88e2792b5e5e1cc079eba10/plugins/ratchet
- Commit: `1c8ee484ea94dde7a88e2792b5e5e1cc079eba10`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
