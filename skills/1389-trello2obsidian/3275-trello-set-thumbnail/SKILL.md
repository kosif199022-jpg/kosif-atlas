---
name: trello-set-thumbnail
description: This skill should be used when the user asks to "set thumbnails for Trello cards", "add thumbnail frontmatter", "populate thumbnail field", or wants to add a `thumbnail` frontmatter field from the first image found in imported Trello card Markdown files.
allowed-tools: Bash, Read, Write, Edit
invocation: user
argument-hint: "[--root PATH]"
version: 0.1.0
---

# Trello Set Thumbnail Skill

Add or update a `thumbnail` frontmatter field in imported Trello card notes, using the first image found in each file.

## When to Use

- After running `trello-import` (and optionally `trello-media-download`)
- When card notes should have a `thumbnail` field pointing to their first image

## Bundled Script

The thumbnail setter script is bundled at `scripts/set_thumbnail_frontmatter.py`. Run from the repository root:

```bash
python3 .claude/skills/trello-set-thumbnail/scripts/set_thumbnail_frontmatter.py
```

## Options

| Flag | Description |
|------|-------------|
| `--root PATH` | Directory to scan (default: `TRELLO_IMPORT`) |
| `--pattern GLOB` | File pattern under root (default: `**/index.md`) |
| `--field NAME` | Frontmatter field name to set (default: `thumbnail`) |

## Behavior

- Scan each Markdown file for the first `![alt](target)` image link in the body (below frontmatter)
- Add or update the `thumbnail` field in YAML frontmatter with that image target
- Remove any legacy `thumnbnail` (typo) field if present
- Skip files without frontmatter or without images

## Recommended Workflow

1. Run `trello-import` to generate card notes.
2. Run `trello-media-download` to localize images.
3. Run `trello-set-thumbnail` to populate frontmatter thumbnails.
