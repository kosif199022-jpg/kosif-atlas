# cmux-node-options-tmpdir-guard

Keep cmux's Claude NODE_OPTIONS restore guard alive when it lives under $TMPDIR. Use when: (1) a long-lived cmux/Claude session suddenly has every node/claude invocation fail with a missing --require target, (2) NODE_OPTIONS points at a /var/folders/.../T/cmux-claude-node-options/restore-node-options.cjs path on a cmux build that predates manaflow-ai/cmux#3699, (3) reboot-surviving cmux sessions break after about three days idle. Root cause: macOS reaps $TMPDIR files untouched for about three days, so the required guard file vanishes while NODE_OPTIONS still references it. Covers the persistent-HOME-copy stopgap, the LaunchAgent that recreates and mtime-refreshes the $TMPDIR file daily, why a LaunchAgent resolves the same per-user temp base, and when to retire it.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/cmux-node-options-tmpdir-guard
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
