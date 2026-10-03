# abstraction-architect

Structural entropy auditor: finds where the same concept is represented, owned, computed or implemented more than once, and what it costs when that concept changes. Seven dimensions over two evidence tracks. Knowledge track (duplicated domain knowledge, competing sources of truth, redundant representation, duplicated or derivable state) is judged by semantic identity and ownership, so two representations suffice behind a strict gate. Form track (missed unification, prior art available, abstraction fitness) is judged by recurrence, where the Rule of Three applies to missed unification only. Global mode censuses the codebase and persists a concept index; diff mode asks the same seven questions as 'introduced or aggravated by this change' and runs as the Abstraction dimension of /senior-review:team-review and /senior-review:code-review. Report-only, grounded in canonical theory (Metz, Beck, Fowler, Gross, North, DDD).

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/acaprino/daodan/tree/39443d215d28fcbc32d651895b3cc45c64f24b6f/exports/codex/plugins/abstraction-architect
- Commit: `39443d215d28fcbc32d651895b3cc45c64f24b6f`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
