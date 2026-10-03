# Agent Todos

This folder is the todo store for AI agent tasks on this project.

## Structure

- Each subdirectory represents a category of tasks
- Task files use the naming convention: `[NNNN]_[description].md`
- Completed tasks are prefixed with `DONE_`

## Todo Store

The todo store location is configured in `.agent-todos.local.json` at the project root. By default it is `docs/agent-todos/` inside the project, but it can point to any folder — including a path inside an Obsidian vault.

## Status Lifecycle

Todo files include YAML frontmatter with a `status` field. Typical flow:

```mermaid
timeline
  title Todo Status Lifecycle
  new : Created but not yet fleshed out
  ready : Has content and can be picked up
  doing : Active work in progress
  done : Completed (also rename file with DONE_ prefix)
  archived : Reserved for future archiving
```

## Related Skills

- `/todo-init` - Set up or reconfigure the todo store
- `/todo-creation` - Create a new todo file with sequential numbering
- `/todo-gh-issue-import` - Import GitHub issues as todo files
- `/todo-processing` - Work with and update todo files
- `/todo-moving` - Move and renumber todo files between categories

See the skill documentation for details on file format and workflow.
