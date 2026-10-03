---
name: obsidian-kanban
description: This skill should be used when the user asks to "create a Kanban board", "make an Obsidian Kanban board", "Kanban board format", "add a Kanban column", "edit Kanban cards", "Kanban board settings", or wants to create, edit, or understand Obsidian Kanban plugin board files (.md files with kanban-plugin frontmatter).
version: 0.3.0
---

# Obsidian Kanban Skill

Create and manage Obsidian Kanban plugin board files. The Kanban plugin
(mgmeyers/obsidian-kanban) renders plain Markdown files as drag-and-drop
Kanban boards inside any Obsidian vault.

## Board File Format (Quick Reference)

A Kanban board is a regular `.md` file with this structure:

````markdown
---

kanban-plugin: board

---

## Column Name

- [ ] Card text
- [ ] [[path/to/note/index]]
- [x] Completed card


## Another Column

- [ ] Card with #tag
- [ ] [[some/note/index]] @{2026-02-20}


***

## Archive

- [x] Done items go here

%% kanban:settings
```
{"kanban-plugin":"board","list-collapse":[false,false]}
```
%%
````

Key rules:

- **Frontmatter**: `kanban-plugin: board` is required — triggers board rendering. Note the blank lines around the property inside the frontmatter block.
- **Columns**: `## H2` headings — column order matches heading order in file
- **Cards**: `- [ ]` (open) or `- [x]` (complete) checkbox list items
- **Single-line cards**: All card text must be on one line (no blank lines within a card)
- **Wiki-links**: `[[path/to/note/index]]` — link cards to vault notes. No display text alias needed; the plugin resolves the note title automatically.
- **Tags**: `#tag` inline — rendered as colored pills in board view
- **Dates**: `@{YYYY-MM-DD}` appended to card text — shown as date pills
- **Archive separator**: A `***` horizontal rule before `## Archive`
- **Archive**: `## Archive` column stores completed/archived cards
- **Settings**: `%% kanban:settings ... %%` comment block at the very end, using plain triple backticks (no language hint)
- **Double blank lines**: The plugin outputs double blank lines between columns

## Creating a Board

To create a Kanban board from scratch:

1. Create a new `.md` file with a descriptive name (filename = board title)
2. Add `kanban-plugin: board` in YAML frontmatter (with blank lines around the property)
3. Add `## Column` headings for each lane
4. Add `- [ ]` items under each column for cards
5. Add `***` horizontal rule before `## Archive`
6. Add the settings comment block at the very end

Additional frontmatter properties (e.g. `tags`, `aliases`) may coexist alongside `kanban-plugin`.

### Linking Cards to Existing Notes

Use wiki-links for cards that reference other vault notes:

```markdown
- [ ] [[Projects/Website Redesign/index]]
- [ ] [[Meeting Notes/2026-02-16/index]]
```

When a card is a wiki-link, the plugin displays the linked note title as the card label.

### Creating Notes from Cards

In Obsidian's board view, right-click a card or use the three-dot menu and select
"Create note". The card text becomes the note title, and the card is replaced with
a `[[link]]` to the new note. Configure the target folder and template in board settings.

### Card Metadata

Cards support Obsidian inline fields (Dataview-compatible):

```markdown
- [ ] Task [priority:: high] [assignee:: John]
```

## Editing Existing Boards

When modifying a Kanban board file:

- Preserve the `kanban-plugin: board` frontmatter — removing it breaks board rendering
- Keep the settings comment block at the end intact
- Maintain the `- [ ]` / `- [x]` checkbox format for cards
- Column order in the file = column order in the board
- Adding/removing/reordering `## H2` headings adds/removes/reorders columns
- Keep the `***` separator before `## Archive`

## Board Settings

Settings are stored in the `%% kanban:settings ... %%` block using plain triple backticks. Common keys:

| Key                      | Type        | Description                      |
| ------------------------ | ----------- | -------------------------------- |
| `kanban-plugin`          | `"board"`   | Required identifier              |
| `list-collapse`          | `boolean[]` | Collapsed state per column       |
| `lane-width`             | `number`    | Column width in pixels           |
| `show-checkboxes`        | `boolean`   | Show/hide card checkboxes        |
| `new-line-trigger`       | `string`    | `"enter"` or `"shift-enter"`     |
| `date-picker-week-start` | `0-6`       | First day of week in date picker |

Settings are also accessible via the board's gear icon in the UI, which provides options
for note folder, note template, date/time format, archive size, and display preferences.

## Additional Resources

### Reference Files

For the complete Kanban plugin Markdown format specification:

- **`references/kanban-format.md`** — Detailed format reference including all card syntax variants, settings keys, board settings UI options, and file naming conventions
