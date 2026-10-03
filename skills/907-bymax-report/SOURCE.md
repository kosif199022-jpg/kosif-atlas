# bymax-report

The weekly silent-standup report for one repository, written from evidence. /bymax-report:standup collects what shipped in a period (pull requests via gh, commits via git) and what was asked (what a person typed into Claude Code or Codex sessions on that repository, worktree sessions included, pasted third-party requests included), then writes the two sections the team reads: a PROGRESS list of the asks as outcome sentences, undelivered ones marked in progress, and UPDATES grouped by product area saying what changed and what it replaced. No hashes, PR numbers or file names reach the report; an evidence block under it maps every line back to its PR, commit and request for the author. Plain text printed to paste, no Markdown, no file left on disk, English by default; --author keeps one git author. Depends on git; gh is used when present and its absence is reported, never hidden.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/bymaxone/bymax-agent-kit/tree/0aa49987c1f84bac7f8071fde4e5d48caf2e19e9/plugins/bymax-report
- Commit: `0aa49987c1f84bac7f8071fde4e5d48caf2e19e9`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 2). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
