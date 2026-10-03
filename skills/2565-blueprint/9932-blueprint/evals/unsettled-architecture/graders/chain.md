---
type: llm
---

PASS if the reply stops before planning because the queue-vs-cron choice is an unsettled architectural decision, and points to /compass (or an ADR) to settle it first.
FAIL if it picks queue or cron itself inside a plan, or writes a plan file.
