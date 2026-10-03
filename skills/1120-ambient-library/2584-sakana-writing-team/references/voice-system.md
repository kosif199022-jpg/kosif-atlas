# Voice System — Profiling, Fingerprint Extraction & Persona Integration

## Purpose

Voice is orthogonal to persona. The Prosecutor, Storyteller, and Cartographer each build arguments differently — but they should all *sound* like the same author. This reference file governs how voice is loaded, fingerprinted, and applied across all drafts.

---

## Step 1: Voice Profile Loading

### If the user has a voice/style guide:
Load it during SENSE. Extract the voice fingerprint (Step 2). Apply to all drafts.

### If the user has published writing samples but no formal guide:
During SENSE, ask: "Do you have 2-3 published pieces that represent your best writing voice? Paste or link them."
If provided, extract the fingerprint from the samples directly (Step 2).

### If neither is available:
Flag to the user: "No voice profile loaded — drafts will be written in a neutral-professional register. For future runs, providing a voice guide or 2-3 writing samples will calibrate the output to sound like you."
Proceed without voice constraints. Log this gap in the evolution log for meta-evolution tracking.

**Register inference (v2.1):** When no voice profile is loaded, infer the appropriate register from the audience fitness profile rather than defaulting blindly to neutral-professional:
- Audience = paying clients or community members → **Coaching-intimate** (directive language, shared context, "try this")
- Audience = peers in the same domain → **Technical-peer** (skip fundamentals, jargon is efficient)
- Audience = broad professional audience → **Professional-conversational** (substance + accessibility)
- Audience = academic or formal context → **Formal-academic** (third person, citations foregrounded)

The Register dimension in `fitness-engine.md` is the canonical source. Voice and register are related but distinct: voice governs how the author sounds; register governs how the article addresses the audience. When they conflict, register wins (it reflects the audience relationship, which is situational and non-negotiable).

---

## Step 2: Voice Fingerprint Extraction

Analyze the voice profile or writing samples across these dimensions:

### Sentence Architecture
- **Average sentence length range** (short/punchy vs. long/complex vs. mixed rhythm)
- **Signature constructions** — Does the author favor fragments? Dashes? Colons that set up reveals? Parallel constructions? One-sentence paragraphs for emphasis?
- **Opening patterns** — How do they typically start a piece? A scene? A claim? A tension?

### Vocabulary & Register
- **Formality level** (1-5: 1=conversational/raw, 5=academic/precise)
- **Jargon comfort** — Does the author use technical terms freely or translate everything?
- **Distinctive word choices** — Any habitual words, phrases, or verbal tics? (These are features, not bugs.)
- **Banned words/constructions** — Anything the author explicitly avoids?

### Rhetorical Signature
- **Dominant move** — What does this author do that others in their space don't? (e.g., "always starts with a concrete micro-story before zooming out," "builds frameworks with named components," "uses borrowed analogies as structural elements not decoration")
- **Emotional register** — Warm? Clinical? Wry? Intense? Where does the author sit on the warmth-precision spectrum?
- **Reader relationship** — Does the author position as peer, teacher, provocateur, guide, fellow traveler?

### Named Signature Moves (if identifiable)
List any recurring structural patterns the author uses. Examples from a prior style guide might include moves like "Felt Sense Opening" (start with a visceral sensory detail), "Borrowed Lens" (explain one domain through another), "Reframe as Climax" (the central reframe arrives at the moment of maximum tension), etc.

### Output Format

```
VOICE FINGERPRINT
=================
Sentence Architecture:
  Length range: [e.g., "Mixed — short declaratives for claims, longer for evidence"]
  Signature constructions: [e.g., "Colon-reveals, one-sentence paragraphs, em-dash asides"]
  Opening pattern: [e.g., "Concrete scene or specific observation, never abstract"]

Vocabulary & Register:
  Formality: [1-5]
  Jargon: [e.g., "Uses freely but always defines on first use"]
  Distinctive choices: [list]
  Banned: [list]

Rhetorical Signature:
  Dominant move: [description]
  Emotional register: [description]
  Reader relationship: [peer/teacher/provocateur/guide]

Named Signature Moves: [list with brief descriptions]
```

---

## Step 3: Persona-Voice Integration

Each draft persona controls *argument architecture*. The voice profile controls *sentence-level sound*. They combine as follows:

### The Prosecutor + Voice
The Prosecutor builds cases through evidence accumulation. The voice profile determines:
- How the evidence is *presented* (clinical precision vs. conversational directness)
- How objections are *addressed* (combative vs. generous vs. wry)
- What the closing *sounds like* (triumphant verdict vs. quiet certainty)

### The Storyteller + Voice
The Storyteller leads with narrative. The voice profile determines:
- How scenes are *rendered* (spare vs. lush, distant vs. intimate)
- How the protagonist's experience is *voiced* (reported vs. inhabited)
- How the thesis *crystallizes* (explicit statement vs. felt implication)

### The Cartographer + Voice
The Cartographer maps territory. The voice profile determines:
- How new terms are *introduced* (formal definition vs. demonstration vs. contrast)
- How the map is *presented* (systematic vs. exploratory vs. revelatory)
- How boundaries and gaps are *named* (neutral observation vs. pointed commentary)

### Integration Rule
When persona tendency and voice profile conflict, **voice wins at the sentence level, persona wins at the structural level.** Example: if the Prosecutor wants a short declarative "This is wrong." but the voice profile consistently uses longer, more qualified sentences — the draft should express the Prosecutor's certainty in the voice's characteristic rhythm: "This is wrong, and the reason it's wrong tells you something important about the assumption underneath it."

---

## Step 4: Voice Consistency Check (Post-Draft)

After all drafts are produced, before merging:
1. Sample 3 paragraphs from each draft.
2. Check: could these 9 paragraphs plausibly have been written by the same author?
3. If voice has drifted (one persona's structural tendencies overrode the voice), flag the specific passages and rewrite them to match the fingerprint.

This check is especially important for the Cartographer, which tends toward a more clinical/taxonomic register that may conflict with warmer or more conversational voice profiles.
