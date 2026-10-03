# delivery

The host-neutral delivery engine: 4 flow-* staged procedures named for what changes — the code, the devbook folders, the dependencies, the project — 3 shared phases, and the pull-request lane, sequenced by the flow-runner agent through a closed set of extension points — spec, implement, validate, app.start, qa.run, verify and deliver as services, session.start, flow.start, data.prepare and flow.end as chores — with human gates a repository adds but never removes, and a run surface resolved from the live tool list so none is a normal outcome. Bindings, extensions, policy, and gates are declared per repository in .devbook/config.json.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/jsdotnet/devbook/tree/585d8b881ae5011f1cf21caaeafb7bf876e04e25/plugins/delivery
- Commit: `585d8b881ae5011f1cf21caaeafb7bf876e04e25`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 3). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
