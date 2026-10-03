# Raw — Design Principles

## 1. Concepts

### Conceptual Integrity
- **Definition**: a system must reflect a coherent, standardized set of ideas, not a pile of independent features.
- **Solves**: avoids accidental complexity from inconsistent UI layouts, naming, and behaviors.

### Information Hiding
- **Definition**: classes hide design decisions and implementations likely to change; expose only a stable interface to clients.
- **Solves**: prevents internal algorithm/data-structure changes from breaking dependent code elsewhere.

### Single Responsibility (SRP) / Cohesion
- **Definition**: a class should implement a single concern → only one reason to change.
- **Solves**: classes that try to do everything become hard to test, reuse, maintain (e.g., presentation mixed with business logic).

### Coupling (acceptable vs bad)
- **Definition**: strength of connection between two classes. Acceptable: through stable public interfaces. Bad: through unmediated structures (globals, direct DB access).
- **Solves**: prevents the cascade where any change in one class forces unforeseen changes in many others.

### Interface Segregation (ISP)
- **Definition**: interfaces should be small, cohesive, specific to the client using them.
- **Solves**: stops clients from depending on / implementing methods they don't use.

### Dependency Inversion (DIP)
- **Definition**: clients should couple to abstractions (interfaces), not concrete classes.
- **Solves**: shields the app from breakage when concrete implementations swap; abstractions are more stable.

### Composition over Inheritance
- **Definition**: prefer holding another class as a field (composition / black-box) over extending it (inheritance / white-box).
- **Solves**: kills the static, strong coupling inheritance creates; avoids leaking parent internals into the child.

### Law of Demeter (Least Knowledge)
- **Definition**: a method should call only methods of: its own class, objects it created, parameters received, or its direct attributes.
- **Solves**: prevents "talking to friends of friends" — long chains that break when intermediate classes change.

### Open/Closed (OCP)
- **Definition**: classes open for extension, closed for modification of the base source.
- **Solves**: lets you add new requirements/strategies (via interface injection) without inserting bugs into already-tested code.

### Liskov Substitution (LSP)
- **Definition**: a subclass must not violate conditions and the semantic contract of its superclass.
- **Solves**: stops polymorphism from breaking code when a base type is substituted by a subtype (e.g., adding numbers but inheriting concatenation).

## 2. When to Use

- **Conceptual Integrity** — multiple teams creating inconsistent UI; standardizing variable naming.
- **Information Hiding** — central data structure may change (Array now, DB later).
- **SRP** — function touches UI and DB at once → split.
- **DIP** — typing constructor/method parameters.
- **Composition over Inheritance** — relationships need to flex at runtime; want code reuse without semantic-domain tie.
- **OCP** — frequent additions of algorithms to a central process (sortings, filters, calculation strategies).

## 3. When NOT to Use

- **Big committees for design** — to enforce conceptual integrity → too many votes produce bloated systems.
- **Blind getters/setters** — abusing them violates information hiding; pure leakage if every field becomes effectively public.
- **Zero coupling** — trying to eliminate all coupling isolates basic functions; coupling to stable native pieces is fine.
- **Speculative design (YAGNI)** — interfaces / abstractions for "someday" needs without real demand → useless complexity.

## 4. Smells

- **Inconsistent naming** — camelCase mixed with snake_case in the same system → integrity broken.
- **Public mutable internals** (e.g., public HashMap) — clients inject items directly → information hiding violated.
- **Feature Envy** — method reading lots of get/set from another object → cohesion failure.
- **Global coupling** — multiple systems breaking with no clear reason → secret comms via globals or files.
- **Train wrecks** — `a.getB().getC().do()` → Demeter violation; B changes cascade.
- **`instanceof` used widely** — Liskov / OCP violation; missing polymorphism.

## 5. Operational Checklist

- [ ] Make unstable variables and structures `private`.
- [ ] Centralize critical design and naming decisions for conceptual integrity (avoid 100% free committee development).
- [ ] Push business rules into core packages; keep UI/Console code in UI packages (SRP).
- [ ] Split bloated interfaces that force empty method implementations.
- [ ] Type method parameters as interfaces (e.g., `List`) instead of concrete classes (e.g., `ArrayList`) → DIP.
- [ ] Replace `class A extends B` with composition + delegation when inheritance drags unwanted surface into A's API.
- [ ] Replace train wrecks with direct commands ("Tell, don't ask").
- [ ] Parameterize strategies via class attributes (open to extension via composition).
- [ ] Ensure inherited methods stay within the operational contract of the superclass.
- [ ] Sporadically use OO metrics (LCOM, CBO) to spot coupling/cohesion anomalies before large refactors.

## 6. Examples

### DIP
Use abstraction so swapping concrete `LG` for `Sony` later doesn't break clients.

### SRP
Split presentation from business logic so the same class works in Mobile, Web, Console.

### Demeter
Replace `account.getCustomer().getAddress().getZip()` with `account.getCustomerZip()` — encapsulation respected.

## 7. Trade-offs

- **Composition vs Inheritance** — Composition: loose runtime coupling, but explicit delegation work. Inheritance: very fast reuse (white-box), but static lock-in and bloated subclasses.
- **Incremental Design vs BDUF** — design principles let you defer/abstract uncertainty (OCP, SRP) and stay safe across iterative sprints, no chaos.
- **Full Hiding vs Accessors** — banning all accessors handicaps infrastructure (serializers, mocks). Exposing every field destroys instance safety. Pick deliberately per case.

## 8. Cross-references

- **Design Patterns** — SOLID is the foundation. Strategy enables OCP. Decorator replaces inheritance with dynamic composition.
- **Testing** — code under DIP + Hiding + Composition is highly testable; allows isolation, mocks, stubs.
- **Refactoring** — when smells signal principle decay (huge classes → SRP gone), extraction and pragmatic refactorings restore design integrity.
