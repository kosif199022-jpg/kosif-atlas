#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

echo "Fetching and pruning remote tracking refs..."
git fetch --prune origin

# Branches fully merged into main
MERGED=$(git branch --merged main | grep -vE '^\*|^[[:space:]]*(main|master|develop)$' | sed 's/^[[:space:]]*//' || true)

# Branches whose remote tracking is gone
GONE=$(git branch -vv | grep ': gone]' | awk '{print $1}' | grep -vE '^(main|master|develop)$' || true)

# Branches with a remote tracking ref but whose PR is merged or closed
CLOSED_PR=""
if command -v gh &>/dev/null; then
  while IFS= read -r branch; do
    [ -z "$branch" ] && continue
    state=$(gh pr list --head "$branch" --state all --json state --jq '.[0].state // empty' 2>/dev/null || true)
    if [[ "$state" == "MERGED" || "$state" == "CLOSED" ]]; then
      CLOSED_PR="$CLOSED_PR"$'\n'"$branch"
    fi
  done < <(git branch -vv | grep -v ': gone]' | awk '/origin\// {print $1}' | grep -vE '^(main|master|develop)$')
fi

# Deduplicate
CANDIDATES=$(printf '%s\n%s\n%s\n' "$MERGED" "$GONE" "$CLOSED_PR" | sort -u | grep -v '^$' || true)

if [ -z "$CANDIDATES" ]; then
  echo "Nothing to clean up — no merged or orphaned local branches found."
  exit 0
fi

echo ""
echo "Branches to delete:"
echo "$CANDIDATES" | while read -r branch; do
  echo "  - $branch"
done
echo ""
read -rp "Delete these branches? [y/N] " confirm

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo ""
DELETED=()
SKIPPED=()

while IFS= read -r branch; do
  [ -z "$branch" ] && continue
  # Delete remote branch if it still exists
  if git ls-remote --exit-code origin "$branch" &>/dev/null; then
    git push origin --delete "$branch" 2>/dev/null || true
  fi
  if git branch -d "$branch" 2>/dev/null; then
    DELETED+=("$branch")
  else
    # Likely squash/rebase merged — safe to force
    if git branch -D "$branch" 2>/dev/null; then
      DELETED+=("$branch (force)")
    else
      SKIPPED+=("$branch")
    fi
  fi
done <<< "$CANDIDATES"

if [ ${#DELETED[@]} -gt 0 ]; then
  echo "Deleted:"
  for b in "${DELETED[@]}"; do echo "  - $b"; done
fi

if [ ${#SKIPPED[@]} -gt 0 ]; then
  echo "Skipped:"
  for b in "${SKIPPED[@]}"; do echo "  - $b"; done
fi
