# skill-quality

Skill-authoring QA tooling: a static contract checker that runs twenty-six deterministic checks over a Claude Code skill (frontmatter, explicit invocation mode, description/verb-contract polarity, per-skill listing-entry cap, trigger-keyword preservation, line caps, broken internal refs, markdownlint, gotchas surface, evals presence, precompute opportunity, completion-criteria signal, injection shell-declaration, fresh-eyes declaration conformance), a shared skill-listing budget reporter across a set of skills, and a bundled evals.json schema plus a deterministic eval-quality lint (duplicate case identities, missing fixtures, empty or vague grading criteria, set-coverage warnings), and a measure-invocation probe harness that scores description auto-invocation probes on train and validation splits. Runs against any repo's skills directory via the convention-resolution ladder, with no baked layout.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/melodic-software/claude-code-plugins/tree/c8fa858c9059d3183cfc08f646e4a97f44b33973/plugins/skill-quality
- Commit: `c8fa858c9059d3183cfc08f646e4a97f44b33973`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 9). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
