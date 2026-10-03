# Conversation IP Extractor

## The UP=IP Principle

Every substantive AI conversation is more than a conversation — it is a working session that encodes the practitioner's judgment, methodology, and intellectual identity. The sequence of moves you made, the questions you asked, the moments you pushed back or reframed — these are not noise. They are your implicit methodology. This skill extracts that methodology, formalizes it as a named framework, and packages it as usable IP.

The insight behind this: when Lou reverse-engineered a 100,000+ character working session with Claude (Feb 19 session), the result was a 9-step framework that read as years of deliberate practice — not a single conversation. Michael Simmons confirmed the same pattern: blockbuster articles often emerged from conversation, not from intentional framework-building.

## When to Use This Skill

Use this skill when:

- You have a long conversation (20,000+ characters) and want to know what framework or methodology is embedded in it
- You finished a complex working session and want to turn the process into something publishable or teachable
- You want to name and formalize an approach you've been using intuitively
- You want to produce a LinkedIn article, blog post, or framework brief from a working session
- You want to create a SKILL.md from a process you've already performed once in conversation
- A client or collaborator has been working through a complex problem and you want to capture their approach as a reusable asset

## What Counts as a Strong Conversation for Extraction

**Minimum useful size:** 20,000 characters
**Optimal size:** 50,000+ characters

Strong source material tends to include:
- The practitioner making multiple distinct moves (not just asking Claude to do things, but evaluating, reframing, pushing back, redirecting)
- Evidence of criteria being applied — moments where the practitioner accepted one thing and rejected another, with some hint of why
- A complex problem with multiple stages, not a single-shot task
- The practitioner's voice appearing in the conversation — their specific language, distinctions, standards

Good source types:
- A Claude working session on a complex strategic or creative problem
- A coaching session transcript where one person's thinking dominates
- A mastermind transcript that is heavy with one person's contributions
- A session where you prompted Claude through multiple iterations to get something right

Weaker source material (still extractable, but with lower yield):
- Pure Q&A sessions with no evidence of methodology
- Sessions where Claude did most of the work with minimal practitioner input
- Sessions under 10,000 characters
- Sessions that cover too many unrelated topics

## The Process

### Step 1: Context Intake

Ask the practitioner to provide the conversation or session. If they haven't already, ask:

- What was the conversation trying to accomplish?
- What field or domain does this practitioner work in?
- Do they want this for personal use, publication, or to turn into a teachable skill?
- Is there a name or phrase they already associate with this approach?

If the conversation is very long (100,000+ characters), read it in sections, starting with the practitioner's messages — these carry more signal than Claude's responses.

### Step 2: Methodology Detection

Read the full conversation looking for the practitioner's moves. Specifically, look for:

- **Sequence of moves** — what did they do first, second, third?
- **Question types** — what kinds of questions did they ask, and what made those questions different from obvious ones?
- **Evaluation criteria** — what did they accept vs. reject, and what appears to be the standard behind those decisions?
- **Reframes and pushbacks** — moments when they redirected, corrected, or introduced a new frame
- **Standards enforced** — what did they keep returning to? What was non-negotiable?

These moves are the implicit methodology. Your goal is to make them explicit.

### Step 3: Step Extraction

Extract 5–12 discrete, sequentially ordered steps that describe the practitioner's approach at a level of generality that would apply to similar situations — not just this specific conversation.

Each step should:
- Be named (not just numbered)
- Be actionable and specific enough to follow
- Be general enough to apply to the class of situations, not just this one instance
- Describe what the practitioner did, not what Claude did

**Example of step extraction output** (from a strategic positioning session):

> **The 7-Step Positioning Audit**
>
> 1. **Articulate the current claim** — State the positioning you're currently using, including the implicit claim about who it serves and what problem it solves.
> 2. **Name the assumption underneath** — Identify what has to be true about the market for this positioning to be correct.
> 3. **Surface the tension** — Find the place where what you say conflicts with what clients actually experience.
> 4. **Widen the frame** — Ask: what is the conversation this positioning is entering? Who else is in that conversation?
> 5. **Identify the overlooked constituency** — Who is not being addressed by anyone in this space?
> 6. **Restate the positioning from the constituency's perspective** — What do they need to hear to recognize this as relevant to them?
> 7. **Test the distinctiveness** — Could a competitor say this? If yes, the positioning is not yet specific enough.

### Step 4: Generalization Test

Once you have extracted the steps, propose a domain of applicability and test it:

"This framework appears to apply to [X type of situation]. Does that match your experience? Can you think of 2–3 other situations where you've used the same moves — even if you didn't know you were following a process?"

The practitioner confirms, narrows, or expands. This step matters because it separates a genuine transferable methodology from a description of one specific task.

### Step 5: Framework Naming

Generate 5–8 candidate names. Draw from these naming patterns (which have produced strong frameworks in this community):

- **Acronyms** — GEARS, UP=IP, PRD-First
- **Metaphors** — Deep Field, Latent Space, Eigenthinking
- **Proper noun forms** — The Three Returns, The Operator-to-Strategizer Shift
- **Principle statements** — Process Over Prompts, Minimum Viable Brief
- **Question forms** — What Era Are You Teaching To?
- **Compound nouns** — Content Topology, Psychographic FAQ

Give the practitioner the list and let them select, modify, or propose a different direction.

### Step 6: Distinctiveness Check

Once a name is selected, do a brief check: "How does [framework name] differ from [the most similar known framework]?" This keeps the framework genuinely distinct rather than a relabeling of something that already exists.

Name the most similar known framework, explain the distinction clearly, and note it in the framework summary.

### Step 7: Packaging

Produce the following, depending on the practitioner's stated purpose:

**Standard package (always produce):**
- A 1-page framework summary with: name, core premise (1–2 sentences), the steps with brief descriptions, and the domain of applicability. This can go directly into a LinkedIn article or be used as a framework brief.

**For publication:**
- A brief for a longer-form article: thesis, key tension, framework walkthrough, one real example, conclusion/implication.

**For skill codification (when the framework is a repeatable process):**
- A SKILL.md draft following the skill-creator format — the practitioner can then install this as a Claude skill and run the process on future conversations.

---

## Fast Track

For practitioners who just want a quick framework name and brief — skip the full process and use this:

**Prompt to run:**

> "Read this conversation. In 3–5 sentences, describe the underlying methodology I used. Then give me 5 candidate names for it. Then write a 150-word framework brief."

This takes approximately 2–3 minutes and produces enough to write a LinkedIn post or test whether the framework resonates before investing in the full extraction.

The Fast Track trades depth for speed. It is useful for deciding whether a conversation is worth the full treatment. If the 5 candidate names feel right and the brief is recognizable, the full process will produce something strong.

---

## Relationship to Deep Field

The `anthropic-skills:deep-field` skill covers eigenthinking and latent space navigation as philosophical and conceptual territory. This skill is the operational workflow for practitioners who want to extract and publish IP from their AI working sessions. Use Deep Field to understand the theory; use this skill to do the work.
