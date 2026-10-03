---
name: tracker
description: 'Keep a change''s tasks.md as its work items — read a step, set its state and tick its tasks, or leave a note on it — for an engine that binds its tracker as { "provider": "devbook-openspec:tracker" }. Implements read_item, update_item, and comment over the steps of openspec/changes/<name>/tasks.md, with the four step states open, in progress, in review, and done read off the step''s branch and pull request — or, under single-branch, where a step is a commit, off its ticks. Use when: a run reads or updates the step it is building, "which steps of this change are merged", "mark step 2 in review".'
---

# devbook-openspec tracker

Open the reply with `devbook-openspec@<version>`, `version` read from `../../.claude-plugin/plugin.json`, not recalled.

A work item is a part of a change: `<change>` is its proposal, `<change>#step-<N>` the
`## Step N — title` block in `openspec/changes/<change>/tasks.md`, and `<change>#close` its
acceptance and archive. The lines under a step heading are
`../../rules/devbook-openspec-change.md`'s — `delivers:`, `owner: me`, `branch:`, `PR:`, then
the tasks. Three operations; anything else — find, create, link — is not this tracker's, and
the caller takes its unbound path.

**The state is read, never decided.** Check in this order and take the first that holds:

| State | Holds when |
|---|---|
| `done` | The `PR:` pull request is merged, on the host's own record |
| `in review` | The `PR:` pull request is open |
| `in progress` | A `branch:` line names a branch that exists, locally or on the remote |
| `open` | None of the above |

**Under `single-branch` a step has no pull request of its own**: it is a commit on
`change/<change>`, and the change's one pull request is `<change>#close`'s, read by the table
above. So a step is `done` when every one of its tasks is ticked in a commit on that branch,
locally or on the remote, `in progress` while the branch exists with a task unticked, and
never `in review`. That is what lets the closing run accept and archive before it opens the
one pull request; waiting for a merge there would wait for a pull request that only opens
after the acceptance it is waiting on.

Under `proposal-first` a closed, unmerged pull request is `in progress` again, and ticked tasks
without a merge are not `done`. Read the pull request's state through whatever the host exposes for it — the
GitHub CLI, a connector — and say so when none answers: the state is then unknown, never
`done`.

- **`read_item`** — for every item, `change`, `part` (`proposal`, `step` with its number, or
  `close`), and `workflow`: the proposal's `Workflow:` line, else
  `components.openspec.workflow`, else `single-branch`. For a step, also its title,
  `delivers:` and `owner`, its tasks with their ticks, its state, and the proposal's status.
  Under `proposal-first` the proposal's state is read the same way off `change/<change>`'s
  pull request. An item that does not exist is an error, named.
- **`update_item`** — given a state and the tasks the run completed: write `branch:` when the
  run starts the step and `PR:` when its pull request opens, and tick the completed tasks.
  Edit those lines only, on the step's own branch, so the ticks reach `main` with the merge.
  Under `single-branch` that branch is `change/<change>` and a step gets no `PR:` line; the
  one pull request is written on the close.
  Never write `done`: merge is what makes a step done. Never untick a task a person ticked.
- **`comment`** — append `> <date>: <text>` as the step block's last line, on the step's branch.

Refuse `update_item` and `comment` on a change under `archive/`: it is history.
