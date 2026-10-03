#!/usr/bin/env bash
set -euo pipefail

URL="${1:?Usage: navigate.sh <url>}"

WS=$(cmux identify | jq -r '.focused.workspace_ref')
SURF=$(cmux rpc surface.list "{\"workspace_ref\":\"$WS\"}" | jq -r '[.surfaces[] | select(.type == "browser")] | first | .ref // empty')

if [ -z "$SURF" ]; then
  cmux browser open-split "$URL"
else
  cmux browser "$SURF" navigate "$URL"
  cmux browser "$SURF" wait --load-state complete
fi
