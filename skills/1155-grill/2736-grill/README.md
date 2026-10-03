# grill — serial convergence, then trusted autonomy

Resolves ambiguity by interview — **one question at a time**, each answer locked
before the next question is chosen, then an explicit flip into autonomous
execution. A batch questionnaire can't adapt — the answer to question 1 usually
changes what question 2 should be. And the grill has a defined end, so clarity
converts into momentum instead of more meetings.

## What it does

1. **Map the gaps** — list the unknowns, rank by how much the answer changes
   what gets built (architecture forks → scope → quality bar → preferences).
   Unknowns that wouldn't change the next action are curiosity, not gaps —
   discarded. Anything irreversible in scope makes **risk posture** a
   top-ranked question automatically.
2. **Grill serially** — each turn: why this question matters (one sentence), the
   question itself, and a **recommended default** with its tradeoff named — so a
   busy answer can be "yes". Each answer is reflected back as a locked decision.
3. **Detect convergence** — stop when no remaining unknown would change the next
   action. Three questions that unblock the build beat ten thorough ones that
   delay it.
4. **Explicit handoff** — "Aligned. Proceeding autonomously within:
   [locked constraints, risk tier, out-of-bounds list]." That sentence is the
   contract: no returning with "should I…?" questions the ledger already answers.
5. **Write the ledger** — `decisions.md` (or the project's `.context/`/spec):
   Locked / Constraints & risk posture / Out of scope / Open-but-non-blocking.
   Any future session or agent inherits the alignment without re-grilling.
6. **Go** — execution starts immediately within the contract.

## How to trigger

"grill me", "ask me questions one at a time", "ask me about the critical gaps",
"let's get on the same page", "interview me", "help me decide" — or any sizable
build whose requirements arrived as a single fuzzy paragraph.

## Guardrails

- One question per turn, no bundles (a genuine joint decision is *one* question
  about the tradeoff).
- Locked means locked — settled decisions don't get re-litigated unless new
  information invalidates them, said explicitly.
- Risk posture captured before any destructive action is proposed:
  non-destructive default, copy-not-move, dry-run first.
- The ledger lives in a file, not the chat — context windows die; files don't.

## Files

- `SKILL.md` — the skill (includes the ledger template)
- `evals/evals.json` — draft test prompts for the skill-creator eval loop

Provenance: distilled from 60 days of real working sessions — a recurring
"ask me one at a time… then proceed" protocol, followed by ~30 trust-handoff
phrases ("you decide", "do the right thing") once convergence was reached.
