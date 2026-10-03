# TDD Cycle + Rules + Test-Smell Checklist

## Cycle (baby steps)

1. **Red** — write a failing test. Acts as the spec for the feature.
2. **Green** — write the minimum code (even trivial constants) just to pass the test.
3. **Refactor** — improve quality of code and test; apply principles, kill duplication. Test must stay green.

## FIRST Rules

- **Fast** — milliseconds; viable for continuous runs.
- **Independent** — no shared state; order doesn't affect outcomes.
- **Repeatable** — deterministic; same result regardless of environment/time.
- **Self-checking** — binary green/red; no manual file inspection.
- **Timely** — written before production code.

## Test-Smell Checklist

- [ ] **Obscure test?** Long or complex to read → simplify; one test = one requirement.
- [ ] **Conditional logic?** `if`, `for`, `while` inside test body → remove; flow must be strictly linear.
- [ ] **Duplicated setup?** Same fixture across many tests → extract to a shared setup / common init.
- [ ] **Flaky?** Random pass/fail → isolate concurrency; remove `sleep`-based timing; replace async with sync stand-ins.
- [ ] **Disconnected asserts?** Multiple unrelated asserts → split tests; same-concept asserts only (multiple attribute checks of one object are fine).

## Mocking guidance

Use mocks/stubs when scope crosses outside the language / in-memory boundary (disk, web servers, real time/async). Avoid when they couple tests to internal implementation rather than the contract — that's a fragile test.
