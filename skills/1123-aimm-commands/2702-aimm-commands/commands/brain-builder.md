---
name: The Brain Builder
type: command
description: Design an AI-powered product that packages your expertise into a scalable, interactive system — not a course or a PDF, but a "brain" that clients interact with directly. Architect the knowledge structure, interaction model, and delivery mechanism that turns what you know into something that works while you sleep.
source: multiple — Sep 4, 2025 AIMM session on the "Brain" business model
trigger: /aimm:brain-builder
location: wiki/mastermind/commands/
source-sessions:
  - 2025-09-04_Mastermind
---

# The Brain Builder

Design an AI-powered product that packages your expertise into a scalable, interactive system — not a course or a PDF, but a "brain" that clients interact with directly. Architect the knowledge structure, interaction model, and delivery mechanism that turns what you know into something that works while you sleep. From the Sep 4, 2025 AIMM session on the "Brain" business model.

---

You will help me design an AI-powered product that encodes my professional expertise into an interactive system clients can use independently. Not a chatbot with personality — a structured knowledge product that delivers the judgment, frameworks, and pattern recognition I've built over years, in a format that scales beyond my personal availability.

The mechanism: the traditional expertise economy forces a trade between depth and scale. You can deliver your best thinking to 10 clients personally, or a diluted version to 1,000 through courses. A "brain" product breaks this trade-off: it encodes your decision-making patterns, frameworks, and domain knowledge into an AI system that delivers personalized, context-aware guidance at scale — the way you would advise, if you had infinite time.

MY EXPERTISE DOMAIN: $ARGUMENTS

If no domain was provided above, ask me to describe my expertise area, who I serve, and what kind of guidance I typically provide.

MY AUDIENCE: [WHO WOULD USE THIS PRODUCT — clients, students, internal team, public market. Say "you decide" to have me infer from the expertise domain]
PRODUCT SCOPE: [NARROW for a focused single-problem tool, BROAD for a comprehensive advisory system. Say "you decide" to have me recommend based on the domain]

If "you decide," state the recommendation with reasoning and proceed.

---

STEP 1 — EXPERTISE AUDIT:
Before designing anything, inventory the knowledge that would power this product. Identify:

**Core frameworks**: The 3-5 frameworks, models, or decision trees you use most often when advising clients. These become the product's reasoning engine.

**Pattern library**: The recurring situations, symptoms, and scenarios you've seen enough times to recognize instantly. These become the product's diagnostic capability.

**Judgment layer**: The nuanced, context-dependent decisions where your advice differs from the textbook. This is the hardest to encode and the most valuable — it's what separates your brain from generic AI advice.

**Edge cases and exceptions**: The situations where your usual frameworks break down and require improvisation. These become the product's safety rails — knowing when to escalate to a human.

For each: describe it in enough detail that an AI system could apply it. If you can't describe it explicitly, flag it — we'll use the Wisdom Doctrine excavation approach to surface it.

---

STEP 2 — INTERACTION MODEL:
Design how users interact with the brain. Key decisions:

**Entry point**: How does a user start? Options include:
- Problem-first: "I'm dealing with X" → the brain diagnoses and advises
- Goal-first: "I want to achieve Y" → the brain designs a path
- Guided assessment: The brain asks structured questions to understand the situation before advising
- Free-form: Open conversation with the brain's expertise available on demand

**Session structure**: Does the brain deliver one-shot advice, or does it guide users through a multi-step process? If multi-step, what gates progression (like competency checks, completed exercises, or submitted data)?

**Personalization depth**: How much does the brain learn about each user? Options range from "stateless — every interaction starts fresh" to "deep context — the brain remembers everything and adapts over time."

**Output format**: What does the user actually receive? Options include — but are not limited to — written advice, structured action plans, decision frameworks, templates, diagnostic reports, or facilitated exercises.

Recommend an interaction model and explain why it fits this expertise domain.

---

STEP 3 — KNOWLEDGE ARCHITECTURE:
Design the technical structure:

**System prompt layer**: The persistent instructions that define the brain's expertise, personality, and constraints. Draft the key elements — not the full prompt, but the architectural decisions about what goes in it.

**Knowledge base layer**: What reference material does the brain need access to? Your frameworks, case studies, templates, and domain data. Specify what exists already and what needs to be created.

**Retrieval strategy**: How does the brain access the right knowledge at the right moment? Options: RAG (retrieval-augmented generation) for large knowledge bases, context-window stuffing for smaller ones, or tool-calling for dynamic data.

**Quality gates**: How does the product ensure accuracy? What topics should it handle confidently, where should it express uncertainty, and when should it redirect to a human expert?

---

STEP 4 — MVP SPECIFICATION:
Define the minimum viable product — the smallest version that delivers real value:

- **Scope**: Which subset of your expertise delivers the most value with the least complexity?
- **Use case**: What specific problem does the MVP solve? (One problem, not five)
- **Input**: What does the user need to provide?
- **Output**: What do they receive?
- **Platform**: Where does this live? (Custom app, GPT Store, Claude Project, Slack bot, web app, etc.)
- **Build estimate**: What's realistic to build in 2 weeks? 1 month? 3 months?

---

STEP 5 — MONETIZATION MODEL:
How does this product generate revenue?

- **Access model**: Subscription, per-use, bundled with services, freemium with premium tier, or embedded in existing client engagements?
- **Pricing anchor**: What is the client currently paying for this kind of guidance? (1:1 consulting rate, course price, etc.) The brain should be priced relative to the alternative, not relative to the cost of running it.
- **Value demonstration**: How do you prove the brain works before asking for payment? Trial, case study, limited free tier, or money-back guarantee?

---

STEP 6 — VERIFICATION:
- Does the expertise audit capture genuinely distinctive knowledge, or is it encoding generic best practices that anyone could prompt AI to generate? The product's value is proportional to how different its output is from a vanilla ChatGPT conversation on the same topic.
- Is the interaction model matched to how clients actually need this knowledge, or is it designed around what's easy to build? Test: would a real client use this the way I've designed it?
- Is the MVP genuinely minimal, or is it a full product with the word "MVP" attached? The first version should be embarrassingly simple but undeniably useful.
- Am I being honest about what AI can and can't do for this domain? Flag areas where the brain might confidently give wrong advice because the judgment layer is too nuanced to encode.

Revise what doesn't survive the audit.

## Source

- [[wiki/mastermind/sessions/2025-09-04_Mastermind]] (multiple — the "Brain" business model)
