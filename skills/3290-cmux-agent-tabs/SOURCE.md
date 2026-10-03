# cmux-agent-tabs

Make AI coding agents show up as watchable cmux tabs/panes, and diagnose the six distinct reasons they do not: wrong launch path, Agent-tool spawn path (never tabs; they surface in the native agent list), a shim shadowed on PATH by a real tmux, the shim's own bare cmux being off PATH so tmux dies with exec: cmux: not found, a resumed pane with no $TMUX that starts an invisible real tmux server, and a teammate mode that resolved to in-process so every agent wedges with no pane, no TTY and no visible permission prompt. Includes the one-shot both-hops test, the ps check that separates a wedged transport from an agent that never launched, and reading the live process env rather than the shell's.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/cmux-agent-tabs
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
