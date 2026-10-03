# testing

Test-stage discipline across all ecosystems: coverage-gap analysis and test planning (`/testing:plan`), TDD test authoring and placement (`/testing:write`), live E2E plus non-UI smoke verification (`/testing:run-e2e`), failing-test root-cause diagnosis with the reproduce → isolate → fix → retest loop (`/testing:diagnose`), which offers a fix-until-green workflow when several tests fail across files, a deterministic can't-fail test audit with a fail-closed gate mode and opt-in findings persistence (`/testing:audit`), a cleanup that rewrites, quarantines or, on approval, deletes low-value tests in one folder behind a mutation gate (`/testing:cleanup`), its configuration (`/testing:setup`), and opt-in hooks that scan each test file Claude writes and question edits that weaken tests.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/melodic-software/claude-code-plugins/tree/c8fa858c9059d3183cfc08f646e4a97f44b33973/plugins/testing
- Commit: `c8fa858c9059d3183cfc08f646e4a97f44b33973`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 30, MCP servers: 0, scripts: 50). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
