---
name: todo-moving
description: >
  This skill should be used when the user asks to "move todos", "move todo files
  between categories", "renumber open todos", "close numbering gaps in todo
  folders", or "avoid collisions with DONE todo numbers".
version: 0.1.0
allowed-tools: Bash, Read, Write, Edit
invocation: user
argument-hint: "[source-category] [todo-set] [target-category]"
---

# todo-moving

Move selected open todo files from one category folder to another and renumber open todos in both folders.

## Purpose

Apply this skill to todo migrations inside the configured todos directory (default: `docs/agent-todos/`) when number consistency is required.

## Arguments

- `source-category`: folder under the todos directory that currently contains the todos, for example `misc`
- `todo-set`: comma-separated list of numbers and/or ranges, for example `0011-0014,0020`
- `target-category`: destination folder under the todos directory, for example `seo`

## Workflow

1. Validate that source category, todo set, and target category are present.
2. Run the bundled script:

```bash
bash <base_directory>/scripts/move-todos.sh "<project_root>" "<source-category>" "<target-category>" "<todo-set>"
```

Where:

- `<base_directory>` is the path shown in "Base directory for this skill:" during invocation.
- `<project_root>` is the repository root.

3. Review script output for moved files, warnings, and renumbering actions.

## Todo Set Format

Accept these token formats inside `todo-set`:

- single number: `0012`
- range: `0011-0014`
- mixed list: `0011-0014,0018,0021`

Move only open markdown todo files matching `<number>_*.md`.

## Renumbering Rules

After moving files, renumber open todos in source and target categories:

- open files: `^[0-9]{4}_.*\.md$`
- done files: `^DONE_[0-9]{4}_.*\.md$`
- assign open todos to the smallest free numbers from `0001` upward
- keep numbers used by DONE and `_archived/ARCHIVED_` files reserved

Produce gapless numbering for open todos without DONE or archived collisions.
