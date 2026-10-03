#!/usr/bin/env bash
# Print the next zero-padded PRD path for a given slug.
# Deterministic index computation — scans existing NNNN-*.md, returns max+1.
# Usage: next-prd-index.sh <slug> [prds-dir]
#   next-prd-index.sh user-auth          -> docs/prds/0007-user-auth.md
#   next-prd-index.sh user-auth docs/prd -> docs/prd/0007-user-auth.md
set -euo pipefail

slug="${1:?usage: next-prd-index.sh <slug> [prds-dir]}"
dir="${2:-docs/prds}"

mkdir -p "$dir"

max=0
for f in "$dir"/[0-9][0-9][0-9][0-9]-*.md; do
  [ -e "$f" ] || continue
  n=$(basename "$f" | cut -c1-4)
  n=$((10#$n))   # force base-10 (avoid octal on leading zeros)
  (( n > max )) && max=$n
done

printf '%s/%04d-%s.md\n' "$dir" $((max + 1)) "$slug"
