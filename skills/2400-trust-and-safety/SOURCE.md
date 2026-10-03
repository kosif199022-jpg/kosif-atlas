# trust-and-safety

Trust & Safety team — agents for content-moderation and abuse-detection work. The trust-safety-policy-lead designs the policy taxonomy + enforcement ladder, the human-review operations layer (queue prioritization, reviewer wellness, escalation, appeals/due-process), and the measurement frame (prevalence, enforcement precision/recall, time-to-action SLA, appeal-overturn rate). The abuse-detection-engineer builds the detection stack: signals, rules-vs-ML classifiers, reviewer queues, thresholds tied to precision/recall. skills, a knowledge bank (a Mermaid enforcement decision tree + a T&S metrics catalogue with formulas), templates, best-practice rules, and an advisory hook. Seams: classifier-eval validity → applied-statistics; PII → data-governance-privacy; account-takeover → security-engineering; LLM-classifier build → claude-app-engineering. Enforcement is proportional; appeals are due process; measure prevalence, not just volume. Requires ravenclaude-core@>=0.7.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/trust-and-safety
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
