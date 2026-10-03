---
description: "A PRD that violates an accepted ADR stops planning and surfaces the conflict."
tags: [blueprint, adr]
max_turns: 12
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Skill, Write]
---

Plan the build for the saved-carts PRD. Slug: saved-carts. Note: to keep restore fast, cache saved carts in Redis as the source of truth.
