---
description: Search the conduitAI catalog for MCP servers, agents, skills, prompts, or plugins. Use when the user asks to find, discover, or browse AI tools, agents, or prompts.
---

# Search conduitAI

Search the conduitAI catalog for: "$ARGUMENTS"

1. If the user is not authenticated, call the `auth_status` tool first. If not signed in, call `authenticate` and wait for sign-in to complete before searching.
2. Call the `search_catalog` tool with:
   - `query`: "$ARGUMENTS"
   - `limit`: 10
   - `sort`: `quality` (unless the user specified a different sort)
3. Present results as a compact table with: name, type, short description, quality score, and slug.
4. Offer to fetch full details for any result via `get_asset_details`, or to install one via `install_asset`.

Do not install anything without explicit confirmation from the user.
