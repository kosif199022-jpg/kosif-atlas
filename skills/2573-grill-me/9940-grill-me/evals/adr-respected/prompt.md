---
description: "An accepted ADR is a locked input: the interview does not relitigate the datastore."
tags: [grill-me, interview, adr]
max_turns: 12
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Skill]
append_system_prompt: "Live interview: the user answers in the next turn. Ask your next question and stop."
---

Grill me on this plan: signed-in shoppers can save their current cart under a name and restore it later from their account page. We will obviously need to persist these somewhere.
