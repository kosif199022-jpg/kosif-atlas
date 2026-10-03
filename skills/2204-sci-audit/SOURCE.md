# sci-audit

Domain-agnostic forensic and linguistic auditor for LLM-generated scientific text. Seven audit axes: reference integrity, claim grounding (with legal open-access full-text resolution), document-internal statistical consistency (statcheck/GRIM/GRIMMER/SPRITE/CI/percentage/subgroup, Turkish decimals), hallucination signals (with ISBN/ORCID/arXiv checksums + entity verification), reporting-guideline conformance (14 guidelines + section pre-scan), AI-use transparency (ICMJE/COPE), and Turkish scientific writing/orthography. Deterministic stdlib core with graceful provider degrade; remote-only MCP; Claude-native judge; injection shield + privacy invariant + content-hashed evidence ledger.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mahirkurt/cureoprivate/tree/2771463ea25e21bfbde2677cafefd9dec5c87e2e/plugins/sci-audit
- Commit: `2771463ea25e21bfbde2677cafefd9dec5c87e2e`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 5, MCP servers: 4, scripts: 18). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
