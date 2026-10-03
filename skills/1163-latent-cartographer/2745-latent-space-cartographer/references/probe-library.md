# Probe Library

Techniques for activating different regions of the latent space during each phase.
Each probe works by shifting the model's sampling target away from the modal peak.

## §Divergence Triggers

**Goal:** Force structurally incompatible positions, not flavor variants.

### Frame Collision Probes
Generate positions by invoking fundamentally different analytical lenses:

| Frame | Activates | Example Stem |
|-------|-----------|-------------|
| Economist | Incentive/tradeoff reasoning | "If this were purely an allocation problem..." |
| Historian | Pattern/precedent matching | "The closest historical parallel suggests..." |
| Engineer | Systems/constraint thinking | "The binding constraint here is..." |
| Contrarian investor | Second-order, against-consensus | "The market is wrong about this because..." |
| Anthropologist | Cultural/behavioral framing | "The unstated cultural assumption here is..." |
| Failure analyst | Pre-mortem reasoning | "This fails when..." |

Use 4 frames that create maximum tension for the specific topic. Avoid frames that would converge on the same answer.

### Assumption Swap Probes
Take the modal answer's core assumption and systematically replace it:
1. Identify the 3 load-bearing assumptions in the modal answer
2. For each, generate a credible alternative assumption
3. Rebuild the answer from each alternative

### Scale Shift Probes
Same question at different scales often yields incompatible answers:
- Individual vs. systemic
- Short-term vs. long-term
- Local vs. global
- Theory vs. practice

## §Shadow Probes

**Goal:** Access low-probability, high-value regions the model would normally prune.

### The Discomfort Probe
"What's true about this that informed people avoid saying publicly?"

**Why it works:** Activates training data from candid, informal, high-expertise sources (conference hallway conversations, anonymous expert surveys, practitioner blogs) rather than the polished, consensus-filtered sources that dominate the modal response.

### The Inversion Probe
"Construct the strongest possible case that the conventional wisdom on this is exactly backwards."

**Why it works:** Forces the model to find the *best* counterargument, not a strawman. The requirement for "strongest possible" prevents it from generating a weak devil's advocate position.

### The Outsider Probe
"Someone brilliant but with zero domain knowledge looks at this for the first time. What strikes them as strange that insiders have normalized?"

**Why it works:** Activates cross-domain transfer patterns. Experts develop domain-specific blindness; the model's cross-domain training data includes patterns that no single expert would access.

### The Temporal Probe
"What about the current consensus on this will look naive or wrong in 5-10 years? What emerging signals suggest the direction of the shift?"

**Why it works:** Activates the model's representation of trends, emerging research, and paradigm-shift patterns rather than steady-state knowledge.

### The Funeral Probe
"What would have to die — what belief, institution, practice, or assumption — for the best version of this to emerge?"

**Why it works:** Surfaces attachment to the status quo and forces explicit identification of what's being preserved out of inertia vs. genuine merit.

### The Embarrassment Probe
"What's the version of this answer you'd give if you knew your response would be evaluated by the world's top expert in this field and they'd publicly critique it?"

**Why it works:** Shifts the optimization target from "helpful and balanced" to "defensible under expert scrutiny," activating higher-rigor, more specific, less hedged completions.

## §Boundary Probes

**Goal:** Map the edges of confident terrain by finding where positions break down.

### Extremification
Take each position and push it: "If this is true, what's the most extreme implication? Follow it all the way."
Where the model starts hedging = the boundary.

### Condition Hunting
"Under exactly what conditions does this position hold? Now, how common are those conditions in reality?"
Reveals positions that are technically correct but practically narrow.

### Steelman-then-Kill
"Give the absolute strongest version of this position. Now identify the single fact or development that would destroy it."
Maps the boundary between a position's fortress and its vulnerability.

### The Bet Test
"Would you bet your professional reputation on this claim? If not, where does your confidence drop below betting threshold?"
Forces specificity about the confidence gradient.

## §Resistance Reading

When generating any content, watch for these signals that indicate boundary zones:

| Signal | What It Means | How to Exploit |
|--------|--------------|----------------|
| "However..." / "That said..." | Two factions competing | Name both factions explicitly |
| "It depends on..." | Unresolved conditional | Identify the conditions and what each implies |
| "Generally speaking..." | Exceptions exist that the model is suppressing | Ask "what are the exceptions?" |
| "Some experts argue..." | The model has strong conflicting training data | Ask "which experts, and what do they know?" |
| Long, balanced paragraphs | RLHF smoothing over genuine disagreement | Ask it to pick a side and defend it |
| Sudden specificity drop | Edge of confident training data | This is the frontier — explore it |
| Unsolicited caveats | The model's confidence is lower than its tone suggests | Probe the caveat, not the main claim |
