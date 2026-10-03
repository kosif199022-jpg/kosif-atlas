#!/usr/bin/env bash
set -euo pipefail
git init -q -b main .
git config user.email eval@example.com
git config user.name eval
n=0
c(){ # c <days-ago> <file> <subject>
  n=$((n+1)); mkdir -p "$(dirname "$2")"; echo "change $n" >> "$2"; git add "$2"
  d=$(date -u -d "$1 days ago" +%Y-%m-%dT12:00:00Z)
  GIT_AUTHOR_DATE=$d GIT_COMMITTER_DATE=$d git commit -qm "$3"; }
for i in 1 2 3 4 5 6; do c $((28-i*2)) src/catalog.ts "feat: catalog step $i"; done
c 14 src/discount.ts "feat: add discount codes at checkout"
c 12 src/discount.ts "chore: tidy discount module"
c 10 src/discount.ts "revert: \"feat: add discount codes at checkout\""
for i in 1 2 3; do c $((8-i*2)) docs/notes.md "docs: notes $i"; done
