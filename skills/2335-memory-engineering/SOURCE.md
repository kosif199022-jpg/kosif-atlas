# memory-engineering

Memory engineering team — agents (memory-architect-lead, memory-retention-and-erasure-engineer, memory-eval-cost-analyst) for the decisions behind a durable memory store: what earns a write, which paradigm, which surface holds the bytes, what makes it forget, what a delete leaves behind, cost per correct answer. skills, commands, dated knowledge files, best-practices, templates, scenarios, an advisory hook, a stdlib calculator. Advisory only — it never reads or mutates a real store. Seams: ai-agent-engineering decides whether an agent should remember at all and where state sits in its topology, this engineers the memory system itself; ai-red-teaming owns the ASI06 attack taxonomy and offensive testing, this owns the defensive design half; data-governance-privacy owns DSAR and legal basis, this owns erasure residue in embeddings and version history; retrieval → ai-rag-engineering; evals → llm-evaluation-engineering; the Claude app → claude-app-engineering. Requires ravenclaude-core@>=0.238.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/memory-engineering
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 2). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
