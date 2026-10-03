# Claude Code adapter

Adds zero-cost delivery of dashboard events using Claude Code hooks. The core
drain/listen loop still works without this; the adapter removes the polling turns.

## What it does

- **`UserPromptSubmit`** — before Claude reads the user's message, `hook.py` drains the
  inbox and attaches any events as additional context. Every chat message arrives with
  the dashboard actions that preceded it.
- **`Stop`** — when Claude is about to end its turn, `hook.py` drains again. If events
  are pending it blocks the stop and hands them to Claude as the reason, so the turn
  continues with the events in hand. No `wait` loop needed; Claude just ends its turn
  and gets woken when the user clicks something.

Both are no-ops when the inbox is empty (exit 0, no output), so the hooks are safe to
leave installed for every session.

## Install

Merge `settings.snippet.json` into your project `.claude/settings.json` (or user
`~/.claude/settings.json`), replacing `<APP>` with the absolute path to the skill-app
folder. Multiple skill-apps can register their own hook lines; each drains only its own
runtime.

Optionally raise the Bash tool timeout so `bridge.py wait` can block longer between
re-issues (used only when hooks aren't installed):

```json
{ "env": { "BASH_DEFAULT_TIMEOUT_MS": "600000" } }
```

## Notes

- Hook stdin is JSON with the session info; `hook.py` ignores it except for
  `hook_event_name`.
- The Stop hook blocks with `{"decision": "block", "reason": "..."}`; the reason is the
  event list. Because the hook drains (moves events to `processed.jsonl`), the next
  Stop finds nothing and lets the turn end — no loop.
- If your Claude Code version changes hook output formats, `hook.py` is 40 lines;
  adjust there.
