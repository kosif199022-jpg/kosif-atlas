# progress-self-monitoring

Cross-session ledger discipline for work that outlives the session. Bundles the progress-self-monitoring skill (the 'what': one file in the project, .agent/progress.md, that holds what the next session cannot recover from the code - the parts still blocked or returned with their observed reason, and the next action - written by the agent and re-opened before substantive work) with per-host hooks (the 'when') that announce the ledger's open-item count and age when a session opens or continues after a compaction, and notice a turn that edited files and left a ledger with open items untouched. The hooks read that one file's metadata and count, never its text, and never write it. Never blocks. Codex: the same hooks/ adapter as Claude Code - same events, same payload, same output envelope; the hooks run once you trust them with /hooks.

- License: **Apache-2.0** (no license file shipped; see the source repository)
- Source: https://github.com/3dgiordano/agent-plugins/tree/06dd34daca8144c5b2cf754a0dfff54d86f17b66/plugins/progress-self-monitoring
- Commit: `06dd34daca8144c5b2cf754a0dfff54d86f17b66`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 10, MCP servers: 0, scripts: 28). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
