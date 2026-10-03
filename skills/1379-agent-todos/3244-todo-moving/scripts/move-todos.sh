#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-$PWD}"
SOURCE_CATEGORY="${2:-}"
TARGET_CATEGORY="${3:-}"
TODO_SET="${4:-}"

if [ -z "$SOURCE_CATEGORY" ] || [ -z "$TARGET_CATEGORY" ] || [ -z "$TODO_SET" ]; then
  echo "Usage: $0 <project_root> <source_category> <target_category> <todo_set>" >&2
  echo "Example: $0 /repo misc seo 0011-0014,0020" >&2
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

read_agent_todos_config
SOURCE_DIR="$TODOS_ROOT/$SOURCE_CATEGORY"
TARGET_DIR="$TODOS_ROOT/$TARGET_CATEGORY"

if [ ! -d "$TODOS_ROOT" ]; then
  echo "Error: Todo root does not exist: $TODOS_ROOT" >&2
  exit 1
fi

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Error: Source category does not exist: $SOURCE_DIR" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"

declare -a REQUESTED_NUMS=()

a_num_exists() {
  local candidate="$1"
  local item
  for item in "${REQUESTED_NUMS[@]-}"; do
    if [ "$item" = "$candidate" ]; then
      return 0
    fi
  done
  return 1
}

num_in_reserved() {
  local candidate="$1"
  local item
  for item in "${RESERVED_NUMS[@]-}"; do
    if [ "$item" = "$candidate" ]; then
      return 0
    fi
  done
  return 1
}

normalize_num() {
  local raw="$1"
  printf "%04d" "$((10#$raw))"
}

add_requested_num() {
  local n="$1"
  if ! a_num_exists "$n"; then
    REQUESTED_NUMS+=("$n")
  fi
}

parse_todo_set() {
  local set_input="$1"
  local token
  local -a tokens
  IFS=',' read -r -a tokens <<< "$set_input"

  for token in "${tokens[@]}"; do
    token="$(echo "$token" | tr -d '[:space:]')"

    if [[ "$token" =~ ^[0-9]{1,4}$ ]]; then
      add_requested_num "$(normalize_num "$token")"
      continue
    fi

    if [[ "$token" =~ ^([0-9]{1,4})-([0-9]{1,4})$ ]]; then
      local start end current swap
      start="$((10#${BASH_REMATCH[1]}))"
      end="$((10#${BASH_REMATCH[2]}))"

      if [ "$start" -gt "$end" ]; then
        swap="$start"
        start="$end"
        end="$swap"
      fi

      current="$start"
      while [ "$current" -le "$end" ]; do
        add_requested_num "$(printf "%04d" "$current")"
        current=$((current + 1))
      done
      continue
    fi

    echo "Error: Invalid todo set token: '$token'" >&2
    exit 1
  done
}

renumber_open_todos() {
  local category_dir="$1"
  local category_name
  local done_file
  local open_file
  local base
  local next
  local index

  category_name="$(basename "$category_dir")"

  declare -a RESERVED_NUMS=()
  declare -a OPEN_FILES=()
  declare -a TMP_FILES=()
  declare -a FINAL_FILES=()

  while IFS= read -r done_file; do
    base="$(basename "$done_file")"
    if [[ "$base" =~ ^DONE_([0-9]{4})_ ]]; then
      RESERVED_NUMS+=("${BASH_REMATCH[1]}")
    fi
  done < <(find "$category_dir" -maxdepth 1 -type f -name 'DONE_*.md' | sort)

  if [ -d "$category_dir/_archived" ]; then
    while IFS= read -r done_file; do
      base="$(basename "$done_file")"
      if [[ "$base" =~ ^ARCHIVED_([0-9]{4})_ ]]; then
        RESERVED_NUMS+=("${BASH_REMATCH[1]}")
      fi
    done < <(find "$category_dir/_archived" -maxdepth 1 -type f -name 'ARCHIVED_*.md' | sort)
  fi

  while IFS= read -r open_file; do
    base="$(basename "$open_file")"
    if [[ "$base" =~ ^[0-9]{4}_.+\.md$ ]]; then
      OPEN_FILES+=("$open_file")
    fi
  done < <(find "$category_dir" -maxdepth 1 -type f -name '*.md' ! -name 'DONE_*.md' | sort)

  if [ "${#OPEN_FILES[@]}" -eq 0 ]; then
    return 0
  fi

  next=1
  index=0

  for open_file in "${OPEN_FILES[@]}"; do
    local open_base suffix assigned
    local tmp_name tmp_path final_path

    open_base="$(basename "$open_file")"
    suffix="${open_base#????_}"

    while :; do
      assigned="$(printf "%04d" "$next")"
      if ! num_in_reserved "$assigned"; then
        break
      fi
      next=$((next + 1))
    done

    tmp_name=".__todo-moving-tmp__${index}__${open_base}"
    tmp_path="$category_dir/$tmp_name"
    final_path="$category_dir/${assigned}_${suffix}"

    mv "$open_file" "$tmp_path"
    TMP_FILES+=("$tmp_path")
    FINAL_FILES+=("$final_path")

    echo "renumber:$category_name: ${open_base} -> $(basename "$final_path")"

    next=$((next + 1))
    index=$((index + 1))
  done

  for index in "${!TMP_FILES[@]}"; do
    mv "${TMP_FILES[$index]}" "${FINAL_FILES[$index]}"
  done
}

parse_todo_set "$TODO_SET"

if [ "${#REQUESTED_NUMS[@]}" -eq 0 ]; then
  echo "Error: No todo numbers were parsed from todo_set" >&2
  exit 1
fi

declare -a MOVED_FILES=()

for num in "${REQUESTED_NUMS[@]}"; do
  local_matches=("$SOURCE_DIR/${num}_"*.md)
  if [ "${#local_matches[@]}" -eq 1 ] && [ -e "${local_matches[0]}" ]; then
    src_file="${local_matches[0]}"
    dest_file="$TARGET_DIR/$(basename "$src_file")"

    if [ -e "$dest_file" ]; then
      echo "Error: Target already contains $(basename "$dest_file")" >&2
      exit 1
    fi

    mv "$src_file" "$dest_file"
    MOVED_FILES+=("$(basename "$src_file")")
    echo "moved: $SOURCE_CATEGORY/$(basename "$src_file") -> $TARGET_CATEGORY/$(basename "$src_file")"
  else
    echo "warning: No unique open todo found for number $num in $SOURCE_CATEGORY" >&2
  fi
done

renumber_open_todos "$SOURCE_DIR"
renumber_open_todos "$TARGET_DIR"

echo "done: moved ${#MOVED_FILES[@]} todo file(s)"
