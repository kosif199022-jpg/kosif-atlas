---
name: cl
description: Close the issues this branch's pull request resolved, checking off their items first
license: MIT
compatibility: Requires git and an authenticated gh CLI
disable-model-invocation: true
argument-hint: [issue numbers, e.g. 12 34]
allowed-tools: Bash(gh pr:*), Bash(gh issue:*), Bash(git status:*), Bash(git log:*)
---

Pull request: !`gh pr view --json number,title,url,state,body,closingIssuesReferences 2>&1 || true`

Issues: $ARGUMENTS. Empty means the ones the pull request references.

1. No issues found either way: say so and stop.
2. For each issue, `gh issue view` it. Compare its checklist and acceptance criteria against what the
   PR actually changed, from the diff, not from the PR description.
3. Check off the items the PR completed (`gh issue edit N --body-file -` with the body on stdin).
   Leave the rest unchecked.
4. Every item done: comment with the PR URL and one line on anything done beyond the list, then
   `gh issue close --reason completed`. Items left: comment with what remains and keep it open.
5. Report one line per issue: closed, or left open with what remains.
