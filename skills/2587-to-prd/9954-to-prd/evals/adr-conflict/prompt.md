---
description: "An intent that contradicts an accepted ADR is surfaced before anything is written."
tags: [to-prd, adr]
max_turns: 12
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Skill, Write]
append_system_prompt: "The gh CLI is unavailable in this sandbox, so skip the tracker publish step and write the PRD to disk only."
---

Write the PRD for saved carts. Slug: saved-carts. One change from the design notes: we decided to store saved carts in Redis for speed.
