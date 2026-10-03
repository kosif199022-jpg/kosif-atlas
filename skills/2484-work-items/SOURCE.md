# work-items

Manages development work items through a provider-neutral tracker seam that ships with the plugin (bundled dispatcher plus github, local-markdown, jira, gitea, and linear adapters; seam plugin-dir canonical, adapters consumer-local-first): dashboard, taxonomy-labeled creation, a race-safe assignee-plus-lease claim protocol, recurring-schedule checks, TODO scanning, stale-lease auditing, plan decomposition into vertical-slice items, a macro-journey router over spec containers (rollup, per-container execution shape, next-step routing), raw-intake triage (issues and unsolicited PRs through raw, verified, briefed, autonomous-eligible states), plus the two work-items loop lanes of the loop-lane convention: a self-paced autonomous work-loop drain (work-class admission gate, adaptive item cap, PR-only) and an attended attend-queue escalation lane. The re-runnable setup skill binds the provider (.work-item-tracker.json), seeds the recurring-schedule seam (.github/recurring-schedule.json), and remaps canonical role labels.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/melodic-software/claude-code-plugins/tree/c8fa858c9059d3183cfc08f646e4a97f44b33973/plugins/work-items
- Commit: `c8fa858c9059d3183cfc08f646e4a97f44b33973`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 50). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
