# oauth-mint-counting-passthrough-proxy

Integration-test an OAuth2 client-credentials caller END TO END while asserting how often it mints tokens, by pointing its config-driven token endpoint at a counting pass-through proxy the spec starts (JDK com.sun.net.httpserver on an ephemeral port) instead of mocking the transport. Use when: (1) a service caches or refreshes a bearer and its unit specs stub the HTTP layer, so a per-request-mint or never-refresh defect is invisible; (2) you must prove in one run that the real gateway rejects a missing bearer, accepts a minted one, refreshes a stale one, AND that N calls mint once; (3) the token endpoint is read from configuration. Caught a real "three lookups, three mints" defect that 22 green unit specs missed.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/oauth-mint-counting-passthrough-proxy
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
