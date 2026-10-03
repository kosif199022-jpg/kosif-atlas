# Raw — Testability

> **Test strategy is not compass's call.** What to test, in what proportion, and whether a feature
> needs an end-to-end test are answered by the **`testing-philosophy`** skill, which is the single
> source of truth for it: behavior over implementation details, the Testing Trophy, and a hard e2e
> floor for user-facing features. Load that skill rather than deciding here.
>
> Compass owns the *design* half: whether code can be put under test at all, and what it says about
> the design when it cannot.

## 1. Testability as a design signal

- **Definition**: how easily parts of the system can be put under test.
- **Why it belongs here**: untestable code is a design report, not a testing problem. Difficulty
  writing the test almost always means hidden coupling, a missing seam, or business rules welded
  to I/O.

Read the difficulty as a diagnosis:

| Symptom while writing the test | Design defect underneath |
|---|---|
| Needs a DB, network or filesystem just to call it | Business rules not separated from I/O |
| Needs a large object graph constructed first | Dependencies built inside rather than injected (DIP) |
| Result varies by run, machine or time of day | Ambient state: a singleton, a static mutable, a real clock |
| Can only be asserted through the UI | Domain logic living in the presentation layer |
| Requires stubbing a concrete class | Missing interface at the external boundary |

## 2. The response is refactor, not skip

If code cannot be tested cleanly, the answer is rarely "skip the test":

- Extract pure functions out of side-effecting methods.
- Inject dependencies that were previously constructed inside the unit.
- Wrap external libraries behind an interface you own.
- Pull domain logic out of UI components.

Assess with [checklists/testability.md](../checklists/testability.md); for the red-green-refactor
rhythm itself see [reference/tdd-cycle.md](../reference/tdd-cycle.md).

## 3. Cross-references

- **Design Principles (SOLID)** — DIP and decoupled, cohesive code yield natural testability; high
  coupling through globals breaks determinism under parallel runs.
- **Refactoring** — tests are the safety net that makes refactoring anything other than reckless,
  which is why [workflows/legacy.md](../workflows/legacy.md) treats getting code under test as a
  hard prerequisite rather than a nice-to-have.
- **DevOps** — the pipeline runs whatever suite exists; it does not decide what that suite should be.
