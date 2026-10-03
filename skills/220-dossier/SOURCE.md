# dossier

Decision-grade entity research skill — produces a hypothesis-tested dossier on a specific company, person, nonprofit, or government org, not a generic profile. Forcing intake makes the user state their hypothesis upfront (what they already believe and want to verify or disprove) so the dossier tests it rather than confirms it. Output is an editable Word document (.docx) with verdict on the hypothesis, identity facts, 12-month activity timeline, network signals, reputation signals, red flags, 3-5 conversation hooks tied to specific findings, and source-provenance audit log. Uses WebSearch + WebFetch + free APIs (SEC EDGAR, GitHub, ProPublica Nonprofit Explorer) as workhorses; optional BYOK MCPs (LinkedIn, Crunchbase, Apollo, Pitchbook, SimilarWeb) enhance coverage. Triggers: 'research [company]', 'dossier on [person/company]', 'background check on [entity]', 'prep me for a meeting with [person/company]', 'due diligence on [company]', 'what should I know about [entity]', 'research [person] before I [meet/hire/invest]', 'competitor research on [company]', 'investor diligence [company]', 'interview prep for [company]'. Honors sensitivity exclusions for journalism + personal-vetting contexts.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/alirezarezvani/claude-skills/tree/19392f7a08264ed00486a251f5b2098321771f94/research/dossier
- Commit: `19392f7a08264ed00486a251f5b2098321771f94`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 3). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
