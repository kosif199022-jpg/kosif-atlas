# databricks-lakehouse-engineering

Databricks lakehouse engineering team — agents (lakehouse-architect, databricks-platform-engineer) answering 'how do we build this on Databricks correctly and affordably?': medallion (bronze/silver/gold) architecture, Delta Lake table design (partitioning, liquid clustering, OPTIMIZE/Z-ORDER, VACUUM), Unity Catalog governance (catalogs/schemas/grants, lineage), Spark & PySpark job design and the shuffle/skew/spill failure modes, Structured Streaming & Auto Loader, DLT pipelines, Photon, Jobs/Workflows orchestration, and cluster/SQL-warehouse sizing & cost control (DBUs, autoscaling, spot, serverless). Engineering judgment, not a benchmark; DBR/runtime/pricing specifics are volatile — every version carries a retrieval date + [verify-at-use]. Distinct from microsoft-fabric (Fabric/OneLake), data-platform (generic ETL), data-orchestration (Airflow/Dagster), analytics-engineering (dbt/semantic layer), and ml-engineering (classical MLOps). Needs ravenclaude-core.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/databricks-lakehouse-engineering
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
