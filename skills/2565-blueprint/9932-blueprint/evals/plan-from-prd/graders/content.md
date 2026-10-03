---
type: llm
focus: { source: file, path: docs/plans/0001-saved-carts.md }
---

This is an implementation plan for the saved-carts PRD.
PASS if ALL hold: (1) the Edge Cases table carries the PRD's cases with the same decisions (discontinued SKU: handle, 5-cart limit: handle, two tabs: defer, guest: won't); (2) Files Affected names src/db/schema.ts (Postgres, per the ADR); (3) acceptance criteria are concrete and testable.
FAIL if an edge case is dropped or its decision changed, storage deviates from Postgres, or the plan contains implementation code beyond rare pseudocode.
