# mutation-testing

Measures whether a test suite can actually detect faults, not merely execute code: `/mutation-testing:principles` answers operator, mutant-state, and metric questions from the primary literature; `/mutation-testing:setup` verifies the ecosystem's mutation tool and writes the tracked config; `/mutation-testing:audit` runs mutation analysis on the diff, or with `--exercised` on the production code the changed tests call, and reports surviving mutants with the cause each lived, verifying that tracked source was restored and failing the run when it cannot, delegating the productive-versus-arid judgment to a fresh-context reviewer and test authoring to the test lane, and optionally persisting survivors as a findings file the review fix pass consumes.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/melodic-software/claude-code-plugins/tree/c8fa858c9059d3183cfc08f646e4a97f44b33973/plugins/mutation-testing
- Commit: `c8fa858c9059d3183cfc08f646e4a97f44b33973`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 12). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
