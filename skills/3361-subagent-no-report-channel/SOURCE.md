# subagent-no-report-channel

Recover the work of a spawned subagent that finished but never reported, and tell that case apart from a genuinely wedged one. Root cause: an agent type's declared toolset may omit a messaging tool, so a correct, completed agent has no channel to deliver through -- or it is a forward-only wrapper scoped not to poll the background job it dispatched. Idle notifications are runtime-generated and are NOT evidence the agent's own send worked; the reliable oracle is the transcript (tool_use with no tool_result). Covers recovering the result from the agent's final text, from the job runtime's state directory, and the one-sentence fallback brief that prevents the loss.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/subagent-no-report-channel
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
