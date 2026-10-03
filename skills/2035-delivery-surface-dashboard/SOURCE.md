# delivery-surface-dashboard

A run surface: the live dashboard a run is watched in. An MCP server implementing all three surface capability groups — lifecycle (open_dashboard, start_run, record_prompt, set_run_context, update_stage, finish_run, list_runs, get_run), render (render_diagram, render_markdown), and export (export_report) — with a run timeline carrying stage output, QA scenarios and their evidence, a Mermaid diagram viewer and a Markdown document viewer, and hook-captured tool and token telemetry. Rendered inline as an MCP App where the host supports it, served on 127.0.0.1 where it does not. Declares no dependency and names no engine.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/jsdotnet/devbook/tree/585d8b881ae5011f1cf21caaeafb7bf876e04e25/plugins/delivery-surface-dashboard
- Commit: `585d8b881ae5011f1cf21caaeafb7bf876e04e25`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 7, MCP servers: 1, scripts: 15). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
