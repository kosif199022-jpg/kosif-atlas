# Trigger Runner — running a folder's standing intentions

A folder's `.aai/triggers.md` names standing intentions ("weekly: re-sync
`.ailib/`") — never how they run, only what and when (SPEC.md §8). This
skill is the due-check: it compares declarations to last-run stamps and runs
whatever is due. The declaration never changes across environments; only how
promptly it fires does (the three execution tiers below).

## Gotchas (read first)

- **Tier 1 is the default, always-safe behavior**: a session-start due-check.
  Don't assume a harness has cron/hooks — check before offering tier 2.
- **Stamps live in `.aai/memory/`, never in `triggers.md`.** The declaration
  file stays a clean statement of intent; run history is disposable state.
- **Tier-2 artifacts are derived, not authoritative.** If you promote a
  trigger to a native hook/cron entry, mark the generated artifact as
  derived/regenerable from the declaration in a comment. Never move or
  delete the original line in `triggers.md` — it's still the source of truth
  if the harness changes again.
- **A missing stamp means "never run," not "not due."** Treat absence as due
  immediately (subject to the cadence — e.g. don't run a "weekly" trigger
  twice in one session just because the stamp is missing after a prior run
  wrote it under a slightly different key; check the actual last-run date).

## Procedure

1. **Read `.aai/triggers.md`** in the target folder. If it doesn't exist,
   there's nothing to check — stop.
2. **Read last-run stamps** from `.aai/memory/trigger-stamps.md` (create it
   if absent — an empty file means every declaration is due).
3. **For each declaration**, compare its cadence/event to the matching
   stamp: due if no stamp exists, or if the cadence has elapsed (e.g. a
   "weekly" trigger last stamped 8+ days ago), or if the declared event is
   the one currently happening (e.g. "on session start"). **Inbound event
   triggers** ("on message via …") are checked by inspecting the folder's
   `inbox/` for unprocessed material, not by stamps — the arrival itself is
   the evidence; stamp only what was processed.
4. **Run what's due**, one at a time. Each declaration is one line of intent
   — interpret it and execute the implied task using whatever tools the
   session has (this may itself invoke `connector-bridge` if the task needs
   an external system).
5. **Write a new stamp** for each trigger just run:
   `<trigger line>: last run <date>` in `.aai/memory/trigger-stamps.md`.
6. **On a harness with native cron/hooks available**, after the due-check,
   offer the user tier-2 promotion: generate the harness's own hook/cron
   artifact from the declaration, clearly marked derived and regenerable.
   Never do this unprompted, and never remove the declaration from
   `triggers.md` when you do.

## Outputs

- Due tasks executed for this session.
- `.aai/memory/trigger-stamps.md` — updated last-run stamps.
- Optionally, a tier-2 harness artifact (hooks/cron config), only when the
  user accepts the offer, marked derived from `triggers.md`.
