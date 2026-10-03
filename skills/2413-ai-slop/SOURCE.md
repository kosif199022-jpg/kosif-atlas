# ai-slop

Detects and removes AI-writing tells (slop) in checked-in markdown prose: em dashes, emoji formatting, AI vocabulary, negative parallelisms, chatbot phrases, filler, stacked hedging, citation artifacts, model-era phrases, and the rest of a catalog distilled from Wikipedia's Signs of AI writing plus a repo-owned, evidence-graded inventory of current-generation model vocabulary. Read-only audit by default with a deterministic detector plus a judgment rubric; an explicit fix action rewrites findings behind a semantic-diff guard. Findings conform to the detector-findings convention so the review fanout fix relay can consume them.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/melodic-software/claude-code-plugins/tree/c8fa858c9059d3183cfc08f646e4a97f44b33973/plugins/ai-slop
- Commit: `c8fa858c9059d3183cfc08f646e4a97f44b33973`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 17). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
