---
description: One-file bug with an obvious cause routes to the three-step bug chain.
tags: [dev-flow, routing]
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
append_system_prompt: "Routing dry run: this sandbox has no project checkout and none of the sub-skills installed, by design. Do not search for the files or skills mentioned. Treat the task description as complete, do not ask clarifying questions about paths, skip worktree isolation, and stop after printing the stage plan (each stage RUN or SKIP with its reason) and asking for confirmation."
---

Kick this off through the workflow: the cart total shows NaN when an item's quantity is set to 0. The cause is obvious, it's a missing guard in src/cart/total.ts, one file.
