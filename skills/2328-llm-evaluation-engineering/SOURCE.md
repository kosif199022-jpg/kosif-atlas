# llm-evaluation-engineering

LLM-evaluation engineering team — agents (eval-strategy-lead, eval-harness-engineer) for the question every team shipping an AI feature has to answer: is it getting better or worse? Eval design (task-grounded metrics, offline-vs-online split, sample size, a ship-gate decided as a number before the run), and the harness that proves it (frozen golden sets with provenance, LLM-as-judge rubrics with a bias audit and human calibration, CI regression gates, guardrail/red-team suites). skills, a decision-tree knowledge bank (an eval-method Mermaid tree + a dated 2026 tooling/method map), best-practices. Engineering decision-support, not a safety certification; model/judge/tooling specifics are volatile — retrieval-dated + verify-at-use; no eval-data PII. Seams: retrieval quality -> ai-rag-engineering; model selection -> ai-coding-model-guidance; classical-ML training/metrics -> ml-engineering; product A/B -> experimentation-growth-engineering. Requires ravenclaude-core@>=0.7.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/llm-evaluation-engineering
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
