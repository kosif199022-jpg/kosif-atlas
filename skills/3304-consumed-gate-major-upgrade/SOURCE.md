# consumed-gate-major-upgrade

Decide whether a new major of a security gate you consume is safe to adopt, when your product depends on a distinction the gate's own host does not -- a vendor's honest 'zero drift' can be true for their host and catastrophic for yours. Use when a dependency you gate on ships a major or a rule-set cut, when release notes quantify an improvement you cannot map onto your own semantics, or when writing the startup check that decides whether a dependency is usable. Covers replaying against your own boundary in both directions, the delegated-versus-unreadable collapse, verifying the tree a drift number was measured on, drawing the startup probe from the affected population rather than the survivors, and asking the vendor to report what the verdict depended on.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/consumed-gate-major-upgrade
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
