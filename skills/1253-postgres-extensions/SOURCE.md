# postgres-extensions

PostgreSQL extension management and the bundled `contrib` catalog. Use when running `CREATE/ALTER/DROP EXTENSION`, listing extensions (`\dx`), or choosing which contrib module enables a feature — FDWs (`postgres_fdw`, `dblink`), trigram search (`pg_trgm`), crypto/UUIDs (`pgcrypto`), types (`hstore`/`ltree`/`citext`), query stats (`pg_stat_statements`, `auto_explain`), forensics (`pageinspect`, `amcheck`). Covers trusted extensions & `shared_preload_libraries`. Includes `(pgNN+)` annotations.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/dashed/claude-marketplace/tree/f6a24dbc08da57aeb80e7423da2508457d0b3398/plugins/postgres-extensions
- Commit: `f6a24dbc08da57aeb80e7423da2508457d0b3398`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
