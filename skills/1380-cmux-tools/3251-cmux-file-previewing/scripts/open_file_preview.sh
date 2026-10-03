#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $(basename "$0") file [file2 ...]" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_FILE="$SCRIPT_DIR/.pane_ref"

pane_exists() {
  cmux list-panes | grep -qF "$1"
}

PANE=""
if [ -f "$STATE_FILE" ]; then
  CACHED="$(cat "$STATE_FILE")"
  if [ -n "$CACHED" ] && pane_exists "$CACHED"; then
    PANE="$CACHED"
  fi
fi

if [ -z "$PANE" ]; then
  OUT="$(cmux new-pane --direction right --focus false)"
  PANE="$(printf '%s' "$OUT" | grep -oE 'pane:[0-9]+')"
  printf '%s' "$PANE" > "$STATE_FILE"
fi

for FILE in "$@"; do
  ABS="$(cd "$(dirname "$FILE")" && pwd)/$(basename "$FILE")"
  cmux open --pane "$PANE" "$ABS" --focus true
done
