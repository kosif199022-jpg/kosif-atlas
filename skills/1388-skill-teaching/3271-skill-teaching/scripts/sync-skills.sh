#!/usr/bin/env bash
set -euo pipefail

# Sync Claude Code skills to other AI agents
# Usage: sync-skills.sh <target> [project-root]
# Targets: codex, opencode, agents, gemini

PROJECT_ROOT="${2:-$PWD}"
SETTINGS_FILE="$PROJECT_ROOT/.claude/settings.json"
SKILLS_DIR="$PROJECT_ROOT/.claude/skills"
TEMP_FILE="/tmp/synced_skills_$$"

TARGET="${1:-}"

if [[ -z "$TARGET" ]]; then
  echo "Usage: sync-skills.sh <target>"
  echo "Available targets: codex, opencode, agents, gemini"
  exit 1
fi

case "$TARGET" in
  codex)
    DEST="$PROJECT_ROOT/.codex/skills"
    MANIFEST="$DEST/.claude-synced-skills.json"
    ;;
  opencode)
    DEST="$PROJECT_ROOT/.opencode/skills"
    MANIFEST="$DEST/.claude-synced-skills.json"
    ;;
  agents)
    DEST="$PROJECT_ROOT/.agents/skills"
    MANIFEST="$DEST/.claude-synced-skills.json"
    ;;
  gemini)
    DEST="$PROJECT_ROOT/.gemini/skills"
    MANIFEST="$DEST/.claude-synced-skills.json"
    ;;
  *)
    echo "Error: Unknown target '$TARGET'"
    echo "Available targets: codex, opencode, agents, gemini"
    exit 1
    ;;
esac

mkdir -p "$DEST"
: > "$TEMP_FILE"  # Create/clear temp file

# Step 1: Delete previously synced skills (preserve target's own skills)
if [[ -f "$MANIFEST" ]]; then
  echo "Cleaning previously synced skills..."
  while read -r skill; do
    if [[ -n "$skill" ]] && [[ -d "$DEST/$skill" ]]; then
      rm -rf "${DEST:?}/$skill"
      echo "  Removed: $skill"
    fi
  done < <(jq -r '.skills[]' "$MANIFEST" 2>/dev/null || true)
fi

# Step 2: Copy local skills (except skill-teaching itself)
echo "Copying local skills..."
if [[ -d "$SKILLS_DIR" ]]; then
  for skill_dir in "$SKILLS_DIR"/*/; do
    [[ -d "$skill_dir" ]] || continue
    skill_name="$(basename "$skill_dir")"
    if [[ "$skill_name" != "skill-teaching" ]]; then
      cp -R "${skill_dir%/}" "$DEST/"
      echo "$skill_name" >> "$TEMP_FILE"
      echo "  Copied: $skill_name"
    fi
  done
fi

# Step 3: Copy plugin skills from enabled plugins
echo "Copying plugin skills..."
if [[ -f "$SETTINGS_FILE" ]]; then
  while read -r plugin_full; do
    [[ -n "$plugin_full" ]] || continue
    # Extract plugin name and marketplace from "plugin-name@marketplace" format
    plugin_name="${plugin_full%@*}"
    marketplace="${plugin_full#*@}"
    plugin_dir="$HOME/.claude/plugins/cache/$marketplace/$plugin_name"

    if [[ -d "$plugin_dir" ]]; then
      latest_version=$(ls "$plugin_dir" 2>/dev/null | sort -V | tail -1)
      if [[ -n "$latest_version" ]] && [[ -d "$plugin_dir/$latest_version/skills" ]]; then
        for skill_dir in "$plugin_dir/$latest_version/skills"/*/; do
          [[ -d "$skill_dir" ]] || continue
          skill_name="$(basename "$skill_dir")"
          if [[ "$skill_name" != "skill-teaching" ]]; then
            cp -R "${skill_dir%/}" "$DEST/"
            echo "$skill_name" >> "$TEMP_FILE"
            echo "  Copied: $skill_name (from $plugin_name@$marketplace)"
          fi
        done
      fi
    fi
  done < <(jq -r '.enabledPlugins | keys[]' "$SETTINGS_FILE" 2>/dev/null || true)
fi

# Step 4: Write manifest
echo "Writing manifest..."
{
  echo '{'
  echo "  \"syncedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo -n '  "skills": ['
  first=true
  while read -r skill; do
    [[ -n "$skill" ]] || continue
    if $first; then
      first=false
      echo ""
    else
      echo ","
    fi
    printf '    "%s"' "$skill"
  done < "$TEMP_FILE"
  echo ""
  echo '  ]'
  echo '}'
} > "$MANIFEST"

# Step 5: Report
skill_count=$(wc -l < "$TEMP_FILE" | tr -d ' ')
echo ""
echo "Synced $skill_count skills to $TARGET:"
while read -r skill; do
  [[ -n "$skill" ]] || continue
  echo "  - $skill"
done < "$TEMP_FILE"

rm -f "$TEMP_FILE"
