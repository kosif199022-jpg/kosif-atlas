# stop-rule

A halting discipline for iterative fix loops: after a bounded number of failed attempts at the same objective, stop and report the state with hypotheses — never make attempt N+1 on momentum. Use when re-pushing to fix CI, retrying a flaky repro, or any loop where each retry is a guess rather than a diagnosis.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/jrichlen/agent-plugins/tree/013353ad6ae0efb71384e0e14a0196b1be1884f6/plugins/stop-rule
- Commit: `013353ad6ae0efb71384e0e14a0196b1be1884f6`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
