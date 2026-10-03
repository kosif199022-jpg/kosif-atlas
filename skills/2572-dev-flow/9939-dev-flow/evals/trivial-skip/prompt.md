---
description: A one-line typo does not get routed through the chain at all.
tags: [dev-flow, routing]
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
append_system_prompt: "Routing dry run: this sandbox has no project checkout and none of the sub-skills installed, by design. Do not search for the files or skills mentioned. Treat the task description as complete, do not ask clarifying questions about paths, skip worktree isolation, and stop after printing the stage plan (each stage RUN or SKIP with its reason) and asking for confirmation."
---

Route this through the workflow: fix the typo 'recieve' to 'receive' in README.md.
