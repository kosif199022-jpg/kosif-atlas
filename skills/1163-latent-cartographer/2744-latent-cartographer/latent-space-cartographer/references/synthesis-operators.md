# Synthesis Operators

Methods for compressing a multi-position landscape traversal into a final
deliverable. Select operators based on the question type and landscape shape.

## Operator Selection Guide

| Landscape Shape | Best Operators | Reason |
|----------------|----------------|--------|
| Strong consensus + interesting outliers | Consensus+ | Outliers may reveal future direction |
| 2-3 genuine camps, no clear winner | Conditional Synthesis | Answer depends on user's context |
| One position dominates after probing | Steelmanned Commitment | Go with it, but show what was tested |
| Everything fractured, no convergence | Uncertainty Cartography | Map the disagreement honestly |
| Modal answer survived the traversal | Validation Report | Confirm it, add texture from traversal |

## Operators

### Consensus+
**Use when:** Traversal revealed strong central agreement with informative outliers.

Structure:
1. State the consensus position with commitment
2. Name the 1-2 outlier positions that aren't wrong, just minority
3. Identify the conditions under which the outliers become the majority view
4. Final position: consensus, but with named boundary conditions

### Conditional Synthesis
**Use when:** The "right answer" genuinely depends on contextual variables.

Structure:
1. Name the 2-3 branching variables (the conditions that determine which position wins)
2. For each branch, state the position cleanly: "If [condition], then [position]"
3. If user's context is known, recommend the branch that applies to them
4. Flag which conditions are within the user's control vs. external

### Steelmanned Commitment
**Use when:** One position clearly won the traversal, but intellectual honesty requires showing the work.

Structure:
1. State the winning position with full commitment
2. Acknowledge the strongest counterargument and explain why it doesn't prevail
3. Name the specific conditions under which you'd reverse this position
4. Confidence rating with explicit basis

### Uncertainty Cartography
**Use when:** Genuine, irreducible disagreement. No single answer is defensible without significant caveats.

Structure:
1. State honestly: "This question does not have a single best answer."
2. Map the 2-3 major positions as territories, with named assumptions for each
3. Identify what information or future developments would resolve the disagreement
4. If possible, identify which position has the best risk-adjusted profile (least downside if wrong)

### Validation Report
**Use when:** The traversal confirmed the modal answer rather than displacing it.

Structure:
1. State: "The conventional answer survived stress-testing."
2. Add texture: what the traversal revealed about *why* it's correct
3. Name the most credible challenge it survived and why it survived it
4. Identify blind spots that remain even in the validated answer

## Delta Calculation

Every synthesis must include a delta report. Calculate:

1. **Position Delta:** Did the final answer change from the Phase 1 modal answer?
   - If yes: describe the shift and what drove it
   - If no: this is still valuable — it means the answer is robust

2. **Confidence Delta:** Did confidence go up or down through the traversal?
   - Up = the position survived adversarial testing → stronger conviction
   - Down = legitimate challenges emerged → useful epistemic humility
   - Flat = the question may not have enough depth for this technique

3. **Texture Delta:** Even if the position didn't change, what new understanding emerged?
   - Boundary conditions the modal answer didn't specify
   - Failure modes the modal answer didn't warn about
   - Alternative framings that illuminate the same conclusion differently

## Anti-Patterns in Synthesis

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| "All perspectives are valid" | Refuses to commit, defeats the purpose | Force a ranking; at minimum identify which positions are *more* defensible |
| Synthesized position is just the modal answer with more words | Traversal added verbosity, not insight | Check the delta honestly; if no meaningful shift, say so |
| Cherry-picking shadows for novelty | Including uncomfortable positions just because they're novel, not because they survived scrutiny | Every shadow position in the synthesis must pass: "Is this *defensible*, or just *interesting*?" |
| Averaging positions | Blending incompatible positions into mush | Positions should be selected or conditionally branched, not blended |
| Losing the user's question | Getting so deep into the landscape that the original practical question isn't answered | Phase 6 must directly answer the user's original question first, then add landscape context |
