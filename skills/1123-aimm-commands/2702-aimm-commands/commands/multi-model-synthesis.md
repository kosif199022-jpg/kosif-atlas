---
name: Multi-Model Synthesis
type: command
trigger: /multi-model-synthesis
description: Run structured parallel model deliberation on any question or document. Use when a decision or draft is high-stakes enough to warrant multiple cognitive perspectives before committing.
score: 84/100
sessions: 7
last_updated: 2026-04-06
source-sessions:
  - vault-wide
---

# Multi-Model Synthesis Command

## Origin

This command crystallized across three phases:

- **Jun 2019** — Kasimir introduced a 4-perspective deliberation technique: run any question through distinct lenses before deciding.
- **Oct 2019** — Built as an N8N automation loop: feed the same prompt to multiple models in parallel, collect outputs, synthesize.
- **Feb 2026** — Formalized as a quality control system with an explicit synthesis rule (see below).

---

## The Golden-Nugget Synthesis Rule

**Never summarize. Never average.**

The failure mode of multi-model synthesis is producing a "lowest common denominator" output — a bland summary that strips the specificity and precision from the best individual response.

The correct approach:

1. Read all model outputs.
2. Identify the **most complete, highest-quality response** as the base document.
3. Read the remaining responses looking only for **non-redundant golden nuggets** — insights, framings, facts, or caveats that are genuinely absent from the base.
4. Insert only those nuggets into the base document, at the point where they add the most value.
5. The result should feel like the best response got smarter, not like all responses got averaged.

If a point is already covered in the base — even if phrased differently — do not add it. Redundancy is noise.

---

## Model Assignment Guidance

Each model has a distinct cognitive fingerprint. Assign accordingly:

| Model | Strongest at |
|---|---|
| **Claude** | Reasoning depth, nuance, epistemic humility, long-form synthesis, structured argument |
| **ChatGPT / GPT-4** | Breadth, conventional frameworks, practical completeness, widely-accepted best practices |
| **Gemini** | Recency, factual retrieval, cross-domain connections, up-to-date context |
| **Perplexity** | Sourced claims, web-grounded assertions, citation trails |

For most deliberations, Claude + GPT-4 covers the core. Add Gemini when recency matters. Add Perplexity when sourced evidence is required.

---

## The Two Use-Case Types

### Type 1: Decision Deliberation
"Should I do X?"

Each model argues both for and against the decision. You synthesize the strongest arguments from each side.

### Type 2: Document Improvement
Submit a draft. Each model proposes improvements. Add only genuinely non-overlapping suggestions to the base draft.

---

## Command Protocol

### Step-by-step

1. **Define the question or submit the document.** Be specific. Vague inputs produce vague deliberation.
2. **Choose your model set** based on the assignment guidance above.
3. **Submit to each model in parallel** using the appropriate prompt template below.
4. **Read all outputs in full** before beginning synthesis. Do not synthesize mid-read.
5. **Select the base document** — the most complete, highest-quality output.
6. **Extract golden nuggets** from each remaining response. Be ruthless: only add what is genuinely absent and genuinely valuable.
7. **Insert nuggets** into the base document at contextually appropriate points.
8. **Review the final document** as a whole for coherence. Light editing for flow is acceptable; do not re-summarize.

---

## Prompt Templates

### Template A — Decision Deliberation

Copy-paste this into each model. Replace `[DECISION]` and `[CONTEXT]` with your specifics.

```
I am considering the following decision:

DECISION: [state the decision clearly — one sentence]

CONTEXT: [2–5 sentences of relevant background — stakes, constraints, what's already been decided]

Your task:
1. Give me your three strongest arguments FOR this decision.
2. Give me your three strongest arguments AGAINST this decision.
3. Identify the one factor that you think is most likely being underweighted in typical analysis of this question.

Be specific. Do not hedge every point. Take a position where you have one.
```

### Template B — Document Improvement

Copy-paste this into each model. Replace `[DRAFT]` and `[GOAL]` with your specifics.

```
I am sharing a draft document for structured improvement feedback.

GOAL OF THE DOCUMENT: [one sentence — what is this document supposed to accomplish?]

DRAFT:
[paste full draft here]

Your task:
1. Identify up to five specific improvements — gaps in logic, missing evidence, unclear structure, weak arguments, or missing context that would materially strengthen the document.
2. For each improvement, explain what is missing and why it matters.
3. Do not suggest stylistic rewrites unless the current phrasing is genuinely ambiguous or misleading.
4. Do not suggest additions that are already implied or present in the draft.

Be specific. Reference the exact section or claim you are responding to.
```

---

## N8N Automation Option

For teams or individuals running this command frequently, this workflow can be fully automated in N8N:

- **Trigger:** Webhook or manual form submission (question + use-case type)
- **Parallel branches:** One HTTP request node per model (Claude API, OpenAI API, Google Gemini API, Perplexity API)
- **Merge node:** Collect all four outputs into a single structured JSON
- **Synthesis step:** Pass merged outputs to Claude with the golden-nugget synthesis rule as the system prompt
- **Output:** Final synthesized document returned via webhook or written to a shared doc

This is worth building if you run 3+ deliberations per week. For occasional use, manual parallel tabs are sufficient.

---

## Related Artifacts

- `wiki/mastermind/prompts/grounded-query-protocol.md` — use this on each model's output when sourced claims matter
- `wiki/mastermind/skills/` — check for any automation skills that wrap this command
