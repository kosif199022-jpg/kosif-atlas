# oracle-ai-data-platform-workbench-databricks-migrator

Drive the Oracle AI Data Platform (AIDP) Databricks Migration Toolkit in natural language. Self-contained — the full Python engine (scripts/, aidp_compat/) ships bundled under engine/ and is invoked from skills via ${CLAUDE_PLUGIN_ROOT}/engine/scripts/. Teaches Claude how to plan and execute an automated end-to-end migration of Databricks (Unity Catalog / HMS) notebooks, jobs, schedules, and catalog DDL onto AIDP — Pass-1 dependency resolution + Pass-2 cell-by-cell execute/verify/fix on a live AIDP cluster using Claude with tool use. Covers job_migrate.py orchestration, catalog migration (18 DDL rewrite rules: 3-part→2-part name flatten, s3://→oci:// via bucket-map, source-format preserved with delta.* property scrub), workflow DAG manifest building, fixup_cell rewind, pre-migration data-availability checks, write-redirect sandbox schema, and the acceptance-contract pattern for batch/streaming convergence. Bundles 10 skills, 4 slash commands, 2 reviewer agents, and 4 reference docs + an env-coords template (cli-map, ddl-rewrite-rules, gotchas, job-report-format + env-coords.template.md).

- License: **MIT**
- Source: https://github.com/oracle-samples/oracle-aidp-samples/tree/90b42d6c24d4e5da784842c21234a750f7e55fef/ai/claude-code-plugins/oracle-ai-data-platform-workbench-databricks-migrator
- Commit: `90b42d6c24d4e5da784842c21234a750f7e55fef`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 50). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
