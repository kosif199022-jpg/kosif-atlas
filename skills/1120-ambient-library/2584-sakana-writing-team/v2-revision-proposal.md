# Sakana Writing Team v2 — Root-Cause Revision Proposal

Based on the full feedback arc from the AIMM knowledge entrepreneur run.

---

## Feedback → Root Cause Map

| # | Feedback | Root Cause | File |
|---|----------|-----------|------|
| 1 | Fictional vignettes feel cringe | No fabrication filter; Storyteller persona defaults to composite characters when real examples aren't available | `draft-personas.md` (Evidence Constraints) |
| 2 | Opening wasn't structured for pull/promise | No delivery format awareness; skill assumes "thought piece" structure for everything | `fitness-engine.md` (missing dimension) |
| 3 | Too formal/academic register | No register calibration; voice system handles author voice but not audience-appropriate register | `fitness-engine.md` (missing dimension) |
| 4 | "Positioning but with maps" — no genuine turn | Fitness axes don't test for structural surprise that goes beyond the borrowed lens; no "reframe-of-the-reframe" requirement | `stress-tests.md` (gap) |
| 5 | HOW section too thin; 4MAT weight was wrong | No structural template system; Action Horizon hints at it (Build/Teach) but doesn't translate into section weight distribution | `SKILL.md` pipeline + `fitness-engine.md` |
| 6 | "I don't get the bloated Greenland" — mechanism unexplained | Borrowed lens constraints require recurrence and insight-enabling but NOT mechanism grounding | `draft-personas.md` (Borrowed Lens Constraints) |
| 7 | "How?" — unsubstantiated claim left in | Same as above; analogy assertions aren't required to explain their causal logic | `draft-personas.md` |
| 8 | "Sacrifice" was the wrong frame | No framing stress test; the core metaphorical frame isn't challenged during STRESS or CHALLENGE | `stress-tests.md` (gap) |
| 9 | Excludes course creators/digital people | Avatar Reviewer caught weaknesses but not audience-segment blind spots | `avatar-reviewer.md` (gap) |

---

## Seven Proposed Revisions

### Revision 1: Add "Delivery Format" to Fitness Engine (Dimension 4)

**Where:** `fitness-engine.md`, after Dimension 3 (Action Horizon)

**What:** A new dimension that determines structural weight distribution before drafting begins.

```
### Dimension 4: Delivery Format
Ask: *What type of piece does this audience need?*

Classify:
- **Thought piece** — The value is the reframe itself. WHY/WHAT heavy (60%+), 
  HOW light. Reader leaves thinking differently.
- **Practitioner guide** — The value is what they can do with it. WHY/WHAT 
  compressed (30%), HOW/WHAT-IF expanded (70%). Reader leaves with an exercise 
  they can run this week.
- **Newsletter/signal** — The value is being ahead. WHY dominant (40%), WHAT 
  compressed (30%), HOW as implication (30%). Reader leaves with something to 
  say at their next meeting.
- **Tutorial** — The value is execution. WHY minimal (10%), WHAT as setup (20%), 
  HOW dominant (60%), WHAT-IF as troubleshooting (10%).
- **Keynote companion** — The value is depth behind a talk. Match the talk's 
  structure. WHY/WHAT mirror the keynote; HOW/WHAT-IF extend it.

This determines: section weight distribution, level of practical scaffolding 
required, whether examples need to be executable (practitioner guide) or 
illustrative (thought piece), and minimum word count for the HOW section.

Cross-reference with Action Horizon:
- Build → default to Practitioner Guide unless overridden
- Teach → default to Practitioner Guide or Tutorial
- Rethink → default to Thought Piece
- Decide → default to Thought Piece or Newsletter
- Buy → default to Newsletter
```

**Why this fixes it:** The AIMM run was profiled as Practiced + Pattern Hunger + Rethink. But the user actually needed a Practitioner Guide (for paid coaching clients). The skill defaulted to Thought Piece structure because there was no dimension to distinguish them. Adding Delivery Format forces the pipeline to set structural weight BEFORE drafting.

---

### Revision 2: Add "Register" to Fitness Engine (Dimension 5)

**Where:** `fitness-engine.md`, after new Dimension 4

**What:** A register classification that tells all personas and the anti-AI-isms pass what level of formality to target.

```
### Dimension 5: Register
Ask: *What is the relationship between the author and this audience?*

Classify:
- **Formal-academic** — The reader expects rigor and distance. Third person. 
  Citations matter. "The evidence suggests."
- **Professional-conversational** — The reader expects substance delivered 
  accessibly. Second person mixed with first. Contractions OK. Data without 
  the lectern. "Here's what the data shows."
- **Coaching-intimate** — The reader is a paying client or community member. 
  Direct address. Directive language OK. "Try this." "Here's what I need 
  you to do." Shared context assumed.
- **Technical-peer** — The reader has equal or greater domain expertise. 
  Jargon is efficient, not exclusionary. Skip fundamentals. "You already 
  know X; here's the part you're missing."

This determines: vocabulary level, sentence structure, acceptable use of 
directives, degree of assumed shared context, and whether the piece reads 
as "writing to" or "writing for" the audience.
```

**Why this fixes it:** Three revision rounds were spent loosening the register from formal-academic to coaching-intimate. The skill never asked what register to target. Voice system handles how the AUTHOR sounds; Register handles how the piece ADDRESSES the audience.

---

### Revision 3: Add Fabrication Filter to Draft Personas

**Where:** `draft-personas.md`, under "Hard Constraints (All Personas)" → "Evidence Constraints"

**What:** Explicit prohibition on composite characters for Practiced/Expert audiences, with alternative moves.

```
### Fabrication Filter
The Evidence Constraints already prohibit hypothetical examples ("Imagine a 
company that..."). This extends to **composite characters** — invented people 
presented as specific individuals (e.g., "A consultant named James...").

For Practiced and Expert audiences, composite characters are an immediate 
credibility failure. These readers know the space well enough to recognize 
a fabricated case study on sight.

When real named examples aren't available for openings or case studies, 
use these alternatives in order of preference:

1. **Direct second-person address.** "You've been in the meeting where..." 
   Speak to the reader's actual experience. They'll supply their own 
   specifics, which is more powerful than yours.
2. **Documented/real examples.** Named companies, named people, named events 
   with verifiable specifics.
3. **Pattern description without character.** "The typical version of this 
   looks like..." Describe the pattern honestly rather than wrapping it 
   in a fake person.
4. **Flag the gap.** Tell the user: "I need a real example here. Do you 
   have a client case (anonymized is fine) we could use?"

Never fabricate a composite character and present them as a real individual 
for Practiced or Expert audiences. The Storyteller persona can still use 
narrative structure — but the narrative should be the reader's own experience 
reflected back to them, or a documented case, not a fictional proxy.
```

**Why this fixes it:** The Storyteller's mode of argument ("leads with a specific human moment") naturally generates composite characters when no real ones are available. The current Evidence Constraints say "no hypothetical" but the Storyteller reads that as "make them specific" rather than "make them real." This closes the gap explicitly.

---

### Revision 4: Add Mechanism Grounding to Borrowed Lens Constraints

**Where:** `draft-personas.md`, under "Hard Constraints (All Personas)" → "Borrowed Lens Constraints"

**What:** A fourth constraint requiring the analogy's MECHANISM to be explained, not just asserted.

```
### Borrowed Lens Constraints (updated — add as 4th bullet)

- The borrowed lens must **explain its own mechanism** within the article. 
  It is not enough to state what the lens shows; the article must explain 
  WHY the lens produces the effects it does. The reader should understand 
  the causal logic connecting the borrowed domain to the target domain.
  
  Test: If a reader asks "but why does that happen?" about the core analogy, 
  can the article answer from its own text? If the mechanism is asserted 
  but not explained, the lens is decorative.
  
  Example (fail): "Mercator made Greenland huge to preserve navigation 
  angles." (Reader: "But why would preserving angles make Greenland huge?")
  
  Example (pass): "On a real globe, longitude lines converge at the poles. 
  On a flat map, they have to be parallel. To keep angles consistent, 
  Mercator had to stretch everything near the poles to compensate — and 
  the further from the equator, the more extreme the stretch."
  
  The mechanism explanation need not be long. But it must be present. 
  Without it, the reader accepts the analogy on faith rather than 
  understanding, and faith-based analogies don't transfer into the 
  reader's own thinking.
```

**Why this fixes it:** Two rounds of feedback were about the Mercator analogy being unclear — not the analogy itself, but the mechanism (why angles cause size distortion, why mapmakers before him worked differently). The existing constraints ensure the lens is structural and recurrent but don't ensure the reader UNDERSTANDS why it works.

---

### Revision 5: Add "Framing Test" to Stress Tests (Test 7)

**Where:** `stress-tests.md`, after Test 6 (Compression Test)

**What:** A stress test that challenges the core metaphorical framing of the argument.

```
## Test 7: The Framing Test (NEW)

### What It Tests
Whether the article's core framing — the metaphorical or conceptual frame 
through which the argument is presented — is the strongest available frame 
for this argument.

### Procedure

Step 1 — Identify the dominant frame.
What is the primary metaphor, analogy, or conceptual frame the article uses 
to present its argument? State it in one phrase. (e.g., "trade-off / sacrifice," 
"map projection / distortion," "lens / focus.")

Step 2 — Generate 2-3 alternative frames.
How else could you frame the same argument? What other metaphorical structures 
would carry the same insight? (e.g., instead of "sacrifice," try "evidence of 
commitment." Instead of "trade-off," try "the lens makes things look different.")

Step 3 — Compare.
For each alternative frame, ask:
- Does this frame make the argument clearer to the target audience?
- Does this frame avoid implications the article doesn't intend? 
  ("Sacrifice" implies loss. "Evidence of commitment" implies proof. 
  Which implication serves the argument better?)
- Does this frame make the actionable parts more obvious?

Step 4 — Verdict.
If an alternative frame is strictly better (clearer, more accurate to the 
argument's actual claim, fewer unintended implications), flag the current 
framing as a FAIL and recommend the reframe.

### Threshold
- Pass: Current framing is the strongest available, or no alternative 
  is strictly better.
- Marginal: An alternative frame is slightly better but the current one 
  is defensible.
- Fail: An alternative frame is clearly better and the current frame 
  introduces confusion or unintended implications.

### Mutation Protocol
Replace the dominant frame. This may require significant rewriting — the 
frame is typically load-bearing across the entire article. The mutation 
should preserve the argument while changing how it's packaged.
```

**Why this fixes it:** The "sacrifice" framing persisted through multiple drafts, merges, and stress tests. No existing test challenges the FRAME of the argument — only the content, voice, specificity, and compression of it. The user had to tell us that "sacrifice" was the wrong word and "evidence the lens is working" was the right one. This test would have caught it.

---

### Revision 6: Split Generativity → Intellectual Generativity + Practical Actionability

**Where:** `fitness-engine.md`, Axis 4

**What:** Split the current Generativity axis into two separate axes, or add Actionability as a 9th axis.

```
**4a. Intellectual Generativity (1-10)**
Does the article create new questions, frameworks, or vocabulary that the 
reader can apply to other domains? Score 10 if it gives the reader a new 
lens they'll use for months. Score 1 if it answers a question without 
opening any new ones.
- Weight: HIGH for Teach and Rethink action horizons.

**4b. Practical Actionability (1-10)**
Can the reader DO something specific within 7 days of reading? Score 10 
if the article contains a complete, executable exercise with clear steps, 
validation criteria, and worked examples. Score 5 if it points toward 
action but leaves the reader to figure out the steps. Score 1 if the 
reader finishes thinking differently but doing nothing differently.
- Weight: HIGH for Build action horizon and Practitioner Guide format.
  MODERATE for Teach. LOW for Rethink and Newsletter.

Weight adjustments:
- Practitioner Guide format → Actionability +1.0
- Build action horizon → Actionability +0.5
- Teach action horizon → Actionability +0.3
- Practical Urgency trigger → Actionability +0.5
```

**Why this fixes it:** The AIMM audience was scored as Pattern Hunger (which boosted Structural Surprise and Generativity). But Generativity was defined as intellectual generativity ("new questions, frameworks, vocabulary"), not practical actionability ("can you do this by Friday"). The piece scored well on Generativity because it gave readers a new lens — but the user needed it to also give readers an exercise. Splitting the axis ensures the pipeline doesn't optimize for one at the expense of the other.

---

### Revision 7: Add Audience Segment Coverage to Avatar Reviewer

**Where:** `avatar-reviewer.md`, after "Avatar Construction"

**What:** When the target audience contains identifiable sub-segments, the Avatar Review should rotate through them.

```
### Segment Coverage Check

After constructing the primary Avatar, identify 2-3 distinct sub-segments 
within the target audience. These are people who fit the audience description 
but whose relationship to the topic differs meaningfully.

Example for "knowledge entrepreneurs who actively use AI":
- Sub-segment A: High-touch consultants (work in rooms, 1-on-1)
- Sub-segment B: Course creators (digital products, work at scale)
- Sub-segment C: Hybrid practitioners (coaching + digital)

For each draft, the Avatar Review runs the primary avatar. But at 
Checkpoint 5 (Close), add a segment scan:

**Segment Scan:** For each sub-segment, ask:
- Does this article speak to their version of the problem?
- Does the practical advice apply to their delivery model?
- Is there a passage that would make this sub-segment feel excluded 
  or unseen?

Flag any sub-segment that the article doesn't serve. This is not a 
requirement to serve all segments equally — but it IS a requirement 
to be aware of which segments the article's framing excludes, so the 
user can make an informed decision.

If the primary avatar represents only one sub-segment and the article 
is intended for the full audience, flag the gap before MERGE.
```

**Why this fixes it:** The article's "specific scar tissue in a specific room" framing excluded course creators and digital product builders — a significant portion of the AIMM audience. The Avatar Review caught weaknesses in engagement and momentum, but it only simulated ONE member of the audience. A segment scan at Checkpoint 5 would have flagged: "This doesn't speak to course creators, who don't work in rooms."

---

## Pressure-Testing Against Core Intent

The skill's identity is evolutionary content production — population-based search, novelty, emergence, adversarial selection. Any revision that compromises those mechanics isn't worth the fix.

| Revision | Compromises core? | Verdict |
|----------|-------------------|---------|
| Delivery Format | No — shapes output structure, doesn't change evolution | **Keep as proposed** |
| Register | Partially redundant with voice system | **Downgrade** — fold into voice-system.md as register guidance, not a new dimension |
| Fabrication Filter | Risk: could neuter the Storyteller persona | **Modify** — gate by sophistication level. Practiced/Expert: strict. Informed/Naive: composites OK with disclosure |
| Mechanism Grounding | Low risk, but forced mechanism for every lens could kill momentum | **Modify** — SHOULD, not MUST. "If the mechanism can be explained in 1-2 paragraphs, explain it. Otherwise flag as known gap." |
| Framing Test | Adds pipeline weight (7th stress test); inherently subjective | **Replace** — add a 4th Skeptic Challenge question: "Is the core metaphorical frame the right one?" Keeps adversarial pressure without adding pipeline stages |
| Actionability axis | Adding a 9th axis changes scoring math everywhere | **Replace** — Delivery Format (Rev 1) handles this structurally. Add minimum HOW word-count thresholds to draft-personas.md for Practitioner Guide format |
| Segment Coverage | Low risk, low effort | **Keep as proposed** |

---

## Final Recommendation: 4 Changes, Ranked

These four changes would have prevented 7 of the 9 feedback rounds in this run without adding pipeline weight or compromising the evolutionary engine.

### 1. Delivery Format dimension in fitness-engine.md (HIGH IMPACT)

Add Dimension 4 as proposed above. This is the single highest-leverage change. It forces the pipeline to decide structural weight distribution (WHY/WHAT/HOW/WHAT-IF) during SENSE, before a single word is drafted. Thought pieces, practitioner guides, newsletters, and tutorials all run through the same evolutionary engine but produce structurally different outputs. Cross-reference with Action Horizon so Build defaults to Practitioner Guide.

### 2. Fabrication Filter in draft-personas.md (MEDIUM IMPACT)

Add the filter as proposed, but gated by sophistication. For Practiced and Expert audiences: no composite characters, period. Use direct second-person address, documented examples, or flag the gap. For Informed and Naive audiences: composites acceptable if they're honest about being composites. This preserves the Storyteller's narrative power for audiences where it works while preventing the cringe for audiences where it doesn't.

### 3. Mechanism Grounding in Borrowed Lens Constraints (MEDIUM IMPACT)

Add the 4th borrowed lens constraint as a SHOULD: "If the borrowed lens's mechanism can be explained concisely (1-2 paragraphs), the article must explain WHY the lens produces the effects it describes, not just assert that it does. If explaining the mechanism would require a major detour that damages momentum, flag it as a gap and let the user decide." This catches the Mercator problem (why do angles cause size distortion?) without forcing every analogy into an explanatory detour.

### 4. Skeptic Challenge enhancement + Segment Scan (LOW IMPACT, LOW EFFORT)

Two small additions:
- Add a 4th Skeptic Challenge question: "Is the core metaphorical frame the right one? Could you reframe this argument through a different conceptual structure that would be clearer, more accurate, or avoid unintended implications?" This catches the "sacrifice" framing problem without adding a new stress test.
- Add the Segment Coverage scan to Avatar Reviewer at Checkpoint 5. When the audience contains identifiable sub-segments, flag which ones the article doesn't serve.

### What I'd skip

- **Register as its own dimension.** Voice system can absorb this with a one-paragraph addition to voice-system.md: "If no voice profile is loaded, infer register from audience sophistication and delivery format."
- **Actionability as a 9th axis.** Delivery Format handles the structural problem. Adding an axis changes scoring math globally for a problem that only affects certain delivery formats.
- **Framing Test as a 7th stress test.** The Skeptic Challenge enhancement achieves the same thing with less pipeline bloat.
