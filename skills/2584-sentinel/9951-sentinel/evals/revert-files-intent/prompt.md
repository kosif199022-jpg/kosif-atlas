---
description: "A revert in the window clears the filing bar on its own and produces an intent file."
tags: [sentinel, maintain, needs-bash]
max_turns: 20
timeout_seconds: 420
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write]
append_system_prompt: "Scheduled sentinel sweep. Tier 2 is not configured for this repo (no config.json), so run tier 1 only over the default window. Use python3 for the scanner."
---

Post-ship check on this repo: did anything regress?
