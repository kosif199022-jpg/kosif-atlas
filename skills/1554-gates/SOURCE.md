# gates

Four stateless PreToolUse gates, a PostToolUse JSON-config guard, and a docs-consolidation trigger. Denies a git commit that changes code without staging its covering docs (per-plugin README/CLAUDE.md pairs, or the nearest README/CLAUDE/AGENTS walking up); denies a shell search whose pattern looks like a code symbol, pointing at the LSP tool instead; denies a high-fan-out Workflow script with no per-agent model: override and asks before a denylisted built-in named workflow; denies an ad-hoc Agent dispatch that omits model unless the agent type pins one in frontmatter. Separately, a never-blocking trigger counts commits since the .docs-sync record and nudges toward /docs-consolidate. Every gate has an ack marker, and GATES_DISABLE turns any of them off from a settings.json env block. Separately, a PostToolUse hook re-parses settings.json/.mcp.json after an edit and reports a syntax error, which Claude Code otherwise swallows by silently dropping the config it cannot parse.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/jasonm4130/claude-skills/tree/94c6597fb1e2815f685e3b6d1bea7026bf4608a9/plugins/gates
- Commit: `94c6597fb1e2815f685e3b6d1bea7026bf4608a9`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 7, MCP servers: 0, scripts: 17). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
