#!/usr/bin/env bash
# Point the agents' skill directories at the project's visible agent-skills/ folder.
#
# Usage: share.sh [--check] [project_root]
#
#   --check        Report the state of each link, change nothing.
#   project_root   Directory that contains agent-skills/ (default: current directory).
#
# Creates relative symlinks:
#   .claude/skills -> ../agent-skills   (Claude Code)
#   .agents/skills -> ../agent-skills   (Codex)
#
# Never copies, moves or deletes skills; only creates the symlinks (and .claude/ or .agents/
# if missing). A real directory, a file or any other symlink target (including an absolute
# path to agent-skills/) is reported as a conflict and left alone.
#
# Afterwards, checks that the files each SKILL.md names (scripts/..., references/...,
# agent-skills/<skill>/...) exist. Note apps such as Obsidian Sync skip non-note files like
# .sh or .py unless configured to sync them, so a synced project can arrive without them.
#
# Exit codes: 0 all links correct (or created) and no referenced file missing,
#             1 usage error or no agent-skills/,
#             2 conflicts found, or links missing in --check mode,
#             3 links fine, but files referenced by a SKILL.md are missing.

set -euo pipefail

CHECK=0
ROOT=""
for arg in "$@"; do
  case "$arg" in
    --check) CHECK=1 ;;
    -h|--help) sed -n '2,24p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) echo "Unknown option: $arg" >&2; exit 1 ;;
    *) ROOT="$arg" ;;
  esac
done
ROOT="${ROOT:-$PWD}"
cd "$ROOT"

if [[ ! -d agent-skills || -L agent-skills ]]; then
  echo "No agent-skills/ directory in $PWD. Nothing changed." >&2
  echo "Run agent-skills-init first to create it from an existing skills folder." >&2
  exit 1
fi

TARGET="../agent-skills"
LINKS=(".claude/skills" ".agents/skills")
status=0

for link in "${LINKS[@]}"; do
  if [[ -L "$link" ]]; then
    current="$(readlink "$link")"
    if [[ "$current" == "$TARGET" ]]; then
      echo "ok        $link -> $current"
    else
      echo "CONFLICT  $link is a symlink to '$current', expected '$TARGET'"
      status=2
    fi
  elif [[ -e "$link" ]]; then
    echo "CONFLICT  $link is a real $( [[ -d "$link" ]] && echo directory || echo file ), not a symlink"
    echo "          Migrate its skills into agent-skills/ (agent-skills-init), then remove it and rerun."
    status=2
  elif [[ $CHECK -eq 1 ]]; then
    echo "missing   $link"
    status=2
  else
    mkdir -p "$(dirname "$link")"
    ln -s "$TARGET" "$link"
    echo "created   $link -> $TARGET"
  fi
done

# Referenced files
missing_files=0
for skill_md in agent-skills/*/SKILL.md; do
  [[ -f "$skill_md" ]] || continue
  dir="$(dirname "$skill_md")"
  name="$(basename "$dir")"
  refs="$(
    grep -oE "(agent-skills|\.claude/skills|\.agents/skills)/$name/[A-Za-z0-9._/-]+" "$skill_md" \
      | sed -E "s#^[^/]+(/skills)?/$name/##"
    grep -oE '(^|[^A-Za-z0-9._/-])(scripts|references|assets)/[A-Za-z0-9._/-]+' "$skill_md" \
      | sed -E 's#^[^a-z]##'
  )" || true
  while IFS= read -r ref; do
    [[ -n "$ref" ]] || continue
    ref="${ref%.}"; ref="${ref%/}"
    if [[ ! -e "$dir/$ref" ]]; then
      echo "MISSING   $dir/$ref (named in $skill_md)"
      missing_files=1
    fi
  done < <(printf '%s\n' "$refs" | sort -u)
done
if [[ $missing_files -eq 1 ]]; then
  echo "          Files named by a SKILL.md are missing. If agent-skills/ is synced with a note app,"
  echo "          it probably skips non-note files: in Obsidian Sync enable \"Sync all other types\""
  echo "          (Settings > Sync) on every device, wait for the sync, then rerun with --check."
  [[ $status -eq 0 ]] && status=3
fi

exit $status
