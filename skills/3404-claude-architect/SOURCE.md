# claude-architect

A recursive multi-agent orchestration framework for Claude Code. An /architect skill classifies every change request and routes it: an orchestrator decomposes work into epics/specs/implementations, runs each in an isolated git worktree — or, opt-in, an isolated cloud VM — and drives a review + architecture-audit + merge pipeline before every squash-merge. Model and effort both follow role, not depth: model by whether a mistake is silent, effort by how much the agent must derive for itself.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/wfbcargo/paulclaudeplugins/tree/ca31a02b72fdc3d645d4a567f03bef6a4ee98bfc/plugins/claude-architect
- Commit: `ca31a02b72fdc3d645d4a567f03bef6a4ee98bfc`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 13). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
