# context-guard

Per-session context-window observability plus the first shipped consumer: a statusline wrapper tees each session's context_window fields to a per-session snapshot file, a zone resolver classifies usage into smart/acceptable/dumb bands (percentage bands plus window-class token bands, conservative-min combination, zones.json SSOT with shipped defaults), a reader contract fixes how consuming sessions interpret the snapshots, and zone-crossing hooks report once per transition into a worse zone across two channels: the continuation menu to the operator, who owns that choice, and to the model only the zone determination plus the counter-steer that a zone word is not a decay signal (advisory by default; an optional blocking mode gates new mutating work on a fresh dumb-zone snapshot with handoff-writing exempt), with a PostCompact hook persisting an evidence-degraded marker.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/melodic-software/claude-code-plugins/tree/c8fa858c9059d3183cfc08f646e4a97f44b33973/plugins/context-guard
- Commit: `c8fa858c9059d3183cfc08f646e4a97f44b33973`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 4, MCP servers: 0, scripts: 20). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
