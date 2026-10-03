---
name: pr-craft
description: Create a pull request with a structured, concise description derived from the diff and conversation context. Use when the user asks to "create a PR", "open a PR", "PR to <branch>", "raise a pull request", or wants the full branch → commit → push → gh pr create flow. Also opens GitHub-native stacked PRs — an ordered series of dependent PRs, one per layer — when the user says "stack this", "stacked PR", or the change is too large/layered to review as one. Produces a body with Problem / Root cause / Fix / Test / Out of scope sections and references task/ticket IDs.
---

# pr-craft

Drive a clean PR end to end: branch, stage only the relevant files, conventional-commit, push, open the PR with a structured body. Default to one focused PR; for a large change that splits into ordered dependent layers, open a **stack** instead (see [Stacked PRs](#stacked-prs-large-layered-changes)).

## Flow

1. **Inspect.** `git status` + `git diff` (and `git diff --staged`). Identify which changed files belong to *this* task. Pre-existing modified/untracked files unrelated to the work (lockfiles, config, scratch dirs) are NOT yours — leave them.
2. **Size the change.** Measure what the PR will actually ask someone to read, *before* committing, so a split is still cheap:

   ```bash
   BASE=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|origin/||')
   git diff --numstat "${BASE}...HEAD" -- . \
     ':(exclude)*.lock' ':(exclude)*lock.json' ':(exclude)*.lockb' \
     ':(exclude)dist/**' ':(exclude)build/**' ':(exclude)vendor/**' \
     ':(exclude)**/*.min.*' ':(exclude)**/*.snap' ':(exclude)**/*.generated.*' \
     | awk '{a+=$1; d+=$2; f++} END{printf "%d files, +%d -%d (%d lines)\n", f, a, d, a+d}'
   ```

   Work not committed yet? Same pipe over `git diff --numstat HEAD`, but first mark this task's **new** files with `git add -N <file> …` (intent-to-add, named individually like step 4, never `-A`). `git diff` does not see untracked files, so without it a feature made of brand-new files measures as zero lines and sails past the gate. The exclusions are deliberate: a regenerated lockfile or a `dist/` rebuild is not review surface, and counting it splits PRs that never needed splitting.

   | Reading | Action |
   |---------|--------|
   | **< 400 lines and < 15 files** | One PR. Proceed. |
   | **400-800 lines, or 15-25 files** | One PR, but report the number and offer the split. |
   | **> 800 lines, or > 25 files** | Propose a [stack](#stacked-prs-large-layered-changes) first. Shipping one PR anyway needs a stated reason. |

   These are review-capacity heuristics, not laws: reviewer defect-detection drops off sharply past a few hundred lines in one sitting. Tune the numbers here if a repo consistently runs bigger.
3. **Branch.** If on the base branch (`main`/`staging`/`master`), create `type/short-slug` (e.g. `fix/marketing-consent-required-signup`). Type matches the commit type. If already on a feature branch, stay.
4. **Stage explicitly.** `git add <file> <file> …` — name each relevant file. Never `git add .` / `-A`. Re-run `git status` to confirm only intended files are staged.
5. **Commit.** Conventional Commits subject (`type(scope): summary`, ≤72 chars). Body explains *why* + bullet the changes. End with `Refs task <id>` / `Refs <ticket>` when known. Obey the repo's CLAUDE.md (e.g. no `Co-Authored-By` trailer if it says so).
6. **Push.** `git push -u origin <branch>`.
7. **Open PR.** `gh pr create --base <base> --head <branch> --title "<same as commit subject>" --body "$(cat <<'EOF' … EOF)"`. Base = the branch the user named, else the repo default (`staging` here, often `main` elsewhere — check `git remote show origin` or repo CLAUDE.md if unsure).
8. **Report** the PR URL. Name which automated reviewers this repo runs, so the user knows what will (and won't) look at the diff — one discovery command, in [review-pass/references/automated-reviewers.md](../review-pass/references/automated-reviewers.md). If the repo has none configured, or the one it has is paused, that's worth a sentence: a PR nobody and nothing reviews should be a deliberate choice, not a surprise. Then offer follow-ups (log time, comment the link on the task).

## PR body structure

Only include sections that carry signal — drop empty ones. Concise, no filler.

```md
## Problem
What's broken / needed and who reported it. The user-facing or compliance impact.

## Root cause
Why it happens, by layer/file. Cite `file:line` or function names.

## Fix
- Bullet each change, what it does and why.
- Note side effects / benefits.

## Test
1. Numbered manual steps a reviewer runs to confirm.

## Out of scope (flag to <owner>)
- Known gaps deliberately not handled (other locales, data backfill, etc.).

Refs task <id>
```

## Stacked PRs (large, layered changes)

Default to one focused PR. Reach for a **stack** when the size gate in step 2 trips *and* the change decomposes into ordered *dependent* layers (e.g. schema → API → UI). Each layer becomes its own small PR, reviewable in parallel, and lower layers can merge first. This is GitHub's native stacked pull requests (public preview, since July 2026): each PR targets the layer below and shows only its own diff, with a stack map at the top.

**Size alone is not a reason to split.** Some large changes have exactly one seam: a mechanical rename across 60 files, a regenerated API client, a dependency bump with wide call-site churn. Splitting those yields layers that are individually meaningless and *harder* to review than the whole. When the gate trips but no seam exists, keep the single PR and spend one line of the body saying why it is big and which parts are mechanical (point reviewers at `?w=1` for whitespace-heavy diffs). Aim each layer under ~400 lines, but let the seam pick the cut, never the line count.

Prereq (once per machine): `gh extension install github/gh-stack`.

1. **Bottom layer.** From the base branch: `gh stack init <layer-1-branch>`. Do that layer's work with the *same* explicit-staging + conventional-commit rules as the single-PR flow above.
2. **Stack up.** For each next layer: `gh stack add <layer-n-branch>`, then commit its work. Each layer depends on the one below it.
3. **Submit.** `gh stack submit` — pushes every branch, opens one PR per layer, and links them as a stack (each PR based on the layer below). Give each PR the same structured body, scoped to its own layer.
4. **Inspect.** `gh stack view` prints the stack map / status. Move around with `gh stack up` / `down` / `top` / `bottom`, or `gh stack switch` to pick a layer interactively.
5. **Revise a lower layer.** Commit on it, then `gh stack sync` to rebase + retarget the layers above (conflicts: `gh stack rebase` → resolve → `gh stack rebase --continue`).
6. **Merge.** `gh stack merge <pr-number>` does an atomic all-or-nothing merge of that PR and every layer below it. **Always pass the PR number.** With no argument in a non-interactive shell (which is what the Bash tool is) it merges the *entire* stack without prompting, using your last merge method. Branch protection and required checks still govern, and a merge-queue base queues the stack instead. Merging on GitHub works too: PRs above stay open and auto-rebase onto the new base.
7. **Report** the stack: each PR URL + the merge order.

Notes: split by *reviewable seam*, not commit count — a layer that can't be reviewed or reverted on its own isn't a layer. Reordering is CLI-only (`gh stack modify`) during the preview; merge-queue support is still rolling out.

## Gotchas

- **Bash tool is POSIX sh** — for multi-line commit/PR text use a heredoc (`-F -` for commit, `$(cat <<'EOF' … EOF)` for `--body`). Do NOT use PowerShell here-strings (`@'…'@`) in the Bash tool — the `@` leaks into the message. Quote the heredoc delimiter (`<<'EOF'`) so backticks/`$` stay literal.
- **Don't sweep unrelated changes** into the commit — the #1 mistake. Stage by name.
- **Subject = PR title** — keep them identical.
- Derive body content from the actual diff + what was discussed, not guesses. If root cause wasn't established, say "investigating" rather than inventing one.

See [EXAMPLE.md](EXAMPLE.md) for a full worked PR.
