# Order of Application — New Project vs Legacy

## New Project — build right foundations + validate fast

1. **Processes + Requirements** — pick agile method (Scrum/Kanban/XP) for short iterative cycles. Skip long requirement docs; use User Stories. Build an MVP to validate market before heavy investment.
2. **Architecture** — take the hardest-to-reverse decisions early. Decide Monolith (Layered/MVC) vs Microservices based on scale needs and team capacity. (See [architectural-heuristics.md](architectural-heuristics.md) and [architecture-paradigms.md](architecture-paradigms.md).)
3. **DevOps + Git** — day-zero VCS; configure CI pipeline. Forces daily integration; kills Integration Hell.
4. **Testing** — don't defer to the end. Use TDD when possible. Tests-first → architecture born testable; cleaner interfaces.
5. **Principles + Patterns** — apply SOLID daily to decompose into cohesive classes. Apply patterns sparingly — only to accommodate a real change. Avoid over-engineering / Patternitis.

## Legacy Project — stabilize first, modernize after

1. **Automated Tests** — "Code without tests is bad code" (Feathers). Before improving anything, build a unit + integration suite as regression safety net. Use Mocks to isolate heavy DB/service deps that block testability.
2. **Code Smells (identify)** — find Duplicated Code, Long Methods, God Classes, dependency tangles signaling Big Ball of Mud.
3. **Refactoring** — apply mechanical refactorings (Extract Method, Extract Class) to improve internal structure without changing visible behavior. Make refactoring opportunistic: when fixing a bug or adding to legacy, clean nearby code first.
4. **Principles + Patterns** — refactor toward SOLID. Structural patterns shine here: Facade for simple access into a confused legacy subsystem; Adapter to bridge incompatible new and old modules.
5. **DevOps** — if deploys cause panic and require manual all-nighters, replace classic silos with DevOps culture. Automate build + reliable deploy scripts: shipping legacy should be "as simple as pressing a button."

## Decision shortcut

| Situation | First move |
|-----------|-----------|
| Greenfield startup, unproven market | MVP + agile + CI from day one |
| Greenfield enterprise, known requirements | Architecture decision + CI + testing strategy |
| Inherited monolith, frequent regressions | Tests first, refactor second |
| Inherited monolith, deploy pain | Tests + DevOps in parallel |
| Inherited microservices mess | Map service boundaries; identify shared-DB violations |
