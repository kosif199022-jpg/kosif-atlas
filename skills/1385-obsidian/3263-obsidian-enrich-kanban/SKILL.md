---
name: obsidian-enrich-kanban
description: This skill should be used when the user asks to "enrich a kanban board", "set kanban card titles from frontmatter", "add thumbnail images to kanban cards", "refresh an existing kanban board", or "update one Obsidian Kanban file from linked note frontmatter".
version: 0.1.0
---

# Obsidian Enrich Kanban

Enrich one existing Obsidian Kanban board file in place by reading frontmatter from each linked card note.

## When To Use

Use this skill when a Kanban board already exists and card rows should be updated to:
- use the linked note frontmatter `title` as wiki-link alias,
- render the linked note frontmatter `thumbnail` as image above the title,
- keep operation scoped to exactly one board file.

## Script

Run from repository root with exactly one board path argument:

```bash
python3 .claude/skills/obsidian-enrich-kanban/scripts/enrich_kanban_board.py "TRELLO_IMPORT/Foodie Rezepte/Foodie Rezepte Kanban.md"
```

## Behavior

- Requires one existing Kanban board path argument.
- Refuses missing argument or more than one board argument.
- Processes checkbox card entries and reads linked note frontmatter.
- Rewrites each card as:
  - `- [ ] ![](thumbnail)` plus indented `[[path|title]]` when `thumbnail` exists
  - `- [ ] [[path|title]]` when `thumbnail` is missing
- Preserves column order and non-card content.
- Writes changes in place only for the provided board file.

## Notes

- This skill is independent from Trello conversion and can be run repeatedly on the same board.
- If linked notes do not contain `thumbnail`, only title aliasing is applied.

## Verify

```bash
rg -n "^[-] \[[ xX]\] !\[\]\(|\[\[.*\|" "TRELLO_IMPORT/Foodie Rezepte/Foodie Rezepte Kanban.md" | head -20
```
