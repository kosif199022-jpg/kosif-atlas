#!/usr/bin/env bash
# create-todo.sh — Create a new todo file with frontmatter and sequential numbering.
#
# Usage: create-todo.sh <category> <title> [base-dir]
#
#   category  — Subdirectory name under docs/agent-todos/ (created if missing)
#   title     — Human-readable title for the todo
#   base-dir  — Project root (defaults to $PWD)
#
# The script:
#   1. Scans all files (open, DONE_, and archived) in the category to find the highest number
#   2. Generates the next 4-digit prefix
#   3. Converts the title to snake_case, truncated to 60 characters
#   4. Creates the file with YAML frontmatter (title, status: new, tags) and section stubs

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: create-todo.sh <category> <title> [base-dir]" >&2
  exit 1
fi

CATEGORY="$1"
TITLE="$2"
BASE_DIR="${3:-$PWD}"
PROJECT_ROOT="$BASE_DIR"

# ---------------------------------------------------------------------------
# Agent-todos config reader
# Reads .agent-todos.local.json and sets TODOS_ROOT
# ---------------------------------------------------------------------------
_read_json_key() {
  jq -r --arg key "$2" '.[$key] // empty' "$1" 2>/dev/null
}

read_agent_todos_config() {
  local config_file="$PROJECT_ROOT/.agent-todos.local.json"
  TODOS_ROOT="$PROJECT_ROOT/docs/agent-todos"
  PROJECT_NAME=""

  # Worktree fallback: if config not found in PROJECT_ROOT, check the main worktree root
  if [ ! -f "$config_file" ]; then
    local git_common_dir
    git_common_dir=$(git -C "$PROJECT_ROOT" rev-parse --git-common-dir 2>/dev/null) || true
    if [ -n "$git_common_dir" ]; then
      [[ "$git_common_dir" = /* ]] || git_common_dir="$PROJECT_ROOT/$git_common_dir"
      config_file="$(dirname "$git_common_dir")/.agent-todos.local.json"
    fi
  fi

  [ -f "$config_file" ] || return 0
  local v
  v="$(_read_json_key "$config_file" todosRoot)";    if [ -n "$v" ]; then TODOS_ROOT="${v/#\~/$HOME}"; fi
  v="$(_read_json_key "$config_file" projectName)";  if [ -n "$v" ]; then PROJECT_NAME="$v"; fi
}

read_agent_todos_config
TODO_DIR="$TODOS_ROOT/$CATEGORY"

# Create category directory if it does not exist
mkdir -p "$TODO_DIR"

consider_prefix_from_basename() {
  local base="$1"
  local stripped num num_val

  stripped=${base#DONE_}
  stripped=${stripped#ARCHIVED_}
  num=${stripped%%[!0-9]*}

  if [ -n "$num" ]; then
    num_val=$((10#$num))
    if [ "$num_val" -gt "$MAX_NUM" ]; then
      MAX_NUM=$num_val
    fi
  fi
}

# Find the highest numeric prefix across all files in the category.
# Matches patterns: NNNN_*, DONE_NNNN_*, _archived/ARCHIVED_NNNN_*
MAX_NUM=0
for file in "$TODO_DIR"/*; do
  [ -e "$file" ] || continue
  [ -f "$file" ] || continue
  consider_prefix_from_basename "$(basename "$file")"
done

if [ -d "$TODO_DIR/_archived" ]; then
  for file in "$TODO_DIR/_archived"/ARCHIVED_*.md; do
    [ -e "$file" ] || continue
    consider_prefix_from_basename "$(basename "$file")"
  done
fi

NEXT_NUM=$((MAX_NUM + 1))
PREFIX=$(printf "%04d" "$NEXT_NUM")

# Convert title to snake_case filename
SNAKE=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/_/g' | sed 's/__*/_/g' | sed 's/^_//;s/_$//')

# Truncate to 60 characters
SNAKE=$(echo "$SNAKE" | cut -c1-60 | sed 's/_$//')

FILENAME="${PREFIX}_${SNAKE}.md"
FILEPATH="$TODO_DIR/$FILENAME"

# Escape single quotes in title for YAML single-quoted scalar
YAML_TITLE=$(printf '%s' "$TITLE" | sed "s/'/''/g")

# Build optional projects block
PROJECTS_BLOCK=""
if [ -n "$PROJECT_NAME" ]; then
  PROJECTS_BLOCK="projects:
- '${PROJECT_NAME}'
"
fi

# Write the file
cat > "$FILEPATH" <<EOF
---
title: '${YAML_TITLE}'
status: new
${PROJECTS_BLOCK}tags:
- todo
- agent-todo
---

## Context

## Tasks

EOF

echo "$FILEPATH"
