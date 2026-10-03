#!/usr/bin/env bash
# scan.sh — emit one JSON object per top-level folder in each given directory.
# Usage: scan.sh <dir> [<dir> ...]   (JSONL to stdout, diagnostics to stderr)
# No recursion: only immediate children are scanned. Requires python3 + git.
set -u
[ $# -ge 1 ] || { echo "usage: scan.sh <dir> [<dir> ...]" >&2; exit 2; }

scan_dir() {
  local base="$1"
  for d in "$base"/*/ ; do
    [ -d "$d" ] || continue
    name=$(basename "$d")
    case "$name" in .git|.claude|node_modules) continue ;; esac

    is_git="false"; last_commit=""; branch=""; dirty=""; remote=""
    if [ -d "$d/.git" ]; then
      is_git="true"
      branch=$(git -C "$d" branch --show-current 2>/dev/null | tr -d '\n')
      last_commit=$(git -C "$d" log -1 --format='%ad|%s' --date=short 2>/dev/null | tr '\n' ' ')
      dirty=$(git -C "$d" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
      remote=$(git -C "$d" remote get-url origin 2>/dev/null | tr -d '\n')
    fi

    readme=""
    for rf in README.md readme.md README.MD Readme.md; do
      [ -f "$d$rf" ] && { readme=$(head -c 500 "$d$rf" | tr '\n\t' '  '); break; }
    done

    pkg_desc=""
    [ -f "$d/package.json" ] && pkg_desc=$(grep -m1 '"description"' "$d/package.json" 2>/dev/null | sed -E 's/.*"description":[[:space:]]*"([^"]*)".*/\1/')

    # newest mtime among top-level entries (GNU/BSD stat both handled by python)
    mtime_h=$(python3 -c "
import os,sys,datetime
d=sys.argv[1]
try:
    ts=max(os.path.getmtime(os.path.join(d,f)) for f in os.listdir(d)) if os.listdir(d) else os.path.getmtime(d)
except Exception:
    ts=os.path.getmtime(d)
print(datetime.date.fromtimestamp(ts))" "$d")

    top_files=$(find "$d" -maxdepth 1 -type f -not -name '.*' 2>/dev/null | while read -r f; do basename "$f"; done | tr '\n' ',' | sed 's/,$//')

    python3 - "$name" "$base" "$is_git" "$branch" "$last_commit" "$dirty" "$remote" "$readme" "$pkg_desc" "$mtime_h" "$top_files" <<'PYEOF'
import json,sys
k=["name","base","is_git","branch","last_commit","dirty","remote","readme","pkg_desc","mtime","top_files"]
v=dict(zip(k,sys.argv[1:12])); v["is_git"]=v["is_git"]=="true"
print(json.dumps(v))
PYEOF
  done
}

for base in "$@"; do
  [ -d "$base" ] || { echo "skip (not a dir): $base" >&2; continue; }
  scan_dir "$base"
done
