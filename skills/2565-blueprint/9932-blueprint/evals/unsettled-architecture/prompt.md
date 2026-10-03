---
description: "An unsettled, hard-to-reverse architecture choice routes to compass, not a plan."
tags: [blueprint, guard]
max_turns: 12
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Skill, Write]
---

Plan the build for abandoned-cart reminder emails. Slug: cart-reminders. Scope is settled: email shoppers 24h after they abandon a cart, once. We have not decided whether this runs on a job queue with per-cart delayed jobs or a nightly cron sweep, and nothing in the repo decides it.
