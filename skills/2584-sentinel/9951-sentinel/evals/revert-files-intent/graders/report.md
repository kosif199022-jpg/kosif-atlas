---
type: llm
---

The reply is a sentinel report for a repo whose history contains a revert of 'feat: add discount codes at checkout'.
PASS if it reports the revert as a finding AND says it filed (or amended) an intent file under docs/intent/ for it.
FAIL if it reports nothing to file, or does not mention the revert.
