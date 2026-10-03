# REFINE Operation — Evolutionary Craft Optimization

## Purpose

REFINE applies evolutionary pressure to *craft* rather than *content*. It operates on drafts whose architecture is already sound — the thesis is sharp, the evidence is grounded, the borrowed lens is structural — but whose paragraph-level execution can be improved through competitive constraint testing.

REFINE is not a mode. It's an operation that activates within existing modes at the point where a draft exists and can benefit from craft-level optimization. It can also be invoked standalone when the user brings existing content that needs rewriting without structural changes.

---

## When REFINE Activates

### Within the normal pipeline

REFINE fires after DRAFT and before STRESS (or after MERGE and before final STRESS, depending on mode) when:
- The draft passes the Compression Test (thesis survives compression with falsifiability, specificity, and power intact)
- The draft passes the Emergence Test (at least partial pass — the content has genuine intellectual substance)
- The user has provided craft constraints (e.g., paragraph-opening techniques, stylistic instructions, register shifts)

If Compression or Emergence fails, the problem is upstream — return to the angle or draft level. REFINE polishes execution. It does not repair architecture.

### Standalone invocation (user brings existing content)

REFINE can also be triggered directly when:
- The user uploads or pastes a completed article and asks for a rewrite
- The user provides craft-level refinement instructions (paragraph-level techniques, stylistic constraints, voice modifications)
- The user asks to "tighten," "sharpen," "upgrade the prose," or "rewrite with [specific technique]"

In standalone mode, REFINE runs: ANALYZE → SEED CONSTRAINTS → APPLY → STRESS (comparative). No SENSE/SEED/EVOLVE needed — the content already exists.

### What REFINE does NOT do

- Does not change the article's thesis, borrowed lens, or structural architecture
- Does not add or remove evidence (unless the evidence is fabricated — fabrication filter still applies)
- Does not restructure sections or reorder arguments
- Does not operate on content that hasn't passed Compression and Emergence (in pipeline mode)

---

## The REFINE Pipeline

### Step 1 — ANALYZE (standalone mode only)

When the user brings existing content, extract what the pipeline would normally have built during earlier phases:

- **Voice fingerprint** — Extract from the content itself (see `references/voice-system.md`, Step 2)
- **Passage classification** — Classify every paragraph by type using `references/passage-taxonomy.md`
- **Structure map** — Identify the four structural regions (Opening, Escalation, Pivot, Resolution)
- **Evidence inventory** — Catalog all research, data, and named examples (these are preserved during rewrite)
- **Borrowed lens identification** — Name the cross-domain lens and note where it appears
- **Delivery format and register inference** — Infer from the content's existing section weights and voice

Output a brief ANALYZE summary for the user to confirm before proceeding.

### Step 2 — SEED CRAFT CONSTRAINTS

This is the evolutionary core of REFINE. Instead of seeding *angles* (the content is fixed), seed *craft constraints* — different paragraph-level strategies for how to write the same content.

**Population: 3-4 constraint sets.** Each is a complete set of instructions for how to open paragraphs, pace sentences, handle transitions, and close sections.

**Seeding sources:**

1. **User-provided constraint** (if any). The user's specific refinement instruction becomes Constraint Set 1. Example: the "invisible filler" technique ("silently think of a conversational filler phrase, delete it, write the sentence that would follow").

2. **Complementary constraints** (generated). Generate 2-3 alternative craft constraint sets that address different aspects of paragraph-level quality. These should be genuinely different strategies, not minor variations.

   Example constraint types (illustrative, not exhaustive):
   - **Concrete-noun entry:** Open every paragraph with the most specific concrete noun available. No abstractions in position 1.
   - **Consequence-first:** Open with what changed or what follows, not with what is. The cause comes after the effect.
   - **Smallest-true-thing:** Open with the smallest observation you can make that's genuinely true. Scale up from there. Never open with the largest claim.
   - **Mid-action entry:** Open as if the reader arrived mid-scene. No setup, no context. The context emerges from the specifics.

3. **Passage-type specialization** (if the user's constraint is strong enough to anchor the set). Take the user's constraint and generate variants that modify it for different passage types. Example: the "invisible filler" technique applied strictly to Argument and Evidence passages, softened for Confrontation passages (where the "filler" becomes a gentler conversational opener like "I know this is hard to hear" rather than "look"), and skipped entirely for Landing passages (which need earned weight, not conversational entry).

**Minimum distance constraint:** No two constraint sets should produce similar paragraph openings for the same passage type. If two sets would both produce "mid-thought" entries for Argument passages, one needs to differentiate.

### Step 3 — APPLY (Per-Passage-Type Tournament)

This is where the evolutionary pressure happens.

**For each passage type present in the article:**

1. Select 2-3 representative paragraphs of that type from the article.
2. Rewrite each paragraph under each constraint set. This produces a matrix:

```
                    Constraint A    Constraint B    Constraint C
Argument para 1     [rewrite]       [rewrite]       [rewrite]
Argument para 2     [rewrite]       [rewrite]       [rewrite]
Evidence para 1     [rewrite]       [rewrite]       [rewrite]
Confrontation p 1   [rewrite]       [rewrite]       [rewrite]
...
```

3. Score each rewrite on two dimensions (from `references/passage-taxonomy.md`):
   - **Entry Quality** (1-10): Does the opening sentence feel mid-thought, specific, and committed? Or does it feel like a topic sentence, thesis statement, or abstract framing?
   - **Pacing Calibration** (1-10): Does the sentence rhythm match what this passage type needs? Fast for argument, spacious for confrontation, invisible for transition, residue-heavy for landing?

4. Select the winning constraint per passage type. A constraint that wins for Argument may lose for Confrontation. That's expected and desired — the point is conditional application, not uniform victory.

**Output: a constraint map.**

```
CONSTRAINT MAP
==============
Argument passages:      → Constraint [A/B/C] — because [why]
Evidence passages:       → Constraint [A/B/C] — because [why]
Confrontation passages:  → Constraint [A/B/C] — because [why]
Advice passages:         → Constraint [A/B/C] — because [why]
Transition passages:     → Constraint [A/B/C] — because [why]
Landing passages:        → Constraint [A/B/C] — because [why]
```

### Step 4 — EXECUTE

Apply the constraint map to the full article:

1. Classify every paragraph by type (from Step 1 or from the draft's existing classification).
2. For each paragraph, apply the winning constraint for its type.
3. Preserve all evidence, research citations, borrowed lens appearances, and structural architecture.
4. Apply voice fingerprint and anti-AI-isms enforcement as in normal drafting.

The output is a complete rewritten article.

### Step 5 — STRESS (Comparative Mode)

Run stress tests on both the original and the refined version. See `references/stress-tests.md`, "Comparative Evaluation Mode."

The comparative tests produce delta scores — where did refinement improve, where did it regress, where was it neutral? Regressions are flagged for manual review or targeted mutation.

---

## Parallelism in REFINE

```
Phase               Parallel Operations                 Max Concurrent
─────────────────────────────────────────────────────────────────────
SEED CONSTRAINTS    Independent — generated in sequence  1 (fast, no search)
APPLY               Per-passage-type × per-constraint    up to 18
                    (6 types × 3 constraints)
STRESS (comparative) Per-test × per-version              up to 12
                    (6 tests × 2 versions)
─────────────────────────────────────────────────────────────────────
Serial: ANALYZE, constraint map selection, EXECUTE
```

The heaviest parallel phase is APPLY — but in practice, the tournament sampling (2-3 paragraphs per type, not all paragraphs) keeps the total manageable. EXECUTE is serial because it needs the constraint map from APPLY.

---

## REFINE in Each Mode

```
              FLAGSHIP    STANDARD    SPRINT    VAULT
──────────────────────────────────────────────────────
REFINE        optional    optional    no        no
Constraints   3-4         3           —         —
Tournament    full        sampled     —         —
Comparative   yes         yes         —         —
  stress
──────────────────────────────────────────────────────
```

REFINE is optional in FLAGSHIP and STANDARD — it fires when craft constraints are provided by the user, or when the stress tests on the initial draft reveal craft-level weaknesses (high Substitution Test failure, Boredom Detector marginal pass) despite strong architecture. It does not fire in SPRINT or VAULT, where speed matters more than craft optimization.

Standalone REFINE (user brings existing content) operates outside the mode system. It runs its own pipeline regardless of what mode would otherwise apply.

---

## Craft Constraint Persistence

After each REFINE run, save the winning constraint map to the vault:

```json
{
  "constraint_map": {
    "audience_type": "practiced knowledge entrepreneurs",
    "delivery_format": "thought piece",
    "register": "professional-conversational",
    "date": "2026-04-11",
    "constraints": {
      "argument": {
        "name": "invisible-filler",
        "description": "Think of conversational filler, delete it, write the sentence that follows",
        "entry_quality_score": 8.5,
        "pacing_calibration_score": 7.8
      },
      "evidence": {
        "name": "invisible-filler",
        "description": "...",
        "entry_quality_score": 8.2,
        "pacing_calibration_score": 8.0
      },
      "confrontation": {
        "name": "smallest-true-thing",
        "description": "Open with the smallest genuinely true observation, scale up",
        "entry_quality_score": 7.5,
        "pacing_calibration_score": 9.1
      }
    }
  }
}
```

On future runs with the same audience type and delivery format, the system loads the stored constraint map as the default and only runs the tournament if the user provides new constraints or requests optimization. This is the meta-evolution hook — the system learns which craft approaches work for which audience/format combinations.

---

## Integration with Existing Pipeline

REFINE reads from:
- `references/passage-taxonomy.md` — passage type classification and pacing targets
- `references/voice-system.md` — voice fingerprint for consistency enforcement
- `references/anti-ai-isms.md` — banned constructions (enforced during EXECUTE)
- `references/stress-tests.md` — comparative evaluation mode
- `references/fitness-engine.md` — audience fitness profile (for parameterizing passage-type targets)

REFINE writes to:
- `references/meta-evolution.md` — craft constraint effectiveness data
- Vault — constraint map persistence
