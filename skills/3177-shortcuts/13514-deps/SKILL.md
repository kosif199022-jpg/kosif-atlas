---
name: deps
description: Update every outdated dependency, run the repository's checks, and commit
license: MIT
compatibility: Requires git, the repository's package managers, and network access
disable-model-invocation: true
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git log:*)
---

Branch and status: !`git status --short --branch`

1. A dirty working tree: stop and say so. Updates go in on their own commit.
2. Detect every package manager from the lockfiles and manifests present (Gemfile.lock, bun.lock,
   package-lock.json, pnpm-lock.yaml, yarn.lock, uv.lock, poetry.lock, Cargo.lock, go.sum, mise.toml)
   and use its own outdated and update commands. Several managers means all of them.
3. Update everything inside the declared constraints first. Then list what is still behind, read each
   major's release notes in its upstream repository, and raise a constraint only when the
   repository's own check (test suite, typecheck, lint) passes with it.
4. Run the check after the update. A failure means: fix the code when the dependency changed
   behaviour, or pin that one dependency back and report why.
5. Commit as `chore(deps): ...` naming the notable bumps. Do not push; that is what /p and /cprw are
   for.
6. Report what was updated, and what stayed behind and why.
