# workflow-builder

Workflow-builder skill: design and write deterministic multi-agent workflow scripts (.js files in .claude/workflows/) for Claude Code's Workflow tool (CLAUDE_CODE_WORKFLOWS=1, /workflows). Every session opens with an intake question set; when the user is vague, a stdlib recommendation engine infers and proposes a topology with rationale instead of stalling. Ships 3 stdlib Python tools (intake recommendation engine, .js validator enforcing the pure-literal-meta / no-non-determinism / guarded-loop / parallel-thunk rules, topology scaffolder), 3 references citing 7-8 authoritative sources each (full API surface, orchestration patterns, decision + intake guide), templates + a runnable example, cs-workflow-architect persona agent + /cs:workflow-build slash command. Use when building, scaffolding, or running a custom Claude Code workflow or orchestrating sub-agents (fan-out, pipeline, loop, judge-panel).

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/alirezarezvani/claude-skills/tree/19392f7a08264ed00486a251f5b2098321771f94/engineering/workflow-builder
- Commit: `19392f7a08264ed00486a251f5b2098321771f94`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 8). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
