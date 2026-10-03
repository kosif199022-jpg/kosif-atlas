---
name: trello-media-download
description: This skill should be used when the user asks to "download Trello images", "localize Trello media", "download attachments from Trello cards", or wants to store Trello-hosted images locally in the vault. Downloads Trello-hosted images referenced in imported Markdown files and rewrites links to local paths.
allowed-tools: Bash, Read, Write, Edit
invocation: user
argument-hint: "--root <TRELLO_IMPORT/BoardName>"
version: 0.1.0
---

# Trello Media Download Skill

Download Trello-hosted images referenced in Markdown files so they are available locally in the vault.

## When to Use

- After running the `trello-import` skill
- When Markdown files reference remote Trello image URLs that should be stored locally

## Bundled Script

The downloader script is bundled at `scripts/download_media_from_trello.py`. Run from the repository root.

Dry run (preview what would be downloaded):
```bash
python3 .claude/skills/trello-media-download/scripts/download_media_from_trello.py --root 'TRELLO_IMPORT/Bangkok (She Simmers)' --dry-run
```

Download and rewrite links:
```bash
python3 .claude/skills/trello-media-download/scripts/download_media_from_trello.py --root 'TRELLO_IMPORT/Bangkok (She Simmers)'
```

## Options

| Flag | Description |
|------|-------------|
| `--root PATH` | Directory to scan (**required**, no default) |
| `--pattern GLOB` | File pattern under root (default: `**/index.md`) |
| `--dry-run` | List planned downloads without writing files |
| `--overwrite` | Re-download files that already exist locally |
| `--timeout SEC` | HTTP timeout in seconds (default: 30) |

## Behavior

- Scan Markdown files for `![alt](url)` links pointing to `trello.com` or `trello-attachments.s3.amazonaws.com`
- Download each image into the same folder as its Markdown file
- Rewrite remote URLs to local relative paths (`./filename.jpg`)
- Skip already-downloaded files unless `--overwrite` is used

## Recommended Workflow

1. Run with `--dry-run` to review planned downloads.
2. Run without `--dry-run` to download and rewrite for that same `--root`.
3. Spot-check a few card folders to verify images are present and links are rewritten.
