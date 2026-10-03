---
name: todo-archiving
description: >
  This skill should be used when the user asks to "archive done todos",
  "archive completed todos", "clean up done todos", "move done todos into an
  archive", or wants to archive DONE_ todo files in a category folder.
allowed-tools: Bash, Read, Write, Edit
invocation: user
argument-hint: "[category]"
---

# todo-archiving

Archive completed todo files in one category folder.

## Purpose

Move completed `DONE_*.md` todos from a category into that category's `_archived/` subfolder,
rename them to `ARCHIVED_*.md`, set their frontmatter status to `archived`, and regenerate an
archive index.

## Arguments

- `category`: folder under the configured todos root, for example `plugin-agent-todos`, `seo`, or
  `misc`

## Workflow

1. Validate that a category is provided.
2. Run the bundled script:

```bash
bash <base_directory>/scripts/archive-done-todos.sh "<project_root>" "<category>"
```

Where:

- `<base_directory>` is the path shown in "Base directory for this skill:" during invocation.
- `<project_root>` is the repository root.

The script reads `.agent-todos.local.json` from `<project_root>` and falls back to the main
worktree root automatically when operating inside a git worktree.

## Script Behavior

The script:

1. Resolves the configured todos root, defaulting to `docs/agent-todos/`
2. Checks that the requested category exists
3. Creates `<category>/_archived/` if it does not exist
4. Moves all `DONE_*.md` files from the category root into `_archived/`
5. Renames each moved file from `DONE_*.md` to `ARCHIVED_*.md`
6. Updates each archived file's frontmatter `status:` to `archived`
7. Regenerates `_archived/Index.md` with all archived todo files in that category

Running the script again is safe. If there are no new `DONE_*.md` files, it still regenerates the
index from existing `ARCHIVED_*.md` files.

## Notes

- The script only archives Markdown todo files in the category root matching `DONE_*.md`.
- Existing archived files are left in place and included in the regenerated index.
- If an archive target filename already exists, the script aborts to avoid overwriting data.
