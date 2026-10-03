# database-engineering

Database-engineering team — agents (schema-architect, query-performance-engineer, migration-engineer, db-reliability-engineer) for the OPERATIONAL/transactional data layer (OLTP): relational schema design and normalization (and when to denormalize), indexing strategy and query/EXPLAIN-plan tuning, safe zero-downtime schema migrations (expand/contract), and connection-pooling, transactions/isolation, replication, and backup/restore reliability. Postgres-leaning, principles portable to MySQL/SQL Server; NoSQL access-pattern guidance where it fits. skills, a decision-tree knowledge bank (index-choice + migration-safety trees + a dated 2026 capability map), best-practices, templates, commands, an advisory hook. Distinct from data-platform (analytics/ELT/warehouse) and analytics-engineering (dbt). Seams: ELT/warehouse -> data-platform, ORM/app data-access -> backend-engineering, managed DB infra -> cloud plugins. Requires ravenclaude-core@>=0.7.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/database-engineering
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
