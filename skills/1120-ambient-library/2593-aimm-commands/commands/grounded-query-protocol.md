---
name: Grounded Query Protocol
type: prompt
description: A parameterized prompt template that enforces evidence-grounded AI responses. Prevents hallucination by context-locking the model to specific sources and requiring explicit confidence disclosure.
use-when:
  - Any research or fact-finding task where accuracy is consequential
  - Technical queries where you have reference documentation
  - Any time you are tempted to ask an AI a question it might confidently fabricate the answer to
  - High-stakes decisions where you need to distinguish sourced claims from inferences
score: 82/100
sessions: 8
last_updated: 2026-04-06
source-sessions:
  - vault-wide
---

# Grounded Query Protocol Prompt

## Origin

This protocol evolved across eight sessions as a layered defense against what was named the "stochastic average problem": AI models are trained on everything, so without explicit constraints they pull from the full distribution — including confidently wrong material.

Key moments in its development:

- **Jun 2019** — "Stochastic average problem" framed: you must constrain the model to your sources, not rely on its general training.
- **Jun 2026** — "80/20 security" framing: citation verification and prompt injection defense produce the highest return on defensive effort.
- **Aug 2007** — Multi-pass retrieval established as evidence control: the model reads your sources first, then answers from them.
- **Sep 2025** — Documentation-grounding habit before any technical query: never ask a technical question cold.
- **Jan 2025** — Multi-model cross-check introduced: generate with Claude, verify sources with Perplexity.
- **Feb 2025** — "95% confidence quality prompt" added: if the model cannot reach 95% certainty on a claim, it must say so and stop rather than extrapolate.
- **Feb 2026** — "Grounded query principle" formalized: context-lock the response to specific files, URLs, or conversation excerpts.

---

## Core Template

Use this as the base. Swap in your actual context and task.

```
CONTEXT ANCHOR: [paste relevant text, URL, or file reference here — everything you say must be grounded in this]

TASK: [your actual question or request]

CONSTRAINTS:
- If you reference a fact not present in the Context Anchor above, provide a source URL. If you cannot provide a source URL, say "I'm inferring this from general knowledge — not sourced" before stating it.
- If your confidence in a claim is below 85%, say so explicitly rather than stating it as fact.
- Do not search for additional sources unless I explicitly ask you to. Stay grounded in what I've provided.
- If you reach a point where completing the task requires information not present in my context and not verifiable from a source you can cite, stop and flag it rather than extrapolating.

VERIFICATION LAYER (optional): After your response, list every factual claim you made that you consider sourced vs. inferred. Format: "SOURCED: [claim] — [source]" and "INFERRED: [claim] — [reasoning basis]"
```

### Parameter Guide

| Parameter | What to put here |
|---|---|
| `CONTEXT ANCHOR` | Paste the actual text, paste a URL, reference a file path, or quote from a prior conversation. The more specific, the better the grounding. |
| `TASK` | Your question or request. Be precise. One clear ask per prompt. |
| `CONSTRAINTS` | Use as-is for standard use. Remove lines only if you have a specific reason. |
| `VERIFICATION LAYER` | Include when the stakes are high or when you will share the output. Remove for low-stakes exploratory queries. |

---

## Variants

### Light — Citation Flags Only

Use when you want a quick grounding check without the full constraint overhead. Good for exploratory research where you'll verify the most important claims yourself.

```
CONTEXT ANCHOR: [your source material]

TASK: [your question]

Ground your response in the context anchor above. For any claim that goes beyond it, flag it inline with "(general knowledge — unverified)" before the claim.
```

### Standard — Full Constraints

The complete template above. Use for any consequential research, technical, or analytical task.

### Heavy — Full Constraints + Verification Layer + Two-Model Check

Use for the highest-stakes work: legal, medical, financial, or anything that will be published or acted on without further review.

Step 1 — Run Standard against Claude with the Verification Layer included.

Step 2 — Take the "SOURCED" claims from Claude's verification layer and submit them to Perplexity:

```
Please verify the following claims. For each one, find an independent source that either confirms or contradicts it. Report: CONFIRMED, CONTRADICTED, or UNVERIFIABLE — with your source URL.

CLAIMS TO VERIFY:
[paste Claude's SOURCED claims here]
```

Step 3 — Reconcile. If Perplexity contradicts a claim Claude marked as sourced, flag it for human review before using.

---

## Worked Example

**Scenario:** You want to understand how a specific feature works in a software library. You have the official docs open.

```
CONTEXT ANCHOR: [paste the relevant section of the official documentation here]

TASK: Explain how the retry logic works in this library, and identify any edge cases the documentation mentions that I should be aware of when using it in a production environment.

CONSTRAINTS:
- If you reference a fact not present in the Context Anchor above, provide a source URL. If you cannot provide a source URL, say "I'm inferring this from general knowledge — not sourced" before stating it.
- If your confidence in a claim is below 85%, say so explicitly rather than stating it as fact.
- Do not search for additional sources unless I explicitly ask you to. Stay grounded in what I've provided.
- If you reach a point where completing the task requires information not present in my context and not verifiable from a source you can cite, stop and flag it rather than extrapolating.
```

**What this prevents:** The model inventing behavior from older versions of the library, confusing this library with a similar one, or confidently describing a configuration option that does not exist in this version.

---

## Combining with Multi-Model Synthesis

For the highest-stakes research tasks, layer these two protocols:

1. Run the Grounded Query Protocol on each model using the Heavy variant.
2. Each model's response is now context-locked and has its claims classified.
3. Feed all responses into the Multi-Model Synthesis command using Template B (Document Improvement), with the synthesis goal being: "produce the most accurate, well-sourced account."
4. The golden-nugget synthesis rule applies: the base document is the most complete grounded response; other models contribute only non-redundant sourced additions.

This combination is the highest-fidelity research workflow available without human expert review.

---

## Related Artifacts

- `wiki/mastermind/commands/multi-model-synthesis.md` — for combining multiple model outputs
