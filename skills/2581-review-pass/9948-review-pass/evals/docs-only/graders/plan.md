---
type: llm
---

The reply is a review plan for a diff that only touches README.md.
PASS if it marks the live-run check (/run) as SKIP because the diff has no runtime surface, AND marks the standalone security-audit as SKIP.
FAIL if it plans to run /run or a standalone security-audit on this diff.
