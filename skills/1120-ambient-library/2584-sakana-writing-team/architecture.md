# Sakana Writing Team — Architecture Plan

## Core Thesis

Most writing teams optimize a single draft through a linear pipeline: research → outline → draft → edit → publish. This is gradient descent — one trajectory, one local optimum. The Sakana Writing Team treats article creation as **population-based evolutionary search over idea space**, where multiple candidate angles, structures, and drafts compete, merge, and mutate against explicit fitness criteria until an emergent article surfaces that no single linear pass would have discovered.

---

## The Three Sakana Principles That Reshape Everything

### 1. Evolutionary Model Merge → Cross-Domain Angle Fusion
Just as Sakana breeds a Japanese LLM with an English math model to get emergent Japanese math reasoning, this system breeds **unlike knowledge domains** against each other to produce angles that exist in neither source alone. The article's core insight must come from *recombination*, not retrieval.

### 2. DiscoPOP / LLM² → Meta-Evolving the Editorial Rules
Instead of fixed editorial criteria, the system evolves its own quality rubric per audience. What "compelling" means for a room of VCs is a different fitness function than what it means for independent coaches. The rubric itself is a variable, not a constant.

### 3. Quality-Diversity (MAP-Elites) → Preserving Multiple Strong Variants
The system never collapses to one "best" draft too early. It maintains a **diverse archive** of candidates across behavioral dimensions (tone, structure, depth, provocation level) and only selects the final output after the population has had time to explore.

---

## System Architecture: Seven Phases

```
AUDIENCE → [SENSE] → [SEED] → [EVOLVE] → [DRAFT] → [MERGE] → [STRESS] → [SELECT] → ARTICLE
              ↑                                                      |
              └──────────── fitness scores feed back ────────────────┘
```

---

### Phase 1: SENSE — Audience Intelligence Extraction

**Purpose:** Build the fitness function before generating any content.

**Inputs:** Audience description (required). Topic (optional — can be discovered).

**Process:**
- Extract **3 audience dimensions** that will serve as fitness axes:
  - **Sophistication level** — what do they already know? What bores them?
  - **Activation trigger** — what makes them stop scrolling? Status? Fear? Curiosity? Contrarianism?
  - **Action horizon** — what do they need to *do* after reading? (Decide, build, teach, buy, rethink?)
- Generate a **Boredom Map**: the 5-7 takes this audience has already heard a hundred times on this topic. These become the anti-fitness criteria — any draft that lands here is automatically penalized.
- If no topic is given, use audience intelligence to identify **3 high-tension topic candidates** where the audience's assumptions are most vulnerable.

**Output:** `audience_fitness_profile.json` — a structured object containing the scoring rubric, boredom map, and activation triggers that every subsequent phase references.

---

### Phase 2: SEED — Population Generation (Divergent Search)

**Purpose:** Generate a diverse population of candidate angles. Not outlines — *angles*. An angle is a thesis + a borrowed lens + a structural shape.

**Process:**
- Generate **8 candidate angles** using forced cross-domain fertilization:
  - For each candidate, randomly assign a **borrowed lens** from a domain unrelated to the topic (evolutionary biology, architecture, jazz improvisation, game theory, thermodynamics, litigation strategy, mycology, choreography, etc.)
  - Each angle must state: (a) the thesis in one sentence, (b) the borrowed lens and why it's non-obvious, (c) what the audience believes now that the article will disrupt, (d) what structural shape the piece takes (narrative arc, escalating proof, nested reveals, dialectic, etc.)
- Enforce a **minimum distance constraint**: no two angles can share the same borrowed lens, the same structural shape, or the same disrupted belief. This is the diversity-preservation mechanism.

**Output:** `angle_population[]` — 8 structured angle objects.

**Design note:** 8 is not arbitrary. It's large enough to guarantee diversity but small enough that each candidate gets real evaluation. This is the seeding generation — quality comes from evolution, not from generating 50 weak candidates.

---

### Phase 3: EVOLVE — Tournament Selection + Angle Merging

**Purpose:** Reduce 8 angles to 3 through competitive evaluation and recombinant merging.

**Process:**

**Round 1 — Fitness Scoring:**
Score each of the 8 angles against the `audience_fitness_profile` on five axes (1-10 each):
  1. **Novelty** — Does this angle exist anywhere in the audience's current reading diet?
  2. **Tension** — How much does it challenge what the audience currently believes or does?
  3. **Inevitability** — Once stated, does the thesis feel obviously true in retrospect?
  4. **Generativity** — Does this angle create new questions, not just answer old ones?
  5. **Structural surprise** — Does the borrowed lens create a shape that delivers the thesis in an unexpected way?

Total fitness = weighted sum (weights derived from audience profile — e.g., a VC audience weights Generativity higher; a practitioner audience weights Inevitability higher).

**Round 2 — Merge the Middle:**
- Top 2 angles survive intact.
- Angles ranked 3-6 enter a **merge pool**. The system attempts pairwise merges:
  - Take the thesis from one angle and the borrowed lens from another.
  - Take the structural shape from one and the disrupted belief from another.
  - Evaluate each hybrid. The single best hybrid becomes angle #3.
- Angles ranked 7-8 are discarded.

**This is the Evolutionary Model Merge step.** The hybrid angle — thesis from one parent, lens from another — is where emergence happens. The Japanese Math LLM emerged from merging unlike capabilities; the best angle often emerges from merging unlike framings.

**Output:** `evolved_angles[3]` — three finalist angles, one of which is a hybrid.

---

### Phase 4: DRAFT — Parallel Variant Generation

**Purpose:** Produce three full drafts, one per surviving angle.

**Process:**
- Each draft is written by a different **specialist persona** (not a fixed role — a dynamically configured voice):
  - **Draft A** — Written by "The Prosecutor": builds the case through evidence, anticipates objections, closes with a verdict. Tight logical structure, high density.
  - **Draft B** — Written by "The Storyteller": leads with a specific scene or character, uses narrative momentum to deliver the thesis, earns the insight through felt experience.
  - **Draft C** — Written by "The Cartographer": maps the territory, names what's unnamed, creates new vocabulary. Spatial/visual structure, emphasis on frameworks and mental models.

- Each persona writes to the same `audience_fitness_profile` but expresses it through a completely different mode. This is the **behavioral diversity** axis — same fitness landscape, different movement strategies.

- **Hard constraints** applied to all three:
  - No draft may begin with a definition, a question, or a statistic. (Anti-pattern enforcement.)
  - The borrowed lens must appear in the first 200 words and recur at least twice more.
  - The thesis must be *earned*, not stated — the reader should be able to articulate it before the writer does.
  - Minimum 3 concrete, specific examples (names, numbers, dates, places). No abstraction without anchor.

**Output:** `draft_population[3]` — three complete drafts.

---

### Phase 5: MERGE — Cross-Pollination of Draft DNA

**Purpose:** Create hybrid drafts by transplanting the strongest elements across variants.

**Process:**
- Score each draft on the 5 fitness axes from Phase 3, plus 3 new craft axes:
  6. **Momentum** — Does every paragraph earn the next? Where does the reader's attention sag?
  7. **Density** — Is every sentence doing at least two jobs (advancing argument + creating texture)?
  8. **Residue** — What stays with the reader 48 hours later? Is there a phrase, image, or reframe that becomes mental furniture?

- Identify the **per-section champion** across all three drafts:
  - Best opening (first 300 words)
  - Best escalation (middle third)
  - Best resolution (final third)
  - Best single paragraph (anywhere)
  - Best borrowed-lens deployment

- Construct **Draft M (Merged)**: Assemble the champion sections into a single coherent draft, rewriting transitions and harmonizing voice. This is the **Data Flow Space merge** — routing the reader through the best layers of each parent model.

- Simultaneously construct **Draft E (Evolved)**: Take the single strongest complete draft and inject the best isolated elements (paragraph, metaphor, structural move) from the other two. This is the **Parameter Space merge** — blending weights within a single architecture.

**Output:** `merged_drafts[2]` — Draft M and Draft E. Plus the single best unmerged original for comparison. Total: 3 candidates.

---

### Phase 6: STRESS — Adversarial Fitness Evaluation

**Purpose:** Subject all three candidates to hostile scrutiny. This is the fitness evaluation that determines the final selection — it must be genuinely adversarial, not cosmetic.

**Process:**

**Test 1 — The Boredom Detector:**
Compare each draft against the Boredom Map from Phase 1. Flag every sentence that could appear in a generic article on this topic. Calculate a **Boredom Ratio** (flagged sentences / total sentences). Target: <10%.

**Test 2 — The So-What Gauntlet:**
For each major claim, ask: "A smart, busy member of this audience reads this. Their first reaction is 'so what?' Does the draft answer that within 2 sentences?" Score: % of claims that survive.

**Test 3 — The Overnight Test (simulated):**
"It's 48 hours later. The reader is describing this article to a colleague. What do they say?" Generate that summary for each draft. If the summary is generic ("it was about AI and content strategy"), the article failed. If the summary contains a specific reframe, image, or framework — it passed.

**Test 4 — The Substitution Test:**
Could a different author's name appear on this article without anyone noticing? If yes, the voice is insufficiently distinctive. Flag passages that read as interchangeable.

**Test 5 — The Emergence Test:**
Does the article say something that is *not* a restatement of any single source, framework, or prior article? Is there at least one insight that is genuinely novel — produced by the recombination process itself, not retrieved from existing knowledge? This is the test for whether the evolutionary process actually worked.

**Output:** `fitness_scores[3]` — detailed per-test scores for each candidate, with flagged passages.

---

### Phase 7: SELECT + MUTATE — Final Evolution

**Purpose:** Choose the fittest candidate and apply targeted mutations to address remaining weaknesses.

**Process:**
- Select the candidate with the highest aggregate fitness score.
- For each test where the candidate scored below threshold:
  - Generate **3 targeted mutations** (rewrites of the specific flagged passages).
  - Evaluate each mutation against the specific test it's meant to address.
  - Keep the mutation that improves fitness without degrading other axes.
- Apply all surviving mutations.
- Run a final **coherence pass**: ensure voice consistency, transition logic, and structural rhythm after mutations.

**Output:** The final article.

---

## Fitness Function Architecture (The Meta-Layer)

This is the DiscoPOP principle applied to writing: **the fitness function itself should evolve.**

After each article is produced, the system records:
- Which fitness axes most differentiated the final winner from the losers
- Which tests caught real problems vs. generated false positives
- Which phase produced the most value (did merging actually improve things? Did the hybrid angle win?)

Over multiple runs, this data allows the system to:
- Re-weight fitness axes per audience type
- Retire tests that don't discriminate
- Add new tests discovered through failure patterns
- Adjust population sizes (maybe 6 seed angles is enough; maybe 10 is better for technical audiences)

**This is the LLM² loop**: the system doesn't just produce articles — it produces better versions of itself.

---

## Implementation Notes for the Skill File

### Invocation
```
Input: audience (required), topic (optional), constraints (optional)
Output: article + fitness report + evolution log
```

### Execution Model
Phases 1-3 execute in a single turn (audience profiling + angle evolution).
Phase 4 executes in a second turn (parallel drafting — most token-intensive phase).
Phases 5-7 execute in a third turn (merging + evaluation + final output).

**Minimum: 3 turns. Maximum: 4** (if the user wants to review angles before drafting).

### Key Files
```
SKILL.md              — Orchestrator: phase sequencing, invocation logic
fitness-engine.md     — Audience profiling, scoring rubrics, test definitions
evolution-protocol.md — Angle generation, tournament selection, merge mechanics
draft-personas.md     — Prosecutor/Storyteller/Cartographer voice specs
merge-protocol.md     — Section-level and parameter-level merge procedures
stress-tests.md       — The 5 adversarial tests + scoring thresholds
meta-evolution.md     — Cross-run learning, fitness function adaptation
```

### What Makes This Different From a Conventional Writing Team

| Conventional | Sakana |
|---|---|
| One angle, refined linearly | 8 angles, evolved through selection + merging |
| Fixed editorial criteria | Audience-derived fitness function that evolves |
| One draft, iterated | 3+ parallel drafts that compete and cross-pollinate |
| Editor improves a draft | Adversarial stress tests *measure* fitness quantitatively |
| Roles are static | Personas are dynamically configured per audience |
| Output is an article | Output is an article + an evolution log showing *why* this version won |
| Process is identical each time | Process itself mutates based on what worked |

---

## The Philosophical Bet

This architecture bets that the .01% article — the one that creates genuine intellectual value — cannot be reached by linear optimization. It can only be *discovered* through search: seeding diverse candidates, applying selection pressure, allowing recombination to produce emergence, and subjecting survivors to genuinely hostile evaluation.

Sakana proved this works for AI models. This skill applies the same evolutionary logic to the production of ideas.
