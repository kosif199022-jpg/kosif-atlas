---
name: implementation-review
description: "Pre-commit quality gate. Invoke before every git commit, after the live-run check (/run). Seven checks run as parallel subagents: plan gaps, use-case coverage gaps, missing test scenarios, test-philosophy violations (Kent Dodds Testing Trophy), SOLID violations, Clean Code violations, and security vulnerabilities (via /security-audit, which layers on /wstg). Surfaces findings before they land in history. Also invoke when the user says 'review this', 'am I done', 'did I miss anything', or 'check the quality'."
---

# Implementation Review

Run this before every commit, after the live-run check (`/run` — drive the actual app and see the change work). The goal: **what was planned is implemented, what is implemented is tested, and what is tested is correct**.

Each of the seven checks is run by a dedicated subagent. Spawn all seven in parallel, collect their reports, then synthesise into the output format below. Never run the checks sequentially in the main agent, spawn then collect then synthesise.

**Two checks pull in other skills' content, pass it into the subagent brief:**
- **Checks 2-4** apply `/testing-philosophy`: behavior over implementation detail, the two acid tests, the Testing Trophy, and the e2e necessity floor. Stack-agnostic. Pass that skill's content into the Check 2, 3, and 4 briefs so they judge tests against one shared bar.
- **Check 7** applies `/security-audit` (which itself layers on `/wstg`): the confidence gate, false-positive precedents, three-phase methodology, WSTG mapping, and dependency audit. Pass that skill's content into the Check 7 brief.

## Step 1: Gather inputs (main agent)

Before spawning subagents, collect:

- `git diff --staged`, full diff, the primary input for all subagents.
- `git diff --staged --name-only`, file list.
- The **active plan**, look in this order:
  1. Session context: did a planning skill (`/blueprint`, `/to-prd`, `/grill-me`) run earlier in this conversation? Use that output.
  2. `docs/plans/*.md` or `docs/prds/*.md`, the most recently modified file. Falling back further, `docs/intent/*.md` carries the grill-me design notes and edge-case decisions — thinner than a plan, but enough for Checks 1-3 to have something to reconcile against.
  3. The decision log: `docs/adr/`, `docs/prds/`, `docs/development/`. The foundational decision anchors mission and scope.
  4. README or CLAUDE.md scope notes.
- Full content of test files touched or related to the staged changes.
- Full content of non-test source files in the staged diff.

If no plan is findable, say so explicitly and skip Checks 1-2 in the subagent briefs.

---

## Step 2: Dispatch seven subagents in parallel

Spawn all seven simultaneously with `model: "sonnet"`. Each receives the relevant slice of inputs (below) and returns findings as `Check N · [name]: ✓ clean | ⚠ [finding] | ✗ [blocking finding]`.

---

### Check 1: Plan gap analysis

**Inputs:** full `git diff --staged`, the active plan.

Compare what the plan said would be built against what the diff implements. For each plan item: in the diff → ✓ implemented; partially there → ⚠ partial, name what is missing; absent → ✗ gap, deferred or forgotten?

Ask: would a reader of the plan consider this commit "phase complete"? If the plan defined a gate ("Phase N is done when ATs #1-4 pass"), does the commit satisfy it? A deferred item is not a gap, but it must be explicitly deferred, not silently absent.

---

### Check 2: Use-case coverage

**Inputs:** full `git diff --staged`, the foundational scope doc (`docs/prds/*`, `docs/adr/*`, `docs/development/*`, or CLAUDE.md), README feature description. Apply `/testing-philosophy`.

For every **user-facing capability** in scope for this commit: is there a test that exercises it through the public API? A code path that implements it? Is the critical happy path covered end-to-end through the real assembled system (the e2e floor)?

Different from Check 1: use cases can be implicit in the product scope even if the plan did not spell them out. Ask "what would a consumer of this code reasonably expect to be able to do?" Flag any use case with an implementation but no test, a test but no implementation, or a user-facing happy path with no end-to-end coverage.

---

### Check 3: Missing test scenarios

**Inputs:** full `git diff --staged`, full content of changed test files, the plan's `## Edge Cases` table if present (plans written before the rename call it `## The Blind Spots`; accept either). Apply `/testing-philosophy`.

**First, reconcile against the ledger.** If the plan carries a Blind Spots table, every row is a claim to check:

- `handle` → is the case actually implemented, and is there a test that fails without it? Implemented-but-untested is a finding. Neither is a ✗.
- `defer` / `won't` → is it still absent? Silently implemented is fine but note it. Silently *half*-implemented is a ✗ — a partial path is worse than none.
- Anything the diff introduced that no row covers → new blind spot, flag it and name the row that should have existed.

No Blind Spots table (bug tier, or the plan predates it) → say so and derive from scratch below.

Then, for every behavior introduced or changed, work the scenario checklist:

| Scenario | Question |
|---|---|
| Happy path | Is the basic success case tested? |
| Empty / nil / zero | Empty, null, zero, or absent input? |
| Boundary | First, last, exactly one, max capacity? |
| Invalid input | Malformed, out-of-range, wrong type, is rejection tested? |
| Error path | For every success path, is the failure path tested? |
| Idempotency | If callable twice, is that safe and tested? |
| Order sensitivity | Does the result depend on call order? Documented and tested? |
| Concurrent access | If called from multiple tasks, safe and tested? (Only if relevant.) |

Not every category applies to every change, exercise judgment, but do not skip a category without a reason.

---

### Check 4: Test philosophy (Testing Trophy)

**Inputs:** full content of changed test files only. Apply `/testing-philosophy`. A violation is a finding.

- **Behavior over implementation:** does the test name describe a behavior ("rejects an out-of-range index with RangeError") or a mechanism ("calls chooseIndex with the given index")? Does it assert the observable result or how it was produced?
- **Public API only:** accessing private fields, `_inner`, unexported functions, or internal state → violation. Asserting an internal function *was called* (spy / mock-call-count on an owned collaborator) → violation. Mocking types it owns → violation. Mocking only genuine external boundaries → ✓.
- **Real collaborators where cheap:** anything mocked that could be a real instance without significant cost → flag.
- **Refactor-proof:** would it break on an internal rename with the public contract unchanged, or on an internal data-structure change with the return value unchanged? → violation.
- **Trophy shape (both directions):** more unit than integration for cross-unit behavior → flag; something at E2E level that fits cheaper at integration → flag (overuse); a user-facing critical path with no e2e at all → flag (the quieter, more common gap, coordinate with Check 2). A snapshot that will be rubber-stamped on update → flag.
- **Test names:** `it("works")`, `it("test 1")`, `it("should work correctly")` → violation. Specific behavior + expected error → ✓.

---

### Check 5: SOLID violations

**Inputs:** non-test source files from the staged diff only.

- **Single Responsibility:** a class or module with more than one reason to change (validates *and* persists, formats *and* dispatches). Flag if methods cluster into two distinct concern groups.
- **Open/Closed:** adding a variant requires editing existing files (a `switch`/`if-else` chain on a type tag in the caller). Flag if extension requires modification rather than addition.
- **Liskov:** a subtype that throws where its base does not, or ignores a method the base defines. Flag a narrower contract.
- **Interface Segregation:** an interface that forces implementors to define methods they do not use. Flag fat interfaces.
- **Dependency Inversion:** `new ConcreteType()` inside a class body where injection or an abstraction would be natural. Flag it.

---

### Check 6: Clean Code violations

**Inputs:** full `git diff --staged` (test and non-test).

| Issue | What to look for |
|---|---|
| Magic values | Bare literals with meaning: `if (index >= 99)`, `setTimeout(fn, 3000)`, a string key repeated across files. Name them. |
| Does more than one thing | If describing it needs "and", split it. |
| Unqualified generic names | `data`, `info`, `result`, `value`, `temp`, `manager`, `handler`, `helper` without qualification. |
| What-comments | Comments restating code (`// increment the index` over `index++`). Keep only *why* comments. |
| Half-finished surfaces | Exported symbol with `TODO`, a stub `{ return null; }`, or "implement later". |
| Long parameter lists | More than 3-4 positional params, group into an options object. |

---

### Check 7: Security

**Inputs:** full `git diff --staged`, file list, the lockfile diff if a lockfile changed.

Pull in the full content of `/security-audit` and apply it to the staged diff. That skill carries the confidence gate, the three-phase methodology, the false-positive precedents, the dependency audit, and it maps findings to WSTG IDs via `/wstg`.

The one rule: **only report a finding with a concrete exploit path, and only when over 80% confident it is actually exploitable.** Review what the change *newly introduces*, not pre-existing issues the diff sits near. When a lockfile changed, run the repo's native auditor (detect it from the lockfile, see the table in `/security-audit`) scoped to the changed packages, degrade to an advisory flag if unavailable. Return findings in the house line format. HIGH and MEDIUM block; LOW is advisory.

---

## Step 3: Synthesise (main agent)

Merge the seven reports:

```
Implementation review, [commit subject or staged file summary]

Check 1 · Plan gaps
  ✓ All phase items present  |  ✗ Gap: [item], [present/partial/absent]
Check 2 · Use-case coverage
  ✓ All use cases covered  |  ✗ [use case], no test / no implementation
Check 3 · Missing test scenarios
  ✓ Scenarios complete  |  ⚠ [behavior]: missing [scenario type]
  Ledger: [N handled / N deferred / N drifted]  |  ✗ [case]: planned [decision], shipped [reality]
Check 4 · Test philosophy
  ✓ Tests pass  |  ✗ [test name]: [violation]
Check 5 · SOLID
  ✓ No violations  |  ✗ [file:line]: [principle], [finding]
Check 6 · Clean Code
  ✓ No violations  |  ✗ [file:line]: [issue]
Check 7 · Security
  ✓ No vulnerabilities  |  ✗ [file:line]: [category] ([severity], WSTG-ID), [exploit] + fix  |  ⚠ [lockfile / auditor]

Summary: [N findings, fix before committing / Clean, proceed]
```

**Blocking** (fix before committing unless the user overrides): a plan gap, a philosophy violation on a public-API test, a SOLID violation that breaks extensibility, a HIGH or MEDIUM security finding. **Advisory** (surface, do not block): an unclear test name, a slightly long function.

---

## Flow position

```
[code changes complete]
     ↓
/run                       ← does the change actually work end-to-end
     ↓
/implementation-review     ← THIS SKILL, seven parallel subagents
     ↓
git commit
     ↓
/pr-craft                  ← open the PR
```

---

## Anti-patterns

- Do not skip a check because "the change is small", that is when violations sneak through.
- Do not invent a plan if none is findable, skip Checks 1-2 and say so.
- Do not treat every advisory finding as blocking, use judgment.
- Do not run Check 4 on non-test files, or Check 5 on test files.
- Do not report a Check 7 finding without a concrete exploit path.
- Do not fail Check 7 when the dependency auditor is missing, degrade to advisory.
- Do not report "✓ clean" without the subagent actually reading the diff.
- Do not run checks sequentially, the point of subagents is parallel execution.
