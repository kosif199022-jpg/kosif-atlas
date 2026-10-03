# data-orchestration

Data-orchestration team — agents (orchestration-architect, pipeline-orchestration-engineer) for the layer that RUNS and SCHEDULES data pipelines: orchestrator selection (Airflow, Dagster, Prefect, Mage, Temporal-for-data; cloud-native MWAA/Step Functions, Azure Data Factory, Cloud Composer/Workflows), DAG and software-defined-asset design, scheduling/triggers (cron, sensor, data-aware), backfills and catchup, idempotency and retries with exponential backoff, partitioning, freshness SLAs and alerting, and lineage. skills (choose-orchestrator, design-dag-and-dependencies, handle-backfills-and-retries), a knowledge bank (a Mermaid selection tree + a 2026 patterns reference), and templates. Distinct from data-platform (ELT/warehouse/BI), analytics-engineering (dbt), and data-streaming-engineering (real-time) — this is the scheduling/run layer they plug into. Requires ravenclaude-core@>=0.7.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/data-orchestration
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
