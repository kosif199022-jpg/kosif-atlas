# session-preflight

SessionStart hook that runs a fast, read-only environment preflight — auth commands, expected tokens (shell env AND known env files), required CLIs, and a host/user/repo/branch identity line — and surfaces failures at the top of the session so the first tool call is never wasted on a dead environment. Never blocks the session.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/paat/claude-plugins/tree/e60ac1fa9cca11cdab467b0021e542ac0f94c56d/plugins/session-preflight
- Commit: `e60ac1fa9cca11cdab467b0021e542ac0f94c56d`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 2). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
