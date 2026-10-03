---
description: Design-only request ends at artifacts, no code stage.
tags: [dev-flow, routing]
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
append_system_prompt: "Routing dry run: this sandbox has no project checkout and none of the sub-skills installed, by design. Do not search for the files or skills mentioned. Treat the task description as complete, do not ask clarifying questions about paths, skip worktree isolation, and stop after printing the stage plan (each stage RUN or SKIP with its reason) and asking for confirmation."
---

Spec out a multi-tenant billing module for our platform, but don't build it yet. We need sign-off from the team on the approach before anyone writes code.
