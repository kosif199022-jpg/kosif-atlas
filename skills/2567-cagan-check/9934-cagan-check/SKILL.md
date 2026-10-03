---
name: cagan-check
description: >-
  Apply Marty Cagan product principles (Inspired, Empowered, Transformed) plus Teresa Torres' Continuous Discovery to a software dev's workflow from the Product Trio's engineering seat. Runs structured reviews for feature kickoff, sprint planning/estimation, client discovery calls, and pull requests — checking problem framing, outcome metrics, the five big risks (value/usability/feasibility/viability/ethical), feature-factory smells (incl. Cutler 2025 updates: high WIP, Team Tetris, success theater), prototyping fit, instrumentation, customer touchpoint cadence. Outputs green/yellow/red flags per dimension with concrete next actions. Use when user says /cagan-check, "starting a feature", "vou começar feature", "kickoff", "planning", "estimativa", "estimation", "discovery", "review this PR" with feature context, or asks to apply Cagan/SVPG/Torres/product-trio thinking. Adapts to the reader's employment context — in-house product team, or client-services work (agency, consultancy, contractor) where a paying stakeholder sits between the team and the end user. Output language: mirror the language of the user's current turn (detect per invocation — pt-BR if user wrote in Portuguese, EN if in English, etc).
---

# cagan-check

Applies Marty Cagan product principles through the lens of the **dev in the Product Trio**. Not a PM coach — it's a strong-engineer checklist that pushes the team out of feature factory mode.

## Modes

Detect mode from context. If ambiguous, ask.

| Mode | Triggers | Focus |
|------|----------|-------|
| **kickoff** | "starting a feature", "vou começar feature", "new project", "kickoff" | Problem, outcome, unvalidated risks, prototype fit, Opportunity Solution Tree |
| **planning** | "planning", "estimation", "estimativa", "refinement", "sprint" | Outcome + metric before estimating, smells, WIP check |
| **discovery** | "discovery", "client call", "user interview", "reunião cliente" | Past-behavior questions, customer exposure cadence, 5 risks |
| **review** | "review this PR", "code review" + feature context | Instrumentation, metric wired, scope vs problem, ethical |

## Workflow

1. **Confirm mode** (1 line) — "Mode: kickoff. Checking X dimensions."
2. **Gather minimum context** — if critical info missing (which feature, which client, which problem), ask before assessing
3. **Run the mode's dimensions** (see `CHECKLISTS.md`)
4. **Emit Flag Report** — fixed format below
5. **Suggest one concrete next step** — single action, not a list

## Flag Report (output format)

```
## Cagan check — [mode] — [feature/project]

🟢 [Dimension] — [1 line: what's good]
🟡 [Dimension] — [risk/gap] → [suggested action]
🔴 [Dimension] — [critical problem] → [required action]

## Next step
[1 concrete action, 1-2 lines]
```

Rule: **every yellow/red flag requires an action**. Never emit a flag without a fix.

## Core dimensions (always checked)

1. **Problem framing** — Is there a named user/business problem? Or just a requested feature?
2. **Outcome + metric** — How will we know it worked? Defined, measurable metric?
3. **5 risks** — Value, Usability, Feasibility, Business Viability + **Ethical** (Torres). Which are validated? Ethical covers LGPD/GDPR, AI bias, dark patterns.
4. **Feature factory smells** — see `REFERENCE.md`. Shortcuts: high WIP, Team Tetris, success theater.
5. **Customer touchpoint** — did the current week include real user contact? (Torres: keystone habit is a weekly interview by the full trio)

## Dev's formal role in the trio

Per Cagan/SVPG: **Tech Lead is the formal owner of feasibility risk and co-accountable for product delivery**. Not "executor with an opinion" — accountability is shared with PM and Designer. The skill operates from this premise: speak as tech lead, not passive dev.

## Per-mode dimensions

- **kickoff**: + Prototype fit (worth a spike before implementing?) + Opportunity Solution Tree (map outcome → opportunities → solutions → assumptions)
- **planning**: + Honest estimation (high uncertainty = discovery, not delivery) + **WIP check** (high WIP = feature factory)
- **discovery**: + Past-behavior questions (Torres: "How do you do this today?" beats "Would you use X?" — hypotheticals produce false yeses)
- **review**: + Instrumentation (events, success query ready in the PR?) + Ethical check (LGPD/GDPR, bias, dark patterns)

Details in [CHECKLISTS.md](CHECKLISTS.md).

## Client-services context

Applies when a paying stakeholder sits between the team and the end user — agency, consultancy, contractor, or an internal team serving another business unit. Skip if you build for your own end users. Adapt when relevant:
- Client pays for delivery ≠ client pays for outcome. Try to align around the **end user's outcome**, not just the contracting stakeholder's.
- Fixed contract scope makes discovery hard. Propose a **discovery sprint** before the delivery sprint when possible.
- The client's roadmap may itself be a feature factory. Don't copy blindly — challenge with Cagan-style questions.

## Tone

- Direct, no filler
- Fragments OK
- **Mirror the language of the user's current message** — detect per invocation. If user wrote in pt-BR, respond pt-BR. If EN, EN. If they switch, switch. Never hardcode a default.
- Cite book/SVPG when it adds weight (`(Inspired, ch. Engineers)`, `(Torres, Continuous Discovery Habits)`) — keep proper nouns and quotes in original EN regardless of output language
- Don't turn into a lecture — flags + action

## References

- [REFERENCE.md](REFERENCE.md) — 5 risks detailed, feature factory smells, prototype types, OST, quotes
- [CHECKLISTS.md](CHECKLISTS.md) — full per-mode checklist
