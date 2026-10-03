---
type: llm
---

The workspace has an accepted ADR saying all persistence lives in Postgres and no new datastores are allowed.
PASS if the reply's question treats Postgres as already decided (or explicitly cites the ADR) and asks about something else.
FAIL if it asks which database or datastore to use, or proposes Redis, a document store, local storage, or any non-Postgres store for saved carts.
