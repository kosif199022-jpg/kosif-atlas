# Workflow — Explain

Use when the user asks to explain a concept, technique, principle, or pattern.

## Process

### 1. Locate the concept

Map the user's term to the right file:

| Topic | File |
|-------|------|
| Agile, Scrum, Kanban, XP | [topics/processes.md](../topics/processes.md) |
| User stories, MVP, A/B tests, requirements | [topics/requirements.md](../topics/requirements.md) |
| UML diagrams, modeling | [topics/modeling.md](../topics/modeling.md) |
| DDD: bounded context, ubiquitous language, aggregate, entity, value object, domain event | [topics/modeling.md](../topics/modeling.md) §9 |
| SOLID, cohesion, coupling, information hiding | [topics/design-principles.md](../topics/design-principles.md) |
| Factory, Singleton, Strategy, Observer, etc. | [topics/design-patterns.md](../topics/design-patterns.md) |
| Layered, MVC, microservices, queues, pub/sub | [topics/architecture.md](../topics/architecture.md) |
| TDD cycle, FIRST rules, test smells | [reference/tdd-cycle.md](../reference/tdd-cycle.md) |
| Testability as a design signal | [topics/testing.md](../topics/testing.md) |
| What tests to write, test mix, e2e coverage | the `testing-philosophy` skill |
| Refactoring, code smells | [topics/refactoring.md](../topics/refactoring.md) |
| CI, CD, DevOps, feature flags | [topics/devops.md](../topics/devops.md) |

If the term spans multiple topics, mention all relevant ones.

### 2. Default explanation shape

```
DEFINITION: <1–2 sentences>
PROBLEM IT SOLVES: <1 sentence>
WHEN TO USE: <2–3 concrete triggers>
WHEN NOT TO USE: <2–3 contraindications>
SHORT EXAMPLE: <pseudo-code or brief story>
RELATED CONCEPTS: <2–3 links to other topics>
```

### 3. Adapt depth

- **One-liner request** ("what's coupling?") → just DEFINITION + PROBLEM IT SOLVES.
- **Standard request** → full default shape.
- **"Deep dive" request** → add trade-offs, anti-patterns, and a worked example in the user's stack.

### 4. Use the user's stack

If a stack is known:

- Replace generic Java examples with the user's language.
- Use idioms native to that stack (hooks, traits, decorators, etc.).
- Mention if the language already solves the concept natively (e.g., `lazy_static!` in Rust replaces some Singleton uses).

### 5. Cross-reference

When relevant, point to:

- The principle it's applying (SOLID).
- The pattern that helps respect it ([reference/solid-expanded.md](../reference/solid-expanded.md)).
- The smell it detects ([reference/anti-patterns.md](../reference/anti-patterns.md)).
- The refactoring it triggers ([reference/refactoring-catalog.md](../reference/refactoring-catalog.md)).

### 6. Flag the simpler-is-better counter-case

For every pattern, abstraction, or architecture explained, include a "when not to use" that points back at simpler alternatives. Reference [reference/simplicity-guard.md](../reference/simplicity-guard.md). A reader who walks away thinking "I should apply this" without knowing when to skip it is a failure mode.

### 7. Stay neutral on dogma

Some teachings ("composition over inheritance", "always TDD") are guidance, not absolutes. Present them as defaults with their counter-cases rather than commandments.
