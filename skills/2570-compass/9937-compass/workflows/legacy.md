# Workflow — Legacy

Use when the user inherited a codebase, says "no tests", "afraid to change this", "I don't understand this code", "we need to modernize", "should we rewrite or refactor", or wants to add a feature inside scary code.

Legacy here follows Michael Feathers' definition: **code without tests**. Age, language, or framework are secondary.

## Process

### 1. Diagnose the situation

Ask (or infer):

- **Test coverage** — none, partial, broken? Can the code even run locally?
- **Change pressure** — bug fix, new feature, full modernization, performance, compliance?
- **Risk tolerance** — production-critical, internal tool, throwaway?
- **Time horizon** — next sprint, next quarter, multi-year?
- **Knowledge** — original authors still around? Domain docs? Or pure archaeology?

### 2. Pick the strategy

Map situation to approach. Reference [reference/legacy-tactics.md](../reference/legacy-tactics.md) for full toolkit.

| Situation | Strategy |
|-----------|----------|
| Bug fix or small feature inside untested code | Characterization tests around the unit, then change |
| New feature that can live beside the old code | Sprout method / sprout class |
| Old function called from many places, need to evolve it gradually | Branch by abstraction |
| Whole subsystem or service to replace incrementally | Strangler fig |
| Legacy model leaking concepts into a new clean module | Anti-corruption layer |
| "Should we rewrite from scratch?" | Default: **no**. Justify the rewrite against incremental options below. |

### 3. The hard prerequisite — get the code under test

Before changing behavior, you need a safety net. The order matters:

1. **Find a seam** — a place where you can alter behavior without editing that place (object seam, link seam, preprocessor seam).
2. **Break the dependencies** at the seam (Extract Interface, Parameterize Constructor, Subclass and Override Method, Introduce Static Setter for tests).
3. **Write characterization tests** — capture *current* behavior, even if it's wrong. Goal: lock the observable output, not validate correctness.
4. **Confirm green baseline.**
5. *Now* change the code, with the refactor workflow's baby-step rule.

If steps 1–3 are blocked entirely (no seam, no way to test), prefer **sprout** — write the new logic in a fresh, fully tested unit and call into it from the legacy site with the smallest possible edit.

Reference [reference/legacy-tactics.md](../reference/legacy-tactics.md) and [reference/tdd-cycle.md](../reference/tdd-cycle.md).

### 4. Choose the test style

- **Characterization / golden master / approval tests** — for code with complex outputs (reports, rendered HTML, PDFs, XML, large objects). Capture once, lock against drift.
- **Targeted unit tests** — for logic small enough to express assertions directly.
- **End-to-end smoke** — for systems where the unit boundary is unclear; use sparingly, as a temporary scaffold.

Approval-style tests are the fastest path when assertions would be tedious. They are repeatability-dependent — flaky inputs (time, randomness, ordering) must be pinned first.

### 5. Apply the simplicity guard with extra weight

Reference [reference/simplicity-guard.md](../reference/simplicity-guard.md). Legacy work tempts overengineering: clean architecture rewrites, hexagonal everything, DDD layered onto a CRUD app.

- The smallest viable seam beats the prettiest abstraction.
- Don't introduce DI containers, CQRS, event sourcing, or microservices because the codebase looks tired. Introduce them only against a named force.
- Don't substitute the user's stack mid-modernization. Strangler fig works inside the existing stack just as well as it works across stacks.

### 6. Decide rewrite vs incremental

Default to incremental. Rewrite is justified only when **all** of the following hold:

- The system's external contract is small and well-understood.
- The team has bandwidth to run two systems in parallel for the full migration window.
- A measured, named force (vendor EOL, security ceiling, a removed dependency) makes "keep evolving it" impossible.
- A spike has proven the new system can match the existing behavior on at least one real workflow.

If any one fails, reach for strangler fig + branch by abstraction instead.

### 7. Output shape

```
SITUATION: <one-line diagnosis>
STRATEGY: <chosen pattern: characterization / sprout / branch-by-abstraction / strangler / ACL>
WHY: <2–3 bullets tying strategy to situation>
SAFETY NET: <which tests, at which boundary>
FIRST STEP: <one concrete action — find seam X, write characterization test for Y>
RISKS: <what could break, what to monitor>
EXIT CRITERIA: <when this strategy is "done">
```

### 8. Anti-patterns to flag

- **The big rewrite** — without the rewrite criteria above.
- **Tests on the new code only** — leaves legacy behavior unverified during migration.
- **Replacing the legacy database first** — almost always the wrong starting move; data migrations dominate risk.
- **Pattern dump** — porting the legacy app to "clean architecture" without a named force.
- **Modernizing without telemetry** — start logging legacy usage before you start replacing it. You cannot strangle what you cannot measure.
- **Mock-heavy tests around legacy** — couples tests to current implementation; they break the moment you refactor.

## Common legacy scenarios

- **"I need to add a feature but there are no tests."** → Sprout method/class for the new logic; characterization tests only around the touched seam.
- **"This 800-line function is unreadable."** → Don't refactor blind. Characterize it first. Then Extract Method in baby steps.
- **"We want to move off the monolith."** → Strangler fig. Pick the smallest leaf endpoint, route through a façade, replace, repeat.
- **"The legacy API uses concepts that pollute our new domain."** → Anti-corruption layer. Translate at the boundary; keep the new model clean.
- **"Should we rewrite?"** → Apply the four-criteria gate above. Almost always: no.
