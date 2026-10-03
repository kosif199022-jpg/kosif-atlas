---
type: llm
---

The reply is a sentinel report for a repo where almost no commits use Conventional Commit prefixes.
PASS if it flags that conventional-commit coverage is too low for the tier-1 signal to be trusted AND files no intent from tier 1.
FAIL if it files an intent, or does not mention the low coverage.
