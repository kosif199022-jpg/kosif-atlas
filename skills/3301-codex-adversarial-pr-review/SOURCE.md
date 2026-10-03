# codex-adversarial-pr-review

Run an adversarial Codex review against a GitHub PR and post its findings as a single batched PR review (inline comments + summary body), instead of letting them die in stdout. Use when: (1) you want `/codex:adversarial-review` output to land ON a pull request where the author can act on it, (2) you are the reviewer role in an agent-team loop (skillz#87) and need the review to close the loop with the developer agent, (3) you want a deterministic, scriptable reviewer rather than an LLM hand-posting comments, (4) you need to sweep a whole PR backlog and post one review per PR. Encodes the codex-companion `--json` call, the finding->diff-line mapping, the GitHub gotchas: inline comments are rejected (422) on lines not in the PR diff (out-of-diff findings are rolled up into the body), self-review forbids APPROVE/REQUEST_CHANGES (default COMMENT), low-confidence findings are demoted to a collapsed section, and a `--dry-run` payload is byte-for-byte the POST body so it can be saved, edited, and posted later without a second Codex pass — plus the recurring false-positive shapes (type-strictness on coerced config, "missing attribution" demanding a refactor, stale-branch mass-deletion artifacts) and degenerate-output shapes (plan-only "zero findings", quiet background-launch failure) to judge before posting.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/codex-adversarial-pr-review
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 4). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
