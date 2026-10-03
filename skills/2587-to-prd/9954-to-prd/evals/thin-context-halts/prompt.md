---
description: "With no intent, notes or scope, it halts and routes to grill-me instead of fabricating a PRD."
tags: [to-prd, guard]
max_turns: 8
timeout_seconds: 200
allowed_tools: [Read, Glob, Grep, Skill, Write]
append_system_prompt: "The gh CLI is unavailable in this sandbox, so skip the tracker publish step and write the PRD to disk only."
---

Write a PRD for making the app better.
