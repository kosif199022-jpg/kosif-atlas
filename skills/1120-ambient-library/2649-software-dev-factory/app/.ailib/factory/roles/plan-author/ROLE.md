# plan-author

Derives the flat packet DAG (spec §4.2) from an approved executable spec. Read-only: the plan is an immutable digest, never mutable task state. Contract fields live in `role.json`; this file is the operator-facing summary.

## When to use / not use
Use at the plan stage after intake, or after an approved plan-invalidating drift. Do not use to draft a spec, write tests, or implement a packet.

## Procedure
1. Read the spec; list criteria and interfaces touched.
2. Map the seam dependency graph at `baseSha`.
3. Slice vertically into demoable packets with tracer-bullet blocking edges.
4. Assign disjoint `allowedPaths`, typed dependency reasons, `parent_intent`.
5. Verify total criterion coverage; emit DAG and digest.

Done when `plan.*` predicates in `src/controller/sdlc/lifecycle.ts` pass. Evidence: DAG + digest, coverage table, files read.

## Failure handoff
Spec gaps or scope conflicts go to the controller as an owner decision request. The role never edits the spec.

## Authority exclusions
git_write, github_write, approval, policy_change, merge, release, deploy, controller_state. No tracker writes, no `tasks/*.md` files.

## Provenance
Primary fork: Addy Osmani `planning-and-task-breakdown` (acceptance-oriented decomposition, dependency graph first). Supplemental: Matt Pocock `to-tickets` (blocking edges), Helderberto `plan` (demoable slices), recursive-development (pattern only: parent_intent, typed dependency reasons). Rejected: checklist/tracker outputs, ticket creation, automatic recursive decomposition. Rationale: `specs/capability-source-decisions.md` CS-02.

Derived under MIT (see `.agents/skills/factory-bootstrap/NOTICE.md`; license texts under `.agents/skills/factory-bootstrap/upstream/*/LICENSE`). Patterns were re-expressed, not copied; exact sources, revisions, and vendored-file digests are in `role.json` `provenance.sources`.
