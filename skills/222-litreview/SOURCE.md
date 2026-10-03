# litreview

Academic literature orientation skill. Turns a research question into a strategically planned mini literature review, delivered as a researcher-friendly Word document (.docx). Searches via free keyless APIs by default (PubMed E-utilities + OpenAlex) with the Consensus MCP as an optional enhancement lane when connected. Grill-me intake (research question + framework hint + tentative depth) before recon search; second forcing checkpoint after Phase 2 confirms framework + sub-areas + depth. Configurable depth (5/10/20 queries) controls coverage vs. speed. Output is a 'launching pad' — orientation guide, not a finished review. Implements research-pack Agent Integrity Rules: 1 q/sec sequential execution, lane check (no plan-tier detection), three-count tracking (sent/received/cited). Source spec: megaprompts/09-litreview-megaprompt.md (PR #657). Sibling of pulse (research-pack shape).

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/alirezarezvani/claude-skills/tree/19392f7a08264ed00486a251f5b2098321771f94/research/litreview
- Commit: `19392f7a08264ed00486a251f5b2098321771f94`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 4). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
