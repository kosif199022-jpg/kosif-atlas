# babysit-prs — command reference

All commands infer owner/repo from the current repo via `gh`, so run them **from the target
repo checkout**. `$PR` = the PR number. No external deps beyond `gh` (its built-in `-q`
provides jq-style filtering).

The helper script lives in THIS skill's dir (its absolute path is shown as "Base directory
for this skill" when the skill loads). Set it once, then call `$HELPER`:

```bash
PR=<number>
HELPER='bash /ABSOLUTE/PATH/TO/babysit-prs/scripts/gh-pr-threads.sh'   # skill base dir + /scripts/gh-pr-threads.sh
```

## 1. Fetch feedback

```bash
# CI checks (one line per check + overall)
gh pr checks "$PR"
gh pr view "$PR" --json statusCheckRollup \
  -q '.statusCheckRollup[] | .name+"\t"+.status+"\t"+(.conclusion//"")'

# PR state / mergeability / review decision
gh pr view "$PR" --json state,isDraft,mergeable,mergeStateStatus,reviewDecision \
  -q '"state="+.state+" draft="+(.isDraft|tostring)+" mergeable="+.mergeable+" status="+.mergeStateStatus+" review="+(.reviewDecision//"none")'

# Top-level reviews (bot + human) with body
gh pr view "$PR" --json reviews \
  -q '.reviews[] | "["+.state+"] "+.author.login+": "+((.body//"")|gsub("\n";" ")|.[0:300])'

# Issue comments (e.g. bot status notes)
gh pr view "$PR" --json comments \
  -q '.comments[] | .author.login+": "+((.body//"")|gsub("\n";" ")|.[0:300])'

# Inline review threads — UNRESOLVED only, with thread id + root comment id (for replies)
$HELPER list "$PR"
# → TSV: threadId <tab> path:line <tab> rootCommentDatabaseId <tab> author <tab> body
```

## 2. Reply to a review thread (fix report)

Replies go on the thread by replying to any comment in it (use the last comment's REST `databaseId`):

```bash
$HELPER reply "$PR" "<rootCommentDatabaseId>" "addressed in <sha> — <what changed>"
# raw REST equivalent:
gh api "repos/{owner}/{repo}/pulls/$PR/comments/<rootCommentDatabaseId>/replies" -f body="..."
```

Top-level PR comment (rarely needed; prefer thread replies):

```bash
gh pr comment "$PR" --body "..."
```

## 3. Resolve a review thread

```bash
$HELPER resolve "<threadId>"
# raw GraphQL equivalent:
gh api graphql -f threadId="<threadId>" -f query='
  mutation($threadId:ID!){ resolveReviewThread(input:{threadId:$threadId}){ thread{ id isResolved } } }'
```

Unresolve (if you resolved something in error):

```bash
gh api graphql -f threadId="<threadId>" -f query='
  mutation($threadId:ID!){ unresolveReviewThread(input:{threadId:$threadId}){ thread{ id isResolved } } }'
```

## 4. Detecting "new since last pass"

No stored cursor needed: each pass, `$HELPER list` returns only threads with
`isResolved=false`. Threads you fixed+resolved last pass drop out, so whatever remains is
genuinely open. For CI, compare the current `statusCheckRollup` conclusions; a check flipping
from `SUCCESS`→`FAILURE` (or a new failing check) is new work.

## 5. Verify with the repo's own tooling (detect, don't assume)

```bash
ls package.json Cargo.toml go.mod mix.exs pyproject.toml Makefile 2>/dev/null
# node:   jq -r '.scripts|keys[]' package.json   → run the test/lint/typecheck/build script that exists
# rust:   cargo test / cargo clippy
# go:     go test ./... / go vet ./...
# elixir: mix test / mix format --check-formatted
# python: pytest / ruff check
# make:   grep -E '^[a-z].*:' Makefile → run the relevant target
```

Run the narrowest check that covers the change; reproduce a failing CI check locally when feasible.

## Gotchas

- `reviewThreads` is paginated at 100 here — fine for normal PRs; page with `after:` if a PR somehow exceeds it.
- A review comment has both a GraphQL node id and a REST `databaseId`. **Replies use the REST `databaseId`**; **resolve uses the thread's GraphQL `id`**. The helper prints both correctly.
- `mergeable`/`mergeStateStatus` can read `UNKNOWN` right after a push — GitHub is recomputing; re-query after a few seconds.
- Bot reviewers post as `copilot-pull-request-reviewer`, `qodo-code-review`, `coderabbitai`, etc. Their threads resolve the same way as human ones.
