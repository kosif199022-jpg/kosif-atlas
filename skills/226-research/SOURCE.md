# research

Default entry point for any research request — a hybrid router that classifies the question deterministically and either delegates to a specialist research skill (pulse for trends/sentiment, grants for NIH funding, litreview for academic literature, syllabus for course reading, patent for prior-art + IP landscape, dossier for entity research) or runs its own plan-decompose-multi-source-search-synthesize-cite fallback workflow when no specialist matches. Always surfaces the routing decision so users can override. Triggers: 'research [topic]', 'look into [topic]', 'what do we know about [topic]', 'investigate [topic]', 'find me information on [topic]', 'do some research on [topic]', 'I need to understand [topic]', or any research request that doesn't obviously match a more-specific specialist skill. Output is a markdown briefing (default) or .docx document (on request) with full citations and an audit log.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/alirezarezvani/claude-skills/tree/19392f7a08264ed00486a251f5b2098321771f94/research/research
- Commit: `19392f7a08264ed00486a251f5b2098321771f94`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 3). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
