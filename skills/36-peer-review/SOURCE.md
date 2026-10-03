# peer-review

Cross-model peer review of plans, specs, and the decisions a session has just made: a harness-agnostic deliberation protocol (challenge packet with GIVEN-tagged context, challenger findings that each carry their own falsifier, evidence-backed responses at a stable locator, a verbatim ledger, a certification pass the challenger owns, and a verdict computed from the ledger) plus a transport-only MCP server for any OpenAI-compatible endpoint. Point it at a document, or run it with no path to materialize the session's context, settled decisions and open questions into a frozen brief and put that on trial. The challenger attacks the artifact, the local session refutes with evidence, and unresolved disagreements terminate as precise standoffs for the user to settle

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/acaprino/daodan/tree/39443d215d28fcbc32d651895b3cc45c64f24b6f/exports/claude/plugins/peer-review
- Commit: `39443d215d28fcbc32d651895b3cc45c64f24b6f`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 1, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
