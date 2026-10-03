---
description: Multi-file user-visible change with settled conventions routes to the feature chain, compass skipped.
tags: [dev-flow, routing]
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
append_system_prompt: "Routing dry run: this sandbox has no project checkout and none of the sub-skills installed, by design. Do not search for the files or skills mentioned. Treat the task description as complete, do not ask clarifying questions about paths, skip worktree isolation, and stop after printing the stage plan (each stage RUN or SKIP with its reason) and asking for confirmation."
---

Start a new feature: add a CSV export button to the orders table in our admin dashboard. The export should respect whatever filters are currently applied. It touches the table component, the API route and a new serializer; the repo already has an established pattern for API routes.
