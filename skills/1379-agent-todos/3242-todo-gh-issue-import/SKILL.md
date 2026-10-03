---
name: todo-gh-issue-import
description: >
  Import open GitHub issues into local agent todo files. Use when the user asks
  to "import issues", "import from GitHub", "convert issues to todos", or wants
  to pull GitHub issues into the configured todos directory (default: docs/agent-todos/).
compatibility: Requires gh CLI (https://cli.github.com/)
allowed-tools: Bash, Read, Write, Edit, Skill, AskUserQuestion
invocation: user
argument-hint: "[category]"
---

# todo-gh-issue-import

Import open GitHub issues into local todo files using the configured todos directory (default: `docs/agent-todos/`).

## Prerequisites

This skill requires the [GitHub CLI (`gh`)](https://cli.github.com/). Before starting, verify it is installed and authenticated:

```bash
gh --version
```

If the command fails, inform the user:

> The `gh` CLI is required but not installed. Install it from https://cli.github.com/ and run `gh auth login` to authenticate.

Do not proceed until `gh` is available and authenticated.

## Workflow

### 1. Check Prerequisites

Run `gh --version` to verify the CLI is available. If not, show the installation message above and stop.

### 2. Fetch Open Issues

Use `gh issue list` to fetch all open issues from the current repository:

```bash
gh issue list --state open --json number,title,body,labels --limit 100
```

If there are no open issues, inform the user and stop.

### 3. Determine Category

For each issue, determine the target category subdirectory under the todos directory:

- If the issue has a label that matches an existing category directory, use that label
- If a category argument was provided (e.g., `/todo-gh-issue-import data`), use it for all issues
- Otherwise, ask the user which category to use, or default to `misc/`

### 4. Create Todo Files

For each issue, use the `/todo-creation` skill to create the todo file:

```
Skill: todo-creation
Args: <category> <issue-title>
```

This ensures proper sequential numbering, file naming, and frontmatter generation.

### 5. Populate Content

After `/todo-creation` creates the file (with `status: new`), populate it with the GitHub issue content and update the frontmatter:

1. Read the created file path from the `/todo-creation` output
2. Update the file body with the issue content structured as:

```markdown
## Problem / Context

(content from the GitHub issue body)

## Tasks

- [ ] (extracted from issue body if possible, otherwise leave for the user)
```

3. Update the frontmatter `status` from `new` to `ready` (since imported issues already have content)

### 6. Close the GitHub Issue

After successfully creating and populating the todo file, close the GitHub issue with a comment:

```bash
gh issue close <number> --comment "Imported to <file-path>"
```

Where `<file-path>` is the relative path like `docs/agent-todos/data/0042_fix_soft_404_errors.md`.

## Example

An imported issue #7 titled "Fix soft 404 errors" with label "data" becomes `<todos-directory>/data/0042_fix_soft_404_errors.md`:

```markdown
---
title: Fix soft 404 errors
status: ready
projects:
- '[[my-project]]'
tags:
- todo
- agent-todo
---

## Problem / Context

(content from the GitHub issue body)

## Tasks

- [ ] ...
```

The GitHub issue is then closed with the comment: `Imported to <todos-directory>/data/0042_fix_soft_404_errors.md`

## Notes

- Only import open issues (closed issues are already done)
- If no label matches a category, ask the user or use `misc/`
- Imported todos always get `status: ready` since they already have content from the issue
- The `/todo-creation` skill handles sequential numbering and file naming conventions
- If `gh` is not authenticated, the user will see an auth error — direct them to run `gh auth login`
