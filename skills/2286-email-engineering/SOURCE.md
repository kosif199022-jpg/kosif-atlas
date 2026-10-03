# email-engineering

Email-engineering team — agents (email-deliverability-architect, email-sending-engineer) for getting legitimate mail to the inbox: domain authentication (SPF, DKIM, DMARC alignment + a staged p=none -> quarantine -> reject rollout, BIMI), transport security (MTA-STS RFC 8461 + TLS-RPT RFC 8460), deliverability (subdomain stream separation, domain/IP warm-up, reputation, Gmail/Yahoo bulk-sender rules), inbox categorization (Gmail tabs, Outlook Focused Inbox, Apple Mail), ESP integration (SES/SendGrid/Postmark/Resend) with idempotent sends + verified webhook handling, MJML templates, and the feedback loop (bounce/complaint classification, ARF, suppression lists, one-click unsubscribe per RFC 8058). skills, a knowledge bank, best-practices, templates, commands, a scenarios bank, a stdlib auth-record linter, and an advisory hook. Seams: strategy -> marketing-operations, infra -> backend-engineering, DNS -> cloud plugins, security -> security-engineering. Requires ravenclaude-core@>=0.7.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/email-engineering
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 2). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
