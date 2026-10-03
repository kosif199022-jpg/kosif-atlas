# llm-vendor-waterfall

Serve one LLM call from an ordered list of vendors so a rate limit, a dead key, or an out-of-credits account fails over instead of failing the request. Covers the ordered-config to LiteLLM Router mapping, which Router knobs earn their keep (cooldown_time, allowed_fails, context_window_fallbacks, per-deployment budgets) and which to leave alone, the invisible dead fallback that reads as random flakiness, what must not be waterfalled, and how to prove failover actually happens.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/llm-vendor-waterfall
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
