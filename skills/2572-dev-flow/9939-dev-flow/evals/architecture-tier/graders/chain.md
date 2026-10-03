---
type: llm
---

The reply is a routing plan for the task.
PASS if it classifies the task as the architecture tier AND the planned chain includes compass (for the architectural decision / ADR) before blueprint, alongside grill-me and to-prd, and still ends with code, review-pass and pr-craft.
FAIL if compass is skipped, or the task is classified as bug or plain feature tier.
