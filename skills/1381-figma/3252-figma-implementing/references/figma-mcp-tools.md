# Figma MCP Tools Reference

## Discovering Available Tools

The exact tool set depends on the Figma desktop version. Always run `/mcp` at the start of a session to confirm which tools are registered under the `figma` server.

Tool names follow the pattern: `mcp__plugin_figma_figma__<tool_name>`

## Expected Tool Categories

The Figma Dev Mode MCP server (as of 2025) exposes tools in these functional groups:

### Node Inspection

Fetch the structure and properties of a node by file key + node ID.

**What to request:**
- Node type (FRAME, COMPONENT, INSTANCE, GROUP, TEXT, VECTOR, etc.)
- Layout properties: width, height, x, y, padding, gap, direction (auto-layout)
- Fill: solid colors, gradients, image fills
- Stroke: color, width, position
- Corner radius
- Opacity, blend mode
- Children (recursive for implementation purposes)

**Key insight:** For auto-layout frames, the direction (`HORIZONTAL`/`VERTICAL`), gap, and padding map directly to flexbox. Request these explicitly.

### Code Snippets

If the file has Dev Mode code snippets configured (via Figma plugins like "Tokens Studio" or custom code mappings), the server can return pre-authored snippets per node.

**When available, prefer these over inferring from properties** — they encode the designer's intended implementation. Check whether snippets are in React, CSS, or another format.

### Design Variables / Tokens

Fetch the variable collections and modes defined in the file. Variables are Figma's design token system.

**What to request:**
- Variable name and collection
- Resolved value per mode (light/dark, etc.)
- Type: COLOR, FLOAT (spacing, sizing), STRING (font family, etc.)

Map these to the project's token file if one exists. If the project uses Tokens Studio, the variable names often directly correspond to token names.

### Current Selection (Dev Mode shortcut)

Some versions expose a tool to fetch the currently selected node in the open Figma file — useful when the user already has the component selected in Figma and just says "implement what I have selected."

## Calling Strategy

1. **Start with the target node**: Fetch the node identified by the URL's `node-id`.
2. **Fetch children if needed**: For complex components, fetch child nodes to understand the full structure.
3. **Check for code snippets first**: If the server offers code snippets and they are present for the node, use them as the primary source.
4. **Fetch variables**: If the design uses Figma variables, fetch their resolved values and map to project tokens.
5. **Interpret auto-layout**: Auto-layout properties (`layoutMode`, `itemSpacing`, `paddingTop/Right/Bottom/Left`) map 1:1 to CSS flexbox.

## Color Value Handling

Figma returns colors as RGBA floats in the range 0–1. Convert to standard CSS:

```
r=0.18, g=0.52, b=0.91, a=1.0  →  rgb(46, 133, 232)  or  #2E85E8
```

For Tailwind projects: find the nearest Tailwind color swatch by comparing the hex value against the palette, or check if the project's `tailwind.config` extends the palette with custom colors that match.

## Typography Handling

Figma returns font properties as:
- `fontFamily`: string (e.g. `"Inter"`)
- `fontSize`: number (pixels)
- `fontWeight`: number (400, 600, 700, etc.)
- `lineHeightPx` or `lineHeightPercentFontSize`
- `letterSpacing`
- `textAlignHorizontal`

Map to the project's type scale (Tailwind `text-lg font-semibold`, CSS custom property, etc.). If an exact match doesn't exist, use the closest size and note the discrepancy.

## Spacing and Sizing

Figma uses pixel values. For Tailwind, divide by 4 to get the spacing unit:
- 16px → `p-4` / `gap-4`
- 24px → `p-6` / `gap-6`
- Odd values (e.g. 14px) → use `p-[14px]` arbitrary value

For CSS, use `rem` if the project does (divide by 16 for base-16 root font size) or `px` if existing components use pixels.
