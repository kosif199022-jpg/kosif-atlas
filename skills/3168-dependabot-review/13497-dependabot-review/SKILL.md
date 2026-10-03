---
name: dependabot-review
description: 'Review Dependabot PRs for breaking changes, codebase impact, and merge readiness: one PR by URL, or an audit of every open one with a triage table'
license: MIT
compatibility: Requires an authenticated gh CLI and a checkout of the repository under review
disable-model-invocation: true
argument-hint: '[Dependabot PR URL or number; empty means audit every open Dependabot PR]'
allowed-tools: Bash(gh pr:*), Bash(gh repo view:*), Bash(gh api:*), Bash(curl:*), Bash(grep:*), Bash(find:*), Read, Write, Grep, Glob
---

# Dependabot Dependency Upgrade Review

Review Dependabot PRs and give the developer a concise, scannable verdict: what changed upstream, what could break (and how to fix it), what each package touches in the codebase, and whether to merge. This works across ecosystems: npm, RubyGems, PyPI, Go modules, Cargo, and so on.

## Choosing a mode

- **Single-PR mode**: the user gave a specific Dependabot PR URL or number. Run the single-PR workflow below.
- **Audit mode**: no PR was given, or the user asked about all open Dependabot PRs. Run the audit workflow. Do **not** ask the user to paste URLs; discover them with `gh`.

## Audit workflow (multiple PRs)

### Step A1: Discover open Dependabot PRs

Determine the repo from the current working directory (`gh repo view --json nameWithOwner -q .nameWithOwner`). Then list open Dependabot PRs:

```bash
gh pr list --author "app/dependabot" --state open \
  --json number,title,url,createdAt,headRefName,labels \
  --limit 50
```

The `app/` prefix in the author filter is required: Dependabot authors as the bot account `app/dependabot`. If `gh` returns an empty list, tell the user "No open Dependabot PRs in <repo>." and stop.

Before analysis, state the scope in one line: "Found N open Dependabot PRs. Analyzing each now."

### Step A2: Analyze each PR

For every PR returned, dispatch one subagent that runs the **single-PR workflow** (Steps 1-4 below) and returns the condensed per-PR section (15-25 lines). Dispatch all of them in one message so they run in parallel and their diff, changelog, and search output stays out of this context.

### Step A3: Produce the consolidated report

Emit the report in this order:
1. A short preamble: "Reviewed N open Dependabot PRs in <repo>."
2. A **summary table** (shape below).
3. A **Details** section with one subsection per PR, each following the single-PR output format but condensed to about 15-25 lines.
4. A closing **Overall recommendation** block: which PRs to merge now, which to investigate, which to hold. Group by verdict.

### Step A4: Offer to post findings as PR comments

Follow the shared **"Posting findings to PRs"** section below. In audit mode the opt-in prompt covers the whole batch ("yes / no / selective"), and the comment body for each PR is that PR's detail section from Step A3.

### Audit summary table

Render a GitHub-flavored markdown table with these exact columns, in this order:

| Column     | Contents                                                              |
|------------|-----------------------------------------------------------------------|
| `#`        | PR number, linked as `[#9170](url)`                                   |
| `Package`  | Package name. For multi-package PRs, comma-separate (e.g., `react-dom, react`) |
| `Bump`     | `old → new` (e.g., `7.2.4 → 8.0.10`)                                  |
| `Type`     | `patch`, `minor`, or `major`. Prefix with `🔒` if the PR addresses a security advisory |
| `Age`      | Days since `createdAt` (e.g., `3d`, `21d`)                            |
| `Verdict`  | `Merge`, `Verify`, `Investigate`, `Hold`                              |
| `Why`      | One short clause (10 words or fewer). Concrete: "dev-only, no breaking changes" beats "looks safe" |

**Sort order:** primary key is verdict in the order `Merge → Verify → Investigate → Hold`. Within each verdict bucket, sort by `Age` descending so the stalest PRs come first.

**Security exception:** any row with the 🔒 marker goes to the top of the entire table regardless of verdict.

Do not add extra columns (branch name, author, CI status, labels). Anything that does not fit the table belongs in the per-PR detail section.

## Single-PR workflow

### Step 1: Fetch PR Details

Parse the PR URL to extract the owner, repo, and PR number. In audit mode these come from the `gh pr list` output.

```bash
gh pr view <NUMBER> --repo <OWNER/REPO> --json title,body,url,files,headRefName
gh pr diff <NUMBER> --repo <OWNER/REPO>
```

From the diff, extract for each package being updated:
- **Package name**, **old version**, **new version**
- **Bump type**: patch (0.0.x), minor (0.x.0), or major (x.0.0)

If the PR updates multiple packages, analyze them together in a combined summary with one section per package.

### Step 2: Review Changelog & Breaking Changes

This is the most important step. Developers need to know what changed and whether anything will break.

Fetch the changelog between old and new versions. Try these sources:

1. **GitHub changelog**: use `gh` to fetch the raw changelog file from the package's repo (usually `CHANGELOG.md`, `Changes.md`, or `HISTORY.md` at the repo root)
2. **GitHub releases**: check `https://github.com/<package-source-repo>/releases`
3. **Package registry**: the package's registry page usually links to its source repo (npm: `https://www.npmjs.com/package/<name>`, RubyGems: `https://rubygems.org/gems/<name>`, PyPI: `https://pypi.org/project/<name>`)

Focus only on changes between the old and new version. For minor/major bumps, include all intermediate versions.

Organize findings by importance:

1. **Breaking changes**: removed/renamed APIs, changed defaults, dropped language/runtime/framework version support. For each breaking change, check whether the codebase is affected and suggest a concrete fix if so.
2. **Deprecations**: still works now, will break later. Note what to watch for.
3. **Security fixes**: increases urgency to merge.
4. **Notable bug fixes and new features**: only mention if relevant to the codebase.

If you cannot find a changelog, say so explicitly.

### Step 3: Find Codebase Impact

Search the codebase to understand what this package touches and what is at stake if it breaks.

1. **Manifest entry**: check the version constraint in the manifest file (`package.json`, `Gemfile`, `requirements.txt`, `go.mod`, etc.) and whether it is a dev/test-only or production dependency.
2. **Search for usage**: find the package's import/require statements and its module/class/symbol names across the source and test directories. Check configuration or setup files for how it is wired up.
3. **Map to features**: group files by feature area (payments, notifications, order processing, etc.) and describe what each area does in plain language.
4. **Ecosystem packages**: check if other packages depend on this one (e.g., a framework plugin that pins its host framework). Verify their version constraints are compatible by checking the lockfile diff (`package-lock.json`, `yarn.lock`, `Gemfile.lock`, `poetry.lock`, etc.); if the package manager resolved successfully, note that.

For dev/test-only packages, note the lower risk profile (broken dev workflow vs broken customer experience).

Keep this section concise: a grouped list of affected areas, not an exhaustive file listing.

### Step 4: Recommendation

Deliver a clear, concise verdict. Consider:

| Factor | Lower Risk | Higher Risk |
|--------|-----------|-------------|
| Bump type | Patch | Major |
| Usage scope | 1-2 files, dev/test only | Widespread, production |
| Feature area | Admin, dev tooling | Payments, auth, orders |
| Changelog | No breaking changes | API changes, deprecations |
| Security fix | No | Yes (merge sooner) |

Verdicts:
- **Merge**: safe, low risk
- **Verify**: looks safe but has specific things to verify first (list them)
- **Investigate**: specific concerns that need human judgment (list them)
- **Hold**: breaking changes or compatibility issues that need code changes before merging

Do not recommend running the test suite; CI handles that. Instead, call out specific things a human should verify that tests might not catch (e.g., production Redis version, runtime behavior changes, new deprecation warnings in logs).

### Step 5: Offer to post the review as a PR comment

After presenting the review in chat, follow the shared **"Posting findings to PRs"** section below. In single-PR mode the prompt is a simple yes/no, and the comment body is the review you just produced.

## Output Format

The output should be concise and scannable. Use this structure:

```
## Dependabot Review: `package_name` (old_version -> new_version)

### Bump Type
[patch/minor/major]: [one line: what this means for risk]

### What Changed
[Changelog highlights organized by importance: breaking changes first (with fix suggestions), then deprecations, security fixes, and notable changes. Skip noise. If nothing notable, say "No breaking changes or deprecations."]

### Breaking Changes in This Codebase
[Only if there ARE breaking changes: list each one with the affected file and a concrete fix suggestion. If no breaking changes affect the codebase, omit this section entirely.]

### Codebase Impact
[Concise grouped list of what this package touches: "Payments: captures charges via checkout jobs", "Notifications: 12 push/email notification handlers", etc. One line per area.]

### Recommendation
[Verdict + 1-3 sentences explaining why and what to verify]
```

For multi-package PRs, use one top-level heading and a section per package, then a single combined recommendation at the end.

In **audit mode**, each per-PR subsection uses the same structure but condensed (aim for 15-25 lines). The top-level summary table and Overall recommendation replace the single-PR verdict block.

## Posting findings to PRs

This section applies to **both** single-PR mode (Step 5) and audit mode (Step A4). Always run it.

### Opt-in prompt

Posting is a public-facing action, so always ask before posting; never post automatically. Run the idempotency check below first, so the prompt can name any PR that already has a review comment. Then ask once with `AskUserQuestion`, one option per answer:

- **Single-PR mode:** "Want me to post this review as a comment on PR #<number>?" with options yes / no
- **Audit mode:** "Want me to post each PR's review as a comment on its PR?" with options yes / no / selective
  - **yes**: post to every PR analyzed
  - **no**: stop; the report in chat is the only output
  - **selective**: ask which PR numbers to post on, then post to just those

If the user answers "no", stop there. If "yes" or "selective", post.

### Command

```bash
gh pr comment <NUMBER> --repo <OWNER/REPO> --body-file <path-to-tempfile>
```

Use `--body-file` rather than `--body` so newlines, backticks, and markdown tables survive the shell. Write each comment to a temp file first (e.g., `/tmp/dependabot-review-<pr-number>.md`), then pass the path.

### Comment template

Use this exact structure per PR:

```markdown
## Dependabot review

**Verdict:** <Merge / Verify / Investigate / Hold>

<one-line reason: the core of why this verdict>

<details>
<summary>Full review</summary>

<the full review output: Bump Type, What Changed, Breaking Changes in This Codebase (if any), Codebase Impact, Recommendation>

</details>

<!-- dependabot-audit:v1 -->
```

Keep the trailing `<!-- dependabot-audit:v1 -->` marker; the idempotency check below depends on it. **Do not** add any signature, "posted by", "generated by", or attribution line.

### Idempotency check

Before posting to any PR, run:

```bash
gh pr view <NUMBER> --repo <OWNER/REPO> --json comments --jq '.comments[].body' | grep -q 'dependabot-audit:v1'
```

If the marker is found, a prior review comment already exists. Say so in the opt-in prompt ("PR #9170 already has a prior review comment") and offer skip, replace (delete the old comment via `gh api --method DELETE /repos/<owner>/<repo>/issues/comments/<id>` and post new), or leave it alone as options. Default to skipping if the user does not specify.

### Failure handling

If `gh pr comment` fails for one PR (permissions, locked PR, rate limit), report the failure inline and continue. In audit mode, do not abort the whole batch because one comment failed.

### Confirmation output

After posting, show a short line:
- Single-PR: "Posted comment on #<number>."
- Audit: "Posted N comments: [#9170, #9157, ...]. Skipped M: [#9064 (had prior review)]."
