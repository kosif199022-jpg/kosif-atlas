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
for i in $(seq 1 12); do c $((29-i*2)) src/module$((i%4)).ts "feat: build step $i"; done
c 3 README.md "docs: readme"
