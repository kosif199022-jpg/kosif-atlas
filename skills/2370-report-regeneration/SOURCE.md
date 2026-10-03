# report-regeneration

Regenerates a review-ready report (HTML or Office/Word→PDF) from an old distributed report used as a template — infers the template's structure with no markup, re-binds it to new data (including Power BI data via XMLA, with a REST executeQueries fallback, and an embedded Power BI screenshot), and runs a gold-standard auto-QA gate: data accuracy vs source, template fidelity, WCAG/PDF-UA accessibility, consistency, and a blocking no-old-client-data-leak egress scan. It GUARANTEES only (a) no old-client-data leak and (b) that every low-confidence classification is surfaced for human review — it produces a draft; peer review, edits, and distribution stay with the human. Local-only for sensitive client data. Skills ship per lane (v0.1.0 HTML → v0.2.0 Office → v0.3.0 Power-BI-ingest); counts reconciled at Gate 12 PR time. Requires ravenclaude-core@>=0.204.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/report-regeneration
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 34). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
