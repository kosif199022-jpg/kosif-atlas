---
name: figma-setup
description: This skill should be used when the user asks to "set up figma mcp", "enable figma mcp", "figma desktop mcp", "design-to-code from figma", "use figma tools in claude", "connect figma to claude code", "figma dev mode mcp", "figma tools not showing", or wants to activate or troubleshoot Figma design tools inside Claude Code. This skill walks through enabling the Figma Dev Mode MCP server in the Figma desktop app, verifying connectivity, and activating the plugin.
version: 0.1.0
---

# Figma MCP Setup

The Figma desktop app ships a local MCP server (Dev Mode MCP Server) that exposes ~9 design tools on `http://127.0.0.1:3845/mcp`, enabling design-to-code workflows: inspect component structure, read properties, extract tokens, and more.

## Prerequisites

- **Figma desktop app** (not the browser version) — minimum version that ships the MCP server
- **Dev Mode access** — requires a paid Figma seat with Dev Mode enabled in the organisation; free plans do not have Dev Mode
- **macOS or Windows** — the local MCP server runs only from the desktop app

## Step 1 — Enable the MCP Server in Figma Desktop

1. Open Figma desktop and sign in.
2. Open **Preferences** (`Cmd+,` on macOS / `Ctrl+,` on Windows).
3. Navigate to the **Dev Mode** section (visible only if Dev Mode is enabled for the seat).
4. Toggle **"Enable Dev Mode MCP Server"** on.
5. Close Preferences. Figma starts the local server immediately — no restart required.

Reference: https://developers.figma.com/docs/figma-server/

## Step 2 — Verify the Server Is Reachable

Run the bundled check script. The `${CLAUDE_PLUGIN_ROOT}` variable is set automatically when executing inside a Claude Code plugin context; if running outside that context, replace it with the absolute path to the plugin directory.

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/figma-setup/scripts/check-figma-server.sh"
```

Expected output on success:

```
OK: Figma MCP server is reachable at http://127.0.0.1:3845/mcp
```

**If the check fails**, work through the checklist the script prints:

- Figma desktop is open and the user is signed in
- Dev Mode is enabled for the organisation (figma.com Settings → Plan → Dev Mode)
- The "Enable Dev Mode MCP Server" toggle is on (Preferences → Dev Mode)
- No local firewall or security tool blocks loopback connections on port 3845

## Step 3 — Enable the Plugin and Load the Tools

In Claude Code, run these two slash commands (not shell commands):

```
/plugin enable figma
/reload-plugins
```

`/reload-plugins` re-registers MCP servers mid-session — no full Claude Code restart required. After reload, the Figma tools appear under the `mcp__plugin_figma_figma__*` prefix.

Confirm tools are registered by running `/mcp` and checking for a `figma` server entry with tools listed.

## Deactivating the Plugin

To remove the Figma tools from the session when switching to non-design work:

```
/plugin disable figma
/reload-plugins
```

The tool schemas are unloaded immediately, recovering the token budget they occupied.

## Troubleshooting

**"Server connected but no tools listed"**
Figma requires an open file to expose design tools. Open a Figma file in the desktop app, then run `/reload-plugins` again.

**"Port 3845 in use by another process"**
Another application has claimed the port. Identify it with `lsof -i :3845` and stop it, then re-enable the toggle in Figma Preferences.

**"Dev Mode section not visible in Preferences"**
Dev Mode is not enabled for the account. Contact the Figma org admin to enable it, or check the plan at figma.com/settings.

**"Tools disappear after Figma closes"**
The MCP server only runs while Figma desktop is open. Re-open Figma, then run `/reload-plugins`.

## Scripts and References

- **`scripts/check-figma-server.sh`** — Probes `127.0.0.1:3845` and prints an actionable checklist on failure.
- **`references/mcp-tool-names.md`** — MCP tool naming convention and `allowed-tools` examples for commands and agents.
