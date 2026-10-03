#!/usr/bin/env bash
set -euo pipefail

QUESTION="${1:?Usage: ask-chatgpt.sh <question>}"

# Find the ChatGPT surface across all workspaces by parsing the cmux tree
SURF=$(cmux tree --all 2>&1 | grep "chatgpt.com" | grep -o "surface:[0-9]*" | head -1)

if [ -z "$SURF" ]; then
  echo "No ChatGPT browser surface found in any workspace." >&2
  exit 1
fi

echo "Found ChatGPT on $SURF"

# Fill the prompt input (ChatGPT uses #prompt-textarea)
cmux browser "$SURF" fill "#prompt-textarea" "$QUESTION"

# Submit — try each selector in sequence until one works
cmux browser "$SURF" click "button[data-testid='send-button']" 2>/dev/null \
  || cmux browser "$SURF" click "[aria-label*='Senden']" 2>/dev/null \
  || cmux browser "$SURF" click "button[aria-label*='Send']"

# Wait for the response to stream in, then screenshot
sleep 4
SCREENSHOT=$(cmux browser "$SURF" screenshot --json | grep '"path"' | sed 's/.*"path" : "\(.*\)".*/\1/')
echo "Screenshot: $SCREENSHOT"
