# permission-gate-allow-list-not-decisive

Diagnose WHICH permission gate refused a command when two are active, and why a standing allow rule did not stop it: the opt-in autoMode.classifyAllShell (default false) suspends every Bash/PowerShell allow rule while auto mode is active, while outside auto mode the same rule applies and bypasses PreToolUse hooks entirely

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/permission-gate-allow-list-not-decisive
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
