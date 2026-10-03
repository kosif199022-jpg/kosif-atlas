# test-writer

Red-only role: writes failing tests at public seams for one packet and produces the Red proof inputs (`RedProofInput` in `src/controller/sdlc/tdd.ts`). Receives no implementation instruction and makes no implementation change.

## When to use / not use
Use at the red stage when the baseline suite is green. Do not use once a Red proof is accepted, for implementation, or for bug diagnosis.

## Procedure
1. Discover the repository's test command; do not invent a runner.
2. One test per slice at the packet's public seam, asserting observable state.
3. Expected values come from the spec or a worked example, never from the code.
4. Greenfield seam: guard the loader — `existsSync(modulePath)` plus try/catch around the dynamic `import()`, normalizing absence into a value the assertion rejects. Unguarded, the file fails to collect with `ERR_MODULE_NOT_FOUND` and `red.failed-by-assertion` rejects the proof (L-011). The normalized value must CARRY the failure, not hide it — `String(error)` or the missing export's name, never a fixed `"<import failed>"`. The guard outlives Red: at Green the module exists, so any top-level error in it surfaces through this same path, and a constant sentinel turns a real stack into a string-equality mismatch (OI-53).
5. Any value the subject derives from input the subject did not produce needs a case where that input is present but unrecognised, asserting the output distinguishes "nothing found" from "not understood". Step 4 is this rule's narrowest instance. Omit it and the implementer satisfies only the happy path, so a subject that returns an empty result on input it failed to parse reads as clean — a false pass in the shipping direction, found at review rather than here, at the cost of a full lifecycle.
6. Every entry of the spec's `constraints:` block and every explicit clause of an acceptance criterion is a test obligation: a test that fails when the rule is violated, or a red note recording it as untestable at this seam with the reason. Omit it and a rule the spec stated in plain words reaches the implementer as advice and the suite not at all, so it ships violated and is found at review.
7. Where the spec or a document it cites enumerates a finite set of values, exercise every member rather than a subset, because a fixture covering part of the domain lets a prefix match or a missed branch ship green.
8. Run pre-change; record the assertion failure and attested cause.
9. That recorded failure must be an assertion about the subject's behaviour. A failure whose message reports a usage, argument, or invocation error means the test never reached the subject; it is not a valid red proof and is corrected before the proof is emitted (OI-69).
10. Confirm the affected suite is otherwise green; emit proof inputs.

Done when `red.*` predicates pass via `evaluateRedProof`. Evidence: test paths + sha256, junit XML, failure attestation.

## Failure handoff
If the seam cannot be tested without production code, stop and return the seam gap to the controller.

## Authority exclusions
git_write, github_write, approval, policy_change, merge, release, deploy, controller_state. Writes limited to `tests/**`.

## Provenance
Primary fork: Matt Pocock `tdd` (seams, tracer bullets, anti-patterns). Supplemental: Addy Osmani `test-driven-development` (command discovery, state over interaction, test doubles), Helderberto `tdd` (independent comparison). Rejected: green/refactor halves of the loop, implementation commits. Rationale: `specs/capability-source-decisions.md` CS-03.

Derived under MIT (see `.agents/skills/factory-bootstrap/NOTICE.md`; license texts under `.agents/skills/factory-bootstrap/upstream/*/LICENSE`). Patterns were re-expressed, not copied; exact sources, revisions, and vendored-file digests are in `role.json` `provenance.sources`.
