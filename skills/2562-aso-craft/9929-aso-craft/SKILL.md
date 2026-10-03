---
name: aso-craft
description: >-
  App Store Optimization for iOS and Android from one per-locale Markdown source.
  Probes keyword candidates against live App Store data for competitor density,
  incumbent difficulty and search intent (free, no API key), assigns each surviving
  term to the surface that actually indexes it per store, then lints the listing:
  hard character limits, target-keyword coverage gaps, keyword budget spent twice,
  keyword stuffing, and URLs or support emails broken by translation. Use when the
  user wants to do ASO, research or validate app store keywords, pick an app name /
  subtitle / short description / keyword field, check store metadata character
  limits, localize a store listing for search, audit why an app is not ranking,
  prepare an App Store or Play submission, or runs /aso-craft.
---

# aso-craft

ASO is three questions in order: **what do people search**, **which surface indexes
it**, and **did the listing actually land it**. This skill answers all three with
scripts, because all three are checkable and none survive being eyeballed across
locales. One Markdown file per locale is the source of truth for both stores.

## Quick start

```bash
# 1. RESEARCH — probe candidates against live store data (free, no key)
python3 scripts/keyword_probe.py "chord pad" "chord progression" --competitors
python3 scripts/keyword_probe.py --from listing/pt-BR.md --country br --lang pt_br

# 2. LINT — limits, coverage gaps, wasted budget, broken atoms
python3 scripts/check_listing.py listing/ --store both --atom '.sf2'
```

Both scripts are stdlib-only and carry `--selftest`. The linter exits nonzero on FAIL,
so it works as a pre-submission gate. Field format: [TEMPLATE.md](TEMPLATE.md).

## Which surface indexes what

| Surface | App Store | Google Play |
|---|---|---|
| name / title | indexed, position-weighted | indexed, position-weighted |
| subtitle | indexed | does not exist |
| short description | does not exist | indexed |
| keyword field | indexed, hidden, 100 chars | **does not exist** |
| description | **never indexed** | **indexed** |

This is a strategy inversion, not a different constant. **Apple** indexes three
surfaces as one pool, so a phrase spent twice is budget burnt — put each concept in
exactly one place. **Play** indexes the description body, so concepts must appear there
in natural prose, and repeating across title and body is normal. What Play punishes is
a literal `Keywords: a, b, c` list, which is spam under its store listing policy and
buys nothing on Apple either.

The linter checks coverage against a `## Target keywords` section, per store: a term on
no indexed surface cannot rank, and a term on three Apple surfaces was paid for twice.

## Judging a keyword

`keyword_probe.py` measures three things off live results. None of them is volume —
Apple's autosuggest returns nothing now and Play has no free API, so **demand is the
one thing this cannot see**. Narrow the list here for free, then validate volume with a
real tool (AppFigures, Sensor Tower, AppTweak, Astro) before betting an app *name*.

- **Intent** — genre concentration of the top 20. Scattered genres mean searchers want
  other categories, however much traffic the term has. `tracker` returns Health,
  Productivity and Lifestyle apps: high traffic, worthless to a calorie app.
- **Difficulty** — median rating count of the top 10, an authority proxy. A new listing
  does not out-rank 100k-review incumbents. Low is winnable now, moderate is a bet on
  the next months, high and entrenched are for later.
- **Density** — share of top titles carrying the term. High means developers converge
  on it: evidence of demand *and* of a fight you lose without authority. Zero is
  ambiguous — a real gap and a dead term look identical from here.

Then assign: strongest term leads the **name**, second leads the **subtitle** (Apple) /
**short description** (Play), the rest fill Apple's keyword field and appear naturally
in Play's description. Keyword-led beats brand-led; leading with the brand is a vanity
trade against installs, since nobody searches your brand until you are already known.

## Research per market, never per translation

Germans do not search a translation of your English phrase, they search what Germans
type. Re-probe on each storefront with `--country` / `--lang` before localizing: a term
returning piano-tutor apps in Brazil is not the Portuguese word for your category,
whatever the dictionary says. With no data for a locale, translate the *concept* and
report that locale as unverified rather than researched.

## Rules that survive every project

- **Limits are hard** — both stores reject the write, neither truncates. A source name
  over ~22 chars is a translation risk: de, fi, tr, hu, ta and ml blow limits English
  fits easily.
- **Localize every locale in one pass.** Never pause for per-language review unless
  asked; reviewing one language proves nothing about the other five. The linter is the
  review.
- **Adapt keyword fields, never invent them.** Same concepts per locale, in words
  locals search. No geo padding, no locale-invented extras.
- **Never localize** URLs, support emails, platform product names, file extensions,
  version numbers, or the brand as the author styles it.
- **Keep out of name and subtitle:** platform trademarks (Apple rejects them) and any
  price claim. Both are fine elsewhere — trademarks in Apple's keyword field, a
  FREE-vs-PRO breakdown in the description body.
- **A 2xx is not verification.** Read the field back per locale. On Play a successful
  mutate is scoped to an uncommitted edit and means nothing until commit.

Field semantics, locale codes, write models, asset specs, upload tooling and the honest
limits of each proxy: [REFERENCE.md](REFERENCE.md).
