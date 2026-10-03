---
name: cut-release
description: 'Cut a release from the Unreleased changelog section: version bump, release branch, PR, squash merge, tag, GitHub release'
license: MIT
compatibility: Requires git, an authenticated gh CLI, and a CHANGELOG.md in Keep a Changelog format
disable-model-invocation: true
argument-hint: '[version, e.g. 2.1.0; empty means derive it from the changelog]'
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git tag:*), Bash(git add:*), Bash(git commit:*), Bash(git branch:*), Bash(git switch:*), Bash(git pull:*), Bash(git push:*), Bash(git symbolic-ref:*), Bash(git config --get:*), Bash(gh pr:*), Bash(gh release:*), Bash(gh run:*), Bash(ls:*), Bash(head:*)
---

# Cut Release

Branch and status: !`git status --short --branch`
Last tags: !`git tag --sort=-v:refname | head -5`
Release workflows: !`ls .github/workflows 2>/dev/null || true`

A release bot in those workflows (release-please, changesets) owns the bump, the changelog, the tag,
and the release. Its open PR is the release: list PRs with
`gh pr list --json number,title,headRefName,url` and take the one whose head starts
`release-please--` or `changeset-release/`. Run only Steps 5.2, 5.3, 6.3, and 7 on it. The invocation is
the go-ahead to merge. With no open bot PR, nothing is releasable yet: say so and stop. A bot that
opens its PR with `GITHUB_TOKEN` starts no `pull_request` workflows, so required checks never
appear, `gh pr checks --watch` passes without them, and `gh pr merge` fails with "the base branch
policy prohibits the merge". Then run `gh pr close <n> && gh pr reopen <n>`, which starts them
under your account, and go back to Step 5.2. Never merge with `--admin`. Name this in the Step 7
report: every future bot PR will hit it until the repository gives the bot an App token.

Take everything under the Unreleased heading (`## Unreleased` or `## [Unreleased]`) in
CHANGELOG.md to a tagged release. Version override: $ARGUMENTS.

## Step 1: Preconditions

Stop and say which one fails:

- The working tree is clean and you are on the default branch, up to date with its upstream
  (`git pull` first).
- The Unreleased section in CHANGELOG.md has at least one entry.
- The last tag matches the version the project's version file carries. A mismatch means someone
  released by hand; ask before continuing.

## Step 2: Pick the version

Empty argument: derive it from the Unreleased entries with the `oss-changelog` skill's rules. A
breaking change or a `Removed` entry on a public API means major; a new feature means minor;
fixes only means patch. Pre-1.0 projects: breaking goes to minor, everything else to patch. State
the bump and the reason in one line before touching anything.

An argument that is lower than the last tag, or equal to it, is an error.

## Step 3: Release branch

`git switch -c chore/release-X.Y.Z`.

## Step 4: Bump and record

1. Version file. Find where the project keeps it: `lib/**/version.rb`, `package.json`,
   `.claude-plugin/plugin.json`, `Cargo.toml`, `pyproject.toml`, `VERSION`. Change every copy. A
   lockfile that embeds the version (Gemfile.lock for a gem) is regenerated with the project's own
   install command, never edited by hand.
2. CHANGELOG.md. Rename the Unreleased heading to `## [X.Y.Z] - YYYY-MM-DD` (today) and insert a
   fresh empty Unreleased heading above it, in the file's own style (bracketed or bare). Update the
   link references at the bottom when the file has them:
   `[Unreleased]` compares `vX.Y.Z...HEAD`, and `[X.Y.Z]` compares the previous tag to `vX.Y.Z`.
3. Anything else the repository bumps on release: a README install line pinned to a version, a
   `docs/` version switcher, a Homebrew formula. Grep for the previous version string and judge
   each hit.

Commit as `chore(release): X.Y.Z` following the `oss-writing` skill. Never hard-wrap.

## Step 5: Land it

1. `git push -u origin HEAD`, then `gh pr create` titled `chore(release): X.Y.Z` with the new
   changelog section as the body.
2. `gh pr checks --watch`. It exits non-zero on failure; read the result. Red: stop, name the
   failing check, and merge nothing.
3. Green: `gh pr merge --squash --delete-branch`, then `git pull` on the default branch.

## Step 6: Tag and release

1. `git tag -a vX.Y.Z -m "vX.Y.Z"` on the merged default branch. Use `-s` instead of `-a` when
   `git config --get tag.gpgSign` or `git config --get commit.gpgsign` prints true. Push the tag.
2. `gh release create vX.Y.Z --title "vX.Y.Z" --notes-file` with exactly the new changelog section.
   Skip this when a workflow in `.github/workflows` creates the release from the tag itself; say so.
3. A workflow that publishes on tag or on release (trusted publishing, `gh release upload`): find
   its run with `gh run list --workflow <file> --limit 1 --json databaseId --jq '.[0].databaseId'`,
   then `gh run watch <id> --exit-status` and report the outcome. A job behind an environment with
   a required reviewer parks the run at status `waiting`, where `gh run watch` blocks: poll
   `gh run view <id> --json status` and, at `waiting`, report the run URL as awaiting approval.
   No such workflow: report the publish command the project documents and do not run it.

## Step 7: Report

Version, bump reason, PR URL, tag, release URL, publish status. One line each.

## Notes

- Never publish a package from this skill unless a workflow does it. A manual `gem push` or
  `npm publish` is the user's call, and `oss-publish` exists to remove that step.
- Do not rewrite changelog entries while releasing. Wording fixes are a separate commit before you
  start.
- A failure after the merge (tag push rejected, release create failed) leaves the default branch
  released but untagged. Say exactly which step failed so the user can finish by hand.
