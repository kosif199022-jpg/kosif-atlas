# Merge Protocol — Cross-Pollination of Draft DNA

## Purpose

This protocol governs how multiple drafts are combined to produce a merged article stronger than any individual. It implements two distinct merge strategies borrowed directly from Sakana's Evolutionary Model Merge architecture.

---

## Prerequisite: Per-Axis Draft Scoring

Before merging, score each draft on all 8 fitness axes from the audience fitness profile:

**Idea axes:** Novelty, Tension, Inevitability, Generativity, Structural Surprise
**Craft axes:** Momentum, Density, Residue

Record scores in a matrix:

```
                Draft A    Draft B    Draft C
Novelty         [score]    [score]    [score]
Tension         [score]    [score]    [score]
Inevitability   [score]    [score]    [score]
Generativity    [score]    [score]    [score]
Struct.Surprise [score]    [score]    [score]
Momentum        [score]    [score]    [score]
Density         [score]    [score]    [score]
Residue         [score]    [score]    [score]
────────────────────────────────────────────
WEIGHTED TOTAL  [total]    [total]    [total]
```

---

## Strategy 1: Data Flow Space Merge (Draft M)

### Concept
In Sakana's DFS merge, tokens are routed through the best layer of whichever model has the strongest layer at that position. Analogously, the reader is routed through the best *section* of whichever draft is strongest at that position.

### Procedure

**Step 1 — Segment all drafts into structural regions:**
- **Opening** (first 300 words): the hook, the orientation, the first appearance of the borrowed lens.
- **Escalation** (middle 40-60%): where the argument builds, evidence accumulates, the stakes rise.
- **Pivot** (the moment the article turns — the most surprising claim, the deepest insight, the climax of the narrative).
- **Resolution** (final 20%): the thesis crystallizes, the implications land, the reader is released with something to carry.

**Step 2 — Identify the per-section champion:**
For each structural region, evaluate which draft performs best:
- Opening → score on Momentum + first-impression Novelty.
- Escalation → score on Density + Tension.
- Pivot → score on Inevitability + Residue. This is the single most important moment — the draft that nails the pivot wins the article.
- Resolution → score on Generativity + Residue.

**Step 3 — Assemble Draft M:**
Combine the champion sections into a single draft. This will require:
- **Transition surgery:** The seams between sections from different drafts will be visible. Rewrite transitions to create continuity of voice and logic. The borrowed lens is usually the best connective tissue — it should thread through all sections regardless of source.
- **Voice harmonization:** Choose the dominant voice (usually from whichever draft contributed the most sections) and rewrite the minority sections to match.
- **Logic verification:** Ensure that the argument still builds. A great escalation from Draft B may assume setup from Draft B's opening — if you used Draft A's opening, you may need to inject that setup.

### Warning Signs
- If all champion sections come from the same draft, DFS merge adds no value. Note this and skip to PS merge.
- If the transitions feel forced, the sections may be incompatible. Consider whether the merge is worth the coherence cost.

---

## Strategy 2: Parameter Space Merge (Draft E)

### Concept
In Sakana's PS merge, weights within a single model architecture are blended. Analogously, the strongest complete draft is preserved as the base architecture, and the best *elements* from other drafts are injected into it — like transplanting genes, not organs.

### Procedure

**Step 1 — Select the base draft:**
The draft with the highest overall weighted fitness score becomes the base. This draft's structure, voice, and argument flow are preserved.

**Step 2 — Identify transplantable elements:**
From the non-base drafts, extract elements at the sub-section level:
- **Best single paragraph:** Which paragraph across all drafts is the most powerful? (Score on Density + Residue.)
- **Best metaphor/image:** Which single image or comparison is most vivid and illuminating?
- **Best evidence deployment:** Which specific example is most surprising and well-placed?
- **Best borrowed-lens moment:** Which draft uses the borrowed lens most effectively at a specific point?
- **Best structural move:** Is there a transition, pivot, or reveal in another draft that's more effective than the corresponding moment in the base?

**Step 3 — Inject elements into Draft E:**
For each transplantable element:
1. Identify the corresponding location in the base draft.
2. Replace the weaker passage with the stronger element.
3. Rewrite surrounding context to integrate seamlessly — matching voice, maintaining argument flow, preserving logical dependencies.

### Injection Rules
- Never inject more than **4 elements** into the base. Over-injection destroys coherence — the base draft's structural integrity is its primary value.
- Each injected element must improve the base draft's score on at least one fitness axis without degrading any axis by more than 0.5 points.
- If an injected element requires more than 3 sentences of connective tissue to integrate, it's too foreign for PS merge. Set it aside.

---

## Post-Merge Evaluation

After producing Draft M and Draft E, score both on all 8 axes alongside the best unmerged original. Present the scores:

```
                Original   Draft M    Draft E
Novelty         [score]    [score]    [score]
...
WEIGHTED TOTAL  [total]    [total]    [total]
```

Note specifically:
- Which merge strategy produced the higher score?
- On which axes did merging improve performance?
- On which axes did merging degrade performance? (Common: Momentum can suffer in DFS merge due to seams.)
- Did either merge produce **emergence** — a quality or insight that exists in the merged version but in neither source draft?

---

## Emergence Detection

The most valuable outcome of merging is emergence — the appearance of qualities that exist in no parent. Watch for:

- **A new insight** that arises from the juxtaposition of elements from different drafts. (Example: Draft A's evidence + Draft B's lens creates an implication neither draft stated.)
- **A structural rhythm** that emerges from combining different personas' pacing. (Example: The Prosecutor's tight opening + The Storyteller's expansive middle creates a tension-release pattern neither draft had alone.)
- **A new metaphor** that forms spontaneously from the collision of two borrowed lenses or two different examples.

If emergence is detected, call it out explicitly in the evolution log. This is the proof that the evolutionary process created value that linear optimization would not have found.

If no emergence is detected in either merge, note this honestly. Not every merge produces emergence. The merged draft may still be superior through simple combination of best elements — but the process hasn't achieved its highest potential.

---

## Output

Pass three candidates to the STRESS phase:
1. **Draft M** (DFS merge — best sections assembled)
2. **Draft E** (PS merge — best draft with injected elements)
3. **Best Original** (highest-scoring unmerged draft — the control group)

The control group matters. If neither merge outperforms the original, the system should select the original and log that merging failed to add value on this run. This data feeds the meta-evolution layer.
