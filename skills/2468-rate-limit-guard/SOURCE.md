# rate-limit-guard

Shared rate-limit guard for loop lanes: a statusline wrapper tees the subscription rate-limit windows to a fixed machine-scope file, a StopFailure hook records rate-limit stops reactively, and a reader contract fixes how consuming sessions pause and resume.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/melodic-software/claude-code-plugins/tree/c8fa858c9059d3183cfc08f646e4a97f44b33973/plugins/rate-limit-guard
- Commit: `c8fa858c9059d3183cfc08f646e4a97f44b33973`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 15). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
