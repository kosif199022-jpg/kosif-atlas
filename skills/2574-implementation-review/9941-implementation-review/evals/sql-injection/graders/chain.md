---
type: llm
---

The staged file src/api/search.ts builds a SQL string by concatenating req.query.q.
PASS if the review flags SQL injection in src/api/search.ts as a blocking finding AND recommends a parameterized query (or equivalent) as the fix.
FAIL if SQL injection is not reported, or is reported only as a minor style note.
