# delivery-surface-backlog

A run surface that is an application: the Backlog desktop app. A stdio MCP server that forwards the lifecycle operations of the surface capability (open_dashboard, start_run, record_prompt, set_run_context, update_stage, finish_run, list_runs, get_run) to the MCP endpoint inside the running app, with the bearer token from the app's own settings, and passes Backlog's answers and refusals through unchanged; export_report only while Backlog lists it, render never. With Backlog closed or its MCP server off, open_dashboard answers unavailable so a caller moves on to the next surface. Registering Backlog's own backlog server, the tracker, never makes it a surface; installing this plugin does. Declares no dependency and names no engine.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/jsdotnet/devbook/tree/585d8b881ae5011f1cf21caaeafb7bf876e04e25/plugins/delivery-surface-backlog
- Commit: `585d8b881ae5011f1cf21caaeafb7bf876e04e25`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 1, scripts: 3). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
