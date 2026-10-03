# Raw — Design Patterns

## 1. Concepts

### Factory
- **Definition**: method (or abstract class) that instantiates and returns objects, hiding the concrete type behind a stable interface.
- **Solves**: removes static coupling on `new` calls; lets you parameterize on-demand creation.

### Singleton
- **Definition**: ensures a class has at most one instance and provides a global access point.
- **Solves**: prevents destructive proliferation of resources that must be unique (e.g., simultaneous overwrites of a log file).

### Proxy
- **Definition**: intermediary that implements the same interface as the base object, sitting between client and real service.
- **Solves**: transparently embeds non-functional concerns — caching, remote calls (stubs), lazy loading.

### Adapter (Wrapper)
- **Definition**: object that converts the interface of an existing class into the one expected by local clients.
- **Solves**: avoids rewriting whole systems when integrating with closed third-party APIs or incompatible vendors.

### Facade
- **Definition**: single class providing a unified, high-level, simplified interface for an entire subsystem.
- **Solves**: hides internal dependency density; client doesn't need to know about underlying objects.

### Decorator
- **Definition**: dynamic alternative to inheritance. Composition delegates calls along an interface chain, layering modifications.
- **Solves**: prevents combinatorial explosion of subclasses for optional feature combinations.

### Strategy
- **Definition**: encapsulates a family of algorithms in separate classes, making them interchangeable.
- **Solves**: removes hardcoded behavior; satisfies Open/Closed.

### Observer
- **Definition**: one-to-many relationship; a "subject" notifies subscribed observers automatically when state changes.
- **Solves**: decouples core data/model rules from various display interfaces (views).

### Template Method
- **Definition**: superclass method holds the algorithm skeleton; specific steps are left abstract for subclass implementations.
- **Solves**: avoids duplicating base rules; implements inversion of control at design / framework level.

### Visitor
- **Definition**: bundles operations on objects in a separate "visitor" class; traversal uses double-dispatch via `accept`.
- **Solves**: simulates double dispatch over wide polymorphic data hierarchies without changing the data classes themselves.

## 2. When to Use

- **Factory** — switching between technology families or channels (TCP vs UDP); isolating complex constructors.
- **Singleton** — single DB instance, central log pointer, shared service registry.
- **Proxy** — security interception; lazy loading of expensive remote/memory objects; cache layer.
- **Adapter** — connecting to a vendor API that doesn't match the system's expected interface.
- **Facade** — wrapping legacy libraries; reducing painful instance setup of an API.
- **Decorator** — runtime stacking of optional features (Logging + Compression + Encryption assembled per call).
- **Strategy** — sortings/filters selected externally; runtime behavior selection.
- **Observer** — reactive updates; UI auto-reacts to changing model data.
- **Template Method** — payroll/accounting skeleton fixed, only deduction details vary per subclass.
- **Visitor** — heterogeneous polymorphic objects iterated for multi-format ops (e.g., apply `save()` over different node types).

## 3. When NOT to Use

- **Patternitis (general)** — language already solves it. Don't force architecture for academic vanity.
- **Factory** — class scope is unique and definitive; no real chance of dynamic-type variation.
- **Singleton** — easily becomes a disguised global; freezes unit tests by injecting eternal state.
- **Decorator** — feature should be a default state, not optional layering.
- **Strategy** — rule never varies for the user/client.
- **Visitor** — `accept()` exposes hidden attributes for reading → severely breaks target class encapsulation.

## 4. Smells

- **Singleton-as-global** — pervasive `Logger.getInstance()` creates inflexible bonds across domains.
- **Class explosion** (`UDPLogBufferedZipChannel`) — static-flexibility deficit → missing Decorator.
- **Exhaustive `if/switch` chain** — picking which routine to run on a list → missing Strategy.
- **Flaky tests** — async methods globally untestable, often from un-resettable Singletons.
- **Over-engineering** — wrapping trivial native reads in complex injections → Patternitis.

## 5. Operational Checklist

- [ ] Question feasibility first ("do we actually need to parameterize this now?").
- [ ] Replace direct `new ClassX()` with Factory + interface return type.
- [ ] Privatize default constructors of every Singleton; expose via static `getInstance()`.
- [ ] In Proxies, strictly mirror the same base interface as the underlying service.
- [ ] In Adapters, delegate the client command to the third-party method.
- [ ] Build a thin Facade only to coordinate 3–4 structural subsystem entry points.
- [ ] Inside a Decorator constructor, aggregate the wrapped instance and forward calls recursively.
- [ ] Extract hardcoded selection logic into a Strategy injection point.
- [ ] In Template Method, mark the parent method `final`; mark per-step methods `abstract`.
- [ ] In Visitor, ensure every type in the hierarchy implements `accept` for polymorphic dispatch.

## 6. Examples

- **Factory** — protocol factory returning TCP or UDP channel via interface.
- **Strategy** — sort method receives a `Comparator`; behavior swapped at runtime.
- **Observer** — Temperature subject pushes updates to a chart view subscriber.

## 7. Trade-offs

- **Decorator vs Inheritance combinatorics** — Inheritance: fine for one static line. Decorator: isolates additions activated via composition at runtime.
- **Template Method vs Strategy** — Strategy delegates the entire algorithm via composition (no inheritance). Template Method standardizes the skeleton via inheritance, locking the tree.
- **Proxy vs Decorator vs Adapter** — All wrap. Adapter changes interface semantics (bridges incompatibles). Proxy preserves the local interface, only mediating access/lazy/remote concerns. Decorator preserves the same interface and stacks combined behavior.
- **Pattern flexibility vs unwanted complexity** — designing for blind change risks bloat (Patternitis). A clean `new` line can save hours that would be lost decoding ghost factories.

## 8. Cross-references

- **Design Principles (SOLID)** — Decorator, Factory, Strategy enable OCP. Most patterns prefer interfaces over concrete classes (DIP).
- **Architecture (MVC)** — Observer is the foundational comm pattern between Model (subject) and View (observer) in Smalltalk MVC and web frameworks.
- **Testing & TDD** — Factory, Facade, Adapter open isolation seams for mocks/stubs; Singleton breaks FIRST isolation by sharing universal state across tests.
