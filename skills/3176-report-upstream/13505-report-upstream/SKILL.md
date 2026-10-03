---
name: report-upstream
description: 'Take a bug or gap found in a third-party dependency upstream: locate the repository, check for an existing report, reproduce, follow its contributing rules, and draft the issue or pull request for confirmation before anything is submitted'
license: MIT
compatibility: Requires git, an authenticated gh CLI, and network access
disable-model-invocation: true
argument-hint: '[package or repo, and what is wrong; empty means the problem discussed in this session]'
allowed-tools: Bash(gh issue list:*), Bash(gh pr list:*), Bash(npm view:*), Bash(gem specification:*), Bash(bundle info:*), Bash(pip show:*), Bash(cargo metadata:*), Bash(brew info:*)
---

# Report upstream

The finding comes from this session or from $ARGUMENTS. Nothing leaves the machine until the user
has seen the exact text and code and said yes.

## Step 1: Locate upstream

Take the repository URL from the package's own metadata, never from a search result:

| Ecosystem | Where |
|---|---|
| RubyGems | `gem specification <name> metadata` (`source_code_uri`), else `gem specification <name> homepage` or `bundle info <name>` |
| npm | `npm view <name> repository.url` |
| PyPI | `pip show <name>` or the `project.urls` in its metadata |
| Cargo | `cargo metadata` `repository` field |
| Go | the module path when it starts with a forge host (`github.com/...`); a vanity path: the repository in the `go-import` meta tag of `curl -s 'https://<module>?go-get=1'` |
| Homebrew | `brew info --json=v2 <name>`: the repository in `urls.stable.url` or `urls.head.url`, else `homepage` |

No metadata, or the URL is not the project's canonical repository: stop and ask.

## Step 2: Is it already reported?

`gh issue list --repo <owner/repo> --search "<key words>" --state all` and the same for
`gh pr list`. Read the closest matches. An open issue that already describes it means: comment
with the reproduction, do not open a second one. A closed one with a fix means: the fix is in a
version the project has not picked up, report that instead.

## Step 3: Read the rules

From the upstream repository, at its default branch: `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE.md`,
`.github/ISSUE_TEMPLATE/`, `CODE_OF_CONDUCT.md`, and the section of the README about
contributing. Note: issue-first policy, DCO or CLA sign-off, commit message convention, test
expectations, which branch to target, and whether the project accepts PRs at all.

## Step 4: Reproduce

Clone upstream at its default branch into a scratch directory. Reproduce the problem there with
the smallest input that shows it, as a failing test in the project's own test framework when one
exists. A problem that does not reproduce on the default branch is fixed already: say so, name the
commit when you can find it, and stop.

The user says "it's my fork": use the fork's remote instead of cloning fresh, and keep its branch
naming.

## Step 5: Draft

Follow the `oss-writing` skill for every sentence. Never hard-wrap.

An issue: title in the project's convention, then what happened, what was expected, the minimal
reproduction, versions, and the environment. Use the issue template when there is one.

A pull request: the fix with the failing test from Step 4 now passing, on a branch named the way
CONTRIBUTING asks (fall back to `fix/<short-description>`), one commit in the project's message
convention, signed off when the project requires it. Body from the PR template; otherwise what and
why, the reproduction, and a link to the issue.

Run the project's own test suite and linters before presenting the draft.

## Step 6: Confirm

Show the user the full issue or comment text, or the diff plus the PR title and body, and the
exact commands you will run. Wait for explicit confirmation. Any change the user asks for goes back
to Step 5.

## Step 7: Submit

- Issue: `gh issue create --repo <owner/repo>`.
- Comment on an existing issue: `gh issue comment <number> --repo <owner/repo> --body-file -` with
  the text on stdin.
- PR: `gh repo fork --clone=false --remote` when no fork exists (the fork becomes `origin`, upstream
  is renamed `upstream`), push the branch to `origin`, then
  `gh pr create --repo <owner/repo> --base <branch>`.

Then hand the URL to `track-contrib` when it is installed, so the thread is watched. Report the
URL.

## Notes

- Do not touch the vendored or installed copy of the dependency in the user's project. A local
  workaround, when one is needed, is a separate change the user asks for.
- One problem per issue or PR. A second finding is a second run.
- A project that says it does not accept contributions, or that asks for a discussion first,
  gets exactly that: report the rule, and stop before Step 5.
