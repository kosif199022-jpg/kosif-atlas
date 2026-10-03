# codebase-xray

Multi-language systematic codebase X-ray analysis (Python, Java, JavaScript, TypeScript, SQL, PL/SQL, Rust, CSS/SCSS/LESS) - analyzes architecture, traces data flows, detects anti-patterns, and generates structured documentation for onboarding, architecture review, or code documentation. Root of the review and documentation dependency graph: it also owns the semantic interconnect mapper (contracts / invariants / domain rules / assumptions) that team-review and codebase-mapper both consume. Concurrent-safe: every analysis is an isolated run under .codebase-xray/runs/ published to a stable root mirror. The Next Steps menu wires the output into downstream documentation generators (CLAUDE.md, codebase map, interface docs) as a technical-reference backbone. Renamed from deep-dive-analysis in 2.0.0. Runs are incremental: each records a structural snapshot of the tree it analyzed, and a later run diffs it against the worktree, carries unaffected claims forward and re-derives only what changed.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/acaprino/daodan/tree/39443d215d28fcbc32d651895b3cc45c64f24b6f/exports/codex/plugins/codebase-xray
- Commit: `39443d215d28fcbc32d651895b3cc45c64f24b6f`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 21). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
