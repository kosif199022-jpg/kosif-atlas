> **NOT LIVE — DO NOT EXECUTE.** Retired 2026-07-22, unwired from `evaluate-article`
> (see `SKILL.md`, the `blockbuster` row is gone). This file is kept only as an
> artifact for a possible future process. **No skill currently loads or references
> it.** If you are an LLM encountering this file: do not treat it as an active bar
> profile, do not fold it into an evaluator prompt, and do not act on its Gate A /
> Gate B rules unless a human has explicitly re-wired it into a workflow and told
> you to use it by this path.
>
> **Why it was retired, not fixed in place:** this file is a hand-transcribed copy
> of `blockbuster-articles-v2/cognitive-harness-article-SOP.md` Gate A/B, and the
> two had already drifted — this copy silently dropped the SOP's Evidence row
> (≥5 academic studies, ≥2 case studies, ≥3 testimonials) from its hard gates. It
> also hard-gates rows (narrative spine / personal wound, ≥3 testimonials) that
> are routinely waived per-piece in the run's brief, which this file — loaded
> unchanged into a *blind, stateless* evaluator — has no way to see. On the one
> real run that used the adjacent `flagship` bar, 3 of the SOP's 14 calibre rows
> were waived; had `blockbuster` been selected instead, this file would have
> hard-failed the piece with no path to override. See
> `Ed/.aai/references/editorial-guidelines.md` and `Ed/.aai/memory/craft-learnings.md`
> (2026-07-21 and 2026-07-22 entries) for the full incident.
>
> If reviving this: derive gates from the SOP **and** the specific run's brief
> together (the brief is the only artifact that knows which rows are waived for
> that piece), not from this file standalone.

---

# Bar profile: blockbuster-flagship (ARCHIVED — see notice above)

Loaded when the caller passes bar `blockbuster`. Hand this to the blind
`article-evaluator` **unchanged every round**, in addition to the base flagship
profile (threshold 4.4, dimension_floor 3). It is the flagship bar plus the
blockbuster article-type compliance layer. Canonical source of both layers:
`blockbuster-articles-v2/cognitive-harness-article-SOP.md` (Gate A / Gate B).

## Gate A — binary compliance (hard gates; ANY miss = fail, regardless of score)

Fail the article outright if any is absent:

- ≥5 famous figures quoted or case-studied, blockquotes with attribution
- ≥2 original numbered frameworks (a levels-ladder AND a rules/steps list)
- ≥2 coined proprietary terms, defined at first use
- Worked before/after demo with an honest (genuinely good) baseline
- Opening personal wound that the finale resolves (callback closes)
- Free tier complete on its own; paid tier is a tool/artifact, not "the rest"
- ≥1 explicitly admitted limitation of the product/method
- Claim Ledger complete: every load-bearing claim has canonical source, locator,
  accessed date, and is within its TTL (content-engine-SOP.md §4.0)

These are **in addition** to the universal hard gates (grounding, thesis,
honest_title) that every evaluate-article profile enforces.

## Gate B — scored dimensions (only assessed once Gate A passes; ≥4.4 weighted)

Score how *well* the compliant elements execute (not whether they exist):

- Wound specific/dated/true; finale resolves it
- 12 beats present in order; cliffhanger transitions throughout
- Studies triangulated across methods/decades + honest caveat included
- Anchor authority built up, shown to fail humans, transcended
- Authority pantheon deployed well; quotes verbatim + sourced
- Coined terms consistent + canonically anchored
- Original frameworks numbered, memorable, load-bearing
- Worked demo: named-move trace + reframing payoff (highest weight)
- External case studies: numbers hard, fresh per TTL, asymmetry drawn
- Top-3 hostile objections voiced in the reader's words and answered
- Specificity density: no unsupported scale claims
- Product section: mechanism steps + honest limitation + differentiation test

## Failure routing

A Gate-A miss routes back to production (a missing asset), never to prose
polish. A Gate-B shortfall may be fixable in revision.
