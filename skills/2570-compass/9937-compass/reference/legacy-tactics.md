---
name: legacy-tactics
description: Toolkit for changing untested, inherited code safely. Seams, sprout, characterization, strangler fig, branch by abstraction, anti-corruption layer.
---

# Legacy Tactics

Companion to [workflows/legacy.md](../workflows/legacy.md). Source material: Michael Feathers' *Working Effectively with Legacy Code*, Martin Fowler's *Strangler Fig* and *Branch by Abstraction*, Eric Evans' DDD anti-corruption layer.

Definition: **legacy code is code without tests.** Everything below is the toolkit for getting unsafe code under test and changing it without regression.

## Seams

A **seam** is a place where you can alter behavior without editing that place. Every seam has an **enabling point** — the switch that selects which behavior runs.

Three common seam types:

- **Object seam** — substitute via subclass, interface, or duck-typed replacement (most useful in OO languages).
- **Link seam** — substitute the linked binary / library at build or load time (C/C++, dynamic libraries).
- **Preprocessor seam** — substitute via macros or conditional compilation (C/C++).

Modern languages: object seams dominate. Find a method call, extract its target into an interface or higher-order function, inject a fake at test time.

**Rule:** if you can't find a seam, you can't test it. Create one with a dependency-breaking refactoring (below) before writing assertions.

## Dependency-breaking refactorings

Surgical edits that introduce a seam without changing observable behavior:

| Technique | Use when |
|-----------|----------|
| Extract Interface | Concrete dependency you want to mock |
| Parameterize Constructor | Class hardcodes a collaborator inside `new` |
| Parameterize Method | Method instantiates a collaborator inline |
| Subclass and Override Method | Need to fake one method on a class you can't touch broadly |
| Extract and Override Call | A static or untestable call sits in the middle of a method |
| Introduce Static Setter | Singleton or global needs to be swappable in tests |
| Expose Static Method | A method does not depend on instance state — test it standalone |
| Encapsulate Global Reference | Globals leak into the unit; wrap them |
| Introduce Instance Delegator | Static method needs to be intercepted via instance |

Each of these is a **safe edit**: ideally automated by IDE refactoring, no behavior change. Run any existing tests (or compile + smoke) between every step.

## Characterization tests

Tests that lock **current** behavior, not correct behavior. The procedure:

1. Pick a unit — a function, class, or whole module.
2. Feed it a known input (or a set of representative inputs).
3. Observe the actual output.
4. Write the test asserting that exact output.
5. If the output is "wrong" — note it, but keep the test green. Fix the bug separately, after the safety net is in place.

Characterization tests are also called **approval tests**, **golden master**, **snapshot tests**, **locking tests**. Same idea, different names — no agreed standard.

Best for: complex outputs (HTML, PDF, XML, large objects, reports) where assertion-by-assertion would be tedious.

Repeatability requirement: pin time, randomness, iteration order, locale, timezone. Flaky inputs make approval tests useless.

Tooling: ApprovalTests (multi-language), Jest snapshots, Verify, Approvals.NET, plus DIY string-comparison.

## Sprout method / Sprout class

Add new behavior **next to** the legacy code, not inside it.

- **Sprout method:** write the new feature as a fresh method on the same class, fully unit-tested. Call it from the legacy method with one minimal edit.
- **Sprout class:** if the new logic doesn't fit the existing class, create a new class, test it independently, instantiate and call from the legacy site.

Trade-off: sprouting leaves the legacy method ugly — but it's the safest way to add tested behavior when the surrounding code resists testing. The cleanup happens later, after a seam exists.

## Wrap method / Wrap class

The inverse of sprout. Use when you must run new behavior **before** or **after** existing behavior:

- **Wrap method:** rename the original method (e.g., `_originalDoX`), create a new method with the original name that calls both the original and the new logic.
- **Wrap class:** wrap the whole legacy class behind a new class that implements the same interface and adds behavior at the boundary.

## Branch by Abstraction

In-process migration when many callers depend on the thing you want to replace.

Steps:

1. **Create an abstraction** — extract an interface (or function type) covering the surface the callers use.
2. **Move callers behind the abstraction** — they now talk to the interface, with the legacy implementation as the only concrete.
3. **Build the new implementation** against the same abstraction.
4. **Switch callers over incrementally** — feature flag, gradual rollout, or all-at-once if low risk.
5. **Remove the abstraction** once the legacy implementation is gone (optional — sometimes worth keeping).

Use for: framework swaps, package extractions, ORM migrations, UI library replacements, internal API redesigns.

## Strangler Fig

System-boundary migration. Place a façade in front of the legacy system; route requests to either the legacy or the new implementation. Migrate endpoint by endpoint until the legacy system has no traffic, then delete it.

Steps:

1. **Stand up the façade / proxy** — every request to the legacy now flows through it. No behavior change yet.
2. **Add telemetry** at the façade — log which endpoints are hot. You strangle the busy paths first or the dead paths first depending on goal (impact vs. easy-win).
3. **Pick the first slice** — usually a leaf endpoint with few dependencies and clear inputs/outputs.
4. **Build the replacement** — new service / module, behind the same façade route.
5. **Route the slice** through the new implementation. Keep the legacy as fallback during validation.
6. **Validate parity** — log diffs, run shadow traffic, or run both and compare outputs.
7. **Remove the legacy slice** once parity holds.
8. **Repeat** until the legacy host is empty, then delete it.

Pairs naturally with **branch by abstraction** for in-process migrations and **anti-corruption layer** when domain models diverge.

Trade-offs:

- Two systems run in parallel for the migration window. Operational cost is real.
- The façade becomes a critical path — invest in its observability.
- Data migration is usually the hardest part, not code.

## Anti-Corruption Layer (ACL)

A defensive boundary between two bounded contexts (or between new code and legacy code). Translates external concepts into the internal domain model so the legacy model does not pollute the clean side.

Three internal layers:

- **Adapter** — protocol concerns (HTTP, auth, retries, serialization).
- **Translator** — maps external data shapes to internal domain types.
- **Façade** — exposes clean operations in the internal domain's language.

Use when:

- The downstream / new context is a core subdomain you want to keep clean.
- The upstream is an unmodifiable legacy system or third-party API.
- Models genuinely diverge — straight pass-through would leak concepts.

Skip when:

- The two models are nearly identical (translation adds no value).
- The legacy side will be retired in weeks — direct calls cost less than a layer.

Decide upfront: is the ACL **permanent** (long-term integration) or **temporary** (retired with the legacy system)? It shapes how much you invest.

## Decision flow

```
Code changes needed?
│
├─ Tests exist and pass? ───→ Use the standard refactor workflow.
│
└─ No tests / broken tests:
   │
   ├─ Can the new behavior live as new code?
   │   │
   │   └─ Yes ──→ Sprout method / sprout class.
   │
   ├─ Need to run new behavior around existing? ──→ Wrap method / wrap class.
   │
   ├─ Many callers, want to swap implementation gradually? ──→ Branch by abstraction.
   │
   ├─ Whole subsystem to replace? ──→ Strangler fig.
   │
   ├─ Legacy concepts polluting new domain? ──→ Anti-corruption layer.
   │
   └─ Must change the legacy unit directly?
       │
       1. Find a seam (or create one with a dependency-breaking refactoring).
       2. Write characterization tests at that seam.
       3. Confirm green.
       4. Apply the change in baby steps.
```

## Mindset

- **The code is allowed to be ugly. The tests are not.** Get the safety net first.
- **Lock observable behavior, not internal structure.** Tests that mirror implementation will break on the first refactor.
- **Smallest seam wins.** Resist the urge to "clean up while you're in there" until tests exist.
- **Telemetry before strangulation.** Measure usage before you replace anything.
- **Rewrite is rarely the answer.** Apply the four-criteria gate in [workflows/legacy.md](../workflows/legacy.md) before considering it.

## Related references

- [reference/refactoring-catalog.md](refactoring-catalog.md) — smell → operation table.
- [reference/tdd-cycle.md](tdd-cycle.md) — Red-Green-Refactor and FIRST rules.
- [reference/simplicity-guard.md](simplicity-guard.md) — anti-overengineering filter.
- [topics/refactoring.md](../topics/refactoring.md) — refactoring concepts.
