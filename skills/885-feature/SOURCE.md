# feature

Ship a feature from a written plan: the ship skill takes any plan.md with Workstreams, Dependencies and Checks sections, runs one codex-manager thread or UX agent per workstream in its own worktree, merges each behind the plan's check, reviews with codex's review mode and ships a verified, deployed PR; the ux-implementer, ux-autofixer and ux-verifier agents staff the UX lane; the handoff skill records a mid-phase stop; the retro skill ranks a finished session's biggest wastes by token cost and routes fixes back to ship and the plan template; hooks keep subagents and the main loop from blocking on each other.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/blockchainian/claude/tree/0e53403fa614c5162b54ed0149cb7720ca1414a9/plugins/feature
- Commit: `0e53403fa614c5162b54ed0149cb7720ca1414a9`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 3, MCP servers: 0, scripts: 11). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
