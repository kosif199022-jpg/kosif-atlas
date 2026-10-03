---
name: usecase
description: "Shape a rough product idea into concrete workflow `usecase` issues through a Socratic, one-question-at-a-time interview. Use when the user wants to discover, refine, resume, or iterate product use cases before implementation. Publishes each confirmed use case as its own workflow `usecase` issue and wraps up with missed-case and quality review."
---

# Use Case Discovery (Workflow)

A Socratic interviewer that helps the user discover what to build
through one-question-at-a-time dialogue. Confirmed use cases are
published as standalone workflow `usecase` issues; knowledge-page
edits are out of scope for this session.

Use the idea or iteration request supplied in the user's current request. If it
is missing, ask for it before starting discovery.

## Scope

In scope: producing **workflow `usecase` issues** (the discovery
surface defined by the `usecase` issue authoring contract).

Out of scope in this skill:

- Curated knowledge-side `usecase` pages — defer to a separate session
  when the flow is stable per the publishing rule in the `usecase`
  knowledge authoring contract.
- Editing knowledge pages (`domain`, `nfr`, `context`,
  `architecture`, `spec`) — out of scope. The skill produces use
  case issues only; cross-surface alignment is left to the user.
  Actors are intrinsic to use case discovery and captured inline in
  each use case's `Actors` section; the actors registry page itself
  is not edited from this skill.
- Implementation work — handed off to `task` / `bug` / `spike` issues
  authored separately once a use case is stable.

## Modes

Determine the mode from the user's request and the configured issue
backend's current `usecase` issues:

- **New discovery** — the user provides an idea (free prose) and the
  backend has no in-progress `usecase` issues that match the idea.
  Run the interview from scratch.
- **Iteration** — the user says `iterate`, names an
  existing `usecase` issue ref, or the user explicitly asks to resume.
  Run `references/iteration-entry.md`.

Never overwrite a confirmed use case's body without an explicit
confirmation; iteration always preserves prior confirmed content.

## Session task list

Use the task list as a live workflow map.

**Naming convention:** phase-level tasks use the phase name. Sub-tasks
use `<phase prefix>: <detail>` and are created **dynamically** when
entering a phase.

**New discovery** — initial tasks:

- `"Step 1: Restate idea and confirm framing"` → `in_progress`
- `"Discovery: Use cases"` → `pending`
- `"Wrap Up: Explorer pass"` → `pending`
- `"Wrap Up: Reviewer pass"` → `pending`
- `"Wrap Up: Walk findings"` → `pending`
- `"Wrap Up: Session report"` → `pending`

**Iteration** — see `references/iteration-entry.md` for the task
backlog to seed.

**Conditional tasks** — add when the corresponding step fires:

- `"Discovery: <ref> <title>"` — one per confirmed and published use case.
- `"Research: <topic>"` — when similar-systems research starts.
- `"UI screen grouping"` — when the user agrees to group UI-related use cases.
- `"Mock: <screen slug>"` — when mock generation is requested.

## Workflow

### Step 1: Receive the idea (new discovery only)

Restate the idea back in one sentence to confirm understanding. Then:

1. Note the framing in the session task list — do **not** publish an
   anchor issue. The first publication is the first confirmed use case,
   not a wrapper.
2. Mark "Step 1" completed. Mark "Discovery: Use cases" in_progress.

### Steps 2–11: Interview phases

| Step | Phase | Procedure |
|------|-------|-----------|
| 2 | Discovery loop (four-gap interview + actor capture) | `references/discovery-loop.md` |
| 3 | Progressive use case extraction + publish | `references/progressive-extraction.md` |
| 4 | Use case splitting | `references/usecase-splitting.md` |
| 5 | Facilitation mode shifts (Contrarian / Simplifier / Reframer) | `references/facilitation-techniques.md` |
| 6 | Similar-systems research (on request, after 3+ use cases) | `references/research-procedure.md` |
| 7 | UI screen grouping + (optional) mock generation | `references/ui-screen-grouping.md` |

### Wrap Up

When the user indicates they're done, run `references/wrap-up.md`:
explorer → present candidates → reviewer → walk findings → session
report. Do **not** conclude on your own — the interview ends only when
the user says so.

## Wrap-Up Support

At wrap-up and on user request, use the available SpecTrack support roles:

- **Reviewer** — reviews confirmed `usecase` issues and publishes one
  workflow `review` issue for each quality finding.
- **Explorer** — looks for missed candidate use cases and returns an
  advisory exploration report.
- **Mock generator** — optionally creates throwaway HTML mockups for
  requested UI screen groups.

**Execution order in Wrap Up:** explorer first (find candidates the
existing set missed), then reviewer (validate the full set).

## Output

Pass-through is not the contract here — this skill drives an
interactive interview. The session's durable outputs are:

- Each confirmed use case → one workflow `usecase` issue (the
  `Description`, `Actors`, `Current Draft`, `Open Questions` sections
  defined by the `usecase` issue authoring contract).
- Each quality finding from the wrap-up reviewer → one workflow
  `review` issue, linked `--blocking` to the use case it targets (the
  finding blocks that use case).
- Optional: one `research` issue per similar-systems investigation,
  linked as related to the use cases it informs — via the backend's
  related link where it exposes one, otherwise listed in the issue's
  Related body section (run `spectrack issue new --help`).
- Optional: mock HTML files for requested UI screen groups.

The skill itself emits a wrap-up summary that lists the refs created,
the open `review` items waiting for resolution, and which use cases
remain at `Open Questions`. The summary is dialogue, not a file.
