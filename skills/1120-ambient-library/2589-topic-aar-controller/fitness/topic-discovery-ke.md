---
type: fitness-function
id: FF-topic-discovery-ke
name: "Topic Discovery for Knowledge Entrepreneurs"
domain: "Topic theses and article angles for AI-first or AI-augmented knowledge entrepreneurs"
created: 2026-04-16
last_evolved: 2026-04-16
selection_pressure: "moderate"
tags:
  - fitness-function
  - topic-discovery
  - knowledge-entrepreneurship
aliases:
  - "AAR topic fitness"
  - "KE topic scoring rubric"
---

# Topic Discovery for Knowledge Entrepreneurs

## Domain

Evaluates candidate topic theses, article angles, and discovery findings produced by the Topic AAR swarm. Target audience: solopreneurs, consultants, coaches, course creators, and small expert businesses who want to become AI-first or deeply AI-augmented.

Use this fitness function when scoring AAR worker candidate findings. Do **not** use it for session captures, client recommendations, or business-level decisions (those have their own fitness functions).

## Criteria

### Novel Insight
- **Weight:** 5
- **Measures:** Whether the topic says something not commonly discussed — reframes a problem, exposes a hidden mechanism, or names an emergent pattern the audience hasn't articulated yet.
- **Scoring rubric:**
  - 10 = reframes how a knowledge entrepreneur thinks about a real problem
  - 7 = a sharper or more specific take on a familiar topic
  - 4 = a slight variation on mainstream framing
  - 1 = rehashes LinkedIn consensus / generic AI thinkpiece territory

### Practical Leverage
- **Weight:** 4
- **Measures:** Whether acting on this topic creates disproportionate returns for the knowledge entrepreneur — where one implementation creates ongoing value.
- **Scoring rubric:**
  - 10 = one implementation creates compounding, ongoing value (e.g., a durable system, a moat, an IP asset)
  - 7 = produces meaningful upside with moderate effort
  - 4 = requires ongoing effort for proportional return
  - 1 = constant effort for marginal gain

### Audience Fit
- **Weight:** 4
- **Measures:** Whether the topic addresses a problem AI-first knowledge entrepreneurs are *actively* wrestling with — not what they say they want, but what they reveal they need.
- **Scoring rubric:**
  - 10 = hits an active pain point the audience is already trying to solve
  - 7 = addresses an adjacent concern they'd recognize as relevant
  - 4 = theoretically interesting but not urgent
  - 1 = interesting to the writer, irrelevant to the reader

### Explainability
- **Weight:** 3
- **Measures:** Whether the topic can be made concrete and actionable in a single article, workshop, or framework — not requiring a book or a prerequisite education.
- **Scoring rubric:**
  - 10 = demonstrated with a specific example the reader can try within 48 hours
  - 7 = clearly explained with one concrete anchor
  - 4 = requires setup explanation before the payoff
  - 1 = requires a book or multi-article series to convey

## Elimination Filters

**Important:** These filters are **operator-applied during review of the SR-\* artifact**, not worker-applied. Workers lack reliable web access and cannot accurately judge saturation. The operator checks these after the swarm completes.

- **Already saturated:** Topic is extensively covered in existing knowledge-entrepreneur content (7+ first-page search results on the exact framing, or appears in 3+ recent newsletters the operator tracks).
- **Requires prediction:** Topic depends on predicting specific future AI capabilities rather than working with what exists today.
- **Generic productivity:** Topic is essentially "use AI to save time" without a novel mechanism or specific leverage point.

## Selection Pressure

**Mode:** moderate
- Keep top 30% of candidates after scoring
- Reflects that discovery should cast a wider net than high-stakes decisions; we want surface area, but with a credible threshold

## Weighted Total

Maximum possible score: (5 × 10) + (4 × 10) + (4 × 10) + (3 × 10) = **160**

Suggested thresholds:
- **Shortlisted:** weighted total ≥ 100 (≈62%)
- **Borderline:** 80–99
- **Eliminated:** < 80 (unless flagged ALIEN-EDGE — see below)

## ALIEN-EDGE flag (separate from fitness scoring)

ALIEN-EDGE findings may fail conventional fitness scoring but carry asymmetric upside. The worker marks a finding as ALIEN-EDGE when:
- The idea feels strange, counterintuitive, or too early
- Yet the worker can articulate a plausible path from the idea to a real test
- The idea's distinctiveness is precisely why mainstream scoring undervalues it

ALIEN-EDGE findings bypass the elimination threshold and are preserved regardless of weighted total. Downstream they become dormant seeds in the vault (if present) or are surfaced separately in the swarm result.

## Evolution History

| Date | Change | Evidence | Source |
|------|--------|----------|--------|
| 2026-04-16 | Initial definition | Ported from AAR's ad-hoc 0–10 scoring dimensions into structured weighted criteria; aligned with the tinkering vault's fitness function format | Integration plan v3 |

## Usage Log

| Date | Used By | Candidates Scored | Winner |
|------|---------|-------------------|--------|
| — | — | — | — |

## Backlinks

- Used by: `~/.claude/skills/topic-aar-worker/SKILL.md` (inline scoring)
- Used by: `~/.claude/skills/topic-aar-controller/SKILL.md` (aggregation)
- Ingested via: vault `aar-adapter` skill (when vault is connected)
