# arbeitsplan

Compiles a stated problem into an executable, budgeted agentic workflow, runs it as a redundant swarm — N candidates over the SAME scope in their own git worktrees, judged blind, exactly one landed and the rest deleted — and refuses to converge by retrying. Ordering is delegated to takt via a generated beat declaration rather than enforced twice. Writes to a scoped output directory (analysis/arbeitsplan/**), to candidate worktrees under .arbeitsplan/**, and — only behind an explicit approval gate — to .claude/takt.local.md; the single landing step is the one place it touches the working tree. A PreToolUse hook denies an identical re-dispatch, an out-of-scope write, a shared-tree write during a fan-out, and a dispatch past the declared budget. Ships a headless `claude -p` matrix runner for sweeps that need a fresh process and a real per-cell --model.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/anselmoo/werkstoff/tree/3308da58f71a65f166e5a563a16f6f0ebfdfcfb8/plugins/arbeitsplan
- Commit: `3308da58f71a65f166e5a563a16f6f0ebfdfcfb8`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 2, MCP servers: 0, scripts: 38). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
