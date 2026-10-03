# database-reliability-engineering

Database Reliability Engineering (DBRE) team — agents (dbre-architect, database-operations-engineer, database-incident-responder) that own the PRODUCTION database as a reliability surface, the layer database-engineering (schema/query design) doesn't: HA topology & failover from RPO/RTO, backup & point-in-time recovery with restore verification, disaster recovery, capacity planning, connection pooling; zero-downtime expand-contract migrations, backfills, replication management & failover drills, upgrades; and DB on-call (replication lag, lock contention, connection storms, runaway queries, disk-full), DB SLOs, blameless postmortems. skills, a knowledge bank with Mermaid decision trees + a dated 2026 reference, best-practices, templates. Seams: schema/query → database-engineering; service SRE → observability-sre; provisioning → terraform-iac / cloud; pipelines → data-orchestration; access → security-engineering / auth-identity. Requires ravenclaude-core@>=0.7.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/database-reliability-engineering
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
