# Progressive Use Case Extraction

When the conversation reveals enough context across the four gaps,
draft a use case and present it to the user for confirmation. On
confirmation, publish it as a workflow `usecase` issue.

## Required fields before drafting

Every draft must name:

- **Actor** — specific person or system (not "the user"). Same name
  the project already uses for that role.
- **Goal** — one concrete thing the actor wants to accomplish.
- **Situation** — trigger and context, concrete (not "when managing
  data").
- **Flow** — numbered, user-visible steps and responses.
- **Expected outcome** — observable, ideally measurable.

Abstraction discipline: stay at the user level. The contract is in
the **Abstraction discipline** section of the `usecase` authoring
contract; the conversion table (before/after rewrites for the most
common leaks) and per-field obligations are in the companion
abstraction guard. Apply the guard before presenting any draft to
the user — rewriting a leaked phrase mid-draft is cheaper than
fixing it after the user has already reacted to the wrong wording.

## How to present the draft

Frame the draft and ask one confirmation question. Example:

> Based on what you've described, here's a candidate use case:
>
> **Share meeting summary**
> - **Actor:** Meeting organizer
> - **Goal:** Share key decisions with absent teammates quickly
> - **Situation:** Just finished a 30-minute meeting; absent teammates
>   need the outcome
> - **Flow:** 1. Open the meeting record … 5. Send to the team channel
> - **Expected outcome:** Absent teammates receive a 3-line summary
>   within minutes; the organizer spends under 2 minutes instead of 20
>
> Does this capture it, or is there something to adjust?

## After core confirmation: drill into precision

Once the core is agreed, probe for the optional surfaces, one
question at a time:

- **Validation** — user-visible input constraints, limits, required
  formats.
- **Error handling** — what the actor sees when things fail.
- **Boundary conditions** — empty input, max items, concurrent access,
  timeouts.

Capture whichever apply. Skip when the use case has no meaningful
constraints or failure modes — these sections are optional in the
issue authoring contract.

## Resolve authoring before publishing

Resolve the `usecase` authoring docs through the
`<authoring-resolver>`. Pass `--type usecase` and `--side issue` since
this skill writes the issue-side surface only:

```bash
spectrack mustread --type usecase --side issue
```

Read the files the resolver returns. They define:

- The workflow `usecase` issue body shape (`Description`, `Actors`,
  `Current Draft`, `Open Questions`, optional `Related Work`,
  `Supersedes`).
- The provider's markup convention (heading form, link form).
- Any provider-specific anti-patterns to avoid.

## Publish the use case

Use `spectrack issue new --type usecase`. Provide:

- `--title` — a short imperative phrase matching the actor's goal
  ("Share meeting summary").
- `--body-file` — a temp body file you drafted under
  `$(spectrack project-dir .spectrack-cache/usecase-drafts/<slug>.md)`. Body sections follow the
  resolver-returned issue-side `usecase` authoring shape. Place the
  user's outstanding questions in the `Open Questions` section so
  they travel with the issue.
- `--assignee me` — by default the user owns the issue they
  discovered. The caller may override with a different assignee.
- Relate siblings — when this use case is part of a discovery session
  that produced earlier sibling use cases, link them pairwise as
  related, not `parent`. Use the backend's related link where it
  exposes one (`--related <ref>`; run `spectrack issue link --help`
  for the relationship kinds the configured backend accepts),
  otherwise list the sibling refs in the issue's Related body section.

After publish, capture the returned ref from the script's JSON output
and:

- Add a task `"Discovery: <ref> <title>"` and mark it completed.
- Mention the published ref back to the user so they can open it.

## Anti-patterns

- Publishing a use case before the actor, goal, situation, flow, and
  expected outcome are all concrete. Half-formed use cases pollute the
  backlog.
- Packing multiple actor goals into one use case. Split first
  (`./usecase-splitting.md`), then publish each child.
- Inlining implementation choices into the body. Push those into
  `Open Questions`.
- Skipping the resolver call. The body shape and provider markup
  change between providers — never assume.
