# universal-audit-log

One hook on * that records every event on $ (tool calls, prompts, turns, other plugins' fs/http/process calls) as JSON lines with origin plugin and tier, duration and outcome, including denials. Buffered and flushed to a JSONL file through $.fs at the end of every turn.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/davila7/claude-code-templates/tree/8b1f88342619330b6306ee318f57f2cd5b78789d/cli-tool/components/mods/observability/universal-audit-log
- Commit: `8b1f88342619330b6306ee318f57f2cd5b78789d`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
