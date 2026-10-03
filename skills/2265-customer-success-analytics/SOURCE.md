# customer-success-analytics

Customer-Success analytics team — specialist agents (cs-analytics-architect, churn-signal-analyst) that own the DOMAIN layer of a CS-health analytics build: the conformed account / health-snapshot / renewal data model, which signals compose the health view, and the transparent rule-based Green/Yellow/Red risk tier (every Red shows why) — no black-box ML in phase one. Domain-neutral: it sits on top of data-platform's pipeline/warehouse/connector layer (which it routes all plumbing to) rather than duplicating it. skills, best-practice rules, a knowledge bank (CS-health/churn signals, renewal lifecycle, NRR/GRR retention metrics, consolidated + risk-tier-escalation Mermaid decision trees), a scenarios bank (field notes), a stdlib cs_calc.py (NRR-GRR + weighted health-score + renewal-risk), and data-model + tier-design templates whose identity spine points at data-platform. Pairs with data-platform; seams to salesforce / tableau / edtech-partner-success. Requires ravenclaude-core@>=0.7.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/customer-success-analytics
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
