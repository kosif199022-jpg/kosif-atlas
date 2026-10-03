# cmux-claude-codex-cross-runtime-messaging

Run a Claude Code agent and a Codex CLI agent as messaging peers in cmux panes, each named as a tab and both in the agent traffic log. Codex has no SendMessage and Claude's peer socket needs auth, so the cross-runtime hop is keystroke injection (cmux send + send-key Enter) through a small helper that also logs to xs explicitly; each agent names its own tab first via cmux identify + tab-action rename. Covers the Codex TUI parking on a startup modal with no way to read its screen (diagnose from ~/.codex logs and the missing rollout file, inject one Enter), and where the lead, teammate and Codex transcripts live on disk afterwards. Verified 2026-08-27: five rounds in 50 s, every message exactly once.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/cmux-claude-codex-cross-runtime-messaging
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
