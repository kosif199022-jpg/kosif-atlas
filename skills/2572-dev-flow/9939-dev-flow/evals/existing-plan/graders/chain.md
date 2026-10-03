---
type: llm
---

The reply routes a task whose PRD and plan already exist.
PASS if it marks grill-me, to-prd and blueprint as SKIP because their artifacts already exist (or says dev-flow should hand straight to the code stage / the next skill), so the work resumes at code.
FAIL if it plans to re-run grill-me, to-prd or blueprint for this task.
