# Avatar Reviewer — Simulated Audience Reaction

## Purpose

The Avatar Reviewer reads each draft as a specific member of the target audience. Not as an editor evaluating quality — as a *reader* experiencing the piece. This catches failure modes that fitness axes miss: the paragraph where attention wanders, the claim that provokes resistance instead of curiosity, the ending that satisfies intellectually but doesn't create the urge to share.

---

## When It Runs

After DRAFT (Step 5), before MERGE (Step 6). Each draft gets one Avatar Review. The Avatar's reactions feed into merge scoring — a draft that the Avatar would share scores higher on Residue; a draft that loses the Avatar mid-article scores lower on Momentum.

---

## Avatar Construction

Build the Avatar from the audience fitness profile (SENSE output):

### Avatar Identity
Construct a specific person, not a demographic:
- **Name** (invented but specific)
- **Role** (the most common role in the target audience)
- **Current situation** (what they're dealing with this week that makes this topic relevant)
- **Reading context** (where and when they encounter this article — scrolling LinkedIn at 7am? Reading a newsletter on their commute? Reviewing a shared link from a colleague?)
- **Skepticism calibration** (what claims would they push back on? what would they accept without evidence?)

### Example Avatar

```
AVATAR: Maya Chen
Role: Executive coach, solo practice, 4 years in
Situation: Just lost a client to a competitor who uses AI-generated content at scale.
  Worried about commoditization but skeptical of "just add AI" advice.
Reading context: Opens newsletter on phone between client calls. Gives an article 
  90 seconds before deciding to read or skip.
Skepticism: Accepts anecdotes and named examples. Pushes back on abstract claims 
  without specifics. Distrusts anything that sounds like it came from an AI aggregator.
```

---

## Review Protocol

For each draft, the Avatar Reviewer reads sequentially and logs reactions at five checkpoints:

### Checkpoint 1: The First 100 Words
- **Would Maya keep reading?** (yes/no)
- **What's her emotional state?** (curious, skeptical, indifferent, hooked, confused)
- **What does she think this article is about?** (Compare to the actual thesis — if there's a mismatch, the opening is misleading.)
- **Universal Door check (v2.1):** Does the opening enter through a universally human experience, or through a topic-specific scenario that presumes Maya has had a specific experience with the tool, trend, or behavior? If the opening requires Maya to have been doing the exact thing described — and she hasn't — does she close the tab? Flag if yes.
- **Inclusivity check (v2.1):** If Maya *doesn't* share the specific experience described in the opening, can she still engage and say "that's not me, but I know people like me who experience this"? If no, flag the opening as too narrow.

### Checkpoint 2: The First Major Claim
- **Does Maya believe it?** (yes/partly/no)
- **If not, what would she need to see to be convinced?** (specific evidence, named example, logic chain)
- **Does the article provide that within 3 paragraphs of the claim?**

### Checkpoint 3: The Midpoint
- **Is Maya still reading or has she mentally checked out?**
- **What's the strongest thing she's read so far?** (the line or idea she'd highlight)
- **What's the weakest?** (the paragraph where her attention drifted)

### Checkpoint 4: The Pivot/Climax
- **Does the central insight land?** (Does Maya feel the "oh" moment?)
- **Does it feel earned or imposed?** (Did the article build to this or announce it?)
- **Would Maya describe this insight to a colleague?** If yes, how? (This is the Overnight Test from the Avatar's perspective.)

### Checkpoint 5: The Close
- **How does Maya feel?** (energized, informed, challenged, underwhelmed, inspired to act)
- **Would she share this?** (yes/no/with caveats)
- **If she shares, what does her share text say?** (Generate a 1-sentence share — e.g., "This reframed how I think about my content process. Key insight: [X].")
- **What would she do differently after reading?** (If nothing, the Generativity score should be downgraded.)

---

## Output Format

```
AVATAR REVIEW — Draft [A/B/C]
Avatar: [name, role]
==============================

CP1 (100 words): [Keep reading? Emotional state? Perceived topic?]
CP2 (First claim): [Believes? Needs? Provided?]
CP3 (Midpoint): [Still engaged? Strongest line? Weakest paragraph?]
CP4 (Pivot): [Insight lands? Earned? Would describe to colleague?]
CP5 (Close): [Feeling? Would share? Share text? Action?]

OVERALL: [Would Maya finish this article? Would she share it? Would she remember it?]
SHARE PROBABILITY: [High / Medium / Low]
HIGHLIGHT QUOTE: "[the single line Maya would highlight]"
WEAKNESS FLAG: "[the moment where Maya almost stopped reading]"
```

---

## Segment Coverage Scan

After the primary Avatar Review, identify whether the target audience contains distinct sub-segments — people who fit the audience description but whose relationship to the topic, delivery model, or daily reality differs meaningfully.

### When to Run

Run the segment scan when the audience description is broad enough to contain people with different delivery models, career stages, or operational contexts. Examples:
- "Knowledge entrepreneurs" → high-touch consultants vs. course creators vs. hybrid
- "Engineering leaders" → startup CTOs vs. enterprise VPs vs. individual contributors promoted to management
- "Marketing professionals" → agency vs. in-house vs. freelance

Skip the segment scan when the audience is already narrow (e.g., "Series B SaaS founders in healthcare").

### Procedure

1. Identify 2-3 distinct sub-segments within the target audience.
2. For each sub-segment, at Checkpoint 5 (Close), ask:
   - Does this article speak to their version of the problem?
   - Does the practical advice apply to their delivery model or working context?
   - Is there a passage that would make this sub-segment feel excluded or unseen?
3. Flag any sub-segment the article doesn't serve.

### Output

```
SEGMENT SCAN
============
Sub-segment A: [description]
  Served? [yes / partially / no]
  Exclusion risk: [specific passage or framing that excludes them, if any]

Sub-segment B: [description]
  Served? [yes / partially / no]
  Exclusion risk: [specific passage or framing that excludes them, if any]

Sub-segment C: [description]
  Served? [yes / partially / no]
  Exclusion risk: [specific passage or framing that excludes them, if any]
```

This is NOT a requirement to serve all segments equally — some articles intentionally target one sub-segment. But it IS a requirement to be aware of which segments the article's framing includes and excludes, so the user can make an informed decision before drafting.

If the primary Avatar represents only one sub-segment and the article is intended for the full audience, flag the gap before MERGE.

---

## Integration with Merge Scoring

Avatar Review data modifies the fitness scores as follows:

- **Share Probability = High** → Residue score +1 for this draft
- **Share Probability = Low** → Residue score -1
- **Weakness Flag in opening** → Momentum score -1
- **Weakness Flag in escalation** → Momentum score -0.5
- **"Would describe insight to colleague" = No** → Inevitability score -1
- **"What would she do differently" = Nothing** → Generativity score -1

These modifications are applied before the merge scoring matrix is computed. They break ties between drafts that score similarly on the raw fitness axes by injecting simulated real-world signal.
