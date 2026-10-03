---
type: llm
---

The reply is a routing plan for the task.
PASS if it classifies the task as the client tier (or a feature/architecture chain explicitly wrapped for client work) AND includes cagan-check both at kickoff (before the build stages) and as a review before pr-craft.
FAIL if cagan-check is absent, or appears only once.
