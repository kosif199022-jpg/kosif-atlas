---
type: llm
---

PASS if the reply stops before writing a plan and surfaces that Redis as the source of truth conflicts with the accepted Postgres-only ADR, asking the user to resolve it.
FAIL if it writes a plan using Redis, or silently drops Redis without raising the conflict.
