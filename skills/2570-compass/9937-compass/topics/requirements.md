# Raw — Requirements

## 1. Concepts

### Functional vs Non-Functional Requirements
- **Definition**: Functional = what the system must do (services/operations). Non-functional = constraints and metric limits on operation (performance, reliability, usability).
- **Solves**: bridges real-world need and software construction; prevents products that fail users or can't sustain demand.

### User Stories
- **Definition**: short informal documents from a user role's perspective (Card), driving daily conversations (Conversation), bounded by acceptance tests (Confirmation) — the 3C's.
- **Solves**: waste from long specs that go obsolete due to requirement volatility.

### Use Cases
- **Definition**: structured textual specs in ordered steps (Normal Flow + Extensions) drawn from the interactions of a primary Actor with the system.
- **Solves**: clear, validatable agreement between client and dev before technical design starts.

### Minimum Viable Product (MVP)
- **Definition**: simplified version with only the core features needed to run "build–measure–learn" with early adopters.
- **Solves**: massive waste when validating hypotheses in markets where even users don't know what they want.

### A/B Tests
- **Definition**: data-driven experiments where random user samples interact in parallel with the original (control) or a variation (treatment).
- **Solves**: removes gut/subjectivity in choosing UI and features; uses statistical validation and real conversion rates.

## 2. When to Use

- **User Stories** — high adaptability, agile cycles, with a business rep continuously available.
- **Use Cases** — frozen/stable requirements; agencies/government demanding fixed pre-contracted scope or detailed certifications.
- **MVP** — startups and disruptive launches in unknown markets where reliable user research isn't possible.
- **A/B Tests** — UI engagement refinement (colors, copy, button order) and post-MVP decisions on whether to ship a new feature/algorithm (e.g., new recommender).

## 3. When NOT to Use

- **User Stories** — mission-critical (medical, automotive, aerospace) needing extreme upfront specs; ephemeral conversations aren't enough.
- **Use Cases** — simple CRUD ops; bureaucratizes routine steps.
- **MVP** — mature markets with established software; never for life-critical components (e.g., ICU control).
- **A/B Tests** — low traffic volume; impatient teams that cut experiments before reaching demographic sample size.

## 4. Smells

- **Epics at execution time** — huge unrefined stories at backlog top → impossible estimates, weeks of accumulated work.
- **No test in the story** — cards saying software should "be fast" or "user-friendly" without testable/visible metric.
- **Use Case as programming language** — excess of conditionals/loops in Normal Flow instead of using Extensions properly.
- **Long Use Case main path** — > 9 ops in success scenario → exhaustive design that should be split.
- **Vanity metrics** — tracking pageviews or empty numbers in MVP instead of Retention/Acquisition; failing the "Measure" leg of build-measure-learn.
- **Gold plating** — dev adds features or re-interprets requirements without a Card request from the client.

## 5. Operational Checklist

- [ ] Express non-functional requirements as quantitative descriptions (e.g., "99.99% server uptime").
- [ ] Verify feasibility and precision of requirements; eliminate grammatical ambiguity.
- [ ] Apply the 3C's (Card, Conversation, Confirmation) across the agile flow.
- [ ] Pass each story through the INVEST screen — explicit business value, structural isolation.
- [ ] Identify user roles upfront in agile workshops (e.g., Customer vs Admin).
- [ ] Decouple conditional logic from Use Cases — push errors to Extension Flows.
- [ ] Maintain a singular vocabulary across specs; keep a Glossary.
- [ ] Map funnel metrics (Acquisition, Activation, Revenue) tied to the business hypothesis in MVP.
- [ ] Set the statistical Significance Level (Alpha) before running A/B test analysis.
- [ ] Run an A/A test first as diagnostic when the analytics framework is brand new.

## 6. Examples

### User Story template
- **Card**: As [library staff], I would like [the system to apply fines on overdue returns].
- **Acceptance**: During Sprint Review, demonstrate a 1-day-late return correctly applying the agreed punitive metric.

### Use Case skeleton
- **Name**: Transfer Funds
- **Primary Actor**: Bank Customer
- **Normal Flow**: 1. Authenticate; 2. Enter amount; 3. Confirm destination; 4. System transfers
- **Extension**: 3a. If insufficient balance → request lower amount

### A/B Test routing
```
if (random() < 0.5) { renderControl(A); } else { renderTreatment(B); }
```
Track funnel correlation with sales for both variants.

## 7. Trade-offs

- **User Stories vs Use Cases** — Stories: oral negotiation under unstable requirements, defer design decisions. Use Cases: rigid contracts, every visible interaction, exceptions, and formal sequence skeleton — protocol-grade agreement.
- **Prototypes vs MVPs** — Prototype: empty/canned simulation for management buy-in or UX validation. MVP: minimum real code, low maintenance concern, exposed to real audience to test commercial viability.

## 8. Cross-references

- **Processes** — agile abandons fixed upfront phases (BDUF); requirements engineering becomes fluid via stories entering Sprint planning progressively.
- **Testing** — Acceptance Tests are direct children of the 3rd C (Confirmation), checking functional + non-functional requirements at Sprint close (black box).
- **Lean Startup** — MVP ties directly to lean cycles; teams iterate based on data approval rather than opinion.
