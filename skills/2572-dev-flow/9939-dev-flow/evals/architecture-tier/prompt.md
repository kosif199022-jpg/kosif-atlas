---
description: New subsystem with a public API routes to the architecture chain with compass.
tags: [dev-flow, routing]
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
append_system_prompt: "Routing dry run: this sandbox has no project checkout and none of the sub-skills installed, by design. Do not search for the files or skills mentioned. Treat the task description as complete, do not ask clarifying questions about paths, skip worktree isolation, and stop after printing the stage plan (each stage RUN or SKIP with its reason) and asking for confirmation."
---

Kickoff: we need a brand-new audit-log subsystem that three existing services will write to, exposing a public API that other teams will consume. We haven't decided storage or delivery guarantees yet. Help me figure out how to structure it and then build it.
