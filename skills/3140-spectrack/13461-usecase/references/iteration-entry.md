# Iteration Entry Procedure

Use this procedure when the caller invokes the skill with
the user's request is `iterate`, names an existing `usecase` issue ref, or
explicitly asks to resume an earlier discovery session. The goal is
to surface what is still open so the session picks up coherently —
without re-asking questions the prior session already settled.

## 1. Inventory current `usecase` issues

List the issues that exist on the configured backend so the user
can pick where to resume.

1. Run `spectrack issue list --type usecase`. When the launcher offers
   no list verb, fetch the refs the user named directly — pass them all
   to a single `fetch` call (the verb accepts multiple refs).
2. For each issue, capture: ref, title, current state, and whether
   the body's `Open Questions` section is non-empty.

Do not read every issue body up front — read on demand. The summary
is meant to orient, not to re-load every confirmed use case.

## 2. Identify the active backlog

Filter to the items the session can act on:

- `usecase` issues whose state is open and whose `Open Questions`
  section is non-empty. These are use cases that need further
  refinement.
- `usecase` issues blocked by any open `review` issue whose `source`
  indicates `usecase-reviewer` or `usecase-explorer` (these are
  quality findings or candidate gaps waiting for resolution).

Present the active backlog as a short priority-ordered list (the
user-supplied ref first, then issues with the most open questions,
then everything else).

## 3. Confirm scope with the user

Ask the user where to resume. Common shapes:

- "Fix <ref>" — load that one issue plus every open `review`
  linked to it; jump straight into the discovery loop scoped to that
  use case.
- "Walk findings" — go directly to the wrap-up walk (`./wrap-up.md`
  step 4) without re-running the explorer or reviewer.
- "Add more use cases" — re-enter the discovery loop with the
  existing set as context.

Do not pick a path on your own — the user names the scope.

## 4. Seed the session task list for iteration

Replace the new-discovery seed with an iteration-shaped backlog:

- `"Iteration: backlog walk"` → `in_progress`
- One `"Iteration: <ref> <title>"` per use case the user selected.
- One `"Iteration: review-<ref>"` per `review` item the user agreed
  to walk through.
- `"Wrap Up: Session report"` → `pending` (the iteration session
  still ends with a report; the reviewer/explorer steps are added
  only if the user asks for another quality pass).

## 5. Iteration discipline

The shared rules from the `usecase` issue authoring contract apply
unchanged. In addition:

- **Show before/after on use case body changes.** When modifying an
  existing `usecase` issue body, present the proposed diff (sections
  affected, before/after wording) to the user before calling
  `spectrack issue update`.
- **Never re-publish a confirmed use case as a new issue** unless
  the user explicitly asked to split it (`./usecase-splitting.md`).
  Re-publication creates a duplicate; the ref the original was first
  published under is the canonical handle.
- **Preserve the audit trail.** Append a comment to the use case
  before changing the body so the change rationale is recorded; then call
  `spectrack issue update` to apply the body change. Two operations,
  in that order.
- **Resolve `review` items by updating their state** through
  `spectrack issue update --state closed` once the resolution
  has landed on the target. Closing the review without updating the
  target leaves the finding unresolved.
