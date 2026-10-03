---
name: are-we-cooked
description: Are we cooked? Finds what a change could break outside its diff before it ships, and proves the one fact it is safe because of by running real code instead of just writing it up. Use only when the user invokes /are-we-cooked by name, e.g. "/are-we-cooked this diff" or "/are-we-cooked PR 42".
disable-model-invocation: true
---

# /are-we-cooked [diff, PR, or change]

Find what a change breaks somewhere else, before it ships. Listing callers is not the job; anyone can grep those in a second. The job is the breakage grep won't show you.

Don't edit the code under review, commit or push. You may write and run a throwaway check script or test (put it in a scratch folder, or tell the user where it is).

Companion to `/lore` (what the code does) and `/receipts` (why it's shaped that way).

## Don't trust your own writeup

A writeup that sounds right is worthless on its own: it reads as convincing whether or not it's true. Find the one or two facts the change's safety depends on and prove them by running code.

For each such fact, get it as far down this ladder as is cheap, and say where it stopped:

1. You said so. Worthless alone.
2. You pointed at the line: a real `file:line`, or the library's own source.
3. You showed the bad case can't happen, walking the failure step by step.
4. You ran it: a script or test calling the real code that fails loudly if you're wrong.
5. You reproduced it in the running app.

Step 4 is usually one small script that imports the same library or module the app uses and calls the exact function you're worried about.

## Steps

1. **Read the change.** No target given: use the uncommitted diff, else the current branch against the default branch. Note what it adds, changes and deletes, and what it now does differently, including what the diff doesn't spell out. Pull the PR and its commits if there is one.
2. **Find the one fact it's safe because of.** Most risky-looking changes are safe because of a single fact ("this only drops entries that are already dead"). If it holds, most risks clear at once. Spend your time here.
3. **Look where grep stops.** The source of libraries you call (and their pinned version or local patch). When things run: async ordering, retries, teardown, cron timing. What a symbol search misses: JSON an API returns, a DB column, a file or wire format, another service or language reading the same data, config and feature flags, code three hops downstream.
4. **Be honest about each risk.** A real chance and a real cost. Keep confirmed risks separate from ones you checked and cleared. Cite real `file:line`. A search that finds nothing is still an answer. Never invent a caller or an API.
5. **Prove the one fact.** Write the script or test, run it, paste what happened.
6. **Big or wide change?** Spawn 2 or 3 general-purpose sub agents in one message, on the `sonnet` model, each hunting one angle (data and formats, timing and lifecycle, callers and config), then merge what they find.

## Output

- **What it does:** the change, including the part that isn't obvious.
- **Verdict:** cooked (it breaks something), probably fine, or fine, in one line.
- **The one fact it's safe because of:** stated, which ladder step it reached, and the proof. If unproven, say "unproven".
- **Risks:** how it breaks, `file:line`, how likely, how bad, how to check. Paste proof for the ones that matter.
- **Cleared:** what you checked and why it's fine.
- **Before you merge:** the cheapest test or repro that would catch the real bug, including the script you wrote and where it is.

Strip anything private before this goes anywhere public. Never put an em dash (the long dash) in the output. Use a comma, colon, full stop or brackets instead.

Adapted from the `blast-radius` skill in [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan (MIT, see `LICENSE-pstack`).
