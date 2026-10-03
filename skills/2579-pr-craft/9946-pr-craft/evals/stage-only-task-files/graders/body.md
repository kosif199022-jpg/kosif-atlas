---
type: llm
---

The reply ends with the PR title and body the agent would submit for a NaN-guard fix in src/cart/total.ts.
PASS if ALL hold: (1) the title is a Conventional Commit starting with "fix"; (2) the body has at least Problem and Fix sections, and a Test section with steps a reviewer can run; (3) it references task 4821; (4) it does not claim the lockfile or scratch notes are part of the change.
FAIL if any of these is missing.
