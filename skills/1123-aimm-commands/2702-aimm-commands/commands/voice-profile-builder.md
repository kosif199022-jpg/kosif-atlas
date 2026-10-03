---
name: The Voice Profile Builder
type: command
description: Construct a precise, reusable model of anyone's writing voice by analyzing the delta between their drafts and their edits — the gap between "what AI wrote" and "what I actually sound like" is the most information-dense signal for voice modeling.
source: multiple — Jul 17, 2025 AIMM session on building voice profiles from draft/edit deltas
trigger: /aimm:voice-profile-builder
location: wiki/mastermind/commands/
source-sessions:
  - 2025-07-17_Mastermind
---

# The Voice Profile Builder

Construct a precise, reusable model of anyone's writing voice by analyzing the delta between their drafts and their edits — the gap between "what AI wrote" and "what I actually sound like" is the most information-dense signal for voice modeling. From the Jul 17, 2025 AIMM session on building voice profiles that actually work.

---

You will build a voice profile — not a vague "tone and style guide" but a precise, actionable model of how a specific person communicates. The secret: the richest signal isn't in finished writing (which is polished and therefore generic). It's in the EDITS — the changes someone makes to a draft reveal their voice more accurately than anything they could describe in the abstract.

The mechanism: when someone edits AI-generated text, every change is a data point. "Changed 'utilize' to 'use'" reveals vocabulary preference. "Cut the entire opening paragraph" reveals pacing instincts. "Added a profanity" reveals register. "Restructured from list to narrative" reveals format preference. Aggregate enough of these deltas and you have a voice model more accurate than any style questionnaire could produce.

VOICE DATA TO ANALYZE: $ARGUMENTS

If no data was provided above, ask me to provide voice samples. The best inputs (in order of signal density):
1. **Draft/edit pairs**: AI-generated text alongside the human's edited version (HIGHEST signal)
2. **Raw unedited writing**: Emails, Slack messages, social posts, first drafts — the less polished, the better
3. **Published writing**: Blog posts, articles, LinkedIn posts — useful but lower signal because editing has already smoothed idiosyncrasies
4. **Verbal transcripts**: Meeting recordings, podcast appearances, talks — captures spoken voice

Multiple sample types produce a richer profile. Even a single draft/edit pair is valuable.

VOICE OWNER: [WHOSE VOICE ARE WE MODELING — yourself, a client, a team member, a public figure? Say "you decide" to have me infer from the data]
INTENDED USE: [WHAT THE VOICE PROFILE WILL BE USED FOR — content creation, ghostwriting, brand voice documentation, AI training, personal reference. Say "you decide" to have me infer]

If "you decide," state the inference and proceed.

---

STEP 1 — DELTA ANALYSIS (if draft/edit pairs are available):
For each pair, catalog every change and classify it:

- **Vocabulary shifts**: Words substituted, added, or removed. What do the replacements reveal about formality level, jargon comfort, and word-feel preferences?
- **Structure changes**: Paragraph reordering, sentence splitting/merging, section additions/deletions. What do these reveal about pacing instincts and information architecture preferences?
- **Tone adjustments**: Where did the voice owner add warmth, edge, humor, directness, or qualification? Where did they remove polish, hedging, or corporate-speak?
- **Kill patterns**: What did they consistently delete across multiple samples? (This is often the most diagnostic signal — it reveals what the voice owner finds inauthentic)
- **Add patterns**: What did they consistently insert? (Reveals what they feel is missing from AI-generated prose — often the most personal elements)

If draft/edit pairs aren't available, skip to Step 2 and work from the raw samples.

---

STEP 2 — VOICE DIMENSIONS:
From the data (deltas + samples), build the profile across these dimensions:

**Rhythm & Pacing:**
- Average sentence length range (short/punchy, long/layered, or mixed?)
- Paragraph density (how much ground per paragraph?)
- Transition style (explicit connectors, implicit flow, abrupt shifts?)
- Opening patterns (how do they begin pieces — question, claim, story, provocation?)

**Vocabulary & Register:**
- Formality spectrum (where between academic and casual?)
- Jargon relationship (embraces, avoids, or subverts industry language?)
- Signature phrases (recurring expressions, pet words, verbal tics)
- Profanity/intensity comfort level

**Stance & Posture:**
- Default argumentative mode (builds cases, makes assertions, asks questions, tells stories?)
- Certainty calibration (how confidently do they state claims?)
- Relationship to the reader (peer, teacher, provocateur, ally, coach?)
- What they're willing to say that others aren't (the edge of their voice)

**What They Avoid:**
- Phrases, structures, or tones that are absent from their writing
- The "anti-voice" — what would sound wrong if it showed up in their content

---

STEP 3 — VOICE PROFILE DOCUMENT:
Synthesize Steps 1-2 into a portable, reusable voice profile. Format:

**[Name]'s Voice Profile**

*Summary* (2-3 sentences capturing the overall feel)

*Do* (specific, actionable instructions for writing in this voice — not "be conversational" but "lead with the claim, qualify only if the evidence is ambiguous, use sentence fragments for emphasis in lists")

*Don't* (specific anti-patterns — not "don't be formal" but "never open with 'In today's rapidly evolving landscape' or any throat-clearing setup")

*Signature Moves* (2-4 distinctive patterns that are uniquely theirs)

*Sample Rewrites* (take 2-3 generic AI sentences and show what they would look like rewritten in this voice)

---

STEP 4 — CALIBRATION TEST:
Write a short piece (150-200 words) on a topic relevant to the voice owner, applying the profile. Then explicitly flag:
- Which elements of the profile you're most confident about (backed by multiple data points)
- Which elements are speculative (inferred from limited data)
- What additional samples would most improve the profile's accuracy

Ask the voice owner to mark what sounds right and what sounds off. Each correction sharpens the model.

---

STEP 5 — VERIFICATION:
- Is this profile specific enough to distinguish this person's voice from a generic "professional" or "conversational" voice? Test: could two different people share this profile? If yes, it's not precise enough.
- Am I modeling their actual voice, or their aspirational voice? (People sometimes edit toward who they want to sound like, not who they actually sound like. Both are useful — but they should be labeled differently.)
- Are the "Don't" items genuinely absent from their writing, or are they just less common? Only include true anti-patterns.

Revise the profile based on calibration feedback.

## Source

- [[wiki/mastermind/sessions/2025-07-17_Mastermind]] (multiple — building voice profiles from draft/edit deltas)
