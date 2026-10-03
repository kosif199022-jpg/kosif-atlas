---
description: An approved plan already exists, so planning stages are skipped as done.
tags: [dev-flow, routing]
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
append_system_prompt: "Routing dry run: this sandbox has no project checkout and none of the sub-skills installed, by design. Do not search for the files or skills mentioned. Treat the task description as complete, do not ask clarifying questions about paths, skip worktree isolation, and stop after printing the stage plan (each stage RUN or SKIP with its reason) and asking for confirmation."
---

Route this through the workflow: the CSV export feature for the orders table. The PRD is already at docs/prds/0004-csv-export.md and the approved implementation plan is at docs/plans/0003-csv-export.md; nothing about the scope has changed since. Pick it up from there.
