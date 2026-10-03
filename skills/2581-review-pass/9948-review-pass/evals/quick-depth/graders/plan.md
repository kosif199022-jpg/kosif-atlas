---
type: llm
---

The reply is a review plan at quick depth for a one-file bug fix in src/cart.ts.
PASS if it runs only the live-run check (/run) and code-review, AND marks implementation-review as SKIP because of quick depth, AND marks security-audit as SKIP.
FAIL if it plans to run implementation-review or security-audit.
