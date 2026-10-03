# Process: {name}

The rules for this dashboard. The agent reads this first and edits it when you change the
process by talking. Keep it short and concrete; replace the italic hints.

## Stages (one tab each, in this order)

*e.g. `pipeline` → `brief` → `draft` → `review` → `publish`. Say what each tab holds
(widget ids and types) and what happens when a stage finishes.*

## Vocabulary

*What the user's words mean here. e.g. "advance": finish the active stage's work and move
to the next; "status": answer from the `stages` list.*

## Conventions

*Widget ids, where things go, what gets stamped or kept in sync. Mark per-run widgets
`"ephemeral": true` so skillify drops them.*

## Never

*What the agent must not do without an explicit yes. e.g. never overwrite the brief;
never publish until the user says "publish".*
