# docs-hygiene

Audits CLAUDE.md/AGENTS.md/SKILL.md instruction files against current repo state, catches claims that have gone stale (a renamed path, a dropped command, a policy that changed) before they get trusted or acted on, and resolves contradictions between layered instruction files (root vs nested, SKILL.md vs its parent AGENTS.md) down to one explicit kept version instead of leaving both to stand. Use before trusting or propagating any instruction-file claim you haven't personally re-checked, whenever onboarding a repo's docs for the first time, right after a refactor/rename/policy change that could invalidate what's documented, or whenever two instruction files (or an instruction file and the actual repo) say different things about the same fact. Trigger phrases: 'audit the docs', 'is AGENTS.md still accurate', 'clean up CLAUDE.md', 'these instructions contradict each other', 'refactor the AGENTS.md files'.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/jrichlen/agent-plugins/tree/013353ad6ae0efb71384e0e14a0196b1be1884f6/plugins/docs-hygiene
- Commit: `013353ad6ae0efb71384e0e14a0196b1be1884f6`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 3). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
