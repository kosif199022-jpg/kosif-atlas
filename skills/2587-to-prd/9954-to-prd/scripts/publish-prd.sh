#!/usr/bin/env bash
# Publish a PRD file to GitHub Issues, with safe fallbacks.
# Usage: publish-prd.sh <prd-file> <title>
# Fallbacks (each warns to stderr, never fails the pipeline):
#   - gh not installed        -> skip tracker, file on disk only
#   - not a gh-authed repo     -> skip tracker, file on disk only
#   - 'needs-triage' missing   -> create issue without the label
set -euo pipefail

file="${1:?usage: publish-prd.sh <prd-file> <title>}"
title="${2:?usage: publish-prd.sh <prd-file> <title>}"

if ! command -v gh >/dev/null 2>&1; then
  echo "WARN: gh not installed — PRD saved to '$file' only (no tracker issue)." >&2
  exit 0
fi

if ! gh repo view >/dev/null 2>&1; then
  echo "WARN: not a GitHub repo / gh not authenticated — PRD saved to '$file' only." >&2
  exit 0
fi

label_args=()
if gh label list --json name -q '.[].name' 2>/dev/null | grep -qx 'needs-triage'; then
  label_args=(--label needs-triage)
else
  echo "WARN: 'needs-triage' label missing — creating issue without it." >&2
fi

gh issue create --title "$title" --body-file "$file" "${label_args[@]}"
