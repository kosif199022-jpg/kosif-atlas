# neon-branch-per-session

A Neon database branch for each Claude Code session: created from your default (or chosen) branch when the session starts, handed to every command Claude runs as DATABASE_URL, and set to expire on its own (or deleted when the session ends). Claude can migrate, seed and break the branch without touching production data. /neon shows it, keeps it or deletes it. Needs function hooks (early access) and a Neon API key.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/davila7/claude-code-templates/tree/8b1f88342619330b6306ee318f57f2cd5b78789d/cli-tool/components/mods/integrations/neon-branch-per-session
- Commit: `8b1f88342619330b6306ee318f57f2cd5b78789d`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 3). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
