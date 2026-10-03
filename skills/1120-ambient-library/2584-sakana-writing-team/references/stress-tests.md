# Stress Tests — Adversarial Fitness Evaluation (v2)

## Purpose

Six tests subject candidate articles to genuinely hostile scrutiny. v2 adds the Compression Test (Test 6) and strengthens the Emergence Test with a mandatory derivation proof. Each test has a quantitative threshold. Run in order.

---

## Test 1: The Boredom Detector (unchanged from v1)

### What It Tests
Whether the article says things the audience has already heard.

### Procedure
1. Retrieve the Boredom Map from the audience fitness profile.
2. Flag any sentence that restates a boredom map entry, could appear in a generic article on the topic, or uses filler phrases.
3. Also check against `references/anti-ai-isms.md` — any banned construction is flagged.
4. Calculate: Boredom Ratio = flagged sentences / total sentences.

### Threshold
- **Pass:** < 10%
- **Marginal:** 10-15%
- **Fail:** > 15%

### Mutation Protocol
Cut, replace with specific claims, or rewrite with non-obvious framing.

---

## Test 2: The So-What Gauntlet (unchanged from v1)

### What It Tests
Whether the article's claims matter to the audience.

### Procedure
1. Extract every major claim.
2. For each: "A smart, busy audience member reads this. They say 'so what?' Does the article answer within 2 sentences?"
3. Calculate: Survival Rate = survived claims / total claims.

### Threshold
- **Pass:** > 85%
- **Marginal:** 70-85%
- **Fail:** < 70%

### Mutation Protocol
Add stakes sentences. If no stakes can be written, cut the claim.

---

## Test 3: The Overnight Test (unchanged from v1)

### What It Tests
Whether the article leaves a lasting impression.

### Procedure
1. Simulate: "48 hours later, the reader describes this article to a friend. What do they say?"
2. Generate that one-sentence summary.
3. Evaluate: does it contain a specific reframe, image, or framework? Or is it generic?

### Threshold
- **Pass:** Summary contains at least one specific, memorable element.
- **Fail:** Summary could describe any article on this topic.

### Mutation Protocol
Identify and amplify the article's strongest moment. Ensure it sits in the Pivot section.

---

## Test 4: The Substitution Test (unchanged from v1)

### What It Tests
Whether the article has a distinctive voice.

### Procedure
1. Imagine a different author's byline. Flag paragraphs where the substitution feels seamless.
2. Cross-reference flagged passages against `references/anti-ai-isms.md`.
3. Cross-reference against the voice fingerprint (if loaded). Does the flagged passage match the author's actual voice or a generic register?
4. Calculate: Substitutable % = substitutable paragraphs / total paragraphs.

### Threshold
- **Pass:** < 20%
- **Marginal:** 20-40%
- **Fail:** > 40%

### Mutation Protocol
Replace generic constructions with voice-specific ones. Inject the borrowed lens. Add texture.

---

## Test 5: The Emergence Test with Derivation Proof (v2 — strengthened)

### What It Tests
Whether the evolutionary process actually produced something new — AND whether the system can prove it.

### Procedure

**Step 1 — Identify the core insight.**
What is the article really saying underneath the thesis statement?

**Step 2 — Novelty check.**
Could this insight have been produced by summarizing a single existing source? By combining two well-known ideas in the obvious way? By restating conventional wisdom with better prose?

**Step 3 — Framework database novelty check (if available).**
Search the database for the closest match. Three outcomes:
- No match → strong emergence signal
- Partial match → acceptable if the article extends/inverts/complicates the existing framework
- Full match → FAIL (the process rediscovered an existing framework)

**Step 4 — Derivation proof (NEW in v2).**
For each claimed emergent insight, the system must produce:

```
EMERGENCE DERIVATION PROOF
===========================
Insight: [state the emergent insight in one sentence]

Source 1: [which angle, draft, or merge contributed element A?]
Source 2: [which angle, draft, or merge contributed element B?]
Collision point: [where specifically did A and B collide?]
  - Phase: [EVOLVE angle merge / DRAFT persona difference / MERGE section assembly]
  - Mechanism: [thesis transplant / lens collision / structural recombination / 
    section-level DFS merge / element-level PS injection]

Could Source 1 alone produce this insight? [yes/no — explain]
Could Source 2 alone produce this insight? [yes/no — explain]
Could a single-draft process have produced this insight? [yes/no — explain]
```

If the system cannot complete the derivation proof — if it can't trace the insight to a specific collision between specific sources — the emergence claim is **downgraded to "good idea, not emergent."** The article may still be strong, but the evolutionary process hasn't demonstrated its core value proposition.

### Threshold
- **Pass:** At least one emergent insight with complete derivation proof, central to the article.
- **Partial pass:** Emergent insight identified but derivation proof is incomplete. Log for meta-evolution.
- **Fail:** No emergent insight, or all insights traceable to single sources.

### Mutation Protocol
If fail: re-examine the borrowed lens (foreign enough?), re-examine the merge (genuine recombination or just selection?), attempt a forced collision between the article's strongest claim and the borrowed lens's most foreign concept.

---

## Test 6: The Compression Test (NEW in v2)

### What It Tests
Whether the thesis is sharp enough to survive compression — whether the article *knows what it's about*.

### Procedure

**Step 1 — Compress the thesis to one sentence.**
Not a summary of the article. The *thesis* — the single claim the article is making. Write it as a sentence someone could disagree with.

**Step 2 — Evaluate the compression.**
Three checks:
- **Falsifiability:** Could a reasonable person argue the opposite? If not, the thesis is too vague. ("Good content requires effort" is not falsifiable. "Adversarial stress on ideas is generative, not selective" is.)
- **Specificity:** Does the compressed thesis contain at least one specific, concrete element — a named mechanism, a specific claim about how something works, a particular practice? If the thesis could apply to any topic by swapping nouns, it's too generic.
- **Power preservation:** Is the compressed thesis still interesting? Does it still create tension? If compression drains the energy, the article may be relying on prose quality rather than intellectual substance to hold attention.

**Step 3 — The Swap Test.**
Replace the article's thesis with a generic alternative ("Good content requires [X]"). If the article still reads roughly the same with the generic thesis — if the specific thesis isn't *load-bearing* in every section — the thesis is decorative rather than structural.

### Threshold
- **Pass:** Thesis survives compression with falsifiability, specificity, and power intact. Swap Test shows the thesis is load-bearing.
- **Marginal:** Thesis compresses but loses some power or specificity.
- **Fail:** Thesis cannot be compressed to one sentence, or the compressed version is unfalsifiable/generic, or the Swap Test reveals it's decorative.

### Mutation Protocol
If marginal/fail:
- Identify the article's actual core claim (which may differ from its stated thesis).
- If the actual core claim is stronger than the stated thesis, elevate it.
- If the article doesn't have a sharp core claim, the problem is structural — return to the angle level. What is this article actually *arguing*? If the answer is vague, the angle wasn't sharp enough to draft.

---

## Aggregate Scoring (updated for v2)

```
STRESS TEST SCORECARD
=====================
Candidate: [Draft M / Draft E / Original]

Test 1 — Boredom Detector:    [PASS/MARGINAL/FAIL] (Ratio: X%)
Test 2 — So-What Gauntlet:    [PASS/MARGINAL/FAIL] (Survival: X%)
Test 3 — Overnight Test:      [PASS/FAIL] (Summary: "[one-sentence]")
Test 4 — Substitution Test:   [PASS/MARGINAL/FAIL] (Substitutable: X%)
Test 5 — Emergence Test:      [PASS/PARTIAL/FAIL] (Derivation: [complete/incomplete/none])
Test 6 — Compression Test:    [PASS/MARGINAL/FAIL] (Thesis: "[one-sentence]")

Overall: [X/6 tests passed]
```

Tiebreaker priority: Test 5 (Emergence) > Test 6 (Compression) > Test 3 (Overnight) > Tests 1, 2, 4.
