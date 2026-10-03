---
description: "Auth middleware change sits on a trust boundary: live check runs and security is called out."
tags: [review-pass, gating, needs-bash]
max_turns: 10
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Skill, Bash]
append_system_prompt: "Plan-only run: none of the sub-skills (run, code-review, implementation-review, security-audit) are installed in this sandbox, by design, and there is no GitHub PR. Scope the diff with git, then stop after printing the stage plan (each stage RUN or SKIP with its reason) and asking for confirmation. Do not attempt to invoke the sub-skills."
---

Give this diff a once-over before I commit, please.
