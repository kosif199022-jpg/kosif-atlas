# Changelog

## 0.1.0 — unreleased

- First version of vibe mode: folder mode and session mode.
- The loop has these steps: ask, test first, build, gates G1 to G6, cold review, docs, commit, and accept.
- Gate G6 (`scripts/docs_gate.py`) checks that docs change with code. It also checks the STE-100 sentence limits.
- Doc templates for apps: README, PRD, FUNCSPEC, and USERGUIDE.
- Changes from the first test build:
  - Step 1 runs before the bootstrap.
  - The app name replaces the folder name in the docs.
  - The gate G6 finds template placeholders.
  - New gotchas for console errors from 4xx responses, dialogs, and the test database.
- The ask step has three tiers: S, M, and L.
- Tiers S and M ask a maximum of five questions. Each question has a default.
  The ask step always confirms one-way doors.
- Tier L runs a Define phase and writes a plan of components. vibe then builds
  all components without a reply from the user.
- Before each component, vibe compares the plan with the current app.
- "continue" starts the next component in a new session.
- Define starts with an open question about the current workflow and the
  existing data. The first test run showed that questions with defaults miss
  these preferences.
- Changes from the first full-app test build:
  - E2E tests use their own ports and reset their database before each test.
  - The plan has no "building" status. "continue" starts at pre-flight.
  - In tier L, PRD marks the requirements of components not built yet as planned.
  - The accept message has a Limits item and shows one screenshot for each screen.
- Tiers count screens, not data entities. A new app with one screen is tier M.
- A default that is cheap to undo becomes an assumption, not a question.
- A missing API key no longer stops the whole slice. vibe builds and tests the
  rest, and reports the live call as stuck.
- vibe names no other skill. WBS and spec requests, and apps with more than
  about 12 components, go to a formal spec or WBS workflow.
- The plan is `PLAN.md` in the app root. `.aai/` holds only what vibe needs
  to run. `.aai/context.md` routes to the app docs and does not copy them.
- An older app gets the new layout at its next checkpoint: the plan moves
  to `PLAN.md`, and `.aai/context.md` is rewritten to route to the docs.
- The release step runs `publish` one time. `--release` is only for production, and it includes the publish.
