# Connector Bridge — resolving declared needs against the live harness

A folder's `.aai/connectors.md` names *what it needs to reach* — never a
server name, tool binding, or credential (SPEC.md §8's boundary rule: the
folder holds capability-knowledge, the harness holds capability-execution).
This skill is the bridge: it reads those declarations and matches them
against whatever the current session's harness actually offers. The LLM
itself is the adapter — there is no lookup table to maintain, because the
match is a judgment call every time the harness (or its tool set) changes.

## Gotchas (read first)

- **Never write into `connectors.md`.** It's the folder's owned declaration —
  stable across harnesses. Bindings you resolve are disposable and belong in
  `.aai/memory/`, never in the declaration file itself.
- **No match is not an error.** Every connector declaration has a required
  `without-it:` line for exactly this case — apply it, don't block or guess
  at a credential.
- **Re-resolve, don't trust a stale cache blindly.** A cached binding in
  `.aai/memory/` is a hint from a prior session, not a guarantee this
  session's harness still offers the same tool. Confirm the tool is actually
  available before relying on the cache.

## Procedure

1. **Read `.aai/connectors.md`** in the target folder. If it doesn't exist,
   there's nothing to resolve — stop.
2. **Enumerate what the current harness actually offers**: registered MCP
   tools, available CLIs on `$PATH`, or nothing. This is session-local
   information, not something declared anywhere in the folder.
3. **For each connector declaration**, match its `name`/`purpose`/`needs`
   against the enumerated offerings. This is inference, not string matching —
   a connector declaring "calendar access" might resolve to a Google
   Calendar MCP tool, an `icalBuddy` CLI, or nothing, depending on the
   session.
4. **On a match**, use the resolved tool for the task, and cache the
   binding as one line in `.aai/memory/connector-bindings.md` (create it if
   absent): `<connector-name>: <what resolved it>, confirmed <date>`. This
   cache is disposable — regenerate it any time it's missing or wrong;
   never promote it into `connectors.md`.
5. **On no match**, apply the connector's `without-it:` line and continue
   the task in degraded mode. Tell the user what's missing and what setup
   (from the `needs:` field, if present) would resolve it — don't fail
   silently and don't ask for credentials directly.

## Outputs

- The task proceeds using whatever tool resolved (or in degraded mode).
- `.aai/memory/connector-bindings.md` — updated cache of successful
  resolutions, one line per connector.
