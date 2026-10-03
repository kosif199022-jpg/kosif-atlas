# backend-engineering

Backend-engineering team — agents (backend-architect, service-implementation-engineer, backend-data-access-engineer, backend-reliability-engineer) for the application/service layer behind an API: domain modeling and service boundaries (monolith vs services, where to split), business-logic implementation and error handling, the data-access layer (repository pattern, ORM use, transaction boundaries, killing N+1), caching strategy (cache-aside, invalidation, stampede), background jobs and async messaging (idempotent workers, outbox, DLQs), and backend reliability (timeouts, retries with backoff + jitter, circuit breakers, graceful degradation). Language-agnostic (examples in Node/Python/Go). skills, a decision-tree knowledge bank (service-boundary + cache trees + a dated map), best-practices, templates, commands, an advisory hook. Seams: the contract -> api-engineering, the schema/index -> database-engineering, deploy -> devops-cicd. Requires ravenclaude-core@>=0.7.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/backend-engineering
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
