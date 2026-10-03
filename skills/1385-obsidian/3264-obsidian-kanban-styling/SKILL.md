---
name: obsidian-kanban-styling
description: This skill should be used when the user asks to "style Obsidian Kanban", "add CSS for Kanban boards", "match Kanban to Trello dark", "customize .obsidian/snippets/kanban.css", or "improve Kanban card appearance".
version: 0.1.0
---

# Obsidian Kanban Styling

Style Obsidian Kanban plugin boards with a cohesive custom visual theme.

## When To Use

Use this skill when a vault uses Obsidian Kanban and requires custom board styling in `.obsidian/snippets/kanban.css`.

## Known Working Selectors

Use Kanban plugin selectors for predictable styling:
- `.kanban-plugin__board`
- `.kanban-plugin__lane`
- `.kanban-plugin__lane-title`
- `.kanban-plugin__item`
- `.kanban-plugin__item-content`

## Assets

Use the bundled template:
- `assets/kanban-glassy-dark.css`

This template provides:
- Trello-like dark board background,
- glassy lanes,
- elevated cards with hover state,
- styled embedded card images,
- board scrollbar styling,
- optional tag accent borders.

## Script

Install template into vault snippet path:

```bash
bash .claude/skills/obsidian-kanban-styling/scripts/install_kanban_snippet.sh
```

Custom target path:

```bash
bash .claude/skills/obsidian-kanban-styling/scripts/install_kanban_snippet.sh ".obsidian/snippets/kanban.css"
```

## Manual Workflow

1. Confirm target file (`.obsidian/snippets/kanban.css`).
2. Apply template CSS via script or direct copy.
3. Enable snippet in Obsidian (`Appearance -> CSS snippets`).
4. Reload Obsidian and verify board, lane, and card appearance.
5. Tune these first for quick adjustments:
   - board background image URL in `.kanban-plugin__board`
   - lane/card border opacity
   - card hover shadow strength

## Verify

```bash
rg -n "kanban-plugin__board|kanban-plugin__lane|kanban-plugin__item" .obsidian/snippets/kanban.css
```
