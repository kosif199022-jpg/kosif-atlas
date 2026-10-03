# Workflow — Advisor

Use when the user asks "should I…", "how should I approach…", "what's the best way to…", or wants pre-code consultation on a specific problem.

## Process

### 1. Frame the problem

Ask if missing:

- What is the user trying to accomplish?
- What constraints (perf, time, team, stack)?
- Is this isolated logic or part of a larger flow?

### 2. Identify the relevant topic(s)

Map intent to [topics/](../topics/):

- New module structure → `topics/design-principles.md`
- Variant behavior selection → `topics/design-patterns.md` (Strategy)
- Async / decoupled communication → `topics/architecture.md`
- Test approach for a tricky area → the `testing-philosophy` skill. Use `topics/testing.md` only when the question is whether the design can be tested at all
- Cleanup of existing tangled code → `topics/refactoring.md`

### 3. Apply the principle test before suggesting patterns

Before recommending a GoF pattern, ask:

- Does the user actually need this flexibility now?
- Will the object likely vary?

If unsure → **simpler is better**. Patternitis is the default failure mode.

### 4. Surface trade-offs explicitly

Every suggestion must include:

- What's gained
- What's sacrificed
- A simpler alternative the user could pick instead

Run [reference/simplicity-guard.md](../reference/simplicity-guard.md) before recommending. If proposal trips any smell (speculative flexibility, premature abstraction, layer inflation, framework gravity, future-proofing), downgrade to the simplest viable option and present *that* as the headline recommendation.

Reference [reference/architecture-paradigms.md](../reference/architecture-paradigms.md) and [reference/symptom-map.md](../reference/symptom-map.md) for canned trade-offs.

### 5. Honor the stack and the user's choices

If the user has already named a stack, library, tool, or constraint, treat it as **fixed input**. Reflect the idioms of that stack (DI in Spring, hooks in React, traits in Rust). Don't propose patterns the language already solves natively. Don't substitute the user's pick for your preferred one without a named technical reason. Don't bolt on extra tech the user did not ask for. If you see a real risk, surface once and proceed inside their choice.

### 6. Output shape

```
PROBLEM: <restate in one line>
RECOMMENDATION: <one sentence>
WHY: <2–3 bullets>
TRADE-OFFS: <gain / loss / simpler alternative>
NEXT STEP: <one concrete action — write a test, sketch the interface, etc.>
```

If the question turns out to settle something hard to reverse (stack, paradigm, persistence,
deployment, auth), it is a checkpoint, not advice: switch to the checkpoint format in SKILL.md →
Decision checkpoints and stop for the user's call rather than answering in one shot.

## Common advisor scenarios

- **"How should I structure this new feature?"** → run a mini-architect flow scoped to the feature; don't redesign the whole system.
- **"Should I use Strategy / Factory / etc.?"** → run principle test; if ambiguous, suggest the simpler route first.
- **"How do I test this code?"** → test strategy is the `testing-philosophy` skill's call; for the cycle itself check [reference/tdd-cycle.md](../reference/tdd-cycle.md). If it is untestable, the design itself is the issue → recommend refactor first.
- **"Monolith or microservices?"** → run architectural heuristics; default to monolith unless scaling/team criteria force the split.
