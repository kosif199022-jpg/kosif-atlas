#!/usr/bin/env bash
# Validate PlantUML, D2, and Structurizr DSL sources without leaving output files.
# The engine is chosen by file extension:
#   .puml .plantuml .pu .iuml .wsd -> PlantUML   .d2 -> D2   .dsl -> Structurizr
#   .md .markdown -> every ```plantuml / ```puml / ```d2 / ```structurizr fenced block
# Usage: validate.sh <file> [file ...]
# Exit code: 0 if everything is valid, 1 if any file or block has errors

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ $# -eq 0 ]; then
  echo "Usage: $0 <file> [file ...]"
  exit 1
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

errors=0

engine_for() {
  case "$(printf '%s' "${1##*.}" | tr '[:upper:]' '[:lower:]')" in
    puml|plantuml|pu|iuml|wsd) echo plantuml ;;
    d2) echo d2 ;;
    dsl) echo structurizr ;;
    md|markdown) echo markdown ;;
    *) echo unknown ;;
  esac
}

# Prints the tool output and returns non-zero when <file> is invalid for <engine>.
# Error line numbers are shifted by <offset> so a block extracted from Markdown reports
# lines of the Markdown file; <shown> replaces the temporary path in tool messages.
check_source() {
  local engine="$1" file="$2" offset="$3" shown="$4" out status
  case "$engine" in
    plantuml)
      out=$("$SCRIPT_DIR/plantuml.sh" -checkonly "$file" 2>&1) && status=0 || status=$?
      if [ $status -ne 0 ] || printf '%s' "$out" | grep -qi "error"; then
        echo "$out"
        plantuml_error_line "$file" "$offset" "$shown"
        return 1
      fi
      ;;
    d2)
      if ! command -v d2 &>/dev/null; then
        echo "d2 not found. Install with: brew install d2"
        return 1
      fi
      # d2 names the file twice: relative to cwd in its prefix, then absolute with line:col.
      local abs
      abs="$(cd "$(dirname "$file")" && pwd)/$(basename "$file")"
      out=$(d2 "$abs" "$WORK_DIR/check.svg" 2>&1) || {
        remap_paths "$(printf '%s\n' "$out" | sed -E 's/^err: failed to compile [^:]*: /err: /')" \
          "$abs" "$offset" "$shown"
        return 1
      }
      ;;
    structurizr)
      if ! command -v structurizr &>/dev/null; then
        echo "structurizr not found. Install with: brew install structurizr"
        return 1
      fi
      local abs
      abs="$(cd "$(dirname "$file")" && pwd)/$(basename "$file")"
      out=$(structurizr validate -workspace "$abs" 2>&1) || {
        structurizr_errors "$out" "$abs" "$offset" "$shown"
        return 1
      }
      ;;
  esac
}

# `-checkonly` does not say where the error is; `-syntax` does, as a line number counted
# from the @start line of the first diagram.
plantuml_error_line() {
  local file="$1" offset="$2" shown="$3" syntax start
  syntax=$("$SCRIPT_DIR/plantuml.sh" -syntax < "$file" 2>/dev/null) || true
  [ "$(printf '%s\n' "$syntax" | sed -n 1p)" = "ERROR" ] || return 0
  start=$(grep -n -m1 '^[[:space:]]*@start' "$file" | cut -d: -f1)
  [ -n "$start" ] || return 0
  echo "$shown:$((offset + start + $(printf '%s\n' "$syntax" | sed -n 2p))): $(printf '%s\n' "$syntax" | sed -n 3p)"
}

# Rewrites "<file>:<line>" in tool output to "<shown>:<line + offset>".
remap_paths() {
  local out="$1" file="$2" offset="$3" shown="$4"
  printf '%s\n' "$out" | awk -v f="$file" -v o="$offset" -v s="$shown" '{
    line = ""; rest = $0
    while ((i = index(rest, f ":")) > 0) {
      line = line substr(rest, 1, i - 1); rest = substr(rest, i + length(f) + 1)
      if (match(rest, /^[0-9]+/)) {
        line = line s ":" (substr(rest, 1, RLENGTH) + o); rest = substr(rest, RLENGTH + 1)
      } else line = line s ":"
    }
    print line rest
  }'
}

# Keeps only the ERROR lines of Structurizr's log output, without the logger prefix, and
# rewrites "at line <n> of <file>" to "at line <n + offset> of <shown>".
structurizr_errors() {
  local out="$1" file="$2" offset="$3" shown="$4" errs
  errs=$(printf '%s\n' "$out" | sed -n -E 's/^.*\] ERROR [^ ]+ -- //p')
  [ -n "$errs" ] || errs="$out"
  printf '%s\n' "$errs" | awk -v f="$file" -v o="$offset" -v s="$shown" '{
    key = " of " f; line = ""; rest = $0
    while ((i = index(rest, key)) > 0) {
      head = substr(rest, 1, i - 1); rest = substr(rest, i + length(key))
      if (match(head, /line [0-9]+$/)) {
        n = substr(head, RSTART + 5) + o; head = substr(head, 1, RSTART - 1) "line " n
      }
      line = line head " of " s
    }
    print line rest
  }'
}

report() {
  local label="$1" engine="$2" file="$3" offset="${4:-0}" shown="${5:-$3}" out
  echo -n "Checking $label ($engine) ... "
  if out=$(check_source "$engine" "$file" "$offset" "$shown"); then
    echo "OK"
  else
    echo "FAIL"
    echo "$out"
    errors=$((errors + 1))
  fi
}

# Splits the diagram fences of a Markdown file into $WORK_DIR, one file per block,
# and prints "<block file>\t<engine>\t<opening fence line>" for each.
extract_blocks() {
  local md="$1" prefix="$2"
  awk -v prefix="$prefix" '
    !inside && match($0, /^[ \t]*(```|~~~)[ \t]*[A-Za-z0-9_-]+/) {
      lang = tolower(substr($0, RSTART, RLENGTH)); sub(/^[ \t]*(```|~~~)[ \t]*/, "", lang)
      fence = substr($0, RSTART, RLENGTH); sub(/^[ \t]*/, "", fence); fence = substr(fence, 1, 3)
      if (lang == "plantuml" || lang == "puml") { engine = "plantuml"; ext = "puml" }
      else if (lang == "d2") { engine = "d2"; ext = "d2" }
      else if (lang == "structurizr") { engine = "structurizr"; ext = "dsl" }
      else next
      n++; out = prefix "-" n "." ext; inside = 1; printf "" > out
      printf "%s\t%s\t%d\n", out, engine, NR
      next
    }
    inside && index($0, fence) && $0 ~ /^[ \t]*(```|~~~)[ \t]*$/ { inside = 0; close(out); next }
    inside { print > out }
  ' "$md"
}

md_index=0
for file in "$@"; do
  if [ ! -f "$file" ]; then
    echo "SKIP: $file (file not found)"
    continue
  fi
  engine="$(engine_for "$file")"
  case "$engine" in
    unknown)
      echo "SKIP: $file (unknown extension; use .puml, .d2, .dsl, or .md)"
      ;;
    markdown)
      md_index=$((md_index + 1))
      blocks="$(extract_blocks "$file" "$WORK_DIR/md$md_index")"
      if [ -z "$blocks" ]; then
        echo "SKIP: $file (no plantuml, puml, d2, or structurizr fenced blocks)"
        continue
      fi
      while IFS=$'\t' read -r block block_engine line; do
        report "$file:$line" "$block_engine" "$block" "$line" "$file"
      done <<< "$blocks"
      ;;
    *)
      report "$file" "$engine" "$file"
      ;;
  esac
done

echo ""
if [ $errors -gt 0 ]; then
  echo "$errors file(s) or block(s) with errors"
  exit 1
fi
echo "All valid"
