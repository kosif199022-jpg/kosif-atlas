# Prompt Enrichment

Most prompts leave value on the table. The user asks the question they know to ask — but the best answer depends on constraints, context, and complexity they didn't think to include.

This skill bridges that gap. It analyzes a prompt for what's missing, asks the user for real data before guessing, enriches the prompt with everything it surfaced, and then delivers either the rewritten prompt or a direct answer built on it.

## The Problem It Solves

Language models pattern-match on surface cues. When a user asks "Should I walk or drive to the car wash 50 meters away?", the model locks onto the distance ("50 meters is short") and recommends walking — never noticing that the car itself needs to be at the car wash. The distance heuristic fires first, feels like a complete answer, and suppresses the physical constraint without the model ever recognizing it missed something.

This isn't a knowledge gap. The model *knows* cars need to be present to be washed. It's an activation failure: the wrong frame dominates, and the right knowledge never gets a chance to participate.

Research on prompt architecture (Jo, 2026 — [arXiv:2602.21814](https://arxiv.org/abs/2602.21814)) found that forcing explicit goal articulation before inference begins raises accuracy from 0% to 85–100% on these implicit-constraint problems. This skill operationalizes that finding into a repeatable workflow.

## How It Works

Four stages, applied in order:

**Analyze.** Infer the user's actual goal (not their literal question), then map the implicit constraints — physical, temporal, domain-specific, stakeholder-related — that the prompt never states but that the answer depends on.

**Source.** Before guessing, ask the user if they have real data that covers the gaps. A pitch deck, intake form, client notes, error log — whatever the prompt is about, the user often has artifacts they didn't think to include. User-provided data is always more valuable than inference.

**Enrich.** Integrate what the user provided with what you inferred. Rewrite the prompt so it starts with the real goal, makes implicit constraints explicit, and includes the context that changes the answer.

**Deliver.** In default mode, present the enriched prompt for review. In fast mode, go straight to answering. In export mode, hand back a clean prompt the user can take elsewhere.

## When It Helps (and When It Doesn't)

The skill adds the most value when the obvious answer is probably incomplete: multi-step decisions, domain-specific questions where unstated rules matter, planning problems with hidden dependencies, or any prompt where "best" depends on context the user didn't provide.

It correctly stays out of the way for simple, well-scoped questions. "How do I center a div in CSS?" gets a direct answer — no enrichment, no source check. The test: if enrichment wouldn't change the substance of the answer, just make it longer, the skill skips it.

## Eval Results

Four evaluations test the skill across different prompt types:

**Car Wash Problem** — The user asks about getting to a car wash 50 meters away. Without enrichment, the model recommends walking (wrong — the car can't walk). With enrichment, the skill surfaces the physical constraint and reframes the question, making the correct answer (drive) unavoidable. This is the canonical example of the heuristic override the research identified.

**Python Learning** — "What's the best way to learn Python?" is undefined without knowing who's asking. Without enrichment, the model produces a generic curriculum (Codecademy → LeetCode → open source). With enrichment, the skill asks five targeted questions, learns the user is a marketing manager wanting to automate CRM reports on a 3-month timeline, and produces a week-by-week plan built around their actual tools and constraints.

**CSS Centering** — "How do I center a div?" is already well-scoped. The skill correctly skips enrichment and produces an equivalent answer to the baseline. This eval confirms the skill knows when *not* to intervene.

**Coaching Proposal** — Without enrichment, the model produces a proposal template with placeholder brackets. With enrichment, the skill asks for client details and methodology, receives specific context (company, CEO, team dynamics, pricing), and produces a named, priced, ready-to-send proposal.

The eval viewer is included as an HTML file for side-by-side comparison of with-skill and without-skill outputs.

## Files

```
SKILL.md          The skill definition (install this)
evals/
  evals.json      Eval prompts and expectations
```

## Installation

Copy `SKILL.md` into your Claude skills directory. The skill triggers automatically on prompts that would benefit from enrichment, or when the user explicitly asks to improve a prompt.

## Related

- [Research paper: arXiv:2602.21814](https://arxiv.org/abs/2602.21814) — the prompt architecture study this skill is based on
