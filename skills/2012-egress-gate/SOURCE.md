# egress-gate

Before any call that transmits repo or user content off-machine (posting a comment, pushing a branch, calling an external API with file contents in the payload), state what is being sent and to whom — permission modes gate the call, this gates the content. Use whenever output leaves the machine to a destination the user didn't name in this task.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/jrichlen/agent-plugins/tree/013353ad6ae0efb71384e0e14a0196b1be1884f6/plugins/egress-gate
- Commit: `013353ad6ae0efb71384e0e14a0196b1be1884f6`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
