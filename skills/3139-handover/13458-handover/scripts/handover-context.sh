#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
handover_dir="$repo_root/.handover"
mkdir -p "$handover_dir"

printf 'repo-root: %s\n' "$repo_root"
printf 'handover-dir: %s\n' "$handover_dir"
printf 'filename-timestamp: %s\n' "$(date +'%Y%m%d-%H%M')"
printf 'now: %s\n' "$(date +'%Y-%m-%d %H:%M %Z %z')"
printf 'git-status (first 20):\n'
git status --short | head -20
