# slack-app-token-rotation

Actually rotate a leaked Slack bot or app-level token: reinstalling does NOT mint a new xoxb-, only destroying the OAuth grant does. Covers the channel-membership fallout, the incoming-webhook channel picker, and verification without printing tokens.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/slack-app-token-rotation
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
