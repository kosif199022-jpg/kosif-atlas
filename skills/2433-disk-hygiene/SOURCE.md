# disk-hygiene

Context-aware disk hygiene for arbitrary directory trees: inventories orphaned and temporary artifacts, classifies evidence into review tiers, and offers exact-path cleanup only after a fresh safety preview and explicit per-tier approval. The target is read-only by default; OS-managed paths, links and mount points, VCS-tracked content without the complete checkout evidence bundle, changed entries, and live-handle uncertainty fail closed.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/melodic-software/claude-code-plugins/tree/c8fa858c9059d3183cfc08f646e4a97f44b33973/plugins/disk-hygiene
- Commit: `c8fa858c9059d3183cfc08f646e4a97f44b33973`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 7, MCP servers: 0, scripts: 34). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
