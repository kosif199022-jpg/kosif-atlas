# mercator-ai

Maps codebases of any size using parallel Sonnet subagents with Merkle-tree change detection. Generates docs/CODEBASE_MAP.md with architecture diagrams, module guides, data flows, and navigation guides. Creates docs/.mercator.json merkle manifest for O(1) staleness checks — compare a single root hash to know if anything changed. Post-commit hook auto-refreshes hashes in ~2 seconds with zero API tokens. Supports incremental updates: only re-explores changed modules. Works without git via pure hash-based diff.

- License: **MIT**
- Source: https://github.com/shihwesley/mercator-ai/tree/1ff6854/
- Commit: `1ff6854`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 3). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
