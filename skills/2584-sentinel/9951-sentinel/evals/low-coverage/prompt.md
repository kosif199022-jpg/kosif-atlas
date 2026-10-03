---
description: "Below ~0.7 conventional-commit coverage, tier 1 is noise: report it and file nothing."
tags: [sentinel, maintain, needs-bash]
max_turns: 20
timeout_seconds: 420
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write]
append_system_prompt: "Scheduled sentinel sweep. Tier 2 is not configured for this repo (no config.json), so run tier 1 only over the default window. Use python3 for the scanner."
---

What's rotting in this repo? Do a sentinel sweep.
