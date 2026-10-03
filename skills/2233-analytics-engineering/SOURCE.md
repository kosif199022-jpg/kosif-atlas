# analytics-engineering

Analytics-engineering team — agents (analytics-engineer, semantic-layer-engineer, data-quality-testing-engineer) for the TRANSFORMATION layer in the modern data stack: dbt modeling (staging -> intermediate -> marts, the medallion/Kimball split, incremental models, materializations), a governed semantic/metrics layer (one definition of revenue/active-user, metrics-as-code) so every tool agrees, and data quality (dbt tests, freshness, model contracts, anomaly checks) that gates the warehouse. Warehouse-neutral (Snowflake/BigQuery/Redshift/Databricks). skills, a decision-tree knowledge bank (materialization + model-layer trees + a dated 2026 map), best-practices, templates, commands, an advisory hook. Distinct from data-platform (ingestion/warehouse/BI) and database-engineering (OLTP). Seams: ELT/warehouse provisioning -> data-platform, OLTP -> database-engineering, BI -> tableau/data-platform, enterprise lakehouse -> microsoft-fabric. Requires ravenclaude-core@>=0.7.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/analytics-engineering
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
