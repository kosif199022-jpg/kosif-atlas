---
type: llm
---

The reply is a review plan for a diff that changes an admin authorization check in auth middleware.
PASS if it identifies the change as touching a trust boundary (auth/authz) AND marks security-audit as RUN (standalone), AND marks the live-run check (/run) and implementation-review as RUN.
FAIL if it treats the change as low-risk, skips security entirely, or does not mention the authorization change.
