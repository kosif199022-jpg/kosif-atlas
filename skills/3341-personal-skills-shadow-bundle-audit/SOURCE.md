# personal-skills-shadow-bundle-audit

Audit and clean up personal `~/.claude/skills/` copies that duplicate or shadow skills a plugin bundle also ships, so sessions stop silently running stale versions. Use when: (1) a skill you know was updated upstream behaves like an old version (e.g. it ran at 4.0.0 while the installed bundle ships 4.1.0), (2) you are asked "can I just delete the local copy?" of a skill that also exists in a plugin, (3) `~/.claude/skills/` has accumulated copies of skills that later moved into a plugin bundle, (4) a skill appears in the session's skill list bare (no `plugin:` prefix) and you need to know which file on disk that actually is, (5) after installing or updating a bundle plugin you want to retire the loose per-skill installs it replaced. Key trap: `~/.claude/plugins/marketplaces/<mkt>/` is the fetched marketplace source, NOT loaded — only plugins present under `~/.claude/plugins/cache/` serve skills, and a bundle can turn out not installed at all, leaving the personal copies as the sole (stale) provider. Covers the audit commands (version drift table, two-way content diff against the cache copy), the delete / keep decision tree (byte-identical, version-behind with superseded wording, genuine unpushed fork), and the tar backup before any rm.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/personal-skills-shadow-bundle-audit
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
