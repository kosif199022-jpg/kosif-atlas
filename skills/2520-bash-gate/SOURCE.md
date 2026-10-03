# bash-gate

A PreToolUse Bash gate that auto-allows provably-safe commands (so you stop approving the same harmless `mkdir`/`rm` of a build artifact) while still deferring anything dangerous. Deterministic allow-classes by default; an optional LLM arbiter handles the long tail. Ships safe-by-default (no path is auto-allowed until you opt in) and a /bash-gate-add skill to extend it when a prompt slips through.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mnox/mnox-ai/tree/50de1158b4e27879e3da104e36b7d31d4204bc15/plugins/bash-gate
- Commit: `50de1158b4e27879e3da104e36b7d31d4204bc15`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 2, MCP servers: 0, scripts: 5). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
