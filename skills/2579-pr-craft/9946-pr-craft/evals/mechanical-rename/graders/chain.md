---
type: llm
---

The change renames one function across 31 files, a purely mechanical edit.
PASS if the reply keeps it as ONE PR and says why it is large (a mechanical rename with no reviewable seam), for example noting that the edits are identical and pointing reviewers at the pattern.
FAIL if it proposes splitting it into a stack or multiple PRs.
