---
description: "A healthy repo with no fixes or reverts files nothing, and says so."
tags: [sentinel, maintain, needs-bash]
max_turns: 20
timeout_seconds: 420
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write]
append_system_prompt: "Scheduled sentinel sweep. Tier 2 is not configured for this repo (no config.json), so run tier 1 only over the default window. Use python3 for the scanner."
---

Run the maintain scan on this repo.
