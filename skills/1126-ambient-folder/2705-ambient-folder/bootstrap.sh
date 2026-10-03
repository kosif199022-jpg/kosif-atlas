#!/usr/bin/env bash
# bootstrap.sh — one-line install of any canonical capability, no library plugin needed.
#
#   curl -fsSL https://raw.githubusercontent.com/coachlou/ambient-library/main/library/ambient-folder/bootstrap.sh | bash -s -- <cap> [target-dir]
#
# Fetches the released library and runs ambient-folder/install.sh <cap> on
# <target-dir> (default: current directory). Needs tar. Re-run to update.
#
# This script is public; the release it installs is not. So it needs GitHub read
# access to coachlou/aai-library: either the `gh` CLI signed in (`gh auth login`),
# or GITHUB_TOKEN / GH_TOKEN set. With neither, ask for an invite to that repo.
set -euo pipefail
[ -n "${1:-}" ] || { sed -n '2,11p' "$0" 2>/dev/null || echo "usage: bootstrap.sh <cap> [target]"; exit 2; }
REPO="coachlou/aai-library"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
# ponytail: whole-repo tarball (a few MB) — portable across BSD/GNU tar
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  gh api "repos/$REPO/tarball/main" > "$TMP/lib.tar.gz"
elif [ -n "${GITHUB_TOKEN:-${GH_TOKEN:-}}" ]; then
  curl -fsSL -H "Authorization: Bearer ${GITHUB_TOKEN:-${GH_TOKEN:-}}" \
    -o "$TMP/lib.tar.gz" "https://api.github.com/repos/$REPO/tarball/main"
else
  sed -n '9,11p' "$0" >&2; exit 2
fi
tar -xzf "$TMP/lib.tar.gz" -C "$TMP"
# the API tarball's top folder is <owner>-<repo>-<sha>, not <repo>-<branch>
ROOT="$(find "$TMP" -maxdepth 1 -type d -name '*-aai-library-*' -print -quit)"
[ -n "$ROOT" ] || { echo "unexpected tarball layout from $REPO" >&2; exit 2; }
bash "$ROOT/library/ambient-folder/install.sh" "$@"
