# claude-code-plugin-from-existing-repo

Convert an existing repo that ships Claude Code slash commands and/or hooks (typically as a dotclaude/ or .claude/ directory the user copies into their project) into a Claude Code plugin so users can install with `/plugin marketplace add OWNER/REPO` + `/plugin install NAME@MARKETPLACE`. Use when: (1) repo currently has a commands/ + hooks/ layout meant for manual copy-into-project install, (2) you want to add plugin install without breaking the manual install path, (3) confused about where marketplace.json vs plugin.json live, (4) confused about which env var the plugin's hooks should reference, (5) the installed plugin shows "failed to load" with `Duplicate hooks file detected` after you declared a `hooks` pointer in plugin.json. Covers coexistence of manual and plugin install via a shared source directory.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/claude-code-plugin-from-existing-repo
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
