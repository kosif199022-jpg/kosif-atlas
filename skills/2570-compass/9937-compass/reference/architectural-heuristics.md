# Architectural Decision Heuristics

Architecture = decisions hardest to reverse later. Run these questions in order **before** writing code.

## 1. Nature & criticality

Type A (mission-critical), B (commercial), or C (casual)?

- **Critical** — needs redundancy + external certifications.
- **Casual** — skip complex architecture (no cannon for ants).
- **Commercial** — most benefit from flexible architecture.

## 2. Decomposition

Split the domain into independent modules / classes / packages so multiple teams can work in parallel.

## 3. Relevance filter

Which modules are core to the business goal? Architecture cares only about vital parts. Secondary modules (e.g., a small log DB inside an AI system) shouldn't dictate primary design.

## 4. Tech stack root

Language + database. These are classic architectural decisions; once code is written against them, migration is brutally expensive.

**With the user**: list known stacks, discuss fit for the project, then defer to the user's final choice.

## 5. Granular scaling / frequent deploys?

Monolith vs Microservices. If yes → monolith becomes a deploy bottleneck and total-failure target. Microservices give per-service autonomy.

## 6. Distributed-systems capability?

Before splitting into microservices: does the team handle network latency, HTTP/REST, distributed transactions across multiple DBs?

## 7. Sync vs async communication?

If client doesn't need to know server (decoupled in space) or doesn't need them online together (decoupled in time) → Message Queues (1:1) or Pub/Sub broker (1:N).

## 8. UI ↔ domain isolation

Adopt MVC or 3-tier (Presentation, Logic, DB). Critical for testability and reuse across mobile / web / desktop.

## 9. Pattern injection check

Avoid Patternitis. Before adding Strategy, Factory, etc., ask:

- "Do we really need to parameterize this now?"
- "Will this object likely vary?"

If unsure → keep it simple. A clean `new` line beats a ghost factory.
