# team-portfolio

Centralized multi-repo, multi-person activity & project tracking. Aggregates commits, pull requests, and issues across many GitHub repositories from the GitHub API and rolls them up by person, by repo, and by cross-repo project — so a team working in sibling repos has one place to see who did what, and a supervisor gets a manage-the-team view no single-repo activity log can provide. Ships a stdlib-only collector (GitHub REST API → normalized activity JSON), a markdown report generator (weekly tracker + rolling activity roll-up + per-project status), a self-contained HTML dashboard generator, an offline config linter, a copy-in GitHub Action template for scheduled refresh, an on-demand /portfolio-refresh command, an optional hand-maintained narrative layer, skills, a scenarios bank, and a knowledge bank of decision trees. Secrets stay in env/secrets, never in config. Requires ravenclaude-core@>=0.7.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/team-portfolio
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 4). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
