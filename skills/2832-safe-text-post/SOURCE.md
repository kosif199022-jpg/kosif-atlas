# safe-text-post

File-based text posting with unicode lint and read-back verification — payloads always travel via files (never inline argv/heredocs), zero-width characters are rejected before posting, and every post is fetched back and byte-compared so curly quotes and non-ASCII content provably survived. Kills the empty-comment / corrupted-PR-body failure class.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/paat/claude-plugins/tree/e60ac1fa9cca11cdab467b0021e542ac0f94c56d/plugins/safe-text-post
- Commit: `e60ac1fa9cca11cdab467b0021e542ac0f94c56d`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 2). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
