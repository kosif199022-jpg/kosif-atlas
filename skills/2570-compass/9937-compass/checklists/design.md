# Design Checklist

Use before writing the first line of code on a new system, module, or feature.

## System framing

- [ ] System class identified (Type A critical / B commercial / C casual)
- [ ] Quality targets named (2–3 from `reference/quality-criteria.md`)
- [ ] Stack chosen (with user, after trade-offs discussion)

## Decomposition

- [ ] Domain split into independent modules / classes / packages
- [ ] Each module has a single concern (SRP at module level)
- [ ] Vital modules separated from peripheral ones — peripheral don't dictate architecture

## Architecture

- [ ] Paradigm picked (Layered / MVC / Microservices / Pub-Sub / Queues)
- [ ] Sync vs async per integration is explicit
- [ ] UI / domain / persistence isolated
- [ ] Distributed-system requirements feasible for the team (if microservices)
- [ ] No paradigm-violating shortcut planned (e.g., shared DB across microservices)

## Boundaries

- [ ] External APIs wrapped in Adapters
- [ ] Cross-cutting concerns (logging, caching, auth) handled outside business classes
- [ ] No global mutable state designed in
- [ ] Information hiding respected — internals are `private` by default

## Patterns discipline

- [ ] Each pattern injection answers: "do we really need this flexibility now?"
- [ ] Composition preferred to inheritance unless inheritance is the natural model
- [ ] No speculative interfaces "for someday"

## Operational

- [ ] CI pipeline planned for day one
- [ ] First slice picked — smallest end-to-end vertical that proves the architecture
- [ ] ADR drafted (`checklists/adr.md`)
