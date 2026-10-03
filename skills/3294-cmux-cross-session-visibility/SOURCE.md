# cmux-cross-session-visibility

Make agent-to-agent traffic visible to the human watching: a structured SendMessage envelope (kind + direction + topic in the summary field, plus a one-line header that survives raw transcripts) paired with a cmux sidebar status pill per workspace showing whether a session is waiting on a peer or owes one an answer. Covers why spawned teams are cross-workspace traffic by construction (tmux-compat maps a window to a workspace), why the pill key must not collide with cmux's own claude_code key, and the stale-pill failure mode plus every exit that must clear it.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/cmux-cross-session-visibility
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
