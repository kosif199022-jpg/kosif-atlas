---
name: simplicity-guard
description: Anti-overengineering checks. Force simplest viable solution. Honor user's stated technical choices.
---

# Simplicity Guard

Run this filter on every recommendation **before** presenting it. If a proposal fails any check, downgrade to the simplest alternative that still meets stated requirements.

## Core rule

> The right solution is the simplest one that satisfies **stated** requirements — not imagined future ones.

Three similar lines beat a premature abstraction. A 20-line script beats a plugin framework. A boring stack beats a novel one.

## Overengineering smell list

Flag the proposal if it contains any of:

- **Speculative flexibility** — config, plugin points, strategy interfaces, generics, or DI for a single concrete case ("we might need to swap this later")
- **Premature abstraction** — base class, interface, or generic with one implementation
- **Layer inflation** — repository + service + controller + DTO + mapper for a CRUD endpoint with no domain logic
- **Pattern-itis** — applying GoF / DDD / hexagonal / CQRS / event sourcing without a concrete force pulling for it
- **Framework gravity** — reaching for a framework when stdlib + 30 lines suffice
- **Microservice reflex** — splitting a service before team size, deploy cadence, or scale demands it
- **Future-proofing** — code paths, flags, or schemas for use cases the user has not asked for
- **Dependency bloat** — adding a library to replace a 5-line function
- **Config explosion** — environment variables / config files for values that never change
- **Defensive overkill** — try/catch, validation, fallbacks for conditions that cannot occur given upstream guarantees
- **Test theater** — tests that mirror the implementation rather than verify behavior; mocking everything

## Pre-output checklist

Before presenting any design, refactor, or code suggestion:

- [ ] **Is there a one-file / one-function version?** If yes, present it first.
- [ ] **Does each abstraction have ≥2 concrete users today?** If not, inline it.
- [ ] **Does each layer earn its keep?** If a layer only forwards calls, drop it.
- [ ] **Does each dependency replace ≥20 lines I'd otherwise write?** If not, vendor or inline.
- [ ] **Does each pattern address a force the user named?** If applied "just because", remove it.
- [ ] **Does each config knob have ≥2 actual values in use?** If not, hardcode.
- [ ] **Does each error handler cover a real failure mode?** If not, let it crash.
- [ ] **Does any test mock something the user did not ask to isolate?** If so, prefer real component.

If all boxes pass, the proposal is appropriately sized.

## Honoring user's technical choices

The user's stated stack, tool, library, paradigm, or constraint is **load-bearing**. Treat it as a fixed input, not a starting point for negotiation.

Rules:

1. **Do not substitute** the user's choice for your preferred one without an explicit, named technical reason (security, correctness, hard incompatibility — not taste).
2. **Do not bolt on** extra technologies the user did not ask for (no "and we'll add Redis / Kafka / GraphQL while we're at it").
3. **If you see a real risk** with the user's choice, surface it once as a trade-off — then proceed inside the user's choice unless they redirect.
4. **Optimize within the choice** — pick the most idiomatic, simplest path *for that stack*, not a stack-agnostic compromise.
5. **Ask before expanding scope** — if solving the request cleanly truly requires a new dependency or service, name it and ask.

## Recommendation framing

When presenting options, lead with the simplest and label trade-ups explicitly:

```
Simplest: <one-file / inline solution>
  Trade-up A (only if X): <next step in complexity>
  Trade-up B (only if Y): <further step>
```

If the user has named a constraint or stack, anchor every option inside it.

## When complexity *is* warranted

Complexity earns its place only against a **named, present** force:

- Concrete second consumer exists today → extract abstraction.
- Measured performance ceiling hit → introduce cache / queue / index.
- Real regulatory or audit requirement → add the layer.
- Team / deploy boundary genuinely splits → split the service.

"We might need it later" is not a force. "Best practice" is not a force. "It's cleaner" is not a force.

A force must be **stated**, with its source named (user / PRD / repo / explicit assumption). If scale, availability, or load is unknown, do **not** silently assume "no force" and default to simple — establish the figure or record an explicit assumption first. Silently guessing low scale is as wrong as silently over-building for high scale.

## Red phrases to avoid in your own output

If you catch yourself writing these, stop and re-evaluate:

- "for future flexibility"
- "in case we need to…"
- "industry standard / best practice" (without a named force)
- "let's also add…"
- "while we're here, we could…"
- "to make it more enterprise-grade"
- "scalable" / "robust" / "extensible" used as justifications without numbers or scenarios
