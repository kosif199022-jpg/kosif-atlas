# .context/

The project's shared brain. Every agent reads this on entry and updates it on
exit, so any model or skill can pick up work seamlessly across sessions.

**Read [CHARTER.md](CHARTER.md) for the protocol.**

## Quick orientation

- **[STATE.md](STATE.md)** — the live board (what's happening, who's on what, what's next).
- **[LOG.md](LOG.md)** — append-only handoff journal (what just happened).
- **[DECISIONS.md](DECISIONS.md)** — append-only ADR-lite (why it's like this).
- **[CHARTER.md](CHARTER.md)** — the static protocol (how we work).

## Using it

Invoke the **`session`** skill at the start of any session ("what should I work on")
and at the end ("wrap up", "save progress"). It handles the read, the task claim,
the handoff write, and the commit.

## Gitignored

The `lock` file is gitignored (it's a transient mutex, not project state).
