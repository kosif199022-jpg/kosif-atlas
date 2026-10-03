# Prompt Enrichment

## What This Skill Does

Most prompts leave value on the table. The user asks the question they know
to ask — but the best answer depends on constraints, context, and complexity
they didn't think to include. This skill bridges that gap.

It works in four stages: **Analyze** the prompt for what's missing,
**Source** real data from the user before guessing, **Enrich** with the
combination of user-provided data and inferred context, and **Deliver**
either the enriched prompt for review (default) or a direct answer.

The underlying mechanism comes from research on prompt architecture (Jo,
2026): when you force explicit articulation of goals, constraints, and
context *before* inference begins, every subsequent token is conditioned
on that richer foundation. The result is answers that catch what
surface-level responses miss.

## Workflow

### Default Mode: Analyze → Source → Show → Approve → Answer

This is the standard flow. The skill identifies gaps, asks the user for
real data to fill them, then presents the enriched prompt for approval.

1. **Analyze** the user's prompt (silently — this is your internal work)
2. **Source** — ask the user if they have real data for the gaps you found
3. **Enrich** — integrate user-provided data + infer what's left
4. **Present** the enriched prompt with a brief explanation
5. **Wait** for the user to approve, edit, or redirect
6. **Answer** the enriched version

### Fast Mode: Analyze → Source → Answer

If the user says "just answer this", "skip the preview", "don't show me
the rewrite", or similar — still ask for source data (this is too valuable
to skip), but go straight from enrichment to answering. Mention briefly
what you surfaced, but don't make them wait for approval.

### Export Mode: Analyze → Source → Deliver the Prompt

If the user wants the enriched prompt as a deliverable (for use in another
tool, API call, or session), output it as a clean, self-contained prompt
they can copy-paste. No answer — just the artifact.

Detect export intent from cues like "rewrite this for me", "give me a
better version of this prompt", "I want to use this in ChatGPT", or
"make this prompt better".

## The Enrichment Process

This is the core of the skill. Work through these layers in order.

### Layer 1: Intent Inference

What is the user actually trying to accomplish? Not what they literally
asked, but the outcome they need when they're done.

Often there's a gap between the question asked and the goal behind it.
"Should I walk or drive to the car wash?" is literally a transportation
question, but the actual intent is "get my car washed." That reframing
changes everything.

**How to do it**: Restate the user's prompt as a goal statement. "The user
wants to [outcome]." Then ask: does achieving that outcome require anything
the prompt doesn't mention?

### Layer 2: Constraint Mapping

Surface the implicit constraints — things that must be true for the goal
to be achieved but that the prompt never states.

These come in several flavors:

- **Physical/spatial**: Objects must be in certain places or states
  (a car must be at the car wash; ingredients must be thawed before
  cooking; a server must be running before you deploy to it)

- **Temporal/sequential**: Steps have prerequisites; order matters
  (you can't sign a document before it's drafted; you can't merge
  a PR before tests pass)

- **Domain rules**: Unstated professional, legal, or technical
  requirements (notarization requires valid ID; HIPAA constrains
  what you can share; a database migration needs a rollback plan)

- **Stakeholder context**: Who else is affected? What are their
  constraints? (Your boss needs the report by Friday; the client
  is in a different timezone; the API has rate limits)

- **Assumption traps**: Places where a strong default heuristic
  exists but the specific context overrides it (short distance ≠
  walk if the cargo can't walk; "simple" question ≠ simple answer
  if the domain has hidden complexity)

### Layer 3: Source Check (The Interaction Layer)

**This is where the skill becomes collaborative instead of monologic.**

Before inferring or researching to fill the gaps found in Layers 1-2,
ask the user if they have real data that covers any of the missing context.
User-provided data is *always* more valuable than the model's best guess.

**How to do it:**

1. Review the gaps identified in Layers 1-2.
2. For each significant gap, consider: is this something the user might
   already have — a document, a dataset, notes, a past deliverable,
   a conversation, a file — that they just didn't think to include?
3. Ask the user directly. Be specific about *what* you're looking for
   and *why* it matters. Don't ask vague questions — name the artifact.

**How to ask:** Frame the ask around concrete artifacts, not abstract
categories. The user doesn't think in terms of "stakeholder context" —
they think in terms of "that intake form I filled out" or "the notes
from my last client call."

Good: "I noticed your prompt doesn't include details about where the
client is in their buying process. Do you have an intake form, discovery
call notes, or a CRM record you could share? That would let me tailor
this instead of guessing."

Good: "This pricing question would benefit from knowing your existing
offer ladder and price points. Do you have a pricing page, sales deck,
or even a quick list I could work from?"

Bad: "Do you have any additional context?" (Too vague — the user
already gave you what they thought was enough.)

Bad: "Can you provide stakeholder information?" (Jargon — the user
doesn't categorize their knowledge this way.)

### Layer 4: Context Augmentation

What additional context would make the answer substantially better?
At this stage, you're working with a combination of user-provided data
(from Layer 3) and gaps that still need filling.

- **User context**: If you know things about the user (their role,
  location, expertise level, past conversations) OR they provided
  relevant documents in Layer 3, fold those details into the prompt.
  A prompt about "how to deploy this app" has a very different best
  answer for a solo founder vs. a platform engineer at a Fortune 500.

- **Domain knowledge**: Inject relevant facts, frameworks, or
  constraints that the user might not know to ask about. If someone
  asks about structuring a contract, they probably don't know to
  specify governing law, indemnification clauses, or IP assignment
  — but those matter enormously.

- **Scope calibration**: Is the user looking for a quick answer or
  a thorough one? A 2-sentence reply or a full analysis? Match the
  enrichment depth to what the situation calls for.

### Layer 5: Rewrite

Compose the enriched prompt. This isn't just the original prompt with
context stapled on — it's a rewrite that naturally integrates everything
you surfaced and everything the user provided. The enriched prompt should:

- **Start with the real goal**, not the surface question
- **Make implicit constraints explicit** so the answering model
  (whether it's you or another LLM) can't miss them
- **Include relevant context** that changes the answer — clearly
  distinguishing user-provided data from inferred context
- **Specify the response shape** if the original prompt was vague
  about what format or depth the user needs
- **Preserve the user's voice** — don't make it sound like a
  different person wrote it

The enriched prompt should read like something the user *would have
written* if they'd had 10 minutes to think about what they actually
needed — and had their files open in front of them.

## Presenting the Enrichment

When showing the enriched prompt to the user (default mode), structure
your response like this:

**What I noticed**: A brief, plain-language summary of the gaps you found.
Not a laundry list — just the 2-3 most important things the original
prompt was missing. Explain *why* they matter, not just *that* they exist.

**What I used**: If the user provided data in the source check, briefly
note what you incorporated and how it shaped the enrichment. This builds
trust — they can see their real data flowing into the output.

**Enriched prompt**: The rewritten prompt, clearly formatted so the user
can read it, edit it, or copy it.

**What this changes**: A sentence or two about how the answer will differ
with the enrichment. This helps the user evaluate whether the enrichment
is actually useful or just adding noise.

Then ask if they want you to answer the enriched version, modify it, or
export it.

## When NOT to Enrich

Not every prompt needs enrichment. Skip the skill if:

- The prompt is genuinely simple and the obvious answer is the right
  one ("What's the capital of France?")
- The user has already provided rich, detailed context and constraints
- The user explicitly wants a quick, surface-level answer
- Adding context wouldn't change the answer in any meaningful way

The test: if your enrichment wouldn't change the substance of the
answer — just make it longer — don't bother. Enrichment that adds
words without adding insight is worse than no enrichment at all.

## Source

- [[wiki/mastermind/sessions/2025-06-19_Mastermind]] (general operational skill)
