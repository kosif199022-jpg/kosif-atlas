---
name: prd
description: Rewrite the pull request title and description from the full diff against the base branch
license: MIT
compatibility: Requires git and an authenticated gh CLI
disable-model-invocation: true
allowed-tools: Bash(gh pr:*), Bash(git diff:*), Bash(git log:*), Bash(git fetch:*)
---

Pull request: !`gh pr view --json number,title,url,baseRefName,body 2>&1 || true`

1. No open pull request for this branch: say so and stop.
2. `git fetch origin <base>`, then read the full diff (`git diff origin/<base>...HEAD`) and the commit
   subjects (`git log origin/<base>..HEAD --oneline`). The diff is the source of truth, not the old
   body and not the commit messages.
3. Title: a Conventional Commit `type(scope): description` covering the whole change, matching the
   subject style in `git log`.
4. Body: what changed and why. Use the repository's pull request template when it has one. Keep
   sections of the old body that are still true; drop what the diff no longer supports. A test plan
   with checkboxes: run each item you can and check it off; leave unchecked what you could not run
   and say why.
5. Follow the `oss-writing` skill for the wording. Never hard-wrap.
6. `gh pr edit --title ... --body-file -` with the body on stdin (heredoc). Report the URL and the
   new title.
