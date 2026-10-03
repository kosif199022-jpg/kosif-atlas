# wrap — session close-out ritual

Ends a working session so that nothing evaporates. One invocation produces the
**three products** every substantial session owes you — the work (committed),
the teaching material (exported + narrated), and the continuity state (handoff).

## What it does

1. **Land the work** — stage specific files, commit with a *why* message, merge
   finished branches/worktrees to main. Pushes only if a remote exists *and* you
   approve.
2. **Export the conversation** — to `chat_exports/`, via a project export script
   if available, manual transcript otherwise.
3. **Teaching narrative** — `YYYY-MM-DD-teaching-narrative-<slug>.md` with the
   arc: initial need → journey (what/why/how, including wrong turns) → result →
   application & benefit for the reader. Raw material for teaching content.
4. **Handoff** — `HANDOFF.md` (or the project's `.context/` checkout protocol if
   it has one): state, locked decisions, next steps, open questions, what NOT to
   do. Written so a zero-memory successor can resume cold.
5. **Memory harvest** — asks "did anything earn a permanent record?" Skill
   failures become gotchas on *that* skill; durable facts become memories;
   reusable assets get flagged as library-promotion candidates. "Nothing earned
   it" is a valid, common answer.
6. **Checklist report** — every step, every path, anything needing your decision.

## How to trigger

"wrap up", "close out this session", "export this conversation", "create a
handoff", "save context for the next chat" — or just signal the session is
ending ("I'll pick this up tomorrow"). Asking for one piece of the ritual offers
the whole thing.

## Guardrails

- Never pushes without a remote and permission (some repos are canonical local
  copies with no origin).
- COPY not MOVE when artifacts belong in a second location.
- The narrative is meaning, not transcript — local paths replaced with placeholders.

## Files

- `SKILL.md` — the skill
- `evals/evals.json` — draft test prompts for the skill-creator eval loop

Provenance: distilled from 60 days of real working sessions, where this ritual
was hand-typed ~25 times in slightly varied words.
