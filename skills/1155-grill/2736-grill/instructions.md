# Grill — serial convergence, then trusted autonomy

Ambiguity resolved by guessing gets paid for twice: once building the wrong thing,
once redoing it. This skill resolves it by interview — but *serially*: one question
at a time, each answer locked before the next question is chosen, because the answer
to question 1 usually changes what question 2 should be. A batch questionnaire can't
adapt; a grill can. And the grill has a defined end: an explicit handoff into
autonomous execution, so clarity converts into speed instead of more meetings.

## Gotchas (read first)

- **One question per turn. No bundles.** "Also, while we're at it—" is a batch
  questionnaire wearing a trench coat. If two things genuinely must be decided
  together, that's one question about the tradeoff between them.
- **Locked means locked.** Once an answer is in the ledger, don't re-open it later
  in the session unless new information genuinely invalidates it — and then say so
  explicitly. Re-litigating settled decisions is how sessions stall.
- **Don't over-grill.** The stop condition is *"would any remaining unknown change
  what I do next?"* — not "do I know everything?" Three good questions that unblock
  the build beat ten thorough ones that delay it. A useful calibration many users
  give: "ask me three questions to make sure we're on the same page, then proceed."
- **The ledger lives in a file, not in the chat.** Context windows die; files don't.

## Step 1 — Map the gaps

Read the request/spec/situation and privately list the unknowns. Rank them by
**how much the answer changes what gets built** — architecture-forks first, then
scope boundaries, then quality bars, then preferences. Discard unknowns whose
answer wouldn't change your next action; those are curiosity, not gaps.

If destructive or irreversible operations are anywhere in scope, the **risk posture**
is automatically a top-ranked gap (see Step 2).

## Step 2 — Grill, one question at a time

For each question, in rank order:

- **Why it matters** — one sentence on what hinges on the answer ("this decides
  whether we need a server at all").
- **The question** — concrete, answerable, about *their* intent, not implementation
  trivia you can decide yourself.
- **A recommended default** — always offer one, with the tradeoff named. "I'd do X
  because Y; the cost is Z" lets a busy user answer with "yes" and keeps the grill fast.

After each answer:
- Reflect it back as a **locked decision** in one line ("Locked: subscription
  inference only — no API fees at runtime").
- Re-rank the remaining gaps — answers routinely dissolve or spawn questions.

For the risk-posture question when relevant, establish: what's irreversible here,
whether originals must be preserved (copy-not-move, non-destructive default), and
whether dry-runs are required before live changes.

## Step 3 — Detect convergence and hand off

When no remaining unknown would change the next action, stop grilling and make the
handoff *explicit*:

> **Aligned.** Proceeding autonomously within: [the locked constraints — scope,
> risk tier, quality bar, what's out of bounds]. I'll surface anything that forces
> a scope change; everything else I decide.

This sentence is the contract. From here, don't return with "should I…?" questions
that the ledger already answers — that's the trust the grill earned.

## Step 4 — Write the ledger

Save `decisions.md` (or append to the project's `.context/`/spec doc if one exists):

```markdown
# Decisions — <topic> — YYYY-MM-DD
## Locked
- <decision> — because <reason from the answer>
## Constraints / risk posture
- <e.g., non-destructive only; dry-run before live; no push, no remote>
## Explicitly out of scope
- <deferred item> — revisit when <trigger>
## Open (does not block)
- <known unknown that doesn't change the next action>
```

Any future session (or a different agent) reading this file inherits the alignment
without re-grilling — that's the point.

## Step 5 — Go

Begin executing immediately within the contract. The grill's output is momentum,
not minutes.
