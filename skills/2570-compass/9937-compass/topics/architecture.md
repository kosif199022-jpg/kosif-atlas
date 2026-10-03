# Raw — Architecture

## 1. Concepts

### Layered Architecture
- **Definition**: organizes classes into hierarchical modules where layer `n` may only call services of layer `n-1`.
- **Solves**: partitions complexity, disciplines dependencies, eases substitution and reuse.

### MVC (Model-View-Controller)
- **Definition**: splits classes into View (UI), Controller (event handling), Model (data + domain).
- **Solves**: isolates UI from business logic; allows multiple presentations of the same data; improves testability.

### Microservices
- **Definition**: decomposes the system into small autonomous modules running in independent processes, no shared memory, communicating via public interfaces.
- **Solves**: removes deployment bottlenecks of monoliths; prevents total failure; enables horizontal per-service scaling.

### Message-Queue Architectures
- **Definition**: asynchronous point-to-point communication (1-to-1) mediated by a FIFO queue (broker).
- **Solves**: decouples producers and consumers in space and time; system keeps working even when one side is offline.

### Publish/Subscribe
- **Definition**: 1-to-N group communication; publishers emit events on a bus, subscribed consumers get notified.
- **Solves**: a single event triggers reactions in many independent systems without the producer knowing them.

### Domain-Driven Design (DDD) — architectural slice
- **Definition**: organizes the system around explicit bounded contexts, each with its own model, language, and persistence; integrated via context maps (shared kernel, customer-supplier, anti-corruption layer).
- **Solves**: large, multi-team systems where one global model collapses under conflicting interpretations of the same term. Pairs naturally with Microservices (one bounded context per service) and Pub/Sub (Domain Events across contexts).
- **When NOT**: thin-domain CRUD, single team, single context — see [topics/modeling.md](modeling.md) §9 and [reference/simplicity-guard.md](../reference/simplicity-guard.md).

### Big Ball of Mud (anti-pattern)
- **Definition**: system without defined architecture — chaotic dependency tangle.
- **Solves**: nothing — to be avoided; makes maintenance nearly impossible.

## 2. When to Use

- **Layered** — network protocols (TCP/IP over Ethernet); traditional enterprise systems split across UI / business / DB.
- **MVC** — apps with GUIs, interactive web apps, SPAs.
- **Microservices** — when monolith deploys are slow/locked, when modules need different tech or independent scaling.
- **Message Queues** — integrations that can run in background; when you must buffer requests if the primary server falls.
- **Pub/Sub** — distributed systems propagating global state changes; one trigger causing async reactions across multiple departments.

## 3. When NOT to Use

- **Microservices** — heavy remote-comm latency; need atomic distributed transactions (multi-DB writes).
- **Queues / Pub-Sub** — caller needs an immediate synchronous response to proceed.
- **Big Ball of Mud** — never; destroys application lifespan.

## 4. Smells

- **Monolith bottleneck** — long manual test batteries, bureaucratic deploy approvals, modules silently breaking each other.
- **Microservices sharing the same DB** — multiple services hitting the same physical tables (skipping APIs) → autonomy gone, central bottleneck back.
- **Big Ball of Mud signs** — simple features take forever, fixes cause domino bugs, new engineers take months to ramp.

## 5. Operational Checklist

- [ ] If layered: enforce that each module only calls the layer immediately below.
- [ ] In MVC: Model classes never know about View or Controller.
- [ ] Keep core business rules in the Application/Model layer — out of purely visual elements.
- [ ] Adopt microservices only when team can support network infra, HTTP/REST, latency.
- [ ] Each microservice owns and manages its own DB in isolation.
- [ ] Implement resilience to partial failures — fallback content when a non-vital service is down.
- [ ] In Pub/Sub, classify events into Topics to reduce client overhead.
- [ ] Use a broker / message queue with persistent storage to survive crashes.

## 6. Examples

- **Microservices (technical autonomy)** — e-commerce: "Customers" service in Java + relational DB; "Recommendations" service in Python + NoSQL, separate processes.
- **Message Queue (Sales / Engineering)** — telecom seller submits a plan; JSON drops into the queue; Engineering team consumes at its own pace and physically activates the customer's router.
- **Pub/Sub (Airline)** — after payment, Sales service emits `venda_finalizada` on the broker; Loyalty, Marketing, Accounting subscribers all act asynchronously and independently.

## 7. Trade-offs

- **Monolith vs Microservices** — Monolith: simple early dev, zero-latency local calls; long-term release agility dies, total-failure risk. Microservices: isolation, fast deploys, per-service scaling; cost is distributed complexity, network protocols, distributed-transaction pain.
- **Queue vs Pub/Sub** — Both async, both decouple time/space. Queue drains each message to one available consumer (1:1). Pub/Sub broadcasts to all subscribers (1:N).
- **3-tier vs MVC** — 3-tier organizes the macro logical structure (Presentation → Business → DB), each tier can run on its own machine. MVC manages only the visual paradigm; in modern 3-tier it constrains the internal organization of the Presentation tier.

## 8. Cross-references

- **Agile / DevOps** — microservices are the technical answer to the monolith deploy bottleneck; without micro-deploys, agile's promise of multi-week releases dies in approval traffic.
- **Conway's Law** — microservice architectures mirror the org structure agile prescribes (small, fast, decentralized teams).
- **Design Patterns** — Pub/Sub is the Observer pattern stretched across distributed processes. In MVC the View acts as Observer of the Model.
- **Testing** — strict UI/logic separation in MVC produces high testability: unit-test core Model algorithms without GUI code.
