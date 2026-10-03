# codebase-design

Before writing a new interface (module boundary, class API, function signature, or service contract) that at least two call sites will depend on, that crosses a module/service/team/persistence boundary, or that will be expensive to change later — produce 3+ radically different candidate designs and compare them on depth, locality, and seam placement before picking one. Use on "before committing to an interface", "design this API/module/class boundary", "how should this be structured", "compare interface designs", "is this the right abstraction", "design it twice", reviewing a proposed interface shape in a PR — or self-trigger whenever about to write a new interface meeting that bar.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/jrichlen/agent-plugins/tree/013353ad6ae0efb71384e0e14a0196b1be1884f6/plugins/codebase-design
- Commit: `013353ad6ae0efb71384e0e14a0196b1be1884f6`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
