# prompt-cache-control

Prompt-cache meter above the Claude Code prompt: how many tokens each request read from, wrote to and sent past the cache, a live countdown to the cache's expiry, and what to do about it (keep going, compact or clear). The TTL comes from the environment variables Claude Code honours (5 minutes by default, 1 hour with ENABLE_PROMPT_CACHING_1H). /cache opens a per-turn table. Needs function hooks (early access).

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/davila7/claude-code-templates/tree/8b1f88342619330b6306ee318f57f2cd5b78789d/cli-tool/components/mods/observability/prompt-cache-control
- Commit: `8b1f88342619330b6306ee318f57f2cd5b78789d`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
