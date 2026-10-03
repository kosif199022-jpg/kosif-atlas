---
description: Install an MCP server, agent, skill, prompt, or plugin from the conduitAI catalog into the current project. Use when the user asks to install, add, or set up a specific asset by name or slug.
---

# Install from conduitAI

Install the following conduitAI asset: "$ARGUMENTS"

1. If the user is not authenticated, call `auth_status`. If not signed in, call `authenticate` and wait for sign-in.
2. Resolve "$ARGUMENTS" to a single asset:
   - If it looks like a slug (kebab-case, no spaces), call `get_asset_details` directly.
   - Otherwise, call `search_catalog` with `limit: 5` and ask the user to pick if more than one result is plausible.
3. Show the user the resolved asset (name, type, version, author, description) and confirm before proceeding.
4. Call `install_asset` with the confirmed slug and asset type.
5. Summarize what was installed and any follow-up steps returned by the tool (environment variables to set, config files written, etc.).

Never install an asset without the user's explicit confirmation.
