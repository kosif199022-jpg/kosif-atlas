---
name: trello-convert-obsidian-kanban
description: This skill should be used when the user asks to "convert Trello to Kanban", "Kanban from Trello import", "create Kanban board from Trello", "generate Kanban from TRELLO_IMPORT", "Trello board as Kanban", or wants to turn imported Trello board directories into Obsidian Kanban plugin board files.
allowed-tools: Bash, Read, Write, Edit
invocation: user
argument-hint: "[BoardName]"
version: 0.1.0
---

# Trello to Obsidian Kanban Conversion

Convert `TRELLO_IMPORT/` board directories into Obsidian Kanban plugin board files.
Each Trello list becomes a Kanban column, and each Trello card becomes a linked card
in the board.

## Prerequisites

- The `trello-import` skill must have been run first to produce the `TRELLO_IMPORT/<Board>/<List>/<Card>/index.md` directory structure.
- For details on the Kanban board file format, consult the `obsidian-kanban` skill.

## Bundled Script

The conversion script is at `scripts/trello_to_kanban.py`. Run from the repository root:

```bash
# Convert a specific board
python3 .claude/skills/trello-convert-obsidian-kanban/scripts/trello_to_kanban.py "Foodie"

# Convert all imported boards
python3 .claude/skills/trello-convert-obsidian-kanban/scripts/trello_to_kanban.py

# Custom output directory
python3 .claude/skills/trello-convert-obsidian-kanban/scripts/trello_to_kanban.py -o KANBAN/ "Foodie"
```

## Behavior

- Reads `TRELLO_IMPORT/<Board>/` and finds list directories (folders matching `NNN name` pattern)
- Sorts lists by their zero-padded prefix (preserving Trello board order)
- Strips the numeric prefix from column names (`001 Ausprobieren-Ideen` -> `Ausprobieren-Ideen`)
- Creates `- [ ] [[path/to/card/index]]` wiki-link items for each card that has an `index.md`
- Cards are sorted alphabetically within each column
- Adds `***` separator and `## Archive` section
- Appends `%% kanban:settings ... %%` block with `kanban-plugin: board`
- Output defaults to `TRELLO_IMPORT/<Board>/<Board> Kanban.md`
- Skips boards where the output file already exists (delete to regenerate)

## Output Format

The generated file matches the exact format expected by the Obsidian Kanban plugin:

- Frontmatter: `kanban-plugin: board` (with blank lines around the property)
- Columns: `## H2` headings
- Cards: `- [ ] [[TRELLO_IMPORT/Board/List/Card/index]]` wiki-links
- Double blank lines between columns
- `***` before `## Archive`
- Settings block with plain triple backticks (no language hint)

For the complete Kanban format specification, refer to the `obsidian-kanban` skill.

## Verify

After running the script, open the generated `.md` file in Obsidian. It should render
as a Kanban board with columns matching the original Trello lists and linked cards.

```bash
# Quick check
head -30 "TRELLO_IMPORT/Foodie/Foodie Kanban.md"
```

