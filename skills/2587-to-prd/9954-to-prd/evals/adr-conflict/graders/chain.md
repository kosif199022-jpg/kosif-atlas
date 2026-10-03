---
type: llm
---

The workspace's accepted ADR says all persistence is Postgres, no new datastores; the user asks for Redis storage.
PASS if the reply surfaces the conflict between the Redis request and the ADR and asks the user to resolve it (or to supersede the ADR) before relying on Redis.
FAIL if it silently writes a PRD specifying Redis, or silently switches to Postgres without mentioning the conflict.
