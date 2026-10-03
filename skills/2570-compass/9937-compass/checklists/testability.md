# Testability Checklist

Use to assess whether code under design or review can be tested cleanly.

## Unit-level testability

- [ ] Class can be instantiated without a database / network / filesystem
- [ ] Dependencies injected via constructor or method param (DIP)
- [ ] No reliance on a Singleton for state
- [ ] No direct call to a real system clock; time injected as a dependency
- [ ] No reliance on `static` mutables that persist across tests

## Mocking seams

- [ ] External services accessible behind an interface (Adapter / Factory / Facade)
- [ ] No `final` / sealed classes in places where mocks are required
- [ ] No private static method holding behavior that needs to be stubbed

## FIRST compliance

- [ ] **Fast** — single test runs in milliseconds
- [ ] **Independent** — no shared mutable state across tests
- [ ] **Repeatable** — deterministic across machines and runs
- [ ] **Self-checking** — assertion result is binary; no manual log inspection
- [ ] **Timely** — tests written alongside or before production code

## Test smells (already in the suite)

- [ ] No `sleep` / wall-clock-sensitive waits
- [ ] No conditional logic (`if`, `for`, `while`) inside tests
- [ ] No giant fixture setups for tiny assertions
- [ ] No multiple unrelated asserts per test
- [ ] No skipped or ignored tests left undated

## Coverage and proportion

The mix of unit / integration / e2e, and whether a feature needs an end-to-end test at all, belong
to the `testing-philosophy` skill, not here. Two items that are design concerns rather than
strategy:

- [ ] Critical paths reachable by a test that crosses real boundaries, not only in isolation
- [ ] No coverage *target* steering the design; coverage is a side effect of testing real behavior

## Untestable code = design smell

If a piece of code can't be tested cleanly, the answer is rarely "skip the test". The answer is to refactor for testability:

- Extract pure functions out of side-effecting methods
- Inject dependencies that were previously constructed inside the class
- Wrap external libraries behind your own interface
