# claude-code-cross-session-messaging

Talk to a Claude Code session that is already running via the native ListAgents + SendMessage pair instead of a headless claude -p call or a terminal-scraping bridge: addressing rules (the name is the address; refs do not survive the listing that produced them), the one-shot notify_when_idle subscription that replaces every polling loop, the no-TTY law that makes headless and in-process transports wedge silently instead of failing, multi-hop transport dependency failures, and the per-session permission boundary that forbids delegating around your own denials.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/claude-code-cross-session-messaging
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
