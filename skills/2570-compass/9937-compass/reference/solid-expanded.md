# SOLID Expanded — Violation, Refactor, Helper Pattern

For each principle: typical violation, exit refactor, and the GoF pattern that helps respect it.

## S — Single Responsibility (SRP)

- **Typical violation**: mixing business rules with presentation — e.g., method calculates academic stats AND prints to console; God Classes monopolizing system logic.
- **Exit refactor**: **Extract Class** — split inflated class into smaller ones, each with one reason to change.
- **GoF helper**: **Proxy** — isolates non-functional cross-cutting concerns (caching, logging) outside the business class.

## O — Open/Closed (OCP)

- **Typical violation**: long type/state-based conditionals like `switch(student.type)` — adding a type forces editing central code.
- **Exit refactor**: **Replace Conditional with Polymorphism** — each subclass responds for its own behavior.
- **GoF helper**: **Strategy** (primary) — algorithm variants in their own package; class stays open to new logic, closed to mods. Also **Template Method**, **Abstract Factory**.

## L — Liskov Substitution (LSP)

- **Typical violation**: subclass corrupts the base contract — e.g., overriding integer-sum to concatenate strings; lethal surprise for clients.
- **Exit refactor**: **Push Down Method** or **Pull Up Method** to relocate misplaced behavior. If incompatibility persists, swap inheritance for composition.
- **GoF helper**: **Decorator** — dynamic alternative when rigid inheritance causes combinatorial explosion or contract violations.

## I — Interface Segregation (ISP)

- **Typical violation**: bloated generic interfaces — e.g., one `Employee` interface forcing CLT employees to implement empty SIAPE registration and public servants to carry useless FGTS calculation.
- **Exit refactor**: **Extract Interface** — split macro contracts into cohesive isolated ones (`EmployeeCLT`, `EmployeePublic`).
- **GoF helpers**: **Adapter** — bridges to a slim local interface against a divergent third-party class. **Facade** — hides complexity behind a simplified interface.

## D — Dependency Inversion (DIP)

- **Typical violation**: coupling to concrete implementations — e.g., method takes `SamsungProjector` as parameter, blocking other brands.
- **Exit refactor**: **Extract Interface** to expose the abstract signature; replace literal class references with the new interface (`Projector`).
- **GoF helper**: **Factory** — replaces rigid `new` instantiation; client demands an object and receives only its interface.
