# fresh-eyes — cold-start persona walkthrough

Validates docs, onboarding flows, installs, and apps the only trustworthy way:
**a stranger just did it.** Spawns a zero-context agent as a naive persona, has
it actually execute the journey, fixes what it hits, and respawns a *new*
stranger until the journey is clean.

## What it does

1. **Define the walk** — persona (default: motivated non-technical user on a
   fresh computer), entry point (the README/URL/command a real user starts
   from), and done state (what "it worked" means).
2. **Spawn a walker** — a fresh agent whose only knowledge is the persona brief
   and the entry point. It executes steps literally (runs the commands, clicks
   the flow), never rescues broken instructions with engineering judgment, and
   keeps a hiccup ledger: step / expected / actual / severity
   (BLOCKER · FRICTION · COSMETIC).
3. **Fix at root cause** — blockers and friction get fixed where *all* users
   pass, not caveat-patched ("if X fails, try Y" is a symptom patch — make X not
   fail).
4. **Respawn and repeat** — a brand-new walker each round, until a clean pass or
   5 rounds. Round 5 still dirty at the same step = design problem, escalated to
   the user.
5. **Report** — hiccup trajectory across rounds (e.g., 7 → 3 → 0), the final
   clean journey as evidence, root causes fixed, anything deferred.

## How to trigger

"fresh eyes", "walk through as a new user", "pretend you're a new member, clean
slate", "does the onboarding actually work", "take me through it the way a user
would", "see where you run into hiccups".

## The two rules that make it honest

- **Fresh spawn every round.** A walker that remembers round 1 can't get honestly
  confused in round 2 — and honest confusion is the product. Never reused, never
  messaged mid-round.
- **The orchestrator never walks its own work.** Builder context contaminates
  the read. The orchestrator fixes; the stranger walks.

## Files

- `SKILL.md` — the skill (includes the full walker brief template)
- `evals/evals.json` — draft test prompts for the skill-creator eval loop

Provenance: distilled from 60 days of real working sessions — ~12 walkthrough
loops observed, including 4–5 fix-respawn rounds in a single day on one
project's install docs.
