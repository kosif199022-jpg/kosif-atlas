# Workflow — Reviewer

Use when the user asks to review code, a PR, or a diff against engineering principles.

## Process

### 1. Establish scope

- Single function / class / file / PR / branch?
- Stack and conventions in this repo (read CLAUDE.md or skim the directory)?
- Quality targets agreed for this system (ask if not stated)?

### 2. Multi-pass scan

Run these scans in order; each finds different defects.

#### Pass 1 — Smells

Reference [topics/refactoring.md](../topics/refactoring.md) and [reference/anti-patterns.md](../reference/anti-patterns.md). Flag:

- Long methods / God classes
- Duplicated code (clones)
- Feature Envy / train wrecks
- Primitive obsession
- Comments as crutch
- Singletons used as globals

#### Pass 2 — SOLID

Reference [reference/solid-expanded.md](../reference/solid-expanded.md). For each principle, flag the typical violation and propose the exit refactor.

#### Pass 3 — Tests

Reference [reference/tdd-cycle.md](../reference/tdd-cycle.md) and [checklists/testability.md](../checklists/testability.md); for whether the right *kinds* of test exist, defer to the `testing-philosophy` skill. Flag:

- Missing tests for new logic
- Flaky timing-based tests
- Multiple unrelated asserts
- Conditionals inside tests
- Mocks coupled to internal implementation rather than contracts

#### Pass 4 — Overengineering

Reference [reference/simplicity-guard.md](../reference/simplicity-guard.md). Flag:

- Abstractions / interfaces / generics with one implementation
- Layers that only forward calls (repo → service → controller with no logic)
- Config knobs / env vars with one value in use
- Dependencies replacing < 20 lines of code
- Patterns applied without a named force ("might need later", "best practice")
- Defensive try/catch / validation for impossible states
- Feature flags / fallbacks for use cases not requested
- Premature service splits, queues, caches without measured need

Fix prescription: collapse / inline / delete. Three similar lines beat a premature abstraction.

#### Pass 5 — Architecture / boundaries

Reference [topics/architecture.md](../topics/architecture.md). Flag:

- Layer-skip (UI calling DB directly)
- Microservices sharing a DB
- Sync calls where async would decouple
- Hidden coupling via globals or shared mutable state

### 3. Output format

One comment per finding, structured:

```
LOCATION: file:line
PROBLEM: <one short line>
WHY: <principle violated>
FIX: <concrete refactor / test / decoupling>
SEVERITY: blocker | major | minor | nit
```

### 4. Prioritize

- **Blockers** — security, correctness, broken contracts.
- **Majors** — SOLID violations with measurable consequences.
- **Minors** — style, naming, comments.
- **Nits** — preferences.

Don't pad the review with nits when blockers exist. Surface blockers first.

### 5. Praise selectively

Call out genuinely good design choices (correct pattern selection, clean abstraction, smart trade-offs). Skip generic praise.

## Quick checklist

Use [checklists/code-review.md](../checklists/code-review.md) as the operational pass-list.
