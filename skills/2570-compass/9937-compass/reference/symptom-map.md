# Symptom → Response Map

| Symptom | Root cause | Response |
|---------|-----------|----------|
| **High coupling / domino effect** — change in one class breaks many | concrete class deps, globals, direct DB access | DIP, Observer, Facade, Proxy |
| **Recurring bugs / regressions** — fixing one breaks another | no automated safety net, hidden coupling | unit tests, TDD, CI |
| **Integration Hell** — days/weeks resolving merge conflicts | long-lived feature branches | daily CI, trunk-based development |
| **Slow build** — too long to compile or run tests | excess UI/system tests, network deps in unit tests | push each test down to the cheapest layer that still proves the behavior (see `testing-philosophy`); fake the network at the boundary |
| **Rejected / obsolete product** — months of work, doesn't fit user | Big Design Up Front, no early validation | Agile (Scrum/XP), user stories, MVP |
| **Traumatic deploys / bottleneck** — manual, all-night, high stress | rigid monolith, Dev/Ops silos | DevOps culture, CD, microservices |
| **Duplicated code** — same logic in multiple places | missing abstraction, rushed implementation | Extract Method, Extract Class, Pull Up Method |
| **God classes** — huge files named `Manager`, `System` | low cohesion, monopolizing intelligence | SRP, Extract Class |
| **Flaky tests** — pass/fail randomly | async deps, time, network, DB | FIRST principles (deterministic), async isolation, mocks/stubs |
| **Subclass combinatorial explosion** — `UDPLogBufferedZipChannel` | inheritance abuse for optional features | Decorator, "prefer composition over inheritance" |
| **Rigid logic / if/switch chains** — new rule means editing the core | OCP violation | Strategy, replace conditional with polymorphism |
| **Spaghetti / Big Ball of Mud** — months for a new dev to understand | continuous architectural decay | Layered architecture, MVC, frequent refactorings |
| **Overload / quality drop** — many tasks in progress, nothing done | no capacity control, work pushed | WIP limits (Kanban), fixed time-boxes (Sprints) |
| **Third-party API breaks the system** — vendor changes API, you break | scattered coupling to external lib | Adapter, information hiding |
