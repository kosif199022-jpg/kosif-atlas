---
name: wm
description: Wait for CI to pass on this branch's pull request, then squash merge it
license: MIT
compatibility: Requires git and an authenticated gh CLI
disable-model-invocation: true
allowed-tools: Bash(gh pr:*), Bash(gh run:*), Bash(git status:*), Bash(git branch:*), Bash(sleep:*)
---

Pull request: !`gh pr view --json number,title,url,isDraft,mergeable,mergeStateStatus 2>&1 || true`
Actions enabled: !`gh api 'repos/{owner}/{repo}/actions/permissions' --jq .enabled 2>&1 || true`

1. No open pull request for this branch: say so and stop.
2. Actions enabled `false` above means the repository runs no CI: skip the watch and treat it as
   green. Otherwise, `gh pr checks --watch` until every check settles. It exits non-zero on failure, so allow that and
   read the result rather than treating it as a crash. CI takes a few seconds to register a new pull
   request, so when it reports no checks, `sleep 20` and watch again. No checks the second time
   means the branch runs no CI: treat it as green.
3. Green: `gh pr merge --squash --delete-branch`. Red: stop, name the failing check and the reason,
   and merge nothing. Do not retry, do not fix, do not merge past a failure.
4. A draft PR, a merge conflict, or a blocked merge state stops you too. Report which it is.
5. Report whether it merged, and the URL.
