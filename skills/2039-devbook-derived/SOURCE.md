# devbook-derived

The committed devbook index, and the canvas that draws it: keeps the derived _meta/ artifacts — the reference graph, the reading outline, and the open-note index, one set per adopted folder and a rollup under .devbook/_meta/ — in a repository's tree for a reader that cannot run devbook's checker itself, and ships the devbook-graph Copilot canvas that renders the graph live from devbook's modules at their materialized path. Ships the refresh paths that pass --write to devbook's build.mjs: the refresh skill and the on-demand Update-DevbookIndex.ps1, the nightly refresh workflow that opens one pull request when the indexes moved, and the pull-request drift warning; the derived-artifacts rule with a wrapper per host; its own AGENTS.md section; and the .claude/settings.json deny snippet. Three skills, init, update, and refresh. An L1 extension over devbook: enable it to commit the index, disable it to stop, and the check is devbook's either way.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/jsdotnet/devbook/tree/585d8b881ae5011f1cf21caaeafb7bf876e04e25/plugins/devbook-derived
- Commit: `585d8b881ae5011f1cf21caaeafb7bf876e04e25`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 5). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
