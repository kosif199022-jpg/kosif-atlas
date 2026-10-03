# chrome-not-secure-tls-interception

Diagnose Chrome's "Your connection to this site is not secure" on a major site (gmail.com, google.com, github.com) on a machine behind a corporate TLS-inspecting proxy (Zscaler, Netskope, Palo Alto, Blue Coat). Use when: (1) Chrome's site-info bubble shows the red triangle and "You should not enter any sensitive information on this site", (2) a CLI `openssl`/`curl` check of the same host looks perfectly clean and you cannot reproduce the browser's complaint, (3) you are about to tell someone their proxy is MITM-ing them. Covers the PAC-proxy blind spot in CLI checks, how to read the intercepted chain, and — critically — why a forged proxy certificate with zero SCTs is the NORMAL steady state and usually NOT the cause.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/chrome-not-secure-tls-interception
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
