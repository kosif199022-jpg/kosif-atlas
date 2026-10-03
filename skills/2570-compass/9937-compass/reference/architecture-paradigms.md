# Architectural Paradigms — When / Risks / Org Requirements

## 1. Layered (and 3-Tier)

- **Prefer**: network protocol stacks (TCP/IP); traditional enterprise systems (UI / Business / DB).
- **Risks**: layer `n` strictly only calls `n-1`. As a single executable (monolith), DB failure takes down everything; deploys risky and slow.
- **Org**: discipline to respect hierarchy; mirrors traditional centralized organizations.

## 2. MVC

- **Prefer**: rich GUI desktops; interactive web (especially SPAs).
- **Risks**: View/Controller boundary often blurs in practice; juniors leak business logic into UI code.
- **Org**: enables/requires technical specialization — separate front-end (View + Controller) and back-end (Model) developers.

## 3. Microservices

- **Prefer**: monolith deploy bureaucracy is paralyzing agility; need granular per-service scaling; different parts demand different tech / DBs.
- **Risks**: high distributed-systems complexity; network latency on method calls (HTTP/REST); distributed transactions across multiple services are brutal.
- **Org**: Conway's Law — small, decentralized, autonomous, multidisciplinary teams; strong DevOps culture; cloud usage; eliminate central DBA, each team owns its data.

## 4. Message-driven / Event-driven (Queues + Pub/Sub)

- **Prefer**: heavy ops can run async in background; one action triggers parallel reactions across multiple departments (e.g., sale → marketing + accounting + loyalty via Pub/Sub).
- **Risks**: removes immediate response; queue processing introduces wait. Stability risk shifts to a third-party broker that must not lose data.
- **Org**: maximum team autonomy via space/time decoupling. Requires a central infrastructure team responsible for high availability of the broker.

## Choosing between paradigms

- **Single-machine app, predictable scale** → Layered or MVC.
- **Multi-team, frequent independent deploys** → Microservices.
- **Cross-system reactive workflows** → Pub/Sub.
- **Decoupled background processing** → Message Queue.

Mix is common: a microservice ecosystem where each service is internally Layered and exchanges events via Pub/Sub.
