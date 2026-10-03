#!/usr/bin/env bash
# install.sh — vendor a canonical capability into a folder and stamp .aai/ if absent.
#
#   bash install.sh <cap> [target-dir]        default target: current directory
#   bash install.sh <cap> --check [target]    plan only, write nothing
#
# Any capability works. A capability is a DISTRO when it ships templates/aai/
# ({identity,instructions,context}.md with {{NAME}}); those stamp the folder's
# .aai/ on first install. Optional: app/VERSION (vendored code), install.d/post.sh
# (extra steps; runs with TARGET and CAP_DIR set), DEPENDS (capabilities to vendor alongside).
#
# Writes (owned, never overwritten if present):   <target>/.aai/*.md   (distros only)
# Writes (vendored, always re-synced):            <target>/.ailib/<cap>/ + dependency closure + manifest.yaml
# Appends a discovery anchor to <target>/CLAUDE.md, AGENTS.md and GEMINI.md, and to
# any other agent-adapter instruction file already present (.cursorrules,
# .github/copilot-instructions.md, .windsurfrules, .clinerules, CONVENTIONS.md, QWEN.md).
# Re-running is the update path: .ailib/ refreshed, .aai/ untouched.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB="$(dirname "$HERE")"                       # library/ or a folder's .ailib/
CAP="${1:-}"; [ -n "$CAP" ] || { sed -n '2,16p' "$0"; exit 2; }; shift
CHECK=0; TARGET=""
while [ $# -gt 0 ]; do
  case "$1" in
    --check) CHECK=1; shift ;;
    --help|-h) sed -n '2,16p' "$0"; exit 0 ;;
    --*) echo "unknown flag: $1" >&2; exit 2 ;;
    *) TARGET="$1"; shift ;;
  esac
done
CAP_DIR="$LIB/$CAP"
[ -f "$CAP_DIR/SKILL.md" ] || { echo "no capability '$CAP' at $CAP_DIR" >&2; exit 2; }
TARGET="${TARGET:-$PWD}"; mkdir -p "$TARGET"; TARGET="$(cd "$TARGET" && pwd)"
case "$TARGET" in "$LIB"|"$LIB"/*) echo "refusing: target is inside the library" >&2; exit 2 ;; esac
NAME="$(basename "$TARGET")"; DATE=$(date -u +%F)
DISTRO=0; [ -f "$CAP_DIR/templates/aai/instructions.md" ] && DISTRO=1

ver() { python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['version'])" "$1/.claude-plugin/plugin.json" 2>/dev/null || echo unknown; }
say() { printf '%s\n' "$*"; }
plan() { say "  $1  $2"; }

# dependency closure: each capability may list others, one per line, in DEPENDS
# ponytail: explicit list instead of grepping bodies for library/<x>/ — prose mentions are not dependencies
closure() {
  local seen=" $CAP " queue="$CAP" c n
  while [ -n "$queue" ]; do
    c="${queue%% *}"; queue="${queue#"$c"}"; queue="${queue# }"
    [ -f "$LIB/$c/DEPENDS" ] || continue
    for n in $(grep -vE '^\s*(#|$)' "$LIB/$c/DEPENDS"); do
      case "$seen" in *" $n "*) ;; *) [ -d "$LIB/$n" ] && { seen="$seen$n "; queue="$queue $n"; } ;; esac
    done
  done
  echo "$seen"
}
CAPS="$(closure)"

# ── plan ─────────────────────────────────────────────────────────────────────
say "target: $TARGET"
if [ $DISTRO = 1 ]; then
  if [ -f "$TARGET/.aai/instructions.md" ]; then plan keep ".aai/ (exists — owned, untouched)"; else plan write ".aai/{identity,instructions,context}.md from $CAP"; fi
fi
for c in $CAPS; do plan sync ".ailib/$c/ ($(ver "$LIB/$c")$( [ -f "$LIB/$c/app/VERSION" ] && printf ', %s' "$(head -1 "$LIB/$c/app/VERSION")"))"; done
plan write ".ailib/manifest.yaml"
# CLAUDE.md, AGENTS.md and GEMINI.md are always written (each harness auto-loads
# only its own); other adapters only if the folder already uses them.
ANCHOR_FILES="CLAUDE.md AGENTS.md GEMINI.md"
for f in QWEN.md CONVENTIONS.md .cursorrules .windsurfrules .clinerules .github/copilot-instructions.md; do
  [ -f "$TARGET/$f" ] && ANCHOR_FILES="$ANCHOR_FILES $f"
done
for f in $ANCHOR_FILES; do
  if [ -f "$TARGET/$f" ] && grep -q 'ambient folder' "$TARGET/$f"; then plan keep "$f (anchor present)"; else plan anchor "$f"; fi
done
[ -f "$CAP_DIR/install.d/post.sh" ] && plan run "$CAP/install.d/post.sh"
[ $CHECK = 1 ] && { say "nothing written."; exit 0; }

# ── .aai (owned) ─────────────────────────────────────────────────────────────
if [ $DISTRO = 1 ] && [ ! -f "$TARGET/.aai/instructions.md" ]; then
  mkdir -p "$TARGET/.aai"
  for t in "$CAP_DIR"/templates/aai/*.md; do
    sed "s/{{NAME}}/$NAME/g" "$t" > "$TARGET/.aai/$(basename "$t")"
  done
fi

# ── .ailib (vendored) ────────────────────────────────────────────────────────
for c in $CAPS; do
  mkdir -p "$TARGET/.ailib/$c"
  rsync -a --delete --exclude='.DS_Store' "$LIB/$c/" "$TARGET/.ailib/$c/"
  # A capability with a contract needs the resolver beside it. The release build
  # copies it in; installing from a source clone has it only at scripts/.
  if [ -f "$TARGET/.ailib/$c/contract.yaml" ] && [ ! -f "$TARGET/.ailib/$c/scripts/resolve.py" ]; then
    [ -f "$LIB/../scripts/resolve.py" ] || { echo "no resolver for '$c' at $LIB/../scripts/resolve.py" >&2; exit 2; }
    mkdir -p "$TARGET/.ailib/$c/scripts"
    cp "$LIB/../scripts/resolve.py" "$TARGET/.ailib/$c/scripts/resolve.py"
  fi
done
python3 - "$TARGET/.ailib/manifest.yaml" "$CAP" "$DATE" $CAPS <<'PY'
import sys,re,os,json
path,cap,date,*caps=sys.argv[1:]
old=open(path).read() if os.path.exists(path) else ""
blocks=dict(re.findall(r"^([a-z0-9-]+):\n((?:  .*\n?)*)",old,re.M))
lib=os.path.dirname(path)
for c in caps:
    try: ver=json.load(open(f"{lib}/{c}/.claude-plugin/plugin.json"))["version"]
    except Exception: ver="unknown"
    b=f'  source: ambient-library/library/{c}\n  version: "{ver}"\n'
    vf=f"{lib}/{c}/app/VERSION"
    if os.path.exists(vf): b+=f'  app: "{open(vf).readline().strip()}"\n'
    if c!=cap: b+=f"  required-by: {cap}\n"
    b+=f"  installed: {date}\n"
    blocks[c]=b
out="# Vendored canonical capabilities — pristine, re-synced by ambient-folder/install.sh; never edit here.\n"
out+="".join(f"{k}:\n{v}" for k,v in sorted(blocks.items()))
open(path,"w").write(out)
PY

# ── anchors ──────────────────────────────────────────────────────────────────
for f in $ANCHOR_FILES; do
  if ! { [ -f "$TARGET/$f" ] && grep -q 'ambient folder' "$TARGET/$f"; }; then
    [ -f "$TARGET/$f" ] && printf '\n' >> "$TARGET/$f"
    cat >> "$TARGET/$f" <<MD
## Ambient folder

This folder is an ambient folder: \`$CAP\` is its agentic function.
**Read \`.aai/instructions.md\` and follow it before acting.** "Ambient folder"
means a folder with an \`.aai/\` behavior layer. Do not scaffold a project here
unless \`.aai/instructions.md\` says to.
MD
  fi
done

# ── capability hook ──────────────────────────────────────────────────────────
if [ -f "$CAP_DIR/install.d/post.sh" ]; then
  TARGET="$TARGET" CAP_DIR="$TARGET/.ailib/$CAP" bash "$CAP_DIR/install.d/post.sh"
  # post.sh may rewrite vendored files (SDF relocates app/install.sh, restamps app/VERSION).
  # List them so audit-compliance.py can tell hook output from hand edits.
  (cd "$TARGET/.ailib/$CAP" && find . -type f ! -name .post-install | sort | while read -r f; do
    cmp -s "$f" "$CAP_DIR/$f" || echo "${f#./}"; done) > "$TARGET/.ailib/$CAP/.post-install"
fi
say "installed $CAP $(ver "$CAP_DIR") into $TARGET"
