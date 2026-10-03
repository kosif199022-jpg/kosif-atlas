# Raw — Processes

## 1. Concepts

### Agile (Manifesto)
- **Definition**: values/principles for short iterative cycles, constant feedback, collaboration, embracing change.
- **Solves**: software becoming obsolete due to natural requirement drift over time.

### Extreme Programming (XP)
- **Definition**: agile method emphasizing engineering practices (TDD, pair programming, incremental design) — not just management.
- **Solves**: keeping technical quality and code cohesion when requirements are vague and mutable.

### Scrum
- **Definition**: agile management method with defined roles (Product Owner, Scrum Master, Developers), artifacts (Backlogs), and events (Sprints).
- **Solves**: lack of prioritization, organization, and transparent alignment for delivering value in fixed time-boxes.

### Kanban
- **Definition**: continuous-flow agile method driven by visual management (Kanban Board) and Work-In-Progress (WIP) limits.
- **Solves**: developer overload and bottlenecks in the software production line.

### Plan-Driven (Waterfall)
- **Definition**: sequential model with large monolithic phases (requirements, design, code, test) executed in order.
- **Solves**: rigid budget predictability and strong upfront documentation of immutable requirements.

### Unified Process (UP / RUP)
- **Definition**: iterative-transition model (Inception, Elaboration, Construction, Transition) with heavy documentation and UML.
- **Solves**: centralized control of architectural risk in corporations requiring formal upfront design.

## 2. When to Use

- **Agile / XP** — Business systems with high market uncertainty, vague mutable requirements, frequent change requests, small co-located teams.
- **Scrum** — Need cadence of regular increments AND a clear single Product Owner accountable for value.
- **Kanban** — Continuous maintenance / DevOps where fixed Sprints get in the way; daily-shifting priorities; smoothing workload spikes.
- **Waterfall / UP** — Mission-critical Type-A systems (avionics, medical), regulated environments, heavy certifications requiring docs before code.

## 3. When NOT to Use

- **Agile (general)** — fixed-scope bureaucratic contracts; life-critical projects requiring Big Design Up Front; teams of dozens/hundreds on a single component.
- **Scrum** — work dominated by interruptions (e.g., critical bug support) — Sprint goal is meant to be stable.
- **Waterfall** — innovation / new product (startups); no cheap mid-course correction.

## 4. Smells

- **Mini-waterfalls** — agile branding but Sprint has "requirements week → code week → test week". Waterfall in disguise.
- **Integration Hell** — no continuous integration; long solo branches; merges become paralyzing conflicts.
- **WIP limits ignored** — "In Progress" columns overloaded; total throughput collapse; management refuses limits.
- **Committee Product Owner** — multiple people sharing the role → decision paralysis, bloated products, unresolved priorities.

## 5. Operational Checklist

- [ ] Choose iterative vs continuous model fitting product/team context.
- [ ] Appoint a Product Owner with real prioritization authority.
- [ ] Slice complex deliveries into short, testable user stories (days, not weeks).
- [ ] Map value flow (Kanban) or set Sprint length (1–4 weeks) (Scrum).
- [ ] Agree on explicit Definition of Done covering technical quality.
- [ ] Set explicit WIP limits to shield team from pushed work.
- [ ] Run feedback ceremonies: Daily (15 min), Review, Retrospective.
- [ ] Automate build + tests to enable CI and prevent regressions.
- [ ] Practice opportunistic refactoring continuously.
- [ ] Cap team size (~< 10) to reduce communication lines.

## 6. Examples

### Scrum cycle
- **Input**: Product Backlog (PO-prioritized).
- **Start**: Planning meeting → PO selects items, team breaks into tasks → Sprint Backlog.
- **Middle**: Sprint (fixed length); team self-manages; daily 15-min sync on status + blockers.
- **End**: Review (demo working software) + Retrospective (process improvement).

### Little's Law for Kanban WIP
- Formula: `WIP = Throughput × Lead Time`
- Example: Implementation stage avg LT = 12 days, TP = 0.38 tasks/day → max simultaneous items = 4.57 → cap at 5.

## 7. Trade-offs

- **Scrum vs Kanban** — Scrum: rigid time-boxes protect focus. Kanban: free continuous flow, only WIP cap; better when constant urgency can't wait for cycle boundary.
- **Scrum vs XP** — Scrum manages process shell (deadlines, roles, rituals). XP enforces engineering discipline (TDD, pairing, simple design). Mature teams often combine "Scrum management + XP engineering".
- **Agile vs Waterfall** — Agile reduces "wrong product" risk via continuous validation, sacrifices fixed scope. Waterfall optimizes for contract comfort, accepts risk of obsolete output.

## 8. Cross-references

- **Requirements** — agile replaces specification manuals with user stories, conversations, available POs.
- **Testing** — XP makes TDD core; automated tests replace heavy manual QA as quality gate.
- **Design Principles & Refactoring** — iterative processes require incremental design instead of Big Design Up Front; rely on routine refactoring.
- **DevOps** — XP's continuous integration evolves into full continuous deployment automation.
