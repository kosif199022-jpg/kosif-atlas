---
name: fci
description: Diagnose the failing CI run on this branch, fix the cause, push, and watch the rerun
license: MIT
compatibility: Requires git and an authenticated gh CLI
disable-model-invocation: true
allowed-tools: Bash(gh pr:*), Bash(gh run:*), Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git log:*), Bash(git push:*)
---

Branch: !`git status --short --branch`
PR checks: !`gh pr checks 2>&1 || true`

1. Nothing red: say so and stop.
2. `gh run view <id> --log-failed` for every failing job, where `<id>` is the number after `/actions/runs/`
   in its PR checks link. No PR: `gh run list --branch <branch from the Branch line> --limit 5`. Read the
   whole failure, not the last line.
3. Reproduce locally when the repository has the same check (test suite, linter, build). Fix the root
   cause in the code or the workflow. Do not retry, skip, or mark the check as allowed to fail, and do
   not loosen the check so it passes.
4. A failure that is not ours (flaky runner, upstream outage, expired secret): report it and stop.
5. Commit the fix as a Conventional Commit following the `oss-writing` skill, push, then
   `gh pr checks --watch` (it exits non-zero on failure, so allow that and read the result). Still red
   after one round: report what remains and stop.
6. Report what failed, the cause, the fix, and the rerun result.
