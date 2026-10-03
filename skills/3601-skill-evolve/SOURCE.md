# skill-evolve

Skill Evolution Engine — Darwin-style autonomous SKILL.md optimizer. Applies a 9-dimension rubric (60 structural + 40 effectiveness; structure now elevates the three SkillLens-validated high-signal dimensions — failure-mechanism encoding / executable specificity / high-risk-action blacklist — that lift pairwise judge accuracy 46.4%→73.8%), default multi-judge independent scoring, mandatory with-skill-vs-no-skill baseline comparison (negative-transfer is a hard non-ship gate), and git-backed ratchet hill-climbing (keep-or-revert) to evolve any Claude Code skill from initial draft toward 90+. Ports SkillOpt's three stability controls: rejected-edit buffer (dead-ends.md) + slow-update memory (learnings.md) + text learning-rate (≤30-line edit budget). Inspired by Karpathy's autoresearch, alchaincyf/darwin-skill, and Microsoft SkillLens/SkillOpt.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/xrensiu/claude-code-forge/tree/1c8ee484ea94dde7a88e2792b5e5e1cc079eba10/plugins/skill-evolve
- Commit: `1c8ee484ea94dde7a88e2792b5e5e1cc079eba10`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
