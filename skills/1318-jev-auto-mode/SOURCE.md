# jev-auto-mode

A permission layer driven by a JSON policy: allow, ask or deny every tool call (Bash, edits, web, MCP, subagents, skills), every slash command or skill you type, and every skill preloaded into a subagent. Rules decide first (deny > ask > allow, compound Bash commands split); what no rule covers can go to TypeSafe's Jev, which judges the action against your latest request with thresholds you set. Claude can never edit the policy. Needs function hooks (early access).

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/davila7/claude-code-templates/tree/8b1f88342619330b6306ee318f57f2cd5b78789d/cli-tool/components/mods/security/jev-auto-mode
- Commit: `8b1f88342619330b6306ee318f57f2cd5b78789d`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 5). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
