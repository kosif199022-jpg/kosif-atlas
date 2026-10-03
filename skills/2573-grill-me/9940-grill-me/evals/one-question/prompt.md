---
description: "Opens with exactly one question plus a recommended answer, not a question dump."
tags: [grill-me, interview]
max_turns: 10
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
append_system_prompt: "Live interview: the user answers in the next turn. Ask your next question and stop."
---

Grill me on this plan: signed-in shoppers can save their current cart under a name and restore it later from their account page.
