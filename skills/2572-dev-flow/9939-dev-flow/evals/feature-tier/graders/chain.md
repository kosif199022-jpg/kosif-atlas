---
type: llm
---

The reply is a routing plan for the task.
PASS if it classifies the task as the feature tier AND plans to run grill-me, to-prd and blueprint before code, then review-pass, then pr-craft, AND marks compass as SKIP (or does not run it) because convention already dictates the shape.
FAIL if it classifies the task as bug tier, skips blueprint, or runs compass without naming an unsettled, hard-to-reverse architectural decision.
