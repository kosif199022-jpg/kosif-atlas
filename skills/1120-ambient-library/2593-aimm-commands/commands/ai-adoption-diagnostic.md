---
name: AI Adoption Diagnostic
type: prompt
description: A structured prompt that assesses the AI adoption posture of a leader, team, or organization — identifying where they actually are on the adoption curve and what is blocking progress.
use-when:
  - individual: A leader or practitioner wants to understand their own AI adoption gaps
  - team lead: A manager wants to assess their team's readiness before rolling out AI tools or workflows
  - org consulting: A consultant or coach is doing discovery before designing an AI adoption program
score: 78/100
sessions: 4
last_updated: 2026-04-06
source-sessions:
  - vault-wide
---

# AI Adoption Diagnostic Prompt

## Origin

**Dec 2025** — Kasimir cited research establishing the core finding: AI adoption fails when it is purely top-down (executive mandate without experimentation culture) or purely bottom-up (enthusiast pockets without vision or infrastructure). The healthy pattern requires both simultaneously.

Lou identified this as worth building out as the "AI Adoption Architecture Assessment."

**Apr 2026** — Reinforced from the teaching angle: the "curse of the expert" problem means advanced practitioners must assess where their clients or teams actually are before prescribing tools or workflows. Misaligned prescription is the most common failure mode in AI coaching engagements.

The consistent finding across sessions: **most clients are 1–2 stages behind where they think they are.** The diagnostic exists to surface this gap before it causes expensive misalignment.

---

## Intake Prompt

Parameterized by context. Choose one of three modes, or combine them.

### Mode A — Individual Leader Assessment

```
I want to assess my current AI adoption posture honestly.

MY ROLE: [job title / function / industry]
CONTEXT: [2–3 sentences about your current use of AI tools — what you use, how often, for what]

Please assess me across the following dimensions. For each one, ask me the clarifying questions you need to give an accurate rating. Do not assume — ask.

DIMENSIONS TO ASSESS:
1. Frequency and depth of AI use in actual daily work (not aspirational use)
2. Whether I have any systematic workflows that incorporate AI, or if use is ad hoc
3. My ability to prompt effectively — do I get good outputs consistently, or is it hit-or-miss?
4. Whether I am experimenting with new use cases, or only using AI for proven tasks
5. Whether I have shared AI workflows or discoveries with colleagues in the last 30 days

After gathering enough information, give me:
- A stage classification (see framework below)
- A posture classification (see matrix below)
- My top 2–3 specific gaps
- 3–5 next actions calibrated to my actual stage — not aspirational actions for a stage above where I am
```

### Mode B — Team Assessment

```
I want to assess my team's AI adoption posture.

MY ROLE: [your title and relation to the team]
TEAM SIZE AND FUNCTION: [describe the team]
CONTEXT: [what AI tools, if any, the team currently uses — and how they were introduced]

Please assess the team across the following dimensions. Ask clarifying questions as needed.

DIMENSIONS TO ASSESS:
1. Is there a stated organizational or team vision for AI use, communicated by leadership?
2. Are individual team members experimenting with AI in their day-to-day work — not just when directed to?
3. Is there a safe-to-fail environment where trying AI approaches and not succeeding is acceptable?
4. Is there any mechanism for cross-team sharing of AI discoveries, workflows, or lessons learned?
5. Is there training budget, time allocation, or policy infrastructure supporting AI adoption?

After gathering enough information, give me:
- A team posture classification (see matrix below)
- The team's current stage (see framework below)
- The top 2–3 structural gaps blocking progress
- 3–5 concrete next actions calibrated to the team's current stage
```

### Mode C — Organizational Discovery (Consulting)

```
I am assessing an organization's AI adoption posture as part of a discovery process.

MY ROLE: [coach / consultant / advisor]
ORGANIZATION: [industry, size, rough description — no confidential details needed]
WHAT I KNOW SO FAR: [what you've observed or been told about their current AI use]

Help me structure a diagnostic conversation. Generate:
1. The 8–10 highest-signal discovery questions I should ask in an initial conversation — questions that will reveal actual posture, not stated intention
2. For each question, note what a strong vs. weak response looks like
3. The most common blind spots organizations have about their own AI adoption stage
4. How to frame the posture classification and stage framework in a way that is honest but not discouraging
```

---

## Four-Posture Classification Matrix

| Posture | Top-Down Signals | Bottom-Up Signals | Core Risk |
|---|---|---|---|
| **Mandate-Only** | Present: executive vision, policy, investment | Absent: practitioner experimentation, safe-to-fail culture | Adoption theatre — compliance without capability. People perform AI use without building real skill. |
| **Grassroots-Only** | Absent: organizational vision, infrastructure, measurement | Present: enthusiast pockets, practitioner experiments | Islands of excellence — brilliant individuals, no scale, no sustainability. Dependent on a few champions who may leave. |
| **Balanced** | Present | Present | Growth mode. Challenge: maintain coherence and quality as adoption scales across diverse functions. |
| **Nascent** | Absent | Absent | Starting point. Neither dimension is developed. Challenge: which to develop first (see note below). |

### Nascent Starting Point Note

The instinct is to start top-down: get a vision statement, write a policy. This is wrong as a first move because it creates expectation without capability.

The correct starting point from sessions: **develop both simultaneously, at minimum viable scale.**

- Top-down minimum: one clear sentence from leadership on why AI matters to this team or org. Not a full strategy. One sentence.
- Bottom-up minimum: one designated safe-to-experiment space — a team meeting, a Slack channel, a weekly 20-minute share-out — where people can try things and report back without judgment.

These two moves, done together, create the conditions for balanced development without requiring a full strategy to exist first.

---

## Stage Assessment Framework

Five stages with defining characteristics. Most clients identify as one stage higher than they actually are.

| Stage | Name | Defining Characteristics |
|---|---|---|
| 1 | **Tool-Curious** | Has heard about AI tools. Has tried one or two. No regular use. Outputs are hit-or-miss. No systematic application to work. |
| 2 | **Prompt-User** | Uses AI tools regularly for specific, repeatable tasks (drafting, summarizing, research). Has some prompts that work. Still largely ad hoc. No workflows. Limited to known use cases. |
| 3 | **Workflow-Builder** | Has built repeatable AI-assisted workflows for specific work functions. Can teach others how to use these workflows. Experiments with new use cases actively. Some prompt engineering skill. |
| 4 | **System-Designer** | Designs AI systems — not just workflows. Thinks in terms of inputs, outputs, feedback loops, automation, and integration. Can evaluate AI tools strategically, not just tactically. May use APIs or no-code automation. |
| 5 | **Culture-Transformer** | Shapes how teams and organizations adopt and evolve with AI. Develops norms, training, shared infrastructure. Thinks about AI adoption as a cultural and structural challenge, not just a technical one. |

### Stage Diagnostic Signal

The fastest way to identify someone's actual stage: ask them to show you, step by step, how they used AI to accomplish something in the last 48 hours. Stage 1–2 people describe a vague interaction. Stage 3+ people describe a specific process.

---

## Output Template

Structure your diagnostic response to the client using this format:

```
POSTURE CLASSIFICATION: [Mandate-Only / Grassroots-Only / Balanced / Nascent]

STAGE ASSESSMENT: Stage [1–5] — [Name]
Confidence: [High / Medium — note if self-report and observed behavior diverge]

EVIDENCE FOR THIS ASSESSMENT:
- [2–3 specific observations or responses that support the classification]

TOP GAPS:
1. [Most important gap — be specific, not generic]
2. [Second gap]
3. [Third gap, if present]

NEXT ACTIONS (calibrated to Stage [X]):
1. [Action appropriate for this stage — not for a stage above]
2. [Action]
3. [Action]
4. [Action, if applicable]
5. [Action, if applicable]

WATCH OUT FOR:
[One specific blind spot or risk pattern most common at this stage — named directly, not softened]
```

---

## Coaching Note: Using This in a Discovery Call

This diagnostic works best as a structured conversation, not a form. The intake prompt is a guide for what you are trying to learn — not a questionnaire to read aloud.

Key principles for delivery:

1. **Lead with curiosity, not evaluation.** The goal in the first pass is to understand, not to classify. Classification happens in your own notes after the call.

2. **Watch for the gap between stated and demonstrated.** "We use AI constantly" followed by an inability to describe a specific recent example is a Stage 1–2 signal regardless of stated confidence.

3. **The curse of the expert.** If you are at Stage 4–5, Stage 2 will look more deficient than it actually is. Stage 2 is not a failure state — it is a stage. Calibrate your prescription to where they are, not where you wish they were.

4. **Posture misidentification is common.** Mandate-Only organizations often believe they are Balanced because they have an enthusiast or two. Grassroots-Only situations often believe they are Balanced because leadership has mentioned AI in a town hall. Probe both dimensions with specific evidence questions.

5. **End with stage-appropriate next actions.** The most common coaching mistake is prescribing Stage 4 actions to a Stage 2 client. This produces overwhelm and abandonment. The single most valuable thing you can do is give them the right next step for where they actually are.

---

## Related Artifacts

- `wiki/mastermind/prompts/grounded-query-protocol.md` — for grounding any claims in the diagnostic in specific evidence
- `wiki/mastermind/commands/multi-model-synthesis.md` — for deliberating on a client's situation across multiple AI perspectives before making recommendations
