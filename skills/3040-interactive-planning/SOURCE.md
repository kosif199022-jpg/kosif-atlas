# interactive-planning

Structured planning for Claude Code with interactive decision gates. Walks through requirements gathering, approach selection, and plan validation before any code is written. Two modes: task-based (single plan file with sequential phases) for straightforward features, and spec-driven (multi-file specs with dependency DAG, topological sprint grouping, and two-level task tracking) for complex multi-domain work. Plans are categorized (feat/fix/refactor/review/test/polish/general) and stored in docs/plans/{category}/{name}/ for multi-plan coexistence. Auto-detects category from user input. Includes session recovery, multi-plan management, auto-detection of complex tasks, and checkpoint protocols for error escalation.

- License: **MIT**
- Source: https://github.com/shihwesley/interactive-planning/tree/2ef3b74/
- Commit: `2ef3b74`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
