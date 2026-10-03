# Raw — Modeling (UML)

## 1. Concepts

### Software Models
- **Definition**: simplified representations of one dimension/abstraction of a system, bridging requirements and source code.
- **Solves**: eases technical understanding before/during coding; mitigates invisible software complexity.

### UML as Sketch
- **Definition**: informal, lightweight use of UML diagrams to support focused dev discussions.
- **Solves**: avoids the waste of producing heavy "blueprint" documentation that quickly becomes obsolete.

### Class Diagram (static)
- **Definition**: structural model showing classes (attributes, methods) and their relationships (associations, inheritance, dependencies).
- **Solves**: visually maps "who knows whom"; exposes coupling and code organization.

### Package Diagram (static)
- **Definition**: groups classes into high-level modules and shows dependencies between them.
- **Solves**: lets you see macro architecture and global dependencies without drowning in individual classes.

### Sequence Diagram (dynamic)
- **Definition**: shows method calls and messages exchanged among objects over time for a specific scenario.
- **Solves**: clarifies runtime behavior; reveals operation order in complex flows.

### Activity Diagram (dynamic)
- **Definition**: represents a process or execution flow centered on actions, decisions, and parallelism.
- **Solves**: visually models sequential or concurrent business rules that text alone can't convey.

## 2. When to Use

- **UML as sketch — Forward Engineering**: before coding a new feature, to debate alternatives at the whiteboard.
- **UML as sketch — Reverse Engineering**: to quickly explain an existing system part to a new team member.
- **Class / Package** — when designing a new database, deciding multiplicities (1-to-many etc.), or assessing whether two parts are too tightly coupled.
- **Sequence / Activity** — debugging or explaining a use case that bounces across several classes; algorithms running across multiple threads needing synchronization.

## 3. When NOT to Use

- **UML as Blueprint** — anti-pattern in agile; requires modeling the whole system upfront (BDUF), produces heavy docs that decay fast.
- **UML as programming language (MDD)** — avoid generating the full source from complex UML models outside niche cases; tooling complexity skyrockets.
- **Blind syntactic formalism** — don't burn time on visibility modifiers (+/-) or perfect notations when they don't aid the sketch's main message.

## 4. Smells

- **Visual pollution (Sequence)** — too many objects in one view; can't print or grasp on one screen → defeats simplification.
- **Notation rabbit holes** — team debates composition vs aggregation more than the actual problem → modeling stalls on rigorism.
- **Model = code** — model has no abstraction level; replicates accidental complexity. "An abstraction that abstracts no complexity abstracts its own essence."

## 5. Operational Checklist

- [ ] Decide goal: understand future (forward) or explain past (reverse)?
- [ ] Pick diagram type: static (structure) or dynamic (behavior/runtime).
- [ ] Draw only the essential classes/objects for the discussion; ignore the rest.
- [ ] Use solid arrows with multiplicity (0..1, *) for associations; dashed open arrows for simple dependencies.
- [ ] In class diagrams, focus on class name + key signatures; skip obvious getters/setters.
- [ ] In sequence diagrams, use lifeline activation (vertical bars) only to mark active execution.
- [ ] In activity diagrams with fork (parallel split), always pair with a join before the end node.
- [ ] Whiteboard, photo, erase, code. Don't preserve sketches as formal docs.

## 6. Examples

### Class Diagram (bidirectional association + multiplicity)
```
[Pessoa | -fone: Fone | +getFone()]  0..1 -------- *  [Fone | -dono: Pessoa[] | +getDono()]
```

### Sequence Diagram (self-call)
- Top box: `objA`
- External arrow into objA: `metodoF()`
- Lifeline activates; arrow loops out and back to same lifeline: `metodoG()`
- Dashed return arrow

### Activity Diagram
```
(Start) → [Action: Checkout] → ⫶Fork⫶
                                ├─ [Action: Decrement Stock]
                                └─ [Action: Issue Invoice]
                                ⫶Join⫶ → (End)
```

## 7. Trade-offs

- **Static vs Dynamic UML** — static shows global rules and compile-time structure, ignoring runtime state. Dynamic shows what happens to in-memory instances during specific user inputs.
- **Blueprint vs Sketch** — Blueprint: formal permanent docs, slow, decays fast. Sketch: extreme agility, collaborative, disposable, no permanent doc.
- **Activity vs Flowchart** — Activity has native fork/join for thread concurrency. Flowchart fits strictly sequential logic.

## 8. Cross-references

- **Requirements / Agile** — sketches visually complement the "Conversation" leg of user stories during Sprint, without BDUF.
- **Design Principles** — class/package arrows externalize coupling metrics and enable debates on Dependency Inversion.
- **Design Patterns** — UML is the lingua franca for understanding and explaining the structural communication required by any GoF pattern.

## 9. Domain-Driven Design (DDD) — when modeling is the bottleneck

Apply only when the domain is genuinely complex (rich business rules, multi-team, multi-context). For CRUD or thin-domain systems, DDD adds ceremony without payoff — see [reference/simplicity-guard.md](../reference/simplicity-guard.md).

### Strategic DDD (boundaries between domains)

- **Bounded Context** — explicit boundary within which a domain model is consistent. Same term ("Order") means different things in Sales vs Fulfillment; each gets its own model.
- **Ubiquitous Language** — shared vocabulary between developers and domain experts, used in code, conversations, and diagrams. If devs say "User" and the business says "Customer", the model drifts.
- **Context Map** — diagram of bounded contexts and their relationships (shared kernel, customer-supplier, conformist, anti-corruption layer). See [reference/legacy-tactics.md](../reference/legacy-tactics.md) for ACL.

### Tactical DDD (building blocks inside a context)

- **Entity** — object with identity that persists over time (User#42 remains the same after attribute changes).
- **Value Object** — immutable, identity-less, compared by attributes (Money, Address, DateRange). Replace, don't mutate.
- **Aggregate** — cluster of entities + value objects with one root. All external references go through the root; invariants enforced at the root. Keep small.
- **Repository** — collection-like interface for aggregate persistence. Hides storage; one repo per aggregate root.
- **Domain Event** — fact that happened in the domain (`OrderPlaced`, `PaymentReceived`). Drives cross-context reactions, pairs with Pub/Sub (see [topics/architecture.md](architecture.md)).
- **Domain Service** — operation that doesn't naturally fit on an entity or value object (e.g., FX conversion across two Money objects).

### When NOT to use

- Thin-domain CRUD app → ActiveRecord / table-module pattern is enough.
- Single team, single context → bounded contexts add ceremony without payoff.
- Aggregates designed too large → become bottlenecks (long transactions, lock contention).
