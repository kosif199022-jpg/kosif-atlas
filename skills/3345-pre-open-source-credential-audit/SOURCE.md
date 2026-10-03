# pre-open-source-credential-audit

Audit a git repo for leaked secrets before making it public: scan tracked files AND full history, avoid the git grep -E \b false-negative, catch tracked editor-backup files, and decide rewrite+rotate vs. accept an inert identifier.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/pre-open-source-credential-audit
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
