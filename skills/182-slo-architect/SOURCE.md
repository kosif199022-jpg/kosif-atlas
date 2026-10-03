# slo-architect

End-to-end SLO/SLI/error-budget discipline per Google SRE Workbook. Ships SLO designer (refuses to render without required fields), error-budget calculator with multi-window burn-rate alert thresholds (PromQL-shaped), and SLO reviewer that catches the 7 common bugs (target too high, window too short, no SLI definition, CPU-as-SLI, etc.). 4 references on principles + SLI design + error budget math + composition with feature-flags-architect/chaos-engineering/kubernetes-operator. Asset templates for SLO YAML and error budget policy. /slo-design slash command. NOT a generic observability skill.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/alirezarezvani/claude-skills/tree/19392f7a08264ed00486a251f5b2098321771f94/engineering/slo-architect
- Commit: `19392f7a08264ed00486a251f5b2098321771f94`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 3). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
