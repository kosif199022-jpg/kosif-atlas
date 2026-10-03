# large-edit-confirmation

Asks the user, in the engine's AskUserQuestion dialog ($.ui.ask), before Claude edits or overwrites a file larger than a configurable line count; denies by default when nobody can answer (headless runs). A tool.call hook on Edit and Write using $.fs.read.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/davila7/claude-code-templates/tree/8b1f88342619330b6306ee318f57f2cd5b78789d/cli-tool/components/mods/security/large-edit-confirmation
- Commit: `8b1f88342619330b6306ee318f57f2cd5b78789d`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
