# handoff

Conversation-handoff document generator. Compacts the current conversation into a markdown handoff so a fresh agent can continue. References existing artifacts (PRDs, plans, ADRs, issues, commits) by path/URL — does not duplicate them. Enhanced from Matt Pocock's MIT-licensed handoff skill (https://github.com/mattpocock/skills) with: (1) stdlib Python tools (template generator, artifact deduplicator, skill recommender), (2) 3 reference docs citing 5+ authoritative sources each (handoff structure, deduplication discipline, next-session skill matching), (3) cs-handoff-author persona agent + /cs:handoff slash command. Matt's no-duplication discipline preserved verbatim per MIT. Use when user wants to hand off the current conversation to a fresh agent or starts a new session that picks up prior work.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/alirezarezvani/claude-skills/tree/19392f7a08264ed00486a251f5b2098321771f94/engineering/handoff
- Commit: `19392f7a08264ed00486a251f5b2098321771f94`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 3). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
