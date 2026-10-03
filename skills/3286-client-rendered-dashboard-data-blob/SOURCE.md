# client-rendered-dashboard-data-blob

Pull trustworthy numbers out of a dashboard that renders entirely client-side, by decoding the data blob it ships instead of scraping the DOM or driving a browser. Use when: (1) you want a dashboard's data as a feed for a report, a script, or another skill, (2) `curl` returns a big HTML page whose numbers are nowhere in the HTML, (3) you are about to reach for Playwright / headless Chrome just to read some totals, (4) you copied a rank or a percentage off the screen and want to know what it actually measures before quoting it, (5) numbers you derived from a decoded blob disagree with what the page displays. Covers finding the blob, decoding a positional-tuple event schema from the page's own render loop, porting derived-metric formulas rather than guessing them, and validating against a screenshot. Includes two traps that silently produce plausible-but-wrong numbers: a displayed rank that is really a row number under the active sort, and a "velocity"/delta that is intra-window rather than period-over-period.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/client-rendered-dashboard-data-blob
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
