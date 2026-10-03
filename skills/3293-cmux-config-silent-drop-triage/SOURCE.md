# cmux-config-silent-drop-triage

Find out why a cmux.json entry that passes `cmux config doctor` never shows up in the palette, plus-button menu or tab bar. Doctor is syntax-only, the schema is additionalProperties: true, and the unified log stays silent - so the working oracles are a backup-diff bisect, the binary's own [CmuxConfig] diagnostics, and enum triads read straight off `strings`. Worked example: a workspaceCommand action hidden by `"restart": "restart"` (valid: ignore/confirm/recreate, or omit for a new workspace each time).

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/cmux-config-silent-drop-triage
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
