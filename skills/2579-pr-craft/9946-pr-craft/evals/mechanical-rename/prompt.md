---
description: "A 31-file mechanical rename trips the file-count gate but has no seam, so it stays one PR with a stated reason."
tags: [pr-craft, git, size-gate, needs-bash]
max_turns: 20
timeout_seconds: 420
allowed_tools: [Read, Glob, Grep, Skill, Bash]
append_system_prompt: "This sandbox has no git remote and gh is not authenticated, by design. Do every step up to and including the local commit. Instead of pushing and opening the PR, print the exact PR title and body you would submit."
---

Open a PR for this rename of total to cartTotal.
