# delivery-surface-collector

A headless run surface: where a run becomes recorded rather than watched. An MCP server implementing two surface capability groups — lifecycle (open_dashboard, start_run, record_prompt, set_run_context, update_stage, finish_run, list_runs, get_run) and export (export_report) — keeping stage status, output, gate decisions, QA scenarios and the handoff marker on disk so a resumed session picks the run up where it stopped, and writing the run's Markdown report at the end. No page, no port, nothing rendered: the right surface for scheduled and unattended runs. Declares no dependency and names no engine.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/jsdotnet/devbook/tree/585d8b881ae5011f1cf21caaeafb7bf876e04e25/plugins/delivery-surface-collector
- Commit: `585d8b881ae5011f1cf21caaeafb7bf876e04e25`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 1, scripts: 6). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
