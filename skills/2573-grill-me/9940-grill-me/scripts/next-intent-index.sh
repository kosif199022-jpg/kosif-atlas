#!/usr/bin/env bash
# Print the next zero-padded intent path for a given slug.
# Deterministic index computation — scans existing NNNN-*.md, returns max+1.
# Mirrors to-prd/scripts/next-prd-index.sh so the whole chain numbers alike.
# Usage: next-intent-index.sh <slug> [intent-dir]
#   next-intent-index.sh magic-link             -> docs/intent/0003-magic-link.md
#   next-intent-index.sh magic-link docs/notes  -> docs/notes/0003-magic-link.md
set -euo pipefail

slug="${1:?usage: next-intent-index.sh <slug> [intent-dir]}"
dir="${2:-docs/intent}"

mkdir -p "$dir"

max=0
for f in "$dir"/[0-9][0-9][0-9][0-9]-*.md; do
  [ -e "$f" ] || continue
  n=$(basename "$f" | cut -c1-4)
  n=$((10#$n))   # force base-10 (avoid octal on leading zeros)
  (( n > max )) && max=$n
done

printf '%s/%04d-%s.md\n' "$dir" $((max + 1)) "$slug"
