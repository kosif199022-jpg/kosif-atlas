---
name: to-prd
description: Turn the current conversation context into a PRD and publish it to GitHub Issues, also persisting it to docs/prds/NNNN-<slug>.md for downstream skills (blueprint). Use when user wants to create a PRD from the current context. Triggers on /to-prd, "write a PRD", "draft a PRD", "spec this out", "feature spec", or after /grill-me when scope and Glossary are settled.
---

This skill takes the current conversation context and codebase understanding and produces a PRD. Do NOT interview the user — just synthesize what you already know. If context is too thin to synthesize, halt and tell the user to run `/grill-me` first; don't fabricate scope.

## Process

1. **Read the codebase.** Explore the repo to understand current state if you haven't already. Use the project's domain glossary throughout the PRD.

2. **Scan `docs/adr/`** for accepted ADRs touching the area. List relevant ones in a `Sources` line and respect their locked decisions. If the PRD's scope would violate an ADR, surface the conflict to the user before writing.

3. **Pick the Glossary source** (in priority order):
   1. Glossary block emitted by a prior `/grill-me` session in the conversation.
   2. `docs/intent/NNNN-<slug>.md` — the same block, written to disk by grill-me. Check here whenever the conversation doesn't carry one: the interview may have happened in an earlier session, or its output may have been compacted away. Match by slug, or take the most recently modified file when the feature is obvious. Cite it in `Sources`.
   3. Domain terms already used in the codebase — search for prominent nouns/verbs in module names, types, and route names.
   4. Terms surfaced in the conversation context.

   Sources 1–2 are the same artifact and carry the edge-case decisions too — fold those into the PRD rather than re-deriving them, so `blueprint` inherits a ledger instead of starting one.

4. **Sketch the major modules** to build or modify. Actively look for opportunities to extract deep modules — ones that encapsulate substantial functionality behind a simple, testable, slow-to-change interface (Ousterhout). Do not interview; synthesize from context. If module shape is unclear, halt and route back to `/grill-me`.

5. **Write the PRD** following [PRD-TEMPLATE.md](PRD-TEMPLATE.md), to two destinations:
   - **Disk**: get the target path from `bash scripts/next-prd-index.sh <slug>` (prints the zero-padded next-index path, creates `docs/prds/` if missing), then write the filled template there. This is what `blueprint` consumes.
   - **Tracker**: `bash scripts/publish-prd.sh <prd-file> "<title>"` — opens a GitHub issue with the `needs-triage` label, auto-falling back (drop the label, or skip the tracker entirely) and warning to stderr when the label is missing, `gh` is unconfigured/unauthed, or the repo isn't on GitHub.

## Rules

- **No interviewing.** Pure synthesis. Halt to `/grill-me` if context is too thin.
- **Glossary is load-bearing.** Blueprint and the implementing code must use the same terms verbatim.
- **Respect ADRs.** Locked architectural decisions are inputs, not topics to relitigate.
- **Update existing PRD** if user says "update the PRD" — find by slug. Edit-safe sections: `Status`, `Further Notes`, adding new `User Stories` or `Implementation Decisions` entries, expanding `Out of Scope`. Locked sections (require explicit user OK): `Problem Statement`, `Solution`, `Glossary`, `Sources`. Never silently drop user stories — mark as `(removed: <reason>)` instead.

## When to skip to-prd

- Bug fix (just fix it; commit message is enough).
- Single-file change.
- Spike/throwaway.
- PRD already exists and feature scope hasn't changed.
- Pure refactor with no user-visible change (use an ADR via `/compass` instead).

## Pipeline placement

`grill-me → to-prd → compass → blueprint → code`

- **grill-me** extracts scope, design-tree decisions, edge cases, and Glossary via interview, and writes them to `docs/intent/NNNN-<slug>.md`.
- **to-prd** (this skill) synthesizes the above into a PRD on disk + tracker.
- **compass** locks architectural decisions in ADRs (auto-written to `docs/adr/`).
- **blueprint** consumes PRD + ADRs, produces implementation plan at `docs/plans/NNNN-<slug>.md`.
- **code** — user or agent implements one phase at a time.

Skip earlier stages when the artifact already exists. If grill-me hasn't run and the conversation lacks scope clarity, halt and route there instead of synthesizing fiction.

## Humanize the written prose (if available)

Before writing generated prose to a file, if the `humanizer` skill is installed, run it on the drafted text so the created document reads naturally and free of AI tells; skip silently if it is not available. Apply it to the human-facing document body only, never to code, frontmatter, file paths, IDs, or literal templates.
