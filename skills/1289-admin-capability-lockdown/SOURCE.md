# admin-capability-lockdown

Organization control mod: withholds the http and process nouns from $ so no plugin beneath it can reach the network or spawn processes, refuses user-tier plugins by name allowlist or by the $ calls their source declares, and withholds the Bash tool (shellPolicy "deny", default) or, in "guardrail" mode, denies well-known network clients as a bypassable speed bump. Hooks engine.create, plugin.register and tool.call; seat it in the managed prepend tier.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/davila7/claude-code-templates/tree/8b1f88342619330b6306ee318f57f2cd5b78789d/cli-tool/components/mods/enterprise/admin-capability-lockdown
- Commit: `8b1f88342619330b6306ee318f57f2cd5b78789d`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
