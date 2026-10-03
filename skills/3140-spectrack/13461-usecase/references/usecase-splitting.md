# Use Case Splitting

Split a use case when the actor goal forks or the flow contains
multiple independent goals. The contract is in the **Splitting a
use case** section of the `usecase` issue authoring contract.

## Split signals

The candidate use case probably needs to split when:

- The flow has steps that serve **independent** goals.
- The expected outcome describes two or more **unrelated** results.
- Different actors take over different parts of the flow.
- The situation covers multiple distinct scenarios that don't always
  occur together.
- The actor and goal are clear but the goal contains "and" connecting
  two real outcomes ("share the summary and schedule the follow-up").

## Procedure

1. **Confirm the split with the user.** Name the children plainly
   ("Share the summary" / "Schedule the follow-up") and ask whether
   the split matches their intent.
2. **For each child**, re-run `./progressive-extraction.md`. Each
   child is its own draft, with its own actor, goal, situation, flow,
   expected outcome — and its own published `usecase` issue.
3. **Link siblings**. After each child is published, relate them
   pairwise — via the backend's related link where it exposes one
   (`--related` through `spectrack issue link`; run `spectrack issue
   link --help` for the relationship kinds the configured backend
   accepts), otherwise by listing the sibling refs in each issue's
   Related body section. Do not use `parent` between siblings; per the
   `issue` authoring contract, the `parent` intent is for parent/child
   coordination, not sibling pairing.
4. **Do not use supersession** unless an older published use case is
   being replaced. A first-time split does not supersede anything —
   the parent was a draft, not a prior publication.

## When a published use case needs to split

If discovery reveals that a previously published `usecase` issue
covers two independent goals, do **not** rewrite the issue body in
place to one of the children. Instead:

1. Publish each child as a new `usecase` issue per
   `./progressive-extraction.md`.
2. Relate each child to the original — via the backend's related link
   where it exposes one (`--related`), otherwise by listing the
   original's ref in each child's Related body section.
3. On the original, append a comment via `spectrack issue comment` explaining
   the split decision and naming the child refs.
4. Update the original's body via `spectrack issue update` so its `Current
   Draft` section names the child refs and its `Open Questions`
   section is cleared if every open question was distributed across
   the children. Do not retitle the original — the original ref is
   how readers find the split history.

## Anti-patterns

- Splitting because the flow is long. Length alone is not a split
  signal; goal independence is. Long, single-goal flows are fine.
- Splitting one user's flow into many use cases per UI screen.
  Screens are grouped via `./ui-screen-grouping.md`, not split.
- Force-fitting a `parent` relationship on the original use case so
  the split feels hierarchical. Sibling use cases are sibling — they
  do not roll up.
