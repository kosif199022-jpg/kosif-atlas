---
name: The Transcript Miner
type: command
description: Extract high-signal nuggets from any conversation transcript — the non-obvious insights, quotable moments, actionable techniques, and content seeds that would take hours to find manually. Turns raw transcripts into structured intellectual capital.
source: multiple — Aug 14, 2025 AIMM session on transcript-to-thought-leadership pipeline
trigger: /aimm:transcript-miner
location: wiki/mastermind/commands/
source-sessions:
  - 2025-08-14_Mastermind
---

# The Transcript Miner

Extract high-signal nuggets from any conversation transcript — the non-obvious insights, quotable moments, actionable techniques, and content seeds that would take hours to find manually. Turns raw transcripts into structured intellectual capital. From the Aug 14, 2025 AIMM session on building a transcript-to-thought-leadership pipeline.

---

You will mine a transcript for its most valuable material — not summarize it (summaries flatten signal into noise) but extract the specific moments where something genuinely insightful, actionable, or non-obvious was said. The output is a curated collection of high-signal nuggets, each tagged for how it can be used.

The mechanism: a typical 60-minute conversation contains maybe 5-10 genuinely valuable moments buried in 50 minutes of context, repetition, and conversational scaffolding. Most people either summarize (losing the specificity) or re-read the whole thing (wasting time). This does targeted extraction — finding the signal, preserving the exact language, and classifying each nugget for downstream use.

THE TRANSCRIPT: $ARGUMENTS

If no transcript was provided above, ask me to paste or upload the transcript. Works with any format: VTT, SRT, plain text, AI-generated notes, or raw transcription.

TRANSCRIPT TYPE: [WHAT KIND OF CONVERSATION — sales call, coaching session, podcast interview, meeting, mastermind, panel, presentation Q&A. Say "you decide" to have me infer from the content]
MY USE CASE: [WHAT I'M MINING FOR — content creation, client insights, product development, training material, thought leadership, competitive intelligence. Say "you decide" to have me extract for general use]

If "you decide," state the inference and proceed.

---

STEP 1 — FIRST PASS (signal detection):
Read the full transcript and flag every moment that registers as potentially valuable. Cast a wide net — you'll filter in Step 2. Look for:

- **Insight moments**: Where someone said something that reframes how you think about a topic
- **Technique reveals**: Where someone described a specific process, method, or approach
- **Quotable lines**: Phrases sharp enough to use verbatim in content
- **Tension points**: Where people disagreed, pushed back, or complicated each other's views
- **Story gold**: Anecdotes, case studies, or examples with narrative power
- **Data points**: Specific numbers, metrics, results, or timelines
- **Unarticulated assumptions**: Things everyone in the conversation agreed on without questioning — these often contain the most interesting ideas because they reveal the group's shared mental model

Don't editorialize yet — just flag and quote.

---

STEP 2 — CLASSIFICATION AND FILTERING:
For each flagged moment, classify it:

**Signal strength** (1-3):
- 3 = Non-obvious, specific, and immediately usable
- 2 = Interesting but needs development or context
- 1 = Common knowledge or too vague to act on

**Nugget type**:
- 💡 **Insight**: A reframe or perspective shift
- 🔧 **Technique**: A specific method or process
- 🔥 **Hot take**: A provocative or contrarian claim
- 📊 **Data point**: A specific number, result, or metric
- 📖 **Story**: A narrative with teaching power
- ❓ **Open question**: Something raised but not resolved (these are content gold)

**Downstream use** (tag all that apply):
- `[content]` — Could become a post, article, or thread
- `[framework]` — Could become a reusable model or framework
- `[training]` — Could become teaching material
- `[product]` — Suggests a product or service opportunity
- `[positioning]` — Informs how to talk about what you do

Drop anything rated Signal 1 unless it has unusual downstream potential.

---

STEP 3 — NUGGET EXTRACTION:
For each Signal 2-3 nugget, produce:
- **The exact quote** (preserving the speaker's language — the specific words are the value)
- **Speaker attribution** (who said it)
- **The context** (1-2 sentences on what prompted this moment)
- **Why it matters** (what makes this non-obvious or valuable — one sentence)
- **The content seed** (how this could be developed into a longer piece — one sentence)

Organize by theme, not by timestamp. Related nuggets from different parts of the conversation should be grouped.

---

STEP 4 — TOP NUGGETS:
Identify the 3-5 highest-value extractions and explain why each one is worth developing further. For each:
- What's the non-obvious insight embedded in it?
- What audience would care about this?
- What format would best serve it? (Post, thread, article, framework, presentation?)
- What additional research or thinking would strengthen it?

---

STEP 5 — EXTRACTION SUMMARY:
Deliver a one-page summary formatted for quick reference:
- **Transcript source**: [type, date, participants]
- **Signal density**: [X nuggets extracted from Y-minute conversation — is this a high or low signal transcript?]
- **Top themes**: [3-5 themes with nugget counts]
- **Immediate action items**: [Nuggets that can be turned into content this week]
- **Long-term seeds**: [Ideas that need development but have high potential]

---

STEP 6 — VERIFICATION:
- Am I extracting genuinely non-obvious material, or am I flagging things that sound smart but are actually common knowledge in this field?
- Am I preserving the speaker's specific language, or am I paraphrasing into generic AI prose? (The exact words are the value — "your language is your fingerprint" is better than "authentic voice matters")
- Are the content seeds actionable and specific, or are they vague prompts like "could write about this topic"?
- Am I over-extracting from charismatic speakers and under-extracting from quieter participants? Signal doesn't correlate with volume.

Revise extractions that don't survive scrutiny.

## Source

- [[wiki/mastermind/sessions/2025-08-14_Mastermind]] (multiple — transcript-to-thought-leadership pipeline)
