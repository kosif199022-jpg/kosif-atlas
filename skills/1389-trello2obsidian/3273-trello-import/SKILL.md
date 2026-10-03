---
name: trello-import
description: This skill should be used when the user asks to "import Trello boards", "convert Trello JSON to Markdown", "generate Obsidian notes from Trello", or has placed Trello JSON exports at the repository root. Converts Trello board JSON exports into browsable Obsidian Markdown notes organized by board, list, and card.
allowed-tools: Bash, Read, Write, Edit
invocation: user
argument-hint: "[board.json ...]"
version: 0.1.0
---

# Trello Import Skill

Convert Trello board JSON exports into Markdown notes for Obsidian.

## When to Use

- User has placed one or more `*.json` Trello board exports at the repository root
- User wants to (re-)generate the `TRELLO_IMPORT/` folder structure

## Bundled Script

The converter script is bundled at `scripts/import_from_trello.py`. Run it from the repository root:

```bash
# Import one board only (recommended)
python3 .claude/skills/trello-import/scripts/import_from_trello.py 20260214_pok-pok-noodles.json

# Import multiple explicit boards
python3 .claude/skills/trello-import/scripts/import_from_trello.py 20260214_foodie-rezepte.json 20260214_hot-thai-kitchen.json
```

Do not run the script without explicit JSON file arguments.

## Behavior

- Read only the explicitly provided `*.json` files
- If a target board directory already exists, prompt for explicit approval before deleting/recreating it
- In non-interactive mode, always refuse overwrite of existing board directories
- Write to `TRELLO_IMPORT/<Board>/<List>/<Card>/index.md`
- Lists are sorted by Trello position and prefixed: `001 ListName/`, `002 ListName/`
- Each card gets YAML frontmatter (`title`, `board`, `list`, `trello_url`) plus sections for description and attachments
- Duplicate card names within a list get `[<card-id>]` appended for collision safety
- Filenames are sanitized (max 120 chars, safe unicode)

## Warning

**Destructive per imported board**: for each selected JSON file, the script deletes and recreates that board directory (`shutil.rmtree`). Never hand-edit files inside `TRELLO_IMPORT/`.
Overwrite is interactive-only: existing board folders are never replaced in non-interactive runs.

## Verify

```bash
find TRELLO_IMPORT -name index.md | head -20
```

## Recommended Follow-Up

After importing, run the `trello-media-download` skill to download Trello-hosted images locally.
