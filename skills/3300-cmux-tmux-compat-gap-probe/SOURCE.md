# cmux-tmux-compat-gap-probe

Enumerate, before installing, which tmux verbs a tmux-driving tool needs that cmux's tmux-compat shim lacks: grep the tool's source for subcommands and #{format} variables, diff against cmux's docs/cli-contract.md, probe read-only verbs live via cmux __tmux-compat. Explains 'Unsupported tmux compatibility command' and 'Workspace target not found' (sessions map to workspaces). Ships scripts/tmux-compat-probe.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/cmux-tmux-compat-gap-probe
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
