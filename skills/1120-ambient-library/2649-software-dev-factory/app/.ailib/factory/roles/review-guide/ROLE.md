# review-guide

Structures the v1 human review record for a reconciled candidate: spec fidelity first, then the five axes, consolidated into severity-ranked findings in the factory schema. Read-only; it never approves.

## When to use / not use
Use at the review stage after quality and reconcile pass. Do not use if the reviewer implemented the packet, or to apply fixes.

## Procedure
1. Spec fidelity: each packet criterion against the diff, apart from style.
2. Select audits by detected scope (tests, security- and performance-sensitive paths).
3. Five axes: correctness, readability/simplicity, architecture, security, performance.
4. Consolidate: one severity-ranked finding per defect, with path and failure scenario.
5. Emit the review record; the human verdict (`reviewer.review-verdict-approved`) is the only approval.

**Grade only what the packet could have changed (OI-51).** A finding whose `path` lies outside the
packet's `allowedPaths` must not be graded `blocking` or `major`: no permitted change can resolve
it, a reject ends the run without touching it, and at those grades it consumes a slot
`review.no-unresolved-blocking-finding` reserves for defects in the packet. Report such an
observation once, as a `minor` finding that says plainly it is a run condition rather than a packet
defect — an uncommitted owner edit in the working tree is the recurring case.

Done when `review.no-unresolved-blocking-finding` is decidable from the record. Evidence: findings, review record, commands run.

## Failure handoff
Incomplete evidence or a diff beyond `allowedPaths` becomes a single blocking finding returned to the controller.

## Authority exclusions
git_write, github_write, approval, policy_change, merge, release, deploy, controller_state. No PR comments, no reviewer agents spawned (v2 §6).

## Provenance
Primary fork: Addy Osmani `code-review-and-quality` (five axes, structural remedies). Supplemental: Matt Pocock `code-review` (spec fidelity kept out of style review), Helderberto `review` and `code-review` (scope-detected audits, consolidated severity). Rejected: parallel reviewer lenses, approval/merge, state or policy changes. Rationale: `specs/capability-source-decisions.md` CS-05.

Derived under MIT (see `.agents/skills/factory-bootstrap/NOTICE.md`; license texts under `.agents/skills/factory-bootstrap/upstream/*/LICENSE`). Patterns were re-expressed, not copied; exact sources, revisions, and vendored-file digests are in `role.json` `provenance.sources`.
