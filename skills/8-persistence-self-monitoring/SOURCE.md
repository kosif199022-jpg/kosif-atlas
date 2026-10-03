# persistence-self-monitoring

Persist-or-quit self-check for coding agents. Bundles the persistence-self-monitoring skill (the 'what': name the hypothesis held, count the variants, name a rival, decide) with per-host hooks (the 'when') that count what an agent cannot feel - the same file edited N times, the same command or error failing N times, tool calls piling up since the user's last message - and speak only when a threshold is crossed. Never blocks. Codex: the same hooks/ adapter as Claude Code - same events, same payload, same output envelope; the hooks run once you trust them with /hooks.

- License: **Apache-2.0** (no license file shipped; see the source repository)
- Source: https://github.com/3dgiordano/agent-plugins/tree/06dd34daca8144c5b2cf754a0dfff54d86f17b66/plugins/persistence-self-monitoring
- Commit: `06dd34daca8144c5b2cf754a0dfff54d86f17b66`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 8, MCP servers: 0, scripts: 14). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
