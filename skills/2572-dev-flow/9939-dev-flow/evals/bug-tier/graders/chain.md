---
type: llm
---

The reply is a routing plan for the task.
PASS if it classifies the task as the bug tier AND the stages it will run are code, then review-pass (quick depth), then pr-craft, with grill-me, to-prd and blueprint marked SKIP (or not run).
FAIL if it plans to run grill-me, to-prd, compass or blueprint, or if it classifies the task as feature, architecture or design.
