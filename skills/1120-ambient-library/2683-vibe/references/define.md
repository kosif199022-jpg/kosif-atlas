# Define — requirements and decomposition for tier L

Read this only when step 1 picks tier L (a new app, or a request of about 3+
slices). Define replaces step 1 for the whole plan. Its output is the app's
`PRD.md` and `PLAN.md`, both in the app root. Rules adapted from the grill skill
(how to ask) and solofactory's factory-guide (what to cover, how to write
acceptance).

## Asking (from grill)

- **First question is always open: the current workflow and existing data.**
  "How do you do this today, step by step? Do you already have data (files,
  lists, another app) that should come in?" Ask it before any default. It has
  no recommended answer, but you may offer "or skip, and I will assume a fresh
  start". Hidden
  preferences — an import, a layout habit, an order — surface here, and no
  proposed default will find them. Its answers fill `workflow` and `data`.
- **One question per message.** Rank by how much the answer changes what you
  build. Ask the highest-impact unknown first.
- Each question has three parts: **why** it matters (one line), the
  **question** in plain product language, and your **recommended default**
  with its tradeoff. "Go with your default" is a valid answer.
- Show a concrete example of input and output when behavior is ambiguous
  ("you paste `2 eggs, 1 cup flour` → the list shows `eggs 2`, `flour 1 cup`").
- **Lock each answer** in a ledger at `.vibe/ledger.md` (the folder may have
  no `.aai/` yet). Never re-ask a locked item. The ledger becomes the plan's
  Locked section.
- If the user answers several things at once, lock them all and skip ahead.
- **Stop** when no remaining unknown would change what you build next. Do not
  ask what you can decide — decide it and list it as an assumption.
- Typical Define is 3–8 questions. More than 10 means you are asking about
  things you should decide.

## Coverage (from factory-guide)

Before the handoff, each key is **complete** (known or a stated assumption):

| Key | Question it answers |
|---|---|
| promise | What the app does, in one sentence |
| user | Who uses it (usually: you, locally) |
| problem | What is painful today |
| workflow | The main path, step by step |
| must-haves | What v1 cannot ship without |
| non-goals | What v1 will not do |
| data | What is stored, where, and how long; import or export |
| integrations | External APIs, files, services, keys |
| visual | Look and feel, reference apps, density |
| acceptance | The scenarios (below) |
| constraints | Stack, platform, offline, performance |

## One-way doors — always confirm, never assume

Confirm these explicitly even when you have a good default. They are costly
to change after components are built on them. Doors with clear defaults may
be confirmed together in one message:

- The data model's core entities and persistence (SQLite file vs browser)
- Auth, multiple users, or anything shared over a network
- Paid or external services, and the keys they need
- Deleting or overwriting user data
- The stack, for a new app

## Acceptance scenarios

- One observable behavior each: **"the <actor> can <action> and then
  <observable result>"**.
- Negative and edge cases are their own scenarios ("…pastes an empty recipe
  and then sees 'Nothing to add'").
- 2–6 scenarios per component. More means split the component.

## Decomposition

- A **component** is a vertical slice the user could try on its own: UI,
  logic, and storage together. Not "backend" then "frontend".
- Order by dependency, then by value. Component 1 is the thinnest end-to-end
  path through the main workflow.
- Name dependencies explicitly. Keep the plan flat: more than ~12 components
  means the app should graduate to a formal spec or WBS workflow.

## Handoff

Send one message and **continue without waiting**:

> Aligned. Building N components autonomously within: <the locked one-way
> doors and key constraints>. Plan: <component names>. I will stop only for a
> one-way door I cannot decide.

On a first build, run step 0 now. Then write `PRD.md` (every scenario as a
numbered requirement, under one heading per component marked "planned") and
the plan, commit them, and start the component loop.

## Plan file — `PLAN.md` (app root)

```markdown
# Plan — <app name>

## Locked
- <each locked answer and one-way door, one line each>

## Components
### 1. <name> — pending | done | blocked: <why>
- depends: none | <numbers>
- scenarios:
  - the user can … and then …
- notes: <pre-flight changes and assumptions>
```

## Next increment (existing plan)

For a new tier-L request in an app that already has a plan: read `PRD.md`, the
plan, and the code first. Ask only about the new increment. Append new
components. Never rewrite done components.
