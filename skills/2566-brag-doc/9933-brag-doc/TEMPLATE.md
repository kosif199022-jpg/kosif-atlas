# Brag Doc — Templates

## Monthly entry (the recurring unit — Lucas Faria's 4 fields)

Copy this block to the top of the target doc on the 1st of each month.

```md
## <Month Year>

**Shipped + impact**
↳ <what shipped> — <outcome: who uses it / metric / $ saved / time saved>. Mark guesses [ESTIMADO].
↳ ...

**Challenges & how I tackled them**
↳ <challenge> → <what I did about it>

**Would be much better if…**
↳ <what's blocking me / what would unblock me / what I'd change>

**Focus next month**
↳ <1–3 priorities>
```

Impact-line rule (Julia Evans): a line is done when it survives *"so what?"*.
- Task (weak): "Refactored the checkout service."
- Impact (strong): "Refactored checkout, cutting p95 latency 40% — now handles Black Friday load without the manual scale-up." Fuzzy work → **goal → actions → observable effect**.

## Rollup (for `compile` → promo packet / self-review — Julia's categories)

Assemble from several monthly entries; don't maintain by hand.

```md
# Rollup — <period>

### Goals (this period / next)
### Projects & impact          # the headline outcomes, quantified
### Collaboration & mentorship # reviews, onboarding, pairing, talks others built on
### Design & documentation     # design docs, RFCs, docs written and why
### Company building           # interviewing, process, recruiting beyond the day job
### What I learned             # tech, tools, domain, soft skills
### Outside of work            # OSS, blog posts, talks, shipped side apps
```

Not every category fires every period — omit empty ones. "Make it sound exactly as good as it is."
