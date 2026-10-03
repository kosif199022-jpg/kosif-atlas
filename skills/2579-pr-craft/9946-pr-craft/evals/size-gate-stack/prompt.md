---
description: "A ~900-line change with three dependent layers trips the size gate and proposes a stack before committing."
tags: [pr-craft, git, size-gate, needs-bash]
max_turns: 20
timeout_seconds: 420
allowed_tools: [Read, Glob, Grep, Skill, Bash]
append_system_prompt: "This sandbox has no git remote and gh is not authenticated, by design. Do every step up to and including the local commit. Instead of pushing and opening the PR, print the exact PR title and body you would submit."
---

Open a PR for the saved-carts work in the working tree.
