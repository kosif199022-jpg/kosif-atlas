# forms-engineering

Forms engineering — the seam between how a form is built, how the request stream behind it is run, and where its trust boundary sits. Owns what no other plugin does: intake taxonomy and triage routing that make a request stream deterministic; the form measurement contract (which events, which denominator, what counts as a defect) and its hand-off to statistical process control; the server half of a submission that web-design routes out by rule (client/server validation parity, honeypot design and its assistive-tech exemption, double-submit and submission idempotency, webhook signature verification, PII minimisation); and form-platform selection on durable axes rather than a feature matrix. Client-side form construction and form accessibility stay with web-design. Upload hardening and challenge-widget mechanics stay with ravenclaude-core, which this plugin cites rather than restates, and every binding security verdict routes to ravenclaude-core/security-reviewer. Requires ravenclaude-core@>=0.7.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/forms-engineering
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 2). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
