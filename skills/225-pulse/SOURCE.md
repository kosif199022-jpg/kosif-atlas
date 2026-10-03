# pulse

Multi-source recency research skill. Takes the pulse of any topic across Reddit, Hacker News, the open web, and (optionally) X/Twitter within a configurable recent window (default 30 days). Forcing 2–4 question grill-me intake clarifies topic specificity, angle (trend/sentiment/problems/opportunities/comparison), time window, and platform scope before searching. Phases 1–3 run in parallel per the research-pack convention. Returns a synthesized briefing with citations, engagement metrics, and cross-platform pattern analysis. Source spec: megaprompts/01-pulse-megaprompt.md (PR #657). Implements the Agent Integrity Rules block locked down by PR #657 audit: 1 q/sec per platform, three-count tracking (sent/received/cited), retry-once-after-3s, stop-after-3-consecutive-failures.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/alirezarezvani/claude-skills/tree/19392f7a08264ed00486a251f5b2098321771f94/research/pulse
- Commit: `19392f7a08264ed00486a251f5b2098321771f94`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 3). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
