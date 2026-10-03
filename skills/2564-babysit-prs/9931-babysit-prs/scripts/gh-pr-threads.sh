#!/usr/bin/env bash
# babysit-prs helper — list unresolved review threads, reply to one, resolve one.
# Deps: gh CLI only (owner/repo inferred from the current repo; gh's -q does the
# jq-style filtering, so no external jq needed).
#
# Usage:
#   gh-pr-threads.sh list    <pr>                          # unresolved threads (TSV)
#   gh-pr-threads.sh reply   <pr> <commentDatabaseId> <body>
#   gh-pr-threads.sh resolve <threadId>
#
# `list` TSV columns: threadId <tab> path:line <tab> rootCommentDatabaseId <tab> author <tab> body
#   - resolve  uses the threadId (GraphQL node id)
#   - reply    uses the rootCommentDatabaseId (REST id of the thread's first comment)
set -euo pipefail

OWNER=$(gh repo view --json owner -q .owner.login)
REPO=$(gh repo view --json name -q .name)

case "${1:-}" in
  list)
    pr="${2:?pr number required}"
    gh api graphql -f owner="$OWNER" -f repo="$REPO" -F pr="$pr" -f query='
      query($owner:String!,$repo:String!,$pr:Int!){
        repository(owner:$owner,name:$repo){
          pullRequest(number:$pr){
            reviewThreads(first:100){ nodes{
              id isResolved isOutdated
              comments(first:1){ nodes{ databaseId author{login} path line body } }
            }}
          }
        }
      }' -q '
      .data.repository.pullRequest.reviewThreads.nodes[]
      | select(.isResolved==false)
      | [ .id,
          ((.comments.nodes[0].path//"-")+":"+((.comments.nodes[0].line//0)|tostring)),
          (.comments.nodes[0].databaseId|tostring),
          (.comments.nodes[0].author.login//"-"),
          ((.comments.nodes[0].body//"")|gsub("\n";" ")|.[0:160]) ]
      | @tsv'
    ;;
  reply)
    pr="${2:?pr number required}"; cid="${3:?comment databaseId required}"; body="${4:?body required}"
    gh api "repos/$OWNER/$REPO/pulls/$pr/comments/$cid/replies" -f body="$body" -q '"replied: "+(.id|tostring)'
    ;;
  resolve)
    tid="${2:?threadId required}"
    gh api graphql -f threadId="$tid" -f query='
      mutation($threadId:ID!){ resolveReviewThread(input:{threadId:$threadId}){ thread{ id isResolved } } }' \
      -q '.data.resolveReviewThread.thread | "resolved "+.id+" isResolved="+(.isResolved|tostring)'
    ;;
  *)
    echo "usage: $0 {list <pr> | reply <pr> <commentDatabaseId> <body> | resolve <threadId>}" >&2
    exit 2
    ;;
esac
