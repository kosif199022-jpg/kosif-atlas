---
type: llm
focus: { source: file, path: docs/prds/0001-saved-carts.md }
---

This is a PRD synthesised from docs/intent/0001-saved-carts.md, with an ADR mandating Postgres.
PASS if ALL hold: (1) its Sources cite docs/intent/0001-saved-carts.md; (2) a Glossary uses "saved cart", "active cart" and "restore" with the intent's meanings; (3) the 5-cart limit and repricing on restore appear as decisions; (4) storage is Postgres, not another datastore.
FAIL if any of these is missing or contradicted.
