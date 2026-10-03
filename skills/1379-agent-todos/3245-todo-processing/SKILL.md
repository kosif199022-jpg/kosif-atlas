---
name: todo-processing
description: >
  This skill should be used when the user asks to "process a todo", "work on
  a todo", "start a todo", "pick up a task", "handle todo 0042", provides a
  path to a todo file to begin working on it, or asks "what should I work on
  next" and todos exist in the configured todos directory
  (default: docs/agent-todos).
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, Glob, Grep, Skill
invocation: user
argument-hint: "[path/to/todo.md]"
---

# todo-processing

This skill describes how to work with todo files located in the configured todos directory (default: `docs/agent-todos/`). These files track tasks for AI agents working on this project.

## Invocation

### Step 1: Identify the Todo to Process

**If a todo file path is provided as argument:**

Use that file directly. Proceed to Step 2.

**If no argument is given:**

1. Read the configured todos directory from `.agent-todos.local.json` (`todosRoot`), defaulting to `docs/agent-todos`. Look for this file in the project root. If not found there (e.g., when running inside a git worktree), run `git rev-parse --git-common-dir` to locate the main worktree's `.git` directory, then check for the config in its parent folder.

2. Find all open todos (non-`DONE_`, non-`TODO_OVERVIEW.md` `.md` files):

   ```bash
   find <todos-dir> -name "*.md" ! -name "DONE_*" ! -name "TODO_OVERVIEW.md" -type f | sort
   ```

3. **If no open todos exist:** Ask the user with `AskUserQuestion` whether they want to create a new todo. If yes, invoke the `todo-creation` skill via the `Skill` tool.

4. **If more than 5 open todos exist:** First ask the user to pick a category using `AskUserQuestion`. List only subdirectory names that contain at least one open todo as the options.

5. **Present the list:** Ask the user to select a todo using `AskUserQuestion`. Show the filename (without full path) as each option label. Use `multiSelect: false`.

### Step 2: Validate and Normalize the Todo File

**Missing numeric prefix:**

If the selected or given filename does not start with 4 digits (`NNNN_`):

1. Scan all files in the same category directory (including `DONE_` files) to find the highest numeric prefix.
2. Assign the next 4-digit prefix.
3. Rename the file using Bash `mv`.

**Missing or incomplete frontmatter:**

If the file has no YAML frontmatter (no `---` block at the top), or if `title` or `status` fields are absent:

1. Derive the title from the filename:
   - Strip `DONE_` prefix if present
   - Strip the numeric prefix (e.g. `0001_`)
   - Replace hyphens and underscores with spaces
   - Capitalize the first letter
2. Prepend or patch the frontmatter block with `title` and `status: new`.

### Step 3: Process the Todo

Continue with `## Workflow` > **Reading a Todo** below.

---

## Directory Structure

Todo files are organized in category subdirectories. Categories are flexible and can be created as needed.

The todos directory is configurable via `.agent-todos.local.json` (default: `docs/agent-todos/`).

```text
<todos-directory>/
├── [category]/     # e.g., data, menu, misc, tags, thai-food-dict
│   ├── 0001_task-description.md
│   ├── DONE_0002_completed-task.md
│   └── ...
└── [another-category]/
```

## File Naming Conventions

### Open Tasks

- `[4-digit-number]_[description].md` - e.g., `0001_create-new-feature.md`
- `TODO-[DESCRIPTION].md` - alternative format for quick todos

### Completed Tasks

- `DONE_[original-filename].md` - Add `DONE_` prefix when task is complete
- Example: `0001_create-feature.md` → `DONE_0001_create-feature.md`

### Supporting Files

Tasks may have supporting files (CSV, JSON, images, etc.) with the same number prefix:

- `0001_fix-soft-404.md` - the task file
- `0001_Tabelle.csv` - supporting data for the task

When marking a task as done, also rename supporting files with the `DONE_` prefix.

## Todo File Structure

Each todo file should contain:

```markdown
---
title: Task Title
status: ready
tags:
- todo
- agent-todo
---

## Problem / Context

Description of the problem or context for the task.

## Tasks

- [ ] Task item 1
- [ ] Task item 2
- [ ] Ask questions if anything is uncertain

## Progress, Decisions etc.

### YYYY-MM-DD: Progress Entry Title

Description of what was done, decisions made, etc.
```

## Frontmatter Fields

Every todo file starts with YAML frontmatter (`---` delimiters) containing:

### `title`

A human-readable title derived from the filename:

1. Strip `DONE_` prefix if present
2. Strip the numeric prefix (e.g. `0001_`)
3. Replace hyphens and underscores with spaces
4. Capitalize the first letter

Example: `DONE_0042_fix-soft-404-errors.md` → `Fix soft 404 errors`

### `status`

Tracks the lifecycle of a todo. Values and transitions:

| Status     | Meaning                         | Transitions to  |
| ---------- | ------------------------------- | --------------- |
| `new`      | Created but not yet fleshed out | `ready`         |
| `ready`    | Has content, ready to work on   | `doing`         |
| `doing`    | Currently being worked on       | `done`, `ready` |
| `done`     | Completed                       | `archived`      |
| `archived` | Archived (reserved)             | —               |

- A file with the `DONE_` prefix should always have `status: done`.
- When a file has meaningful content (problem description, tasks), use `ready`.
- A freshly created empty file uses `new`.

### `tags`

Every todo file should include the following tags:

```yaml
tags:
- todo
- agent-todo
```

## Workflow

### 1. Reading a Todo

When assigned a task:

1. Read the todo file to understand the task
2. Update the frontmatter status from `ready` → `doing`
3. Note any prerequisites or context
4. Check for existing progress entries

### 2. Working on a Task

While working:

1. **Ask questions** if anything is unclear - add user's answers to the file
2. **Document decisions** made during implementation
3. **Track progress** with dated entries

### 3. Adding Progress Notes

Add progress entries with this format:

```markdown
### YYYY-MM-DD: Brief Description

**What was done:**

- Item 1
- Item 2

**Decisions made:**

- Decision 1 (with reasoning)

**Outstanding questions:** (if any)

1. Question 1?
```

### 4. Marking as Done

When task is complete:

1. Update the frontmatter status to `done`
2. Add a final progress entry documenting completion
3. If the file has checkboxes, mark them all as `[x]`
4. Rename the file with `DONE_` prefix

## Best Practices

1. **Be verbose in progress notes** - Future agents will read these
2. **Date all entries** - Use format `YYYY-MM-DD`
3. **Document failures too** - "Attempted X, did not work because Y"
4. **Link to related files** - Reference files that were created/modified
5. **Ask before assuming** - Add questions to the file and ask the user
6. **Update internal docs** - After completing a task, update relevant documentation

## Finding Tasks

Read the configured todos directory from `.agent-todos.local.json` (`todosRoot`), defaulting to `docs/agent-todos`. If the config is not found in the project root (e.g., inside a git worktree), run `git rev-parse --git-common-dir` and check the parent of that path. Substitute `<todos-dir>` below with the resolved value.

To list all open (not done) tasks:

```bash
find <todos-dir> -name "*.md" ! -name "DONE_*" -type f
```

To list all completed tasks:

```bash
find <todos-dir> -name "DONE_*.md" -type f
```

To find tasks ready to be picked up (by frontmatter status):

```bash
grep -rl "^status: ready" <todos-dir>/
```
