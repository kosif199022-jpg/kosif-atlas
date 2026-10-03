---
description: "Reconciles the staged diff against the plan's Edge Cases ledger and flags the handle-but-missing case and the absent tests."
tags: [implementation-review, git, expensive, needs-bash]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash, Agent]
append_system_prompt: "There is no GitHub PR and no remote in this sandbox. Review the staged change and report findings; do not commit anything."
---

Am I done? Check the staged change against the plan before I commit.
