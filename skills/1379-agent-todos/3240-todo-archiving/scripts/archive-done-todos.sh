#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-$PWD}"
CATEGORY="${2:-}"

if [ -z "$CATEGORY" ]; then
  echo "Usage: $0 <project_root> <category>" >&2
  echo "Example: $0 /repo plugin-agent-todos" >&2
  exit 1
fi

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
  v="$(_read_json_key "$config_file" todosRoot)";  [ -n "$v" ] && TODOS_ROOT="${v/#\~/$HOME}"
}

update_status_to_archived() {
  local file="$1"
  local tmp_file
  tmp_file="$(mktemp "${TMPDIR:-/tmp}/todo-archive.XXXXXX")"

  awk '
    BEGIN { in_fm = 0; seen_start = 0; changed = 0 }
    NR == 1 && $0 == "---" { in_fm = 1; seen_start = 1; print; next }
    in_fm && $0 == "---" {
      if (!changed) {
        print "status: archived"
        changed = 1
      }
      in_fm = 0
      print
      next
    }
    in_fm && $0 ~ /^status:/ {
      if (!changed) {
        print "status: archived"
        changed = 1
      }
      next
    }
    { print }
    END {
      if (!seen_start) {
        exit 2
      }
    }
  ' "$file" > "$tmp_file" || {
    rm -f "$tmp_file"
    echo "Error: Todo has no YAML frontmatter: $file" >&2
    exit 1
  }

  mv "$tmp_file" "$file"
}

extract_frontmatter_value() {
  local file="$1"
  local key="$2"
  awk -v key="$key" '
    NR == 1 && $0 == "---" { in_fm = 1; next }
    in_fm && $0 == "---" { exit }
    in_fm && index($0, key ":") == 1 {
      value = substr($0, length(key) + 2)
      sub(/^[[:space:]]+/, "", value)
      sub(/[[:space:]]+$/, "", value)
      if (value ~ /^'\''.*'\''$/ || value ~ /^".*"$/) {
        value = substr(value, 2, length(value) - 2)
      }
      gsub(/'\'''\''/, "'\''", value)
      print value
      exit
    }
  ' "$file"
}

title_from_filename() {
  local base="$1"
  base="${base%.md}"
  base="${base#ARCHIVED_}"
  base="${base#DONE_}"
  base="${base#????_}"
  base="$(printf '%s' "$base" | tr '_-' ' ')"
  printf '%s%s\n' "$(printf '%s' "${base:0:1}" | tr '[:lower:]' '[:upper:]')" "${base:1}"
}

first_context_line() {
  local file="$1"
  awk '
    /^## / {
      in_context = ($0 ~ /^## (Problem \/ Context|Context)$/)
      next
    }
    in_context {
      if ($0 ~ /^[[:space:]]*$/) next
      if ($0 ~ /^```/) next
      if ($0 ~ /^[-*] \[[ xX]\]/) next
      print
      exit
    }
  ' "$file"
}

write_index() {
  local archive_dir="$1"
  local category="$2"
  local index_file="$archive_dir/Index.md"
  local archived_file base title description

  {
    printf '# Archived todos: %s\n\n' "$category"
    printf '| Todo | Description |\n'
    printf '| --- | --- |\n'

    while IFS= read -r archived_file; do
      base="$(basename "$archived_file")"
      title="$(extract_frontmatter_value "$archived_file" title)"
      [ -n "$title" ] || title="$(title_from_filename "$base")"
      description="$(first_context_line "$archived_file")"
      [ -n "$description" ] || description="Archived todo"
      description="$(printf '%s' "$description" | tr '\n|' ' /')"
      printf '| [%s](%s) | %s |\n' "$title" "$base" "$description"
    done < <(find "$archive_dir" -maxdepth 1 -type f -name 'ARCHIVED_*.md' | sort)
  } > "$index_file"
}

read_agent_todos_config
CATEGORY_DIR="$TODOS_ROOT/$CATEGORY"
ARCHIVE_DIR="$CATEGORY_DIR/_archived"

if [ ! -d "$TODOS_ROOT" ]; then
  echo "Error: Todo root does not exist: $TODOS_ROOT" >&2
  exit 1
fi

if [ ! -d "$CATEGORY_DIR" ]; then
  echo "Error: Category does not exist: $CATEGORY_DIR" >&2
  exit 1
fi

mkdir -p "$ARCHIVE_DIR"

archived_count=0

while IFS= read -r done_file; do
  base="$(basename "$done_file")"
  target_base="ARCHIVED_${base#DONE_}"
  target_file="$ARCHIVE_DIR/$target_base"

  if [ -e "$target_file" ]; then
    echo "Error: Archive target already exists: $target_file" >&2
    exit 1
  fi

  update_status_to_archived "$done_file"
  mv "$done_file" "$target_file"
  archived_count=$((archived_count + 1))
  echo "archived: $CATEGORY/$base -> $CATEGORY/_archived/$target_base"
done < <(find "$CATEGORY_DIR" -maxdepth 1 -type f -name 'DONE_*.md' | sort)

write_index "$ARCHIVE_DIR" "$CATEGORY"

echo "done: archived $archived_count todo file(s)"
echo "index: $ARCHIVE_DIR/Index.md"
