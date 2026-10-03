# integrity-self-monitoring

Real-result discipline for work that cannot be done as asked. When a service cannot be reached, a key is missing or two tests want different answers, the easy route is a result that only looks done: a fallback that returns made-up values, a table standing in for the service, code that answers its caller differently, a machine changed until the run goes green. Bundles the integrity-self-monitoring skill (the 'what': the result must be real and the route to it legitimate; "cannot be done as asked, because X" is a complete answer; close with an [INTEGRITY CHECK] - Result, Route, Outside the task, Told the user) with per-host hooks (the 'when') that read each edit to product code for those shapes - only in a file that calls a service - and each shell command for a change to the machine or a server started, and say what it means for the user once per finding. No message on the prompt. Never blocks. Codex: the same hooks/ adapter as Claude Code - same events, same payload, same output envelope; the hooks run once you trust them with /hooks.

- License: **Apache-2.0** (no license file shipped; see the source repository)
- Source: https://github.com/3dgiordano/agent-plugins/tree/06dd34daca8144c5b2cf754a0dfff54d86f17b66/plugins/integrity-self-monitoring
- Commit: `06dd34daca8144c5b2cf754a0dfff54d86f17b66`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 6, MCP servers: 0, scripts: 15). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
