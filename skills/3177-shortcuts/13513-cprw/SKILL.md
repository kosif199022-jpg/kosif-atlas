---
name: cprw
description: Commit, push, open a pull request, wait for green CI, then squash merge
license: MIT
compatibility: Requires git, an authenticated gh CLI, and permitted network access to GitHub
disable-model-invocation: true
argument-hint: [message hint]
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git log:*), Bash(git branch:*), Bash(git switch:*), Bash(git symbolic-ref:*), Bash(git push:*), Bash(gh pr:*), Bash(gh run:*), Bash(git worktree:*), Bash(sleep:*)
---

Branch and status: !`git status --short --branch`
Changed files: !`git diff HEAD --stat || true`
Branch commits: !`git log --oneline origin/HEAD..HEAD || true`
Recent subjects: !`git log --oneline -10 || true`
Actions enabled: !`gh api 'repos/{owner}/{repo}/actions/permissions' --jq .enabled 2>&1 || true`

Run GitHub commands through the host's permitted network mode.
If network access needs host approval, obtain that access before the GitHub preflight.

Commit everything above, push, open a pull request, and merge it once CI is green. Never commit onto
the default branch. The lines above describe the session's working directory. When this session's
work sits in another worktree (`git worktree list`), run every step there with `git -C <path>` and
leave the changes above untouched.

1. Read the full diff (`git diff HEAD`), every untracked file `git status` lists, and, when
   `Branch commits` lists any, their diff (`git diff origin/HEAD...HEAD`) before writing anything.
   For large changes, list changed paths first and read each path's diff separately.
   Split long output into bounded windows. Reread every truncated section before staging.
   Finish when every changed file and hunk has been read.
2. Scan it for credentials, tokens, private keys, and any value that does not belong in this
   repository. If you find one, stop, commit nothing, and report what you found.
3. If the current branch is the repository's default branch, create and switch to a new one first:
   `type/kebab-description`, where `type` matches the Conventional Commit type you are about to use
   and the description comes from the change itself. Any `Branch commits` move to the new branch with
   it: then run `git branch -f <default> origin/<default>` so the default branch matches its remote
   and the merge can fast-forward it.
4. Stage the changes. Prefer explicit paths over `git add -A`.
5. Write a Conventional Commit `type(scope): description`, matching the subject style already in
   `git log`. Resolve writing helpers once from the host's skill catalog and supplied paths.
   Follow `oss-writing` when available. Otherwise, use the repository's wording rules.
   $ARGUMENTS is a hint at what the change
   is about, not the message itself.
6. Commit, then `git push -u origin HEAD` with a 600000 ms Bash timeout: a pre-push hook can run the
   whole test suite.
7. `gh pr create`. The squash merge makes the title the one commit on the default branch, so the
   title and body cover the whole branch: your commit's subject when it is the branch's only
   commit, otherwise one Conventional Commit subject spanning every commit. Use the repository's
   pull request template when it has one. Otherwise, use `pr` when available from the host's catalog.
   With no template or helper, write a brief body stating the problem, behavior, and validation.
   Apply the wording route from step 5 even when no commit was written.
   When the host has no Skill tool, read the helper at its supplied path.
8. Actions enabled `false` above means the repository runs no CI: skip the watch and treat it as
   green. Otherwise, `gh pr checks --watch` until every check settles. It exits non-zero on failure, so allow that and
   read the result rather than treating it as a crash. CI takes a few seconds to register a new pull
   request, so when it reports no checks, `sleep 20` and watch again. No checks the second time
   means the branch runs no CI: treat it as green.
9. Green: `gh pr merge --squash --delete-branch`. When the branch is checked out in a worktree,
   `--delete-branch` cannot delete it: first confirm `git -C <worktree> status --short` is empty,
   then `git worktree remove <worktree>` and merge from the main checkout. Red: stop, name the
   failing check and the reason, and merge nothing. Do not retry, do not fix, do not merge past a failure.
10. Report the PR URL and whether it merged. GitHub closes an issue the body names with `Closes #N`
    up to a minute after the merge, so report it as closing and leave the close to GitHub.
