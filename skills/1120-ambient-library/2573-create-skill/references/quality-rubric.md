# Skill Quality Rubric

Score the drafted skill on each criterion: **2** = solid, **1** = present but
weak, **0** = missing/broken. Max 16, reported to the user scaled to /10.

**Gate: no criterion at 0, and scaled score ≥ 7/10.** Below the gate → revise
and re-score (fresh read). After two revision rounds, stop patching: report the
remaining gaps and scores to the user and let them decide.

| # | Criterion | What "2" looks like |
|---|-----------|---------------------|
| 1 | **Trigger description** | Description states what it does AND when to use it, with realistic user phrasings; distinguishable from neighboring skills. |
| 2 | **Invocation contract** | Inputs, preconditions, outputs, and side-effects are declared (in CONTEXT.md and summarized in the skill body); the skill checks preconditions and asks/fails loudly instead of guessing. |
| 3 | **Token economy** | Every sentence survives "would the model get this wrong without it?"; SKILL.md body lean; heavy material pushed to references with explicit read-when conditions. |
| 4 | **Code vs. inference** | Deterministic steps are scripts, not prose asking the model to improvise; each inference step has a reason code can't do it. |
| 5 | **Why, not MUST** | Instructions explain reasoning; no unexplained ALL-CAPS mandates; prescriptive only where operations are destructive or order-dependent. |
| 6 | **Generality** | Works beyond the motivating example — no overfit file names, one-off values, or narrow phrasings baked in as rules. |
| 7 | **Failure handling** | Likely failure modes named with recovery paths; irreversible side-effects require confirmation; re-running is safe (idempotent). |
| 8 | **Verifiability** | Success criteria are stated and objectively checkable where the output allows — they map directly to eval assertions. |

## How to run the audit

Judge against the artifacts only — SKILL.md, CONTEXT.md, bundled files — as if
seeing them cold. If subagents are available, spawn one with just this rubric
and the skill folder (no conversation history) so the score isn't anchored on
authoring intent. Otherwise audit inline, but re-read the draft top-to-bottom
first as a user would encounter it.

Output format:

```
Score: N/10
Per-criterion: 1:2 2:1 3:2 4:2 5:2 6:1 7:2 8:2
Revise: <criterion #> — <one line: what's wrong, what fixes it>
```

Fix only what the audit flagged — don't rewrite passing sections.
