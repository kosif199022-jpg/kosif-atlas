---
name: m
description: Squash merge this branch's pull request now, without waiting for CI
license: MIT
compatibility: Requires git and an authenticated gh CLI
disable-model-invocation: true
allowed-tools: Bash(gh pr:*), Bash(git status:*), Bash(git branch:*), Bash(git pull:*)
---

Pull request: !`gh pr view --json number,title,url,isDraft,mergeable,mergeStateStatus 2>&1 || true`

1. No open pull request for this branch: say so and stop.
2. A draft PR, a merge conflict, or a blocked merge state stops you too. Report which it is.
3. `gh pr merge --squash --delete-branch`. Do not wait for checks; that is what /wm is for. A merge the
   forge refuses (required checks, required reviews): report the reason and stop. Never use `--admin`.
4. `gh` switches to the default branch and deletes the local branch. Confirm it is up to date with
   `git pull` when it is not.
5. Report the URL and whether it merged.
