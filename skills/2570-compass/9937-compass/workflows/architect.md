# Workflow — Architect

Use when the user asks to design a system, choose an architecture, or plan a new feature's structure.

## Process

### 1. Establish the system class (required — never skip)

These drive how complex the architecture must be. Resolve each **before** designing:

- **Criticality** — mission-critical (Type A — life/finance), commercial (Type B), or casual (Type C)?
- **Scale** — expected users, traffic, data volume.
- **Availability / latency targets** — SLA % (e.g. 99.99%), p95 latency.
- New project or feature inside an existing system?
- Team size + experience with distributed systems?

**Source order:** pull from the PRD / `docs/adr/` / repo if present → else ask the user. If a value stays unknown, pick a default and **record it as an explicit stated assumption** in the output and ADR — never assume silently. Any recommendation that hinges on scale or availability must name where that figure came from (user / PRD / assumption).

### 2. Run the architectural heuristics in order

Follow [reference/architectural-heuristics.md](../reference/architectural-heuristics.md):

1. Nature & criticality → 2. Decomposition → 3. Relevance filter → 4. Tech stack → 5. Scaling needs → 6. Distributed-system capability → 7. Sync vs async → 8. UI ↔ domain isolation → 9. Pattern injection check.

### 3. Stack recommendation (checkpoint)

Stack is a checkpoint decision. Use the format in SKILL.md → Decision checkpoints.

- If the user already named a stack, it is fixed input. Surface a real risk once, then work inside it.
- If not, **recommend one** against the system class from step 1. Do not open with a survey. Name the
  fit that drives the pick (latency, scale, ecosystem maturity, operational burden, team familiarity)
  and the conditions that would flip it.
- Ask what the user already runs in production before recommending something new. Familiarity is a
  real force and usually beats a marginal technical edge. When the better answer *is* a stack they do
  not know, say so and price the learning curve, rather than silently excluding it.
- **The final call is the user's.** After the choice, optimize patterns and folder structure for that
  stack's idioms.

### 4. Pick the paradigm (checkpoint)

Paradigm is a checkpoint decision: present the pick with its trade-offs and the conditions that would
flip it, and confirm before designing against it. Match the system to a paradigm using [reference/architecture-paradigms.md](../reference/architecture-paradigms.md):

- Single-machine app → Layered or MVC
- Multi-team independent deploys → Microservices
- Cross-system reactive workflows → Pub/Sub
- Decoupled background ops → Message Queue

Mix is fine: microservices internally Layered, exchanging events via Pub/Sub.

### 5. Define quality targets

Pick 2–3 from [reference/quality-criteria.md](../reference/quality-criteria.md) that matter most for this system class. State them explicitly. They're inputs to the ADR and the code review later.

### 6. Produce the design output

By this point every checkpoint decision is settled, so the output **records** decisions rather than
announcing them for the first time. If one is still open, say so explicitly instead of quietly
picking. Deliver, in this order:

1. **One-paragraph summary** — what is being built and why.
2. **Decomposition diagram** (text or Mermaid) — modules + their responsibilities.
3. **Paradigm + key trade-offs** — why this paradigm, what's deliberately sacrificed.
4. **Stack** — the decision reached at the checkpoint, plus what would make it worth revisiting.
5. **Quality targets** — measurable.
6. **ADR draft** — fill [checklists/adr.md](../checklists/adr.md).
7. **First slice** — smallest end-to-end vertical that proves the architecture.

### 6.5. Design checklist

Walk [checklists/design.md](../checklists/design.md) before declaring the design done. Each unchecked box is either a gap to fill or an explicit waiver to record in the ADR.

### 7. Simplicity gate

Before output, run [reference/simplicity-guard.md](../reference/simplicity-guard.md) over the design:

- Could a single service / single file / single function meet the stated requirements? If yes, present that first.
- Each module, layer, queue, cache, service boundary must answer to a **named present force** (scale, team split, regulatory, measured perf). Strip the rest.
- No speculative microservice splits, no "we'll add Kafka later", no plugin points without a second consumer today.
- Anchor every choice inside the user's named stack/constraints — do not bolt on extras.

Frame trade-ups: `Simplest: monolith / Trade-up A (only if N teams ship independently): split service X / Trade-up B (only if write throughput > Y): introduce queue`.

### 8. Anti-patterns to flag

While designing, watch out for these (full list in [reference/anti-patterns.md](../reference/anti-patterns.md)):

- Big Ball of Mud — no architecture defined.
- BDUF — overspecifying before any code is written.
- Patternitis — inserting GoF patterns "just in case".
- Over-engineering — heavy infra for a casual app.
- Microservices sharing one DB — autonomy gone.

## Output style

Concise. Bulleted. Ready for the user to copy into an ADR or design doc. If user wants narrative explanation, expand specific sections on request.
