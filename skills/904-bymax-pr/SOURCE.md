# bymax-pr

The PR lifecycle, powered by the `gh` CLI. /bymax-pr:push ships work safely: branch (never the default branch) → stage → complete Conventional-Commits message → push, with an explicit `pr` opt-in that opens a fully-described PR (Summary / Changes / How to verify). /bymax-pr:babysit-pr autonomously shepherds an open PR to merge-readiness: resolves merge conflicts, polls CI at a cadence matched to the CI's real duration (270 s floor), classifies failures as real vs flaky (re-running flaky checks), fixes real failures locally before pushing, triages bot review comments (4-tier), and notifies you when the PR is green. Never merges, never pushes to the base branch, never force-pushes. A built-in preflight verifies the gh CLI is installed and authenticated. Depends on `gh` + `git` but never bundles them.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/bymaxone/bymax-agent-kit/tree/0aa49987c1f84bac7f8071fde4e5d48caf2e19e9/plugins/bymax-pr
- Commit: `0aa49987c1f84bac7f8071fde4e5d48caf2e19e9`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
