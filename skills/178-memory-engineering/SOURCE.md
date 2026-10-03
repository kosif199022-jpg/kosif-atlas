# memory-engineering

Engineer an agent's forgetting, not just its remembering. Four deterministic stdlib scripts implement the four lenses of agent memory: a cost profiler that splits construction from query spend and reports cost per correct answer (construction energy exceeds total query energy across 300 queries in the Stanford characterization); an architecture picker that scores the four paradigm families — long-context, flat RAG, structure-augmented RAG, agentic — disqualifies on hard constraints, names the cost the winning choice makes you pay, and refuses to pick when the top two tie; a density auditor that classifies every record in a real memory directory or JSONL export as FACT / SKILL / LOG / PROSE, finds near-duplicates, and flags stale and time-relative wording; and a forgetting-policy linter that fails any design with no forgetting rule or that auto-merges contradictions. Ships cs-memory-engineer agent, /cs:memory-engineering and /cs:forgetting-audit commands, 4 references citing 7 sources each, and a seven-question forcing worksheet.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/alirezarezvani/claude-skills/tree/19392f7a08264ed00486a251f5b2098321771f94/engineering/memory-engineering
- Commit: `19392f7a08264ed00486a251f5b2098321771f94`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 4). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
