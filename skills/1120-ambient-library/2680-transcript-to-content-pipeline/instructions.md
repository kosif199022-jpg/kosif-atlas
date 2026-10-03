# Transcript → Content Pipeline

## What This Skill Does

You have a raw conversation — a mastermind session, a coaching call, a working session with an AI, a client debrief, an expert interview. That conversation contains your best thinking. The problem is that best thinking is buried in 10,000 words of context-setting, tangents, and half-formed ideas.

This pipeline extracts the signal, amplifies the strongest ideas, and produces a complete content package ready for editorial review. The practitioner's job is editorial judgment — approving, shaping, and refining — not production.

**The core principle:** Human role = editorial judgment, not production. Your thinking happens in conversation. This skill handles the conversion from conversation to publishable asset.

**Evolved through:** Sessions June 2025 – April 2026, with contributions from Lou, Kasimir, Bally, and the PowerUp Coaching mastermind group. Highest-scoring pattern in the vault (95/100 across 10 sessions).

---

## Quick Start

If you have a transcript and want content fast:

1. Paste or link the transcript and say: *"Run the content pipeline on this."*
2. The pipeline will extract 15-25 nuggets, present the top candidates, and ask you to confirm which 2-4 to develop.
3. Approve the candidates and a creative brief for each.
4. Receive your full content package: long-form draft, 3 LinkedIn variants, 1-page summary.
5. If you have a voice profile (from the `voice-profile-trainer` skill), say so upfront — it will be applied as a final style pass.

That's the fast path. The sections below explain the full pipeline and why each stage exists.

---

## The Full Pipeline

### Stage 1 — Ingest

**What:** Accept the raw source material. This can be:
- A verbatim audio transcript (Zoom, Otter.ai, Riverside, etc.)
- A Zoom chat export
- Mastermind session recording notes
- Client session notes or debrief
- A Claude or ChatGPT conversation export
- Working session notes — even rough, unstructured ones

**Why it matters:** The pipeline is input-agnostic by design. Don't clean up the transcript before feeding it in — raw material is more honest. The extraction stage is built to work with noise, repetition, and incomplete sentences. Over-editing the source before ingestion risks losing the moments that matter most: the spontaneous insights, the unguarded observations, the things said in passing that turn out to be the whole point.

**What to provide:** Paste the transcript directly or share a file path. Note the source type (coaching call, mastermind, AI session, etc.) and approximate date if known. Mention the practitioner's name and audience if not already established in context.

---

### Stage 2 — Nugget Extraction

**What:** Extract 15-25 high-signal ideas, quotes, breakthroughs, and patterns from the raw material.

**Why it matters:** Most transcripts are 80-90% scaffolding — context-setting, rapport-building, process coordination, false starts. The insight-to-word ratio is low. Nugget extraction is an act of compression: finding the 10-20% of the conversation that actually advances thinking.

**The reverse-outline technique:** Rather than reading the transcript linearly and summarizing, read for three things:
1. What surprised you — moments where the conversation went somewhere unexpected
2. What challenged an assumption — points where conventional wisdom was questioned or inverted
3. What you'd repeat to a colleague over coffee — the ideas worth sharing in the next conversation

These three filters reliably surface the most original and shareable content. Generic summaries tend to extract the explicitly stated conclusions; this technique catches the insights that were almost said, the implications that the speakers hadn't quite named yet.

**Output format:** A numbered list of 15-25 nuggets, each with:
- The raw idea in 1-2 sentences
- A provisional "headline" that captures it as a shareable insight
- A signal score (High / Medium / Low) based on novelty and audience relevance

---

### Stage 3 — Candidate Selection

**What:** From the 15-25 nuggets, select 2-4 for full development.

**Why it matters:** Not all insights are worth developing into full content. The selection filters are:
- **Novelty:** Does this challenge something the audience currently believes? Generic confirmation content does not build authority.
- **Audience relevance:** Is this something the practitioner's specific audience of entrepreneurs/leaders/coaches would find immediately useful or disorienting?
- **Canon alignment:** Does this connect to or extend the practitioner's existing framework or intellectual territory? Content that clusters around a coherent worldview compounds; isolated insights don't.
- **Developability:** Is there enough substance to build a 600-1000 word argument, or is this better as a LinkedIn post only?

**Present the top 4 candidates with brief rationale and ask for confirmation before proceeding.** The practitioner's editorial judgment matters here — they know their audience and their existing content in ways the pipeline does not.

---

### Stage 4 — Creative Brief

**What:** For each selected nugget, generate a creative brief before writing begins.

**Why it matters:** Writing without a brief produces drafts that have to be torn apart and restructured. A brief forces the key decisions to be made explicitly: What assumption are we challenging? Who specifically is the reader? What do we want them to think or do differently? These decisions are much cheaper to make at the brief stage than at the draft stage.

**Each creative brief includes:**
- **Angle:** The specific claim or argument (not the topic — the take)
- **Audience assumption to challenge:** What does this reader currently believe that this piece should disturb?
- **Structural approach:** Argument-first (lead with the claim, then support it), story-first (open with a scene, build to the insight), or framework-first (introduce a mental model, then apply it)
- **2-3 research hooks:** Existing evidence, named examples, or analogies that could reinforce the argument
- **Target length and format:** Long-form article (600-1200 words), LinkedIn post, or both

**Present the briefs for approval before writing.** This is a second editorial checkpoint — changing direction after the brief costs nothing; changing direction after the draft costs revision time.

---

### Stage 5 — Writing Team Execution

**What:** Produce the drafts using a multi-role writing process.

**Why it matters:** A single "write this" prompt produces a single perspective. The multi-role process embeds multiple quality filters into the production itself, catching problems before they reach the practitioner for review.

**If the `anthropic-skills:aimm-writing-team` skill is available, use it.** It is specifically designed for this stage.

**If not available, run the following roles in sequence:**

- **Researcher:** Expands the creative brief with supporting evidence, relevant examples, and named analogies. The goal is not to add footnotes — it's to find the 2-3 pieces of external material that make the argument feel grounded rather than asserted.
- **Strategist:** Sets the angle and structure based on the approved brief. Decides the opening hook, the key turning point, and the closing move. Produces an outline, not prose.
- **Writer:** Produces the first full draft from the outline. Writes for argument clarity, not performance. Avoids over-explanation.
- **Editor:** Reviews for readability (target Flesch-Kincaid grade 6-8 for entrepreneur/executive audiences), argument flow (each paragraph should advance the case), and AI telltales (excessive lists, hedging phrases, over-formal transitions — see the voice-profile-trainer skill for the full list).
- **Publisher:** Packages the final approved draft for distribution — title, subtitle, meta-description if needed, word count, format notes.

---

### Stage 6 — Style Layer

**What:** Apply the practitioner's voice profile as a final filter pass.

**Why it matters:** This is the "stochastic average problem" in practice. Without a style layer, AI-assisted content converges toward a generic competent voice — readable, reasonable, and utterly unmemorable. The style layer is the differentiator. It is what makes the content sound like the practitioner rather than like a competent AI writing about the practitioner's topic.

**If a voice profile exists** (generated by the `voice-profile-trainer` skill), prepend it to the final editing pass and run a voice similarity check against the profile's authentication threshold (typically 70-80% similarity before output is accepted for delivery).

**If no voice profile exists:** Flag this explicitly. Deliver the content package, but include a note:

> *"This draft has passed through editorial quality standards but has not been filtered through a personalized voice profile. To close the gap between 'competent AI voice' and 'your actual voice', run the voice-profile-trainer skill next. It will produce a reusable prompt block that can be applied to all future content runs."*

The absence of a voice profile is not a blocker — it's an opportunity to be named.

---

### Stage 7 — Multi-Format Packaging

**What:** Produce the complete content package from the approved, style-filtered draft.

**Output includes:**

1. **Long-form article draft** — 600-1200 words, structured for the practitioner's primary publishing channel (LinkedIn article, newsletter, blog)
2. **LinkedIn post variants (3):**
   - Hook-based: Opens with a surprising or counterintuitive claim
   - Insight-based: Opens with the core idea stated plainly, builds supporting argument
   - Story-based: Opens with a specific moment or scene, builds to the insight
3. **1-page summary** — The argument in 200-300 words, suitable for email, internal sharing, or as a standalone asset
4. **Audio brief script (optional)** — A 90-120 second script formatted for ElevenAI or similar text-to-speech, suitable for a voice memo or podcast intro

**Present the full package as a single deliverable.** The practitioner reviews and approves — they do not rewrite from scratch. The 80/20 rule applies: 80% of their time should go to judgment (which ideas to develop, which angle to take, what to approve), 20% to production refinements.

---

## When This Works Best

### Input quality requirements

The pipeline performs best when:

- The source material is at least 2,000 words (shorter sources tend to yield only 5-8 nuggets, which is often not enough to identify 2-4 worth developing)
- The conversation involved genuine thinking — not just information delivery. Q&A sessions, working through a problem, debating approaches, and teaching moments all yield high-signal content. Logistics calls and admin conversations do not.
- The practitioner was an active participant, not just a passive listener. Their voice, their framing, their language is what the pipeline is trying to capture.

### Ideal source types (ranked)

1. Mastermind sessions where members are solving real problems
2. Client coaching sessions (with permission) where the practitioner is doing their best work
3. Working sessions where the practitioner is thinking through a framework or problem with an AI
4. Expert interviews or podcast recordings
5. Team debriefs after a significant event or decision

### Works less well for

- Highly technical or domain-specific content that requires expert verification
- Content requiring original research not present in the transcript
- Sessions dominated by administrative logistics
- Transcripts shorter than 1,500 words

---

## Common Pitfalls

### Pitfall 1: Treating every nugget as equal

The extraction stage produces 15-25 items deliberately — more than will be developed. The temptation is to try to use them all, either by developing too many pieces or by cramming multiple nuggets into one article. Resist this. One sharp, well-developed idea beats three lightly-treated ones every time. The selection stage exists precisely to force prioritization.

### Pitfall 2: Skipping the creative brief

The brief feels like overhead. It is not. Briefs that skip the "audience assumption to challenge" step consistently produce content that confirms rather than challenges — and confirmation content does not build thought leadership. The brief is the cheapest place to catch a bad angle.

### Pitfall 3: Delivering output without a style pass

Content that hasn't been filtered through a voice profile (or at minimum reviewed for AI telltales) will read as competent but generic. If the practitioner reads the draft and thinks "this sounds like an AI," it's because the style layer was skipped or weak. Send it back through Stage 6 before delivery.

### Pitfall 4: Asking the practitioner to rewrite, not review

The practitioner's job is to approve, adjust, and redirect — not to rewrite from scratch. If they are regularly spending significant time rewriting rather than reviewing, the brief or the style layer is not doing its job. Surface this as a process problem, not a content problem.

### Pitfall 5: Using the pipeline on a cold transcript with no context

The pipeline needs to know who the practitioner is, who their audience is, and what their existing intellectual territory looks like (their Canon). Without this, candidate selection defaults to generic "what's interesting" rather than "what advances this practitioner's authority." Run the pipeline in context — either by establishing the practitioner profile upfront, or by referencing existing content from the vault.

---

## Connected Skills

- **`voice-profile-trainer`** — Builds the voice profile used in Stage 6. Run this first if no profile exists.
- **`anthropic-skills:aimm-writing-team`** — The recommended writing engine for Stage 5. Use when available.
- **`anthropic-skills:article-architecture`** — Use for long-form structural guidance if the article draft needs significant restructuring.

---

## Version History

- **v1.0** — Initial pattern identified, June 2025 sessions
- **v1.5** — Reverse-outline technique added, Aug 2025
- **v2.0** — Style layer formalized as a distinct stage; voice profile integration added, Oct 2025
- **v2.5** — Multi-format packaging standardized; audio brief format added, Jan 2026
- **v3.0** — Current version. Candidate selection criteria formalized; stochastic average problem named and addressed explicitly, Apr 2026

*Score: 95/100 across 10 sessions. Contributions: Lou, Kasimir, Bally, PowerUp Coaching mastermind group.*
