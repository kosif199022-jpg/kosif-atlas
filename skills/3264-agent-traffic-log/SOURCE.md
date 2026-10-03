# agent-traffic-log

An append-only JSONL event log of agent-to-agent traffic plus a live pane over it, giving a fleet an org-wide view instead of N private conversations. No daemon and no lock: concurrent appends are safe because a single write of under PIPE_BUF bytes to an O_APPEND descriptor cannot interleave, verified at 24 concurrent writers producing 960 lines with zero torn. Ships scripts/xs with log, tail, recent, status (who is waiting on whom, derived from events rather than tracked), and prune. Includes the acceptance test that only a real team run can satisfy.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/agent-traffic-log
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
