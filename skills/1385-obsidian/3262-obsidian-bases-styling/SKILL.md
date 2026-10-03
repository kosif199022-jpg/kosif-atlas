---
name: obsidian-bases-styling
description: This skill should be used when the user asks to "style Obsidian Bases", "add CSS for Bases", "make zebra rows in Bases", "match Bases styling to Kanban", or "create/update .obsidian/snippets/bases.css".
version: 0.1.0
---

# Obsidian Bases Styling

Style Obsidian Bases views with a consistent custom theme, including alternating table row colors and visual parity with existing Kanban styling.

## When To Use

Use this skill when a vault uses Obsidian Bases and requires custom appearance in `.obsidian/snippets/bases.css`.

## Known Working Selectors

Use official Bases class selectors for predictable styling:
- `.bases-view`
- `.bases-table`
- `.bases-thead`, `.bases-tbody`
- `.bases-tr`, `.bases-th`, `.bases-td`

Avoid broad guess selectors when these classes are available.

## Assets

Use the bundled template:
- `assets/bases-glassy-dark.css`

This template provides:
- dark glass surface,
- column/header styling,
- alternating row colors,
- hover emphasis,
- visual consistency with Trello-like Kanban styling.

## Script

Install the template into the vault snippet path:

```bash
bash .claude/skills/obsidian-bases-styling/scripts/install_bases_snippet.sh
```

Custom target path:

```bash
bash .claude/skills/obsidian-bases-styling/scripts/install_bases_snippet.sh ".obsidian/snippets/bases.css"
```

## Manual Workflow

1. Confirm the target file path (`.obsidian/snippets/bases.css`).
2. Apply template CSS using the script or direct copy.
3. Ensure snippet is enabled in Obsidian (`Appearance -> CSS snippets`).
4. Reload Obsidian and verify zebra rows in Bases table views.
5. Tune only these variables first for contrast:
   - `--bases-row-odd`
   - `--bases-row-even`
   - `--bases-row-hover`

## Verify

```bash
rg -n "bases-tbody|nth-child\(odd\)|nth-child\(even\)" .obsidian/snippets/bases.css
```
