# coverage-self-monitoring

Parts-ledger discipline for multi-part or hard tasks. Bundles the coverage-self-monitoring skill (the 'what': write the ledger first - the parts, which is hardest and why, hardest first - and close each part as done, blocked with an observed reason, or returned to the owner) with per-host hooks (the 'when') that count the stub / placeholder / TODO markers written per turn, ask for a ledger when the prompt enumerates three or more items, and scan the final message for deferred work with no [COVERAGE CHECK]. Never blocks. Codex: the same hooks/ adapter as Claude Code - same events, same payload, same output envelope; the hooks run once you trust them with /hooks.

- License: **Apache-2.0** (no license file shipped; see the source repository)
- Source: https://github.com/3dgiordano/agent-plugins/tree/06dd34daca8144c5b2cf754a0dfff54d86f17b66/plugins/coverage-self-monitoring
- Commit: `06dd34daca8144c5b2cf754a0dfff54d86f17b66`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 11, MCP servers: 0, scripts: 15). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
