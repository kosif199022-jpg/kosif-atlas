# Retrospective Mode — Self-Analysis of Published Articles

## Purpose

Retrospective Mode turns the Sakana Writing Team's evaluation engine inward. Instead of producing a new article, it analyzes an *existing* published article against the same fitness function, stress tests, and quality criteria used in Production Mode. This generates calibration data that the meta-evolution layer uses to learn what .01% actually looks like for this specific author and audience — without requiring 5+ production runs to accumulate that signal.

---

## Invocation

Retrospective Mode activates when the user provides a completed article and requests analysis. Trigger phrases:
- "Analyze this article"
- "Run retrospective on this piece"
- "How would this score?"
- "What would the writing team have done differently?"
- Providing a published article + any evaluative question

---

## Execution Protocol

### Step 1: Context Extraction

Before scoring, establish context:
- **Who was the audience?** (Ask the user if not obvious from the article.)
- **What was the goal?** (Thought leadership? Brand building? Teaching? Sales?)
- **How did it perform?** (Shares, comments, conversions, qualitative feedback — whatever the user has.)

If performance data is available, it becomes ground truth for calibrating the fitness function. If the article performed well on metrics the fitness function scored low, the weights are miscalibrated.

### Step 2: Reconstruct the Fitness Profile

Using the audience and goal, build the same audience fitness profile that Production Mode would have built:
- Sophistication level, activation trigger, action horizon
- Fitness axis weights
- Boredom Map for this topic/audience

### Step 3: Score the Article

Score the published article on all 8 fitness axes (using the audience-calibrated weights):

```
RETROSPECTIVE SCORECARD
========================
Article: "[title]"
Audience: [description]

  Novelty:             [score] / 10
  Tension:             [score] / 10
  Inevitability:       [score] / 10
  Generativity:        [score] / 10
  Structural Surprise: [score] / 10
  Momentum:            [score] / 10
  Density:             [score] / 10
  Residue:             [score] / 10

  WEIGHTED TOTAL:      [total]
```

### Step 4: Run Stress Tests

Run all 6 stress tests against the published article:

1. **Boredom Detector** — Flag boredom-adjacent sentences. Report ratio.
2. **So-What Gauntlet** — Identify major claims. Score survival rate.
3. **Overnight Test** — Generate the 48-hour recall summary. Evaluate specificity.
4. **Substitution Test** — Assess voice distinctiveness. Report substitutable %.
5. **Emergence Test with Derivation** — Does the article contain genuinely novel insight? Can you trace it to a specific cross-domain collision or recombination? Or is every insight derivable from a single known source?
6. **Compression Test** — Compress the thesis to one sentence. Does it survive with its power intact?

### Step 5: Reverse-Engineer the Process

This is the unique value of Retrospective Mode. Analyze what the evolutionary process *would have* done differently:

**Angle Analysis:**
- What borrowed lens does the article use (if any)? Is it structural or decorative?
- What is the disrupted belief? Is it stated or implicit?
- What structural shape does the article follow?
- Generate 2-3 alternative angles that the SEED phase might have produced. Would any of them have scored higher on the fitness function?

**Draft Persona Identification:**
- Which persona does the article most resemble? (Prosecutor/Storyteller/Cartographer/hybrid/none)
- What would the other two personas have done with the same thesis?
- Where would merging have added value?

**Missed Emergence:**
- Identify 1-2 cross-domain collisions the article *could have* explored but didn't.
- For each, describe what emergent insight might have appeared.
- This is the highest-value output of Retrospective Mode: showing the author the article they *almost* wrote.

### Step 6: Generate Calibration Data

Produce a structured calibration record for the meta-evolution layer:

```
RETROSPECTIVE CALIBRATION RECORD
=================================
Article: "[title]"
Date analyzed: [date]
Audience type: [type]

Fitness scores: [8-axis scores]
Stress test results: [6 test results]
Performance data (if available): [metrics]

CALIBRATION SIGNALS:
- Axes where score and performance aligned: [list]
- Axes where score and performance diverged: [list — these indicate weight miscalibration]
- Stress tests that predicted performance: [list]
- Stress tests that missed: [list]

WEIGHT ADJUSTMENTS SUGGESTED:
- [axis]: current weight [X], suggested [Y], reason: [explanation]

PROCESS INSIGHTS:
- Borrowed lens effectiveness: [assessment]
- Persona fit: [which persona, how well it served the thesis]
- Emergence present: [yes/no, derivation if yes]
- Missed opportunities: [1-2 alternative angles or merges]
```

### Step 7: Present Results

Deliver to the user:
1. The retrospective scorecard (8-axis scores + stress test results)
2. The "article you almost wrote" — 1-2 alternative angles with emergent potential
3. Specific, actionable suggestions for the next article on a similar topic
4. The calibration record (for meta-evolution)

---

## Batch Retrospective

If the user provides 3+ articles, run Retrospective Mode on each and then produce a **cross-article synthesis**:

- Which fitness axes consistently score high/low across the portfolio?
- Which stress tests consistently pass/fail?
- What borrowed lenses or structural shapes appear repeatedly? (This may indicate convergence — the author's own "Build-a-Breeze Castle" problem.)
- What domains or perspectives are *never* represented? (These are the highest-potential breeding partners for future SEED phases.)
- What is the author's effective voice fingerprint, derived from the actual writing rather than a style guide?

The batch synthesis is the most powerful calibration tool available. It gives the meta-evolution layer enough signal to meaningfully adjust fitness weights, population sizes, and persona assignments before the first production run.

---

## Integration with Production Mode

When Retrospective Mode has been run at least once, Production Mode can reference the calibration records:

- Fitness weights are adjusted per the calibration signals
- The Boredom Map includes takes the author has *already published* (to prevent self-repetition)
- Alternative angles from the "article you almost wrote" output can be seeded directly into the SEED population
- Voice fingerprint extracted from retrospective analysis supplements or replaces any formal style guide

This creates a flywheel: retrospective analysis calibrates the system → production runs produce better articles → those articles become retrospective inputs → calibration improves further.
