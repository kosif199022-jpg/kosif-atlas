# cmux-session-self-identity

Determine which cmux workspace, tab and surface a session is actually running in, and map other live sessions to theirs. Never answer from CMUX_* env vars: the tab and workspace variables can carry the same id (so tab identity is not in the environment at all), and on a resumed session they are a stale launch-time snapshot that can name a workspace the session has left. Uses the bundled CLI -- identify for the caller's own refs (read caller, not focused), tree --all --id-format both to resolve refs to names, top --all --processes to map pids to surfaces. Matters because a session that cannot name its own tab cannot tell a human which tab to address. Also covers the case the first version missed: the CLI only answers processes descended from the app, so a spawned subagent gets a broken-pipe/access-denied refusal -- the normal case, not a fault -- and must fall back to the app's live state file, using the environment ids as lookup keys rather than as answers.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/cmux-session-self-identity
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
