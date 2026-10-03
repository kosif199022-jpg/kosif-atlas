# block-destructive-commands

Denies Bash commands that match destructive patterns (recursive rm on roots, force push, hard reset, destructive SQL, disk formatting) before they run. A tool.call hook with a Bash matcher that returns { deny } without calling next.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/davila7/claude-code-templates/tree/8b1f88342619330b6306ee318f57f2cd5b78789d/cli-tool/components/mods/security/block-destructive-commands
- Commit: `8b1f88342619330b6306ee318f57f2cd5b78789d`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
