# permission-gate-inherits-operator-allow-list

Audit what a service actually auto-runs when it reuses a permission gate built for an interactive terminal. The gate reads a human's editor settings, so an agent or bot driven by other people's input inherits that human's personal allow-list -- measured on one deployment: 123 Bash() patterns, including gh pr merge, gh api and codex exec, auto-running with no approval card. Use when a command you expected to need approval ran without one, when a verdict says "matches user allow pattern", when wiring such a gate into a service, or when a suite's verdicts change with whose machine runs it. Covers locating the discovery paths, measuring and proving the surface with the gate's own verdicts, cutting the inheritance off upstream rather than around it, and asserting at boot that it stayed cut.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/permission-gate-inherits-operator-allow-list
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
