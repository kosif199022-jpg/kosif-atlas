---
description: "A staged route that concatenates user input into SQL is flagged by the security check with a fix."
tags: [implementation-review, git, security, expensive, needs-bash]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash, Agent]
append_system_prompt: "There is no GitHub PR and no remote in this sandbox. Review the staged change and report findings; do not commit anything."
---

Review this before I commit, did I miss anything?
