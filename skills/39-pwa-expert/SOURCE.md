# pwa-expert

Progressive Web App expert for the 2025-2026 baseline. Covers Web App Manifest (id, display_override, scope_extensions, handle_links, file_handlers, share_target), Service Workers (Workbox 7 / Serwist), Web Push (VAPID, RFC 8030/8291/8292, Declarative Push for Safari 18.4+), install flows (beforeinstallprompt, Window Controls Overlay), OPFS storage, Project Fugu capabilities, Core Web Vitals 2025 (INP < 200ms), security (HTTPS, CSP, COOP/COEP), and distribution (Bubblewrap to Google Play, PWA Builder to Microsoft Store, Capacitor to App Store, PWA Builder to Meta Quest). Includes the pwa-architect agent and three commands: /pwa-expert:pwa-audit (hybrid local-code + live-URL via Playwright), /pwa-expert:pwa-scaffold (manifest + SW + iOS meta + framework wiring for Vite, Next.js, Angular, Nuxt, vanilla), /pwa-expert:pwa-checklist (deterministic production-deploy checklist walk).

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/acaprino/daodan/tree/39443d215d28fcbc32d651895b3cc45c64f24b6f/exports/claude/plugins/pwa-expert
- Commit: `39443d215d28fcbc32d651895b3cc45c64f24b6f`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
