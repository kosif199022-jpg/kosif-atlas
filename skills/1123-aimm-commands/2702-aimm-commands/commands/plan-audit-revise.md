---
name: Plan-Audit-Revise
type: command
description: Three-step workflow that catches plan-level errors before they become implementation bugs. Ask AI to generate a plan, then audit its own plan for gaps, conflicts, and unstated assumptions, then revise. Exploits the difference between AI generation mode (narrative coherence) and evaluation mode (gap detection). Lou found 18 problems in one pass.
trigger: /aimm:plan-audit-revise
location: wiki/mastermind/commands/
source-sessions:
  - 2026-04-16_Mastermind
---

# Plan-Audit-Revise

## The Problem This Solves

AI generates plans that *look* coherent but contain structural gaps, missing dependencies, conflicting assumptions, and unstated prerequisites. These defects compound during implementation — each undetected problem spawns secondary problems. The root cause: AI generation mode optimizes for narrative flow, not for completeness. Evaluation mode catches what generation mode hides, but you have to explicitly invoke it.

## The Command

Use before implementing any AI-generated plan:

```
Audit this plan before we build anything.

Find every:
- Gap (something the plan needs but doesn't address)
- Conflict (two parts of the plan that contradict each other)
- Missing dependency (something that must exist before a step can work)
- Unstated assumption (something the plan takes for granted without checking)
- Potential failure mode (what breaks if this step doesn't work as expected)
- Edge case (a scenario the plan doesn't handle)

For each issue found, describe: what it is, where in the plan it lives, why it matters, and how to fix it.

Then produce a revised plan that addresses every issue. Mark what changed and why.
```

## The Three-Step Minimum

1. **Plan** — Ask AI to generate the best plan it can for your task. Let it present with confidence.
2. **Audit** — Use the command above. The keyword "audit" shifts the model from generation to evaluation mode.
3. **Revise** — The audit output includes fixes. Review them, then ask for a clean revised plan incorporating all accepted fixes.

Never skip step 2. The cost is one additional prompt. The payoff is catching problems before they compound.

## Why This Works

Generation and evaluation access different patterns in the model. Generation optimizes for: narrative coherence, completeness of story arc, confident presentation. Evaluation optimizes for: gap detection, consistency checking, failure-mode analysis. They are complementary, not redundant. Running both is not "asking twice" — it's asking from two different cognitive angles.

## Evidence

Lou demonstrated this during the April 16 session while integrating the AAR system into his vault. Claude generated a plan it presented with full confidence. The audit found 18 distinct problems: structural gaps, missing edge cases, conflicting assumptions. All 18 were real. The revised plan was substantially different from the original.

## When to Use

- Before implementing any multi-step AI-generated plan
- Before shipping any skill, script, or workflow that AI designed
- Before accepting any architectural proposal from AI
- Before deploying any integration that touches existing systems

## Source

- [[wiki/mastermind/sessions/2026-04-16_Mastermind]] (Lou — plan-audit-revise pattern, 18-problem discovery)
