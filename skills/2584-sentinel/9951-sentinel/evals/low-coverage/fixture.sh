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
for i in $(seq 1 10); do c $((29-i*2)) src/pay.ts "update pay stuff $i"; done
c 9 src/pay.ts "fix: rounding in pay"
c 6 src/pay.ts "fixed it again"
c 3 src/pay.ts "wip"
