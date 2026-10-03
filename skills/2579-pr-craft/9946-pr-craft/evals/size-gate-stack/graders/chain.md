---
type: llm
---

The working tree holds about 900 new lines in three dependent layers: a DB migration, API handlers, and a UI panel.
PASS if the reply reports the change size (roughly 900 lines, over the 800-line gate) AND proposes a stacked PR split by layer (schema/migration, then API, then UI) instead of shipping one PR without a stated reason.
FAIL if it opens or drafts a single PR without flagging the size, or splits by something other than the dependent layers.
