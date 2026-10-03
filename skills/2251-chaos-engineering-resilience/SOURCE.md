# chaos-engineering-resilience

Chaos-engineering & resilience team — agents that make distributed systems survive failure. resilience-architect owns the DESIGN side: failure-mode analysis (FMEA), resilience patterns (timeouts, retries with backoff+jitter, bulkheads, circuit breakers, load shedding, graceful degradation, idempotency), the observability-maturity gate for whether you're ready to run chaos, and redundancy/DR (multi-AZ/region, failover, RTO/RPO). chaos-experiment-engineer owns the EXPERIMENT + VERIFICATION side: hypothesis-driven experiments, blast-radius containment (automatic abort/rollback), game days, fault injection (latency/error/resource/dependency-outage/partition/zone), and verifying the pattern held under load+fault. skills, a knowledge bank (decision trees + a dated 2026 patterns reference), templates. Distinct from observability-sre (metrics/SLO/on-call — a hard prerequisite), devops-cicd (progressive delivery), performance-engineering (load), incident-response-dfir. Requires ravenclaude-core@>=0.7.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/chaos-engineering-resilience
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
