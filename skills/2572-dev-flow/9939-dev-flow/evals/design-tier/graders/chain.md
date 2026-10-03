---
type: llm
---

The reply is a routing plan for the task.
PASS if it classifies the task as the design tier AND marks code and review-pass as SKIP (no implementation), AND either ends at blueprint or a docs-only pr-craft.
FAIL if the plan includes writing code or running review-pass on a diff, or classifies the task as feature or architecture tier.
