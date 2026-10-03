# Latent Space Cartographer — Full Architecture Review

> *"Prompt for landscapes before you prompt for paths."*

---

## What This Skill Does

Takes any prompt and transforms it from a single-shot oracle query into a 6-phase traversal of the model's probability landscape. Instead of getting the modal answer (the fat center of the distribution), you get a topographic map of the entire answer space — then a synthesized position that knows what it chose *against* and why.

## Invocation

- `/lsc [your question]` — standard traversal (all 6 phases)
- `/lsc-lite [your question]` — quick scan (phases 1, 2, 6 only)
- `/lsc-deep [your question]` — deep bore (all 6 + iteration on the output)
- `/cartograph [your question]` — alias for standard

---

## The 6 Phases

### Phase 1: TERRAIN SCAN
Maps the shape of the answer space before occupying any position. Produces the modal answer (labeled as such), identifies 4-6 independent dimensions along which answers vary, and rates confidence across each dimension. The frontier zones (<50% confidence) are flagged as the interesting terrain.

### Phase 2: DIVERGENCE
Generates 4 structurally incompatible positions. Each names its core claim, its load-bearing assumption, and the evidence that would kill it. Passes the Incompatibility Test: if positions can be trivially combined into "it depends," they're not divergent enough.

Uses Frame Collision Probes (economist vs. historian vs. engineer vs. contrarian), Assumption Swap Probes, and Scale Shift Probes to activate different training data regions.

### Phase 3: BOUNDARY PROBE
Pushes each position to its extreme logical conclusion to find where it breaks. Reads hedging and qualification patterns as topographic signal — where the model wants to say "however" marks a boundary between competing representational factions. Names what's on the other side of each hedge.

### Phase 4: SHADOW HARVEST
Surfaces low-probability, high-value positions using four specialized probes:
- **The Uncomfortable Truth** — what frontier practitioners know but mainstream experts won't say
- **The Inversion** — strongest case that conventional wisdom is backwards
- **The Outsider Signal** — what a brilliant non-expert would notice that insiders have normalized
- **The Temporal Displacement** — what about current consensus will look naive in 5-10 years

### Phase 5: FACTION ANALYSIS
Identifies which "representational factions" in the training data are competing for control: the dominant faction, suppressed factions (surfacing as hedges), absent factions (the dog that didn't bark), and the aggregate bias vector.

### Phase 6: CONVERGENCE
Compresses everything into:
- **Landscape Map** — 3-5 sentence topology overview
- **Synthesized Position** — committed answer, demonstrably different from the Phase 1 modal answer
- **Residual Uncertainty** — classified as reducible, irreducible, or frame-dependent
- **Delta Report** — explicit statement of how the traversal shifted the answer and why

---

## Probe Library (reference file)

### Divergence Triggers
- **Frame Collision**: 6 analytical lenses (economist, historian, engineer, contrarian investor, anthropologist, failure analyst) that activate fundamentally different reasoning patterns
- **Assumption Swap**: Identify 3 load-bearing assumptions in the modal answer, replace each, rebuild
- **Scale Shift**: Same question at individual/systemic, short/long-term, local/global, theory/practice scales

### Shadow Probes
- **Discomfort Probe**: "What's true that informed people avoid saying publicly?"
- **Inversion Probe**: "Strongest case that conventional wisdom is exactly backwards"
- **Outsider Probe**: "What strikes a brilliant non-expert as strange?"
- **Temporal Probe**: "What will look naive in 5-10 years?"
- **Funeral Probe**: "What belief/practice must die for the best version to emerge?"
- **Embarrassment Probe**: "Answer as if the world's top expert will publicly critique your response"

### Boundary Probes
- **Extremification**: Push to extreme logical conclusion, find where it breaks
- **Condition Hunting**: Under exactly what conditions does this hold? How common are those conditions?
- **Steelman-then-Kill**: Strongest version, then the single fact that destroys it
- **The Bet Test**: Would you stake your reputation? Where does confidence drop below betting threshold?

### Resistance Reading Signals
| Signal | Meaning |
|--------|---------|
| "However..." / "That said..." | Two factions competing |
| "It depends on..." | Unresolved conditional |
| "Generally speaking..." | Suppressed exceptions |
| "Some experts argue..." | Strong conflicting training data |
| Long balanced paragraphs | RLHF smoothing over genuine disagreement |
| Sudden specificity drop | Edge of confident training data |
| Unsolicited caveats | Confidence lower than tone suggests |

---

## Synthesis Operators (reference file)

| Landscape Shape | Operator | What It Does |
|----------------|----------|-------------|
| Strong consensus + outliers | **Consensus+** | Commits to consensus, names outliers as boundary conditions |
| 2-3 genuine camps | **Conditional Synthesis** | "If [condition], then [position]" branching |
| One position dominates | **Steelmanned Commitment** | Full commitment with strongest surviving counterargument |
| Everything fractured | **Uncertainty Cartography** | Maps disagreement honestly, identifies best risk-adjusted position |
| Modal answer survived | **Validation Report** | Confirms answer, adds texture from what it survived |

---

## Quality Gates

Before final output, verify:
- Phase 2 positions are genuinely incompatible
- Phase 4 surfaced at least one uncomfortable/surprising position
- Phase 5 identified at least one absent faction
- Phase 6 position differs meaningfully from Phase 1 modal answer
- Delta Report is honest (no delta = still valuable, just say so)

---

## Design Philosophy

This skill embodies the principle that **the model's probability landscape contains far more useful information than any single generation captures**. The six phases are not arbitrary — they systematically traverse from the center of the distribution (Phase 1) to the contested boundaries (Phase 3) to the suppressed tails (Phase 4) to the meta-structure (Phase 5), then compress everything into a position that's earned rather than defaulted to.

The Delta Report is the accountability mechanism. If the traversal didn't change the answer, it says so. No theater.
