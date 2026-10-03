---
description: "Synthesises the PRD from the on-disk intent file, keeping the Glossary verbatim and citing it."
tags: [to-prd, artifact]
max_turns: 14
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Skill, Write]
append_system_prompt: "The gh CLI is unavailable in this sandbox, so skip the tracker publish step and write the PRD to disk only."
---

Write the PRD for saved carts. Slug: saved-carts.
