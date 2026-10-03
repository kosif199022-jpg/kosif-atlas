---
name: figma-implementing
description: This skill should be used when the user provides a Figma URL and asks to "implement this figma component", "build from figma", "code this figma design", "implement figma design", "create component from figma", "turn figma into code", "implement this design", or pastes a figma.com URL and wants it turned into code. Checks MCP availability, fetches component data from the Figma Dev Mode MCP server, detects the repo's tech stack and conventions, and implements the component.
version: 0.1.0
argument-hint: "<figma-url>"
---

# Figma Implementing

Fetch a Figma component or frame via the Figma Dev Mode MCP server and implement it as code, following the current repo's tech stack and conventions.

## Step 1 — Get and Validate the Figma URL

If no URL was provided as an argument, ask the user for one before proceeding.

Extract the **file key** and **node ID** from the URL. Consult `references/figma-url-formats.md` for all URL patterns and extraction edge cases.

Quick reference:
- Pattern: `https://www.figma.com/design/<FILE_KEY>/...?node-id=<NODE_ID>`
- File key: path segment after `/design/` or `/file/`
- Node ID: `node-id` query param — `123-456` and `123%3A456` both mean `123:456`

If the URL has no `node-id`, ask the user to select the target frame in Figma and copy its link (right-click → Copy/Paste as → Copy link) — the link will include the node ID.

## Step 2 — Check MCP Availability

Verify the Figma Dev Mode MCP server is running. Both skills live in the same `figma` plugin, so `CLAUDE_PLUGIN_ROOT` resolves to the plugin root when loaded through the plugin system.

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/figma-mcp-setup/scripts/check-figma-server.sh"
```

If `CLAUDE_PLUGIN_ROOT` is unset (e.g. running outside the plugin system), replace it with the absolute path to the `figma` plugin directory. The script is at `skills/figma-mcp-setup/scripts/check-figma-server.sh` relative to that root.

If the check fails, stop and tell the user to follow the `figma-mcp-setup` skill to enable the server first.

If the check passes, confirm that the Figma MCP tools are registered by running `/mcp` and locating the `figma` server. If no tools appear under it, ask the user to open a Figma file in the desktop app and try again — the server only exposes tools when a file is open.

## Step 3 — Fetch Design Data

Use the available Figma MCP tools to retrieve, for the target node:

1. **Node structure** — type, auto-layout direction, children tree
2. **Visual properties** — fills, strokes, corner radius, opacity, shadows
3. **Typography** — font family, size, weight, line height, letter spacing (for TEXT nodes)
4. **Spacing and sizing** — width, height, padding, gap (from auto-layout)
5. **Code snippets** — if the file has Dev Mode snippets configured, prefer these as the implementation source
6. **Variables / design tokens** — variable bindings on fills, text, and spacing

Consult `references/figma-mcp-tools.md` for how to interpret each property type, color conversion, and Tailwind mapping hints.

## Step 4 — Detect the Tech Stack

Run from the project root:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/figma-implementing/scripts/detect-tech-stack.sh"
```

Read `CLAUDE.md` from the project root if it exists — it may override any inferred convention.

Read 2–3 existing component files listed by the script to capture:
- Export style (`export default` vs named export vs barrel)
- Props definition style (interface, type, inline)
- File and directory naming convention

Consult `references/tech-stack-detection.md` for framework-specific guidance (Next.js App Router, Vue Composition API, etc.) and token file mapping.

## Step 5 — Implement the Component

**Placement:** Mirror existing component file placement. Match casing and directory depth exactly.

**Naming:** Derive the component name from the Figma layer name — remove special characters and apply the project's casing convention.

**Props:** Map Figma variants and component properties to props. Use the project's type system.

**Styling:**

| Detected styling | Approach |
|-----------------|----------|
| Tailwind CSS | Translate fills/spacing/typography to utility classes; use `[arbitrary]` for off-scale values |
| styled-components / Emotion | Generate styled primitives; bind to theme tokens where available |
| CSS Modules | Generate a `.module.css` alongside the component |
| Plain CSS / SCSS | Generate a companion stylesheet; match project's class naming |

**Design tokens:** When `detect-tech-stack.sh` surfaces a token file, map Figma color and spacing values to project tokens. Use literal values for unmatched ones and note them in the output.

**Icons:** Use the detected icon library if one exists. For unrecognized icons, extract the SVG path from the MCP data and inline it.

**Next.js App Router:** Add `"use client"` at the top if the component uses state, effects, or event handlers. Prefer `next/image` over `<img>`.

## Step 6 — Report

After creating the file(s), output:

- Path(s) created
- Props interface or parameter list
- Any hardcoded design values that had no matching token (so the designer can review)
- Any assumptions made (e.g., "used nearest Tailwind color `blue-500` for `#1D78F3`")

## References

- **`references/figma-url-formats.md`** — URL patterns, file key and node ID extraction, edge cases
- **`references/figma-mcp-tools.md`** — MCP tool categories, property interpretation, color and spacing conversion
- **`references/tech-stack-detection.md`** — Framework, styling, and convention detection heuristics; token file mapping
- **`scripts/detect-tech-stack.sh`** — Run from project root; outputs framework, language, styling, icon library, token files, and sample component paths
