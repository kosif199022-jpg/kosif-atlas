# irreversible-guard

PreToolUse gate that blocks Bash commands with no practical local undo — de-obfuscates ssh/docker-exec transports, heredocs, command chains, and env prefixes, then matches a tiered deny-set (irreversible-everywhere ops block unconditionally; locally-reversible ops block only when the command names production)

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/paat/claude-plugins/tree/e60ac1fa9cca11cdab467b0021e542ac0f94c56d/plugins/irreversible-guard
- Commit: `e60ac1fa9cca11cdab467b0021e542ac0f94c56d`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 5). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
