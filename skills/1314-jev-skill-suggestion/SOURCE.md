# jev-skill-suggestion

Keeps the skill listing out of the context window and lets TypeSafe's Jev, a System One decision model, pick at most one skill per prompt from the skills' descriptions, the way TypeSafe's skill-suggestion cookbook does: one request ranks every skill and asks whether the prompt needs a skill at all, a second re-reads the top three with their SKILL.md and can reject them all. The winner's SKILL.md is attached to the prompt, so the skills can be hidden from the model altogether (/jev-skill-suggestion:setup makes them user-invocable-only and /context counts them at 0). Falls back to the engine's built-in classifier when no key is set.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/davila7/claude-code-templates/tree/8b1f88342619330b6306ee318f57f2cd5b78789d/cli-tool/components/mods/productivity/jev-skill-suggestion
- Commit: `8b1f88342619330b6306ee318f57f2cd5b78789d`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 3). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
