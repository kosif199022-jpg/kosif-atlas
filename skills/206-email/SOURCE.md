# email

Email triage system — paired skills (inbox-setup + inbox-triage) for personalized recurring email triage. inbox-setup runs once via interactive interview to build a knowledge base of 7 files (taxonomy, patterns, evaluation-framework, rate-card, blocklist, tracker, triage-log/) in ${WORKSPACE}/Email/. inbox-triage runs on recurring cadence (1-3x daily) or on demand: classifies recent emails, researches new senders, generates recommendations, drafts replies (NEVER sends), delivers a report, and updates the KB with learnings. The two skills share a strict file contract — PR #657's cross-skill consistency audit verified the 7 KB filenames align verbatim between the two megaprompts. Source specs: megaprompts/06-inbox-setup-megaprompt.md + megaprompts/07-inbox-triage-megaprompt.md.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/alirezarezvani/claude-skills/tree/19392f7a08264ed00486a251f5b2098321771f94/productivity/email
- Commit: `19392f7a08264ed00486a251f5b2098321771f94`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 6). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
