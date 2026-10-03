# Fresh Eyes — cold-start persona walkthrough

"It should work" is not evidence. The only trustworthy signal that docs, an install
flow, or a user journey works is **a stranger just did it** — someone with none of
the builder's context, following only what's written. This skill manufactures that
stranger, repeatedly, until the journey is clean.

## Gotchas (read first)

- **Every round is a FRESH spawn.** Use the Agent tool to launch a new walker each
  round. Never reuse a walker via SendMessage — a walker that remembers round 1
  can't get honestly confused in round 2, and honest confusion is the entire product.
- **You (the orchestrator) never do the walkthrough yourself.** You built or fixed
  the thing; your context contaminates the read. You fix; the walker walks.
- **The walker executes, not reads.** Running the commands, opening the files,
  clicking the flow. A walker that reads the docs and *reasons about* whether they'd
  work has failed its brief.
- **Report in journey order, not severity order.** The deliverable is what a stranger
  hits, in the order they hit it — a cosmetic confusion at step 1 can matter more
  than a blocker at step 9 no one reaches.

## Step 1 — Define the walk

Confirm three things (infer from context where possible; ask only if genuinely unclear):

- **Persona**: who is walking? Default: *a motivated non-technical user on a fresh
  computer* — follows instructions literally, doesn't debug, gives up where
  instructions are wrong or missing. Adjust if the user names another audience.
- **Entry point**: the README, install doc, URL, or first command a real user would
  start from. The walker gets the entry point and nothing else.
- **Done state**: what a successful journey ends with (app running, first output
  produced, email sent). Without this, "worked" is undefined.

## Step 2 — Spawn the walker

Launch a fresh general-purpose agent with a brief structured like this:

```
You are <persona>. You have NEVER seen this project. Your only knowledge is
this brief and the entry point below. Do not explore the repo for answers —
a real user wouldn't.

Entry point: <path or URL>
Goal: <done state>

Follow the instructions LITERALLY, executing each step for real (run the
commands, open the files). When a step is ambiguous, do what a
non-expert would most likely do — do not use engineering judgment to
rescue a broken instruction. When truly blocked, stop that thread and
note it; don't debug around it.

Keep a hiccup ledger. For every friction point record:
- step: where in the journey
- expected: what the instructions implied would happen
- actual: what happened (verbatim errors)
- severity: BLOCKER (cannot proceed) / FRICTION (proceeded but confused,
  had to guess, or wasted time) / COSMETIC (noticed, didn't slow down)

Return: the ledger in journey order, whether you reached the goal, and
one paragraph on how the journey *felt* at this persona's skill level.
```

## Step 3 — Fix at root cause

Triage the ledger:

- **Blockers and friction get fixed** — at the root cause. If the walker hit a wrong
  path in one doc, grep for that path everywhere; if a step failed because of a
  missing prerequisite, add the prerequisite where *all* users pass, not a patch on
  the one doc this walker happened to read.
- **Cosmetic items**: fix the free ones, log the rest.
- **Don't fix by adding caveats.** "Note: if X fails, try Y" is a symptom patch.
  Make X not fail.

## Step 4 — Respawn and repeat

Launch a **new** fresh walker (same brief, updated artifacts). Repeat fix→respawn
until a walker reaches the done state with zero blockers and zero friction, or 5
rounds elapse. If round 5 still isn't clean, stop and report — repeated failure at
the same step usually means the design is wrong, not the wording, and that's the
user's call.

## Step 5 — Report

- Rounds run, and the hiccup count trajectory (e.g., 7 → 3 → 0).
- The final clean journey, step by step, as evidence.
- What was fixed each round (with root causes, not just edits).
- Anything logged-but-not-fixed, and the round-5 design flag if hit.
