---
name: c
description: Commit all changes on the current branch, main included
license: MIT
disable-model-invocation: true
argument-hint: [message hint]
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git log:*)
---

Branch and status: !`git status --short --branch`
Changed files: !`git diff HEAD --stat || true`
Recent subjects: !`git log --oneline -10 || true`

Commit everything above on the current branch. Do not switch or create a branch, even on main.

1. Read the full diff (`git diff HEAD`) and every untracked file `git status` lists before writing
   anything.
2. Scan it for credentials, tokens, private keys, and any value that does not belong in this
   repository. If you find one, stop, commit nothing, and report what you found.
3. An untracked directory that holds a local tool's state (an index, cache, or database, such as
   `.codegraph/`) belongs in the root `.gitignore`, even when it ships its own `.gitignore`: add
   its path there, commit that line with the rest, and say so in the report.
4. Stage the changes. Prefer explicit paths over `git add -A`.
5. Write a Conventional Commit `type(scope): description`, matching the subject style already in
   `git log`. Follow the `oss-writing` skill for the wording. $ARGUMENTS is a hint at what the change
   is about, not the message itself.
6. Commit. Report the subject and the short hash, plus the `.gitignore` line from step 3 if you
   added one, nothing else.

Split into several commits when the diff covers unrelated changes.
