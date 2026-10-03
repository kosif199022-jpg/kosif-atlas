# Obsidian Kanban Plugin — Markdown Format Reference

## Overview

The Obsidian Kanban plugin (mgmeyers/obsidian-kanban) renders plain Markdown files as
drag-and-drop Kanban boards. The plugin is markdown-backed: every board is a `.md` file
that can be edited in source mode or rendered as a board.

Current version: 2.0.51 (GPL-3.0). The plugin is looking for new maintainers.

## Board File Structure

A complete board file has three sections:

````markdown
---

kanban-plugin: board

---

## Column Name

- [ ] Card text
- [ ] Another card
- [x] Completed card


## Another Column

- [ ] Card with [[path/to/note/index]]
- [ ] Card with #tag


***

## Archive

- [x] Archived card 1
- [x] Archived card 2

%% kanban:settings
```
{"kanban-plugin":"board","list-collapse":[false,false]}
```
%%
````

### 1. YAML Frontmatter (required)

```yaml
---

kanban-plugin: board

---
```

The `kanban-plugin: board` property is **required** — it tells Obsidian to render the file
as a Kanban board instead of normal Markdown. Note the blank lines around the property
inside the frontmatter fences — this is how the plugin writes it.

Additional frontmatter properties may coexist (e.g. `tags`, `aliases`).

### 2. Columns and Cards (required)

- **Columns** are `## H2` headings
- **Cards** are `- [ ]` (incomplete) or `- [x]` (complete) checkbox list items
- Cards appear in the order listed under each column
- Column order follows the heading order in the file
- The plugin outputs double blank lines between columns

### 3. Archive Separator

A `***` horizontal rule is placed before the `## Archive` heading to visually
separate active columns from the archive.

### 4. Settings Block (optional)

Stored as an Obsidian comment at the end of the file, using plain triple backticks
(no language hint like `json`):

```
%% kanban:settings
` ` `
{"kanban-plugin":"board","list-collapse":[false,false]}
` ` `
%%
```

(Backticks shown with spaces for escaping — in the actual file they are contiguous.)

Common settings keys:
- `"kanban-plugin"`: `"board"` (required)
- `"list-collapse"`: array of booleans per column (collapsed state)
- `"new-line-trigger"`: `"enter"` or `"shift-enter"`
- `"lane-width"`: number (pixels) for column width
- `"show-checkboxes"`: boolean
- `"date-picker-week-start"`: 0-6 (day of week)

## Card Syntax

### Basic Card

```markdown
- [ ] Simple card text
```

### Card with Wiki-Link

```markdown
- [ ] [[path/to/note/index]]
```

When a card is a wiki-link, the Kanban plugin displays the linked note's title
as the card label. No display text alias is needed.

Creating notes from cards (right-click → "Create note") turns the card text into a
new note and replaces the card with a `[[link]]` to it.

### Card with Tags

```markdown
- [ ] Task with #tag and #another-tag
```

Tags are displayed as colored pills on the card in board view.

### Card with Date

Dates are added via the `@` trigger in the UI (opens a date picker). In the Markdown,
dates appear appended to the card text:

```markdown
- [ ] [[some/note/index]] @{2026-02-20}
```

The date format depends on plugin settings. Dates can optionally link to Daily Notes.

### Card with Inline Metadata

Cards support Obsidian inline fields (Dataview-compatible):

```markdown
- [ ] Task [priority:: high] [assignee:: John]
```

### Completed Card

```markdown
- [x] This card is done
```

### Multi-line Cards

Cards are single list items. All text must be on one logical line (no blank lines).
Line breaks within a card are not natively supported — the full card text goes on
one `- [ ]` line.

## Archive Section

The `## Archive` column stores completed/archived cards, preceded by a `***` separator:

```markdown
***

## Archive

- [x] Completed task 1
- [x] Completed task 2
```

Cards are moved to the archive via the card context menu. The archive column can be
toggled visible/hidden in board settings.

## Creating Notes from Cards

Two methods:
1. Right-click a card → select "Create note"
2. Click the three-dot menu on a card → "Create note"

The note is created in the configured "Note folder" using the configured "Note template".
The card text becomes the note title, and the card is replaced with a `[[link]]` to the
new note.

## Board Settings (UI)

Settings accessible via the board's gear icon:
- **Note folder**: where notes created from cards are stored
- **Note template**: template applied to new notes
- **Lane width**: column width in pixels
- **Max archive size**: limit archived cards
- **Date format / Time format**: customize date display
- **Link dates to daily notes**: auto-link dates
- **Show relative dates**: display "2 days ago" style
- **Hide tags in card display**: clean card appearance
- **Hide date in card display**: suppress date pill
- **Show card checkboxes**: toggle `[ ]` visibility

## File Naming

Board files are regular `.md` files. Name them descriptively:

```
My Project Board.md
Cooking Ideas.md
Sprint Planning.md
```

The filename becomes the board title in Obsidian's file explorer.
