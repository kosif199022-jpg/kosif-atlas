# postgres-performance

PostgreSQL query & performance tuning. Use when a query is slow, reading an `EXPLAIN [ANALYZE]` plan (scan/join nodes, estimate skew), choosing an index type/columns (btree/GIN/GiST/SP-GiST/BRIN/hash; partial/expression/covering), fixing planner estimates with statistics, diagnosing MVCC bloat/VACUUM/autovacuum lag, or tuning planner GUCs (`random_page_cost`, `work_mem`). Includes `(pgNN+)` annotations. Tuning only — client -> psql, SQL -> postgres-sql, config -> postgres-admin.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/dashed/claude-marketplace/tree/f6a24dbc08da57aeb80e7423da2508457d0b3398/plugins/postgres-performance
- Commit: `f6a24dbc08da57aeb80e7423da2508457d0b3398`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
