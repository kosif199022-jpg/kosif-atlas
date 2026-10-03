# merge-guard

Post-merge verification tail: diffs merged main against the pre-merge state to catch junk files leaked by squash merges and unintended path changes, checks configurable grep-based business invariants (attribution parameters, forbidden patterns), auto-opens a cleanup PR for leaked junk, and guides an adjacent-behavior regression spot-check. Complements pre-merge review gates.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/paat/claude-plugins/tree/e60ac1fa9cca11cdab467b0021e542ac0f94c56d/plugins/merge-guard
- Commit: `e60ac1fa9cca11cdab467b0021e542ac0f94c56d`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 2). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
