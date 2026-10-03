# agent-flow

A side pane that draws the session's agent flow live: the main loop's context window, every subagent it spawns as a tree, and for each one the context handed down (its prompt, or the whole parent context for a fork), what it did with it (steps, tools, context size) and the answer it handed back up. Docked beside the transcript in the fullscreen layout, above the prompt otherwise. Needs function hooks (early access).

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/davila7/claude-code-templates/tree/8b1f88342619330b6306ee318f57f2cd5b78789d/cli-tool/components/mods/ui/agent-flow
- Commit: `8b1f88342619330b6306ee318f57f2cd5b78789d`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
