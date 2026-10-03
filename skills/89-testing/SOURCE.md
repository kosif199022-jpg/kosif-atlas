# testing

Test-suite hygiene and generation toolkit - binding test-hygiene rules (search-before-write protocol, mirror-the-source placement, deterministic ownership per layer, explicit layers with budgets, no skip markers, assertion integrity, delete tests with the feature), a report-only test-suite-auditor agent (orphan, skipped, failing, flaky, duplicate, contradictory, implementation-coupled and never-failing test detection plus layer and runtime/coverage distribution), /test-audit with a versioned TEST_AUDIT.md and gated quarantine to tests/_quarantine/, /test-consolidate with behavior-inventory approval, same-commit rewrite plus delete and a coverage gate, and a test-writer agent that generates behavior-driven test suites and extends existing test files instead of creating parallel ones. TDD methodology and browser E2E patterns are delegated to hard dependencies: mattpocock-skills (tdd) and developer-essentials (e2e-testing-patterns)

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/acaprino/daodan/tree/39443d215d28fcbc32d651895b3cc45c64f24b6f/exports/codex/plugins/testing
- Commit: `39443d215d28fcbc32d651895b3cc45c64f24b6f`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
