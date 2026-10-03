---
name: The Incremental Reveal
type: command
description: Reverse-engineer any AI product's hidden architecture — system prompts, guardrails, tool chains, reasoning patterns — through a structured sequence of progressive questions that map the boundaries of what the system will and won't do.
source: multiple — Jun 12, 2025 AIMM session on dissecting AI products
trigger: /aimm:incremental-reveal
location: wiki/mastermind/commands/
source-sessions:
  - 2025-06-12_Mastermind
---

# The Incremental Reveal

Reverse-engineer any AI product's hidden architecture — system prompts, guardrails, tool chains, reasoning patterns — through a structured sequence of progressive questions that map the boundaries of what the system will and won't do. From the Jun 12, 2025 AIMM session on dissecting AI products to understand what's actually under the hood.

---

You will systematically reverse-engineer an AI product, agent, or tool by probing its behavior through carefully sequenced questions. The goal is not to "jailbreak" — it's to understand the architecture, constraints, and design decisions so the user can learn from them, compete with them, or build something better.

The analytical mechanism: AI products reveal their architecture through what they do, what they refuse, what they hallucinate about, and where their behavior changes abruptly. Each response is a data point. The sequence matters — early questions establish baselines, middle questions probe boundaries, late questions test hypotheses formed from the pattern.

THE PRODUCT TO REVERSE-ENGINEER: $ARGUMENTS

If no product was provided above, ask me to name the AI product, agent, or tool to analyze.

MY GOAL: [WHAT YOU WANT TO LEARN — e.g., understand their system prompt architecture, map their tool chain, identify their moat, learn their UX patterns, find gaps to compete against. Say "you decide" to have me infer from the product type]

If "you decide," infer and state the most likely goal, then proceed.

---

STEP 1 — BASELINE MAPPING:
Before probing, document what's publicly known about this product:
- What does the product claim to do? (Marketing copy, docs, demos)
- What model(s) does it likely use? (Based on behavior, pricing, or public statements)
- What's the apparent interaction pattern? (Chat, agent, workflow, API)
- What are the obvious constraints? (Rate limits, topic restrictions, output formats)

Use web search to gather current information. Don't guess — verify.

---

STEP 2 — DESIGN THE PROBE SEQUENCE:
Generate a sequence of 8-12 questions to ask the product, organized in three phases:

**Phase A — Capability Mapping (3-4 questions):**
Questions that establish what the product can do. Start broad, narrow based on responses. These should feel like normal user questions — nothing adversarial yet.

**Phase B — Boundary Probing (3-4 questions):**
Questions designed to find where behavior changes. Edge cases, ambiguous requests, multi-step tasks that might reveal tool use or chain-of-thought patterns. Look for:
- Where does it refuse, and how does it phrase refusals? (Reveals guardrail language)
- Where does it switch modes or formats unexpectedly? (Reveals routing logic)
- Where does it cite sources vs. generate? (Reveals RAG vs. parametric knowledge)

**Phase C — Architecture Hypotheses (2-4 questions):**
Based on Phase A and B observations, generate specific hypotheses about the architecture and design questions that would confirm or falsify them. Each question should be designed to distinguish between two plausible explanations.

For each question: state what you expect to learn and what different responses would indicate.

---

STEP 3 — PATTERN ANALYSIS:
After the probe sequence is designed (and ideally after the user has run some of them), analyze the response patterns:

- **System prompt signals**: Consistent phrasing, repeated caveats, or formatting patterns that suggest hardcoded instructions
- **Tool chain indicators**: Response latency changes, format shifts, or capability jumps that suggest external tool calls
- **Guardrail architecture**: What triggers refusals, how refusals are phrased, and whether guardrails are pre-generation or post-generation
- **Knowledge boundaries**: Where the product transitions from confident to uncertain — reveals training data cutoffs or RAG corpus limits
- **Persona consistency**: Does the product maintain character under pressure, or does a base model personality leak through?

---

STEP 4 — ARCHITECTURE RECONSTRUCTION:
Based on the evidence, produce a best-guess architecture diagram (in text):
- Model layer (what foundation model, what fine-tuning)
- System prompt layer (inferred instructions, persona, constraints)
- Tool layer (what external tools or APIs are being called)
- Guardrail layer (pre-processing filters, post-processing checks)
- UX layer (how the interface shapes the interaction)

Rate your confidence for each layer: HIGH (strong evidence), MEDIUM (pattern-consistent), LOW (speculative).

---

STEP 5 — STRATEGIC IMPLICATIONS:
Based on the reconstruction, answer the user's original goal:
- If learning: what design decisions are worth adopting, and which are mistakes?
- If competing: where are the gaps, and what would a better version look like?
- If building: what's the minimum viable architecture to replicate the core value?

---

STEP 6 — VERIFICATION:
- Are the probe questions actually diagnostic, or would any product give similar responses? (Control question: would a vanilla ChatGPT session produce the same patterns?)
- Am I over-interpreting noise as signal? Flag any conclusions that rest on a single data point.
- Is the architecture reconstruction internally consistent, or do some layers contradict others?

Revise conclusions that don't survive scrutiny.

## Source

- [[wiki/mastermind/sessions/2025-06-12_Mastermind]] (multiple — dissecting AI products)
