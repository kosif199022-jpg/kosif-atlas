# auth-identity

End-user authentication & identity team — agents (auth-architect, auth-implementation-engineer) for adding login to a web app (React/Next), an API, and a dashboard. Methods: Google/Apple/Microsoft/GitHub social SSO, magic link, passkeys/WebAuthn, email+password — via managed auth (leaning Supabase Auth). skills, templates, a best-practices index, a scenarios bank (unverified field notes), an advisory anti-pattern hook, a stdlib JWT/scope/cookie analyzer (scripts/auth_analyze.py), and a web-verified knowledge bank with Mermaid decision trees (build-vs-buy, which-providers, OAuth-flow, token-storage, gate-the-dashboard, logout, refresh-reuse, MFA-factor, step-up auth). House rules: Authorization Code + PKCE never Implicit; never store tokens in localStorage; validate ID tokens server-side. Boundary: AUTHENTICATES the person; data-platform AUTHORIZES the data (RLS/embed-JWT); Entra seams to azure-cloud, auth code to security-reviewer. Requires ravenclaude-core@>=0.7.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/auth-identity
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 2). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
