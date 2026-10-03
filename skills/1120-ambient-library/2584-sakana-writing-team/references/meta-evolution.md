# Meta-Evolution — Cross-Run Learning & Fitness Function Adaptation

## Purpose

This is the DiscoPOP layer. The system doesn't just produce articles — it produces better versions of itself. After each run, the meta-evolution protocol records what worked, what failed, and what to change. Over multiple runs, the system's fitness function, population sizes, merge strategies, and stress test thresholds adapt to the audience and the user's specific goals.

---

## What Gets Recorded After Each Run

### 1. Angle Evolution Data

```
RUN LOG ENTRY
=============
Date: [date]
Audience: [type]
Topic: [topic]

Seed Population Size: 8
Angles that survived to final 3:
  - [Angle name] — Origin: [Survivor / Survivor / Hybrid]
  - [Angle name] — Origin: [type]
  - [Angle name] — Origin: [type]

Winning angle: [name]
Was the winner a hybrid? [yes/no]
Emergence in hybrid? [yes/no] — [description]

Borrowed lenses used: [list all 8]
Winning lens: [lens]
Lens effectiveness: [did it produce genuine insight or was it decorative?]

Framework database used: [yes/no]
Framework used as merge catalyst: [yes/no] — [which framework, which merge]
Catalyst effectiveness: [did it enable an emergent hybrid, or was it inert?]
```

### 2. Research (GROUND) Data

```
Research conducted: [yes/no]
Evidence quality: [how many examples survived into the final article?]
Novelty validation result: [Novel / Partially Anticipated / Pre-empted]
  If pre-empted, action taken: [pivot / swap / proceed-and-surpass]
Complications used: [how many counterarguments appeared in final article?]
Freshness elements used: [how many recent developments appeared in final article?]
Research-sourced examples vs. training-data examples in final: [ratio]
```

### 3. Draft & Merge Data

```
Drafts produced: [number]
Personas used: [list]
Persona that produced highest-scoring draft: [persona]

Merge attempted: [yes/no]
DFS merge (Draft M) score: [total]
PS merge (Draft E) score: [total]
Best original score: [total]
Winner: [Draft M / Draft E / Original]

Merge added value: [yes/no]
If yes, on which axes: [list]
If no, why: [diagnosis]
```

### 3. Stress Test Data

```
Test 1 — Boredom Detector:  [result] [ratio]
Test 2 — So-What Gauntlet:  [result] [survival rate]
Test 3 — Overnight Test:    [result]
Test 4 — Substitution Test: [result] [substitutable %]
Test 5 — Emergence Test:    [result]

Tests that caught real problems: [list]
Tests that generated false positives: [list]
Tests that didn't discriminate between candidates: [list]
```

---

## Adaptation Rules

After 3+ runs, the system can begin adapting. After 5+ runs with the same audience type, adaptations become more confident.

### Fitness Weight Adaptation

**Signal:** One fitness axis consistently fails to differentiate between candidates (all candidates score within 1 point of each other on that axis).
**Action:** Reduce that axis's weight by 0.2. It's not doing useful work for this audience.

**Signal:** One fitness axis consistently identifies the winner (the eventual winner always scores highest on this axis).
**Action:** Increase that axis's weight by 0.2. It's the most predictive axis for this audience.

**Signal:** The user consistently prefers a candidate that scored lower on the fitness function.
**Action:** Examine which axes the user's preferred candidate scored higher on. Increase those weights. The fitness function is miscalibrated to the user's actual values.

### Population Size Adaptation

**Signal:** The top 3 angles are always much stronger than angles 4-8 (>2 point gap in fitness).
**Action:** Reduce seed population to 6. The extra angles aren't contributing diversity.

**Signal:** The winning angle frequently comes from rank 3-6 (the merge pool) or is a hybrid.
**Action:** Keep population at 8 or increase to 10. The middle of the population is where value is created.

**Signal:** Hybrids never win.
**Action:** Examine whether the merge protocol is being executed well. If it is, the topic/audience may not benefit from cross-pollination. Note this pattern but don't eliminate merging — it may work on different topics.

### Merge Strategy Adaptation

**Signal:** DFS merge (Draft M) consistently outperforms PS merge (Draft E).
**Action:** For this audience type, prioritize DFS merge. The value is in combining the best structural sections, not in injecting elements into a base draft.

**Signal:** PS merge consistently outperforms DFS merge.
**Action:** For this audience, the strongest individual draft is usually strong enough to anchor the article. Focus PS merge effort on finding the single best transplantable element from each alternative draft.

**Signal:** Neither merge strategy outperforms the best original.
**Action:** Examine the drafts. If they're too similar (same persona tendencies regardless of assignment), the persona differentiation may be insufficiently strong. If they're too different (merge creates incoherence), the audience may need tighter voice consistency. Adapt persona specifications accordingly.

### Stress Test Adaptation

**Signal:** A test never catches anything (100% pass rate across runs).
**Action:** Tighten the threshold OR retire the test and replace it with a more discriminating one.

**Signal:** A test always fails (0% pass rate across runs).
**Action:** Either the threshold is too strict, or there's a systemic weakness in the drafting phase. If the latter, add explicit guidance to the draft personas addressing the weakness.

**Signal:** A new failure pattern emerges that no existing test catches.
**Action:** Design a new test. Add it to the stress test suite. New tests should be specific to the failure pattern and have clear pass/fail thresholds.

### Persona Adaptation

**Signal:** One persona consistently produces the winning draft.
**Action:** DO NOT eliminate the other personas. They provide the genetic diversity that makes merging valuable. Instead, examine what the winning persona does that the others don't, and look for ways to inject that quality into the merge process.

**Signal:** One persona consistently produces the lowest-scoring draft.
**Action:** Examine whether the persona's mode of argument is fundamentally mismatched with this audience. If so, replace it with a new persona better suited to the audience. Consider:
- **The Surgeon** (for audiences that value precision): Removes everything unnecessary, makes every word earn its place.
- **The Anthropologist** (for audiences that value cultural insight): Observes behavior patterns and names what no one has named.
- **The Architect** (for audiences that value systems thinking): Designs the structure first, then fills it with content.
- **The Provocateur** (for audiences that respond to challenge): Takes the most extreme defensible position and makes the audience argue with it.

### Framework Database Adaptation

**Signal:** Framework-catalyzed merges consistently produce the winning hybrid.
**Action:** Increase framework search effort during merging. For this audience/topic type, existing frameworks reliably provide crystallization points for angle collisions.

**Signal:** Framework-catalyzed merges never outperform non-catalyzed merges.
**Action:** Reduce framework search effort. For this audience/topic type, organic merging is more productive — existing frameworks may be constraining rather than catalyzing emergence.

**Signal:** The Emergence Test consistently catches "rediscoveries" — insights that match existing frameworks in the database.
**Action:** The seed angles for this audience/topic type are landing in already-mapped territory. Increase the minimum distance constraint and push for more exotic borrowed lenses to force the search into genuinely new space.

**Signal:** The Cartographer persona consistently produces the highest-scoring drafts when framework database is available.
**Action:** This audience values map-making and positioning against known models. Consider assigning Cartographer to 2 of 3 drafts instead of 1 (with different angles), reducing another persona.

### Research (GROUND) Adaptation

**Signal:** Research-sourced examples consistently replace training-data examples in the final article (>80% ratio across runs).
**Action:** The GROUND phase is earning its cost. Maintain or increase search depth.

**Signal:** Novelty validation frequently catches pre-empted angles.
**Action:** The seed population is generating takes that already exist. Either the borrowed lenses aren't foreign enough, or the topic space is saturated. Push for more exotic lens assignments in SEED phase.

**Signal:** Complication Discovery material rarely appears in the final article.
**Action:** Either the drafting personas aren't using counterarguments well, or the complications found aren't relevant. Examine whether the search queries in Function 3 need to be more specific to the audience's likely objections.

**Signal:** Freshness elements consistently score high on Residue in stress testing.
**Action:** For this audience, recency is a major value driver. Increase Function 4 search depth and prioritize developments from the last 30 days.

---

## Evolution Log Across Runs

Maintain a cumulative log that tracks patterns across runs:

```
CUMULATIVE EVOLUTION LOG
========================
Total runs: [n]
Audience types served: [list]

Most effective borrowed lenses (by emergence rate):
1. [lens] — [n] emergent insights in [n] uses
2. [lens] — [n] emergent insights in [n] uses

Most effective structural shapes:
1. [shape] — [average fitness score when used]

Merge success rate: [n]% of runs where merge outperformed original
Hybrid success rate: [n]% of runs where hybrid angle won
Framework catalyst success rate: [n]% of catalyzed merges that produced emergence
Average boredom ratio (final articles): [n]%
Average emergence rate: [n]% of articles passed emergence test
Research utilization rate: [n]% of research-sourced examples in final articles
Pre-emption rate: [n]% of angles flagged as pre-empted by novelty validation

Current fitness weight calibration by audience type:
[audience type] → [weight vector]

Active adaptations:
- [description of any changes from defaults]
```

---

## The Meta-Evolution Thesis

Over time, this system should discover:
- Which borrowed lenses produce the most emergence for which topics
- Which audience types benefit most from merging vs. single-draft refinement
- Which stress tests are most predictive of actual article quality
- What population size optimizes the quality-efficiency tradeoff
- Which persona combinations produce the most diverse (and therefore most mergeable) drafts

### v2 Addition: Retrospective Calibration Integration

When Retrospective Mode has been run (see `references/retrospective-mode.md`), the calibration records are integrated here:

- **Fitness weight adjustments** from retrospective analysis override default calculations
- **Boredom Map** is supplemented with takes the author has already published (prevents self-repetition)
- **Voice fingerprint** extracted from retrospective batch analysis supplements or replaces any formal style guide
- **Alternative angles** from the "article you almost wrote" output can be seeded directly into future SEED populations
- **Controlled accident effectiveness** is tracked: which types of absurd collisions produced value for this audience?
- **Hybrid seeding ROI**: did externally-sourced angles perform better or worse than AI-generated ones across runs?

The retrospective flywheel: analysis calibrates the system → production runs produce better articles → those articles become retrospective inputs → calibration improves further.

This is exactly what DiscoPOP did for training loss functions: instead of hand-designing the process, let the process evolve based on what actually works.
