# Workflow — Refactor

Use when the user asks to refactor, clean up, improve structure, or fix a code smell.

## Process

### 1. Hard prerequisite — green tests

If no test suite exists or current tests fail → **stop**. Do this first:

- Identify the unit under change.
- Write characterization tests (capture current behavior, even if quirky).
- Confirm green baseline.

Without this safety net, refactoring is reckless. Reference: [reference/tdd-cycle.md](../reference/tdd-cycle.md).

### 2. Identify the smell

Reference [reference/symptom-map.md](../reference/symptom-map.md) and [topics/refactoring.md](../topics/refactoring.md).

Common entry smells:

- Long method
- Duplicated code
- God class
- Feature envy
- Primitive obsession
- Switch on type
- Train wrecks

### 3. Pick the operation

Reference [reference/refactoring-catalog.md](../reference/refactoring-catalog.md). Match smell → refactoring. Examples:

| Smell | Refactoring |
|-------|-------------|
| Long method | Extract Method |
| God class | Extract Class |
| Switch on type | Replace Conditional with Polymorphism |
| Sibling class duplication | Pull Up Method |
| Misplaced method | Move Method |
| Cryptic name | Rename |

### 4. Apply in baby steps

For each refactoring:

1. Use IDE-automated tooling if available (Rename, Extract, Move).
2. Apply one transformation.
3. Run tests.
4. Commit.
5. Next.

Never combine refactorings into one giant edit. Small steps reveal regressions immediately.

### 5. Honor external API

If the changed method is consumed externally:

- Add `@Deprecated` (or stack equivalent) on the old signature.
- Have the deprecated version delegate to the new one.
- Schedule removal for a later release.

Don't break callers without warning.

### 6. Simplicity direction

Refactoring removes complexity, never adds speculative complexity. Reference [reference/simplicity-guard.md](../reference/simplicity-guard.md).

- Prefer **inline / collapse / delete** over **extract / abstract / layer** unless duplication or a named force demands abstraction.
- Don't introduce a Strategy / Factory / interface for a single implementation "to make it extensible".
- Don't add config knobs, DI seams, or plugin points without a present consumer.
- If the user named a stack or constraint, refactor inside it — no library swaps mid-refactor.

### 7. Behavior preservation rule

Refactoring must **not** change observable behavior. If you find a bug along the way:

- Note it.
- Finish the refactoring as planned.
- Fix the bug as a separate commit, with its own test.

Mixing refactor + bug fix corrupts both reviews and history.

### 7. Decide opportunistic vs planned

- **Opportunistic** (default) — small fixes while in a file for another reason. Boy Scout rule.
- **Planned** — only when tech debt is severe enough that the team can justify a dedicated sprint or block of time. Treat as exceptional.

### 8. Output shape

```
SMELL: <name + location>
REFACTORING: <operation>
STEPS: <numbered baby steps>
RISKS: <what could break>
TESTS NEEDED: <new or characterization tests>
```

## Quick checklist

Use [checklists/refactor-triggers.md](../checklists/refactor-triggers.md) for the smell-to-action mapping. When the smell is "hard to test," route through [checklists/testability.md](../checklists/testability.md) first — refactor for seams before refactoring for cleanliness.
