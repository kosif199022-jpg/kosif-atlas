# duckdb

DuckDB — in-process columnar OLAP SQL engine in a single binary ("SQLite for analytics"). Use when querying Parquet/CSV/JSON files directly with SQL, using the `duckdb` CLI shell (REPL or `-c`/`-json` one-shots), friendly SQL (FROM-first, `SELECT * EXCLUDE`, `GROUP BY ALL`, `SUMMARIZE`, `PIVOT`), converting CSV↔Parquet↔JSON via `COPY`, reading HTTP/S3 via httpfs, or `ATTACH`-ing Postgres/MySQL/SQLite. Includes `(duckdb vX.Y+)` annotations; the CLI/SQL engine, not client libraries.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/dashed/claude-marketplace/tree/f6a24dbc08da57aeb80e7423da2508457d0b3398/plugins/duckdb
- Commit: `f6a24dbc08da57aeb80e7423da2508457d0b3398`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
