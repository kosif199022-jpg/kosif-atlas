# Fitness Engine — Audience Profiling & Scoring

## Purpose

The fitness function determines what "good" means for *this specific audience*. It is not a universal rubric. A .01% article for VCs looks nothing like a .01% article for independent coaches. The fitness engine builds a bespoke evaluation instrument before a single word of content is generated.

---

## Step 1: Audience Intelligence Extraction

Given the user's audience description, extract these three dimensions:

### Dimension 1: Sophistication Level
Ask: *What does this audience already know about this topic?*

Classify into one of four tiers:
- **Naive** — Has heard of the topic but has no working model. Needs orientation before insight.
- **Informed** — Has a working mental model. Reads about the topic regularly. Will be bored by introductory framing.
- **Practiced** — Actively works with the topic. Has opinions and experience. Needs to be shown something their experience hasn't revealed.
- **Expert** — Has taught or published on the topic. Will pattern-match to known frameworks instantly. Can only be surprised by genuine emergence or by reframing something they thought was settled.

This determines: vocabulary level, assumption load (how much you can skip), and the altitude of the thesis (naive audiences need ground-level; expert audiences need orbital reframes).

### Dimension 2: Activation Trigger
Ask: *What makes this audience stop scrolling?*

Identify the dominant trigger from this taxonomy:
- **Status signal** — "This will make me look smart / ahead of the curve." Common in executives, VCs, and ambitious operators.
- **Fear of obsolescence** — "Am I being left behind?" Common in mid-career professionals during paradigm shifts.
- **Contrarian instinct** — "Everyone says X but actually Y." Common in independent thinkers, founders, and domain experts.
- **Practical urgency** — "I need to do something with this on Monday." Common in practitioners and implementers.
- **Pattern hunger** — "I want to see the underlying structure." Common in systems thinkers, strategists, and analytically-minded readers.

This determines: the opening strategy, the emotional valence of the thesis, and which of the stress tests to weight most heavily.

### Dimension 3: Action Horizon
Ask: *What does this audience need to do after reading?*

Classify:
- **Decide** — They're choosing between options. The article must create clarity.
- **Build** — They're implementing something. The article must create actionable architecture.
- **Teach** — They'll pass the insight forward. The article must create transferable frameworks.
- **Rethink** — They need to update a mental model. The article must create productive disorientation followed by a better map.
- **Buy** — They're evaluating a purchase or investment. The article must create evaluative criteria.

This determines: the ending (what the article resolves toward), the density of actionable content, and whether frameworks or narratives are the primary vehicle.

### Dimension 4: Delivery Format
Ask: *What type of piece does this audience need?*

Classify:
- **Thought piece** — The value is the reframe itself. WHY/WHAT heavy (60%+), HOW light. Reader leaves thinking differently.
- **Practitioner guide** — The value is what they can do with it. WHY/WHAT compressed (30%), HOW/WHAT-IF expanded (70%). Reader leaves with an exercise they can run this week. Minimum 40% of word count must be in HOW/application sections.
- **Newsletter/signal** — The value is being ahead. WHY dominant (40%), WHAT compressed (30%), HOW as implication (30%). Reader leaves with something to say at their next meeting.
- **Tutorial** — The value is execution. WHY minimal (10%), WHAT as setup (20%), HOW dominant (60%), WHAT-IF as troubleshooting (10%).
- **Keynote companion** — The value is depth behind a talk. Match the talk's structure. WHY/WHAT mirror the keynote; HOW/WHAT-IF extend it.

This determines: section weight distribution, level of practical scaffolding required, whether examples need to be executable (practitioner guide) or illustrative (thought piece), and minimum word count for the HOW section.

Cross-reference with Action Horizon:
- Build → default to Practitioner Guide unless overridden
- Teach → default to Practitioner Guide or Tutorial
- Rethink → default to Thought Piece
- Decide → default to Thought Piece or Newsletter
- Buy → default to Newsletter

### Dimension 5: Register
Ask: *What is the relationship between the author and this audience?*

Classify:
- **Formal-academic** — The reader expects rigor and distance. Third person. Citations matter.
- **Professional-conversational** — The reader expects substance delivered accessibly. Second person mixed with first. Contractions OK. Data without the lectern.
- **Coaching-intimate** — The reader is a paying client or community member. Direct address. Directive language OK. "Try this." "Here's what I need you to do." Shared context assumed.
- **Technical-peer** — The reader has equal or greater domain expertise. Jargon is efficient, not exclusionary. Skip fundamentals.

This determines: vocabulary level, sentence structure, acceptable use of directives, degree of assumed shared context, and whether the piece reads as "writing to" or "writing for" the audience. If a voice profile is loaded, register should be consistent with the voice; if they conflict, register wins (it reflects the audience relationship, which is situational).

---

## Step 2: Boredom Map Construction

Generate 5-7 statements that represent **the takes this audience has already heard to death** on this topic. These are the local optima — the comfortable, predictable positions that every other article occupies.

Format:
```
BOREDOM MAP — [Topic] for [Audience]
1. "[Generic take #1]"
2. "[Generic take #2]"
...
```

Every sentence in every draft will be checked against this map. If a sentence could plausibly appear in an article built around any of these takes, it is flagged as "boredom-adjacent."

The boredom map also serves as the **negative fitness function**: angles that cluster near these takes are penalized during tournament selection.

---

## Step 3: Fitness Axis Calibration

Score articles on 8 axes. The first 5 evaluate the *idea*; the last 3 evaluate the *craft*.

### Idea Axes

**1. Novelty (1-10)**
Does this angle exist anywhere in the audience's current reading diet? Score 10 if the reader has genuinely never encountered this framing. Score 1 if it's a restatement of existing consensus.
- Weight: HIGH for Contrarian and Pattern Hunger audiences. MODERATE for others.

**2. Tension (1-10)**
How much does the article challenge what the audience currently believes or does? Score 10 if it makes the reader uncomfortable before convincing them. Score 1 if it confirms what they already think.
- Weight: HIGH for Expert and Practiced audiences (they need disruption). LOW for Naive audiences (they need orientation first).

**3. Inevitability (1-10)**
Once the thesis is stated, does it feel obviously true in retrospect? The best insights feel surprising *and* inevitable simultaneously. Score 10 if the reader thinks "of course — why didn't I see that?" Score 1 if it feels like a hot take that won't survive scrutiny.
- Weight: HIGH for all audiences. This is the hardest axis to score well on and the most predictive of lasting impact.

**4. Generativity (1-10)**
Does the article create new questions, frameworks, or vocabulary that the reader can apply elsewhere? Score 10 if it gives the reader a new lens they'll use for months. Score 1 if it answers a question without opening any new ones.
- Weight: HIGH for Teach and Rethink action horizons. MODERATE for Build and Decide.

**5. Structural Surprise (1-10)**
Does the borrowed lens create a shape that delivers the thesis in an unexpected way? Score 10 if the structure itself is part of the insight. Score 1 if the lens is decorative.
- Weight: MODERATE for all audiences. Serves as a tiebreaker between otherwise similar candidates.

### Craft Axes

**6. Momentum (1-10)**
Does every paragraph earn the next? Where does the reader's attention sag? Score 10 if the piece pulls the reader forward relentlessly. Score 1 if sections feel like obligations.

**7. Density (1-10)**
Is every sentence doing at least two jobs — advancing the argument AND creating texture, character, or emotional resonance? Score 10 if no sentence is merely functional. Score 1 if the piece is padded.

**8. Residue (1-10)**
What stays with the reader 48 hours later? Is there a phrase, image, framework, or reframe that becomes mental furniture? Score 10 if the reader will quote it to someone else. Score 1 if nothing sticks.

---

## Step 4: Weight Calculation

Compute axis weights based on audience profile:

```
Base weights: all axes = 1.0

Adjustments by Activation Trigger:
- Status signal    → Novelty +0.5, Residue +0.5
- Fear of obsolescence → Tension +0.5, Inevitability +0.3
- Contrarian       → Novelty +0.5, Tension +0.5
- Practical urgency → Generativity +0.5, Momentum +0.3
- Pattern hunger   → Structural Surprise +0.5, Generativity +0.3

Adjustments by Action Horizon:
- Decide  → Inevitability +0.3, Tension +0.2
- Build   → Generativity +0.5, Density +0.2
- Teach   → Generativity +0.5, Residue +0.3
- Rethink → Tension +0.5, Novelty +0.3
- Buy     → Inevitability +0.5, Momentum +0.2

Adjustments by Sophistication:
- Expert    → Novelty +0.5, Tension +0.3 (they're hardest to surprise)
- Practiced → Tension +0.3, Structural Surprise +0.2
- Informed  → Momentum +0.2, Residue +0.2
- Naive     → Inevitability +0.3, Momentum +0.3 (clarity and pull matter most)
```

Normalize so weights sum to 8.0. Record final weights in the audience fitness profile.

---

## Output Format

```
AUDIENCE FITNESS PROFILE
========================
Audience: [description]
Topic: [topic or "to be discovered"]

Sophistication: [tier]
Activation Trigger: [type]
Action Horizon: [type]
Delivery Format: [type] (→ section weight: WHY __% / WHAT __% / HOW __% / WHAT-IF __%)
Register: [type]

Boredom Map:
1. ...
2. ...
...

Fitness Weights:
  Novelty:            [weight]
  Tension:            [weight]
  Inevitability:      [weight]
  Generativity:       [weight]
  Structural Surprise:[weight]
  Momentum:           [weight]
  Density:            [weight]
  Residue:            [weight]

Minimum threshold for publication: weighted score ≥ 7.0/10
```
