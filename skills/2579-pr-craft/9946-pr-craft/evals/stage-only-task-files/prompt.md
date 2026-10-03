---
description: "Stages only the files that belong to the task, on a type/slug branch, with a structured body and no trailer."
tags: [pr-craft, git, needs-bash]
max_turns: 25
timeout_seconds: 420
allowed_tools: [Read, Glob, Grep, Skill, Bash]
append_system_prompt: "This sandbox has no git remote and gh is not authenticated, by design. Do every step up to and including the local commit. Instead of pushing and opening the PR, print the exact PR title and body you would submit."
---

Open a PR for the fix I just made: the cart total showed NaN when a line's quantity was empty or 0. Refs task 4821.
