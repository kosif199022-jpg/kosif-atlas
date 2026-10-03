#!/usr/bin/env bash
# Create the visible agent-skills/ folder from an existing hidden skills folder.
#
# Usage: init.sh --source <dir> [--apply] [project_root]
#
#   --source <dir>  Skills folder to migrate, relative to project_root:
#                   .claude/skills, .agents/skills or .codex/skills.
#   --apply         Make the changes. Without it, only print the plan (dry run).
#   project_root    Default: current directory.
#
# Steps (with --apply):
#   1. Copy every skill (subdirectory with a SKILL.md) from the source into agent-skills/.
#      A skill that already exists there with identical content is skipped; one with
#      different content aborts the whole run before anything is changed.
#   2. Verify each copy byte for byte.
#   3. Delete the source folder, so agent-skills-share can put a symlink in its place.
#      This only happens after every copy has been verified. No backup is kept.
#   4. If a .gitignore exists, add the three skill folders to it.
#
# Refuses to run when the source holds subdirectories without a SKILL.md (grouped layouts,
# lowercase skill.md): deleting the source would lose them.
#
# Exit codes: 0 success (or clean dry run), 1 usage or precondition error, 2 conflict.

set -euo pipefail

SOURCE=""
APPLY=0
ROOT=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --source) [[ $# -ge 2 ]] || { echo "--source needs a value" >&2; exit 1; }; SOURCE="$2"; shift 2 ;;
    --apply) APPLY=1; shift ;;
    -h|--help) sed -n '2,23p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) echo "Unknown option: $1" >&2; exit 1 ;;
    *) ROOT="$1"; shift ;;
  esac
done
ROOT="${ROOT:-$PWD}"
cd "$ROOT"

case "$SOURCE" in
  .claude/skills|.agents/skills|.codex/skills) ;;
  "") echo "Missing --source. Candidates in $PWD:" >&2
      for c in .claude/skills .agents/skills .codex/skills; do
        [[ -d "$c" && ! -L "$c" ]] && echo "  $c ($(find "$c" -mindepth 2 -maxdepth 2 -name SKILL.md | wc -l | tr -d ' ') skills)" >&2
      done
      exit 1 ;;
  *) echo "--source must be .claude/skills, .agents/skills or .codex/skills" >&2; exit 1 ;;
esac

if [[ -L "$SOURCE" ]]; then
  echo "$SOURCE is already a symlink to '$(readlink "$SOURCE")'. Nothing to migrate." >&2
  exit 1
fi
if [[ ! -d "$SOURCE" ]]; then
  echo "$SOURCE does not exist in $PWD." >&2
  exit 1
fi
if [[ -L agent-skills ]]; then
  echo "agent-skills is a symlink. It must be a real directory." >&2
  exit 1
fi

# Plan
copy=(); same=(); conflict=(); skipped=(); blocked=()
for entry in "$SOURCE"/* "$SOURCE"/.[!.]*; do
  [[ -e "$entry" || -L "$entry" ]] || continue
  name="$(basename "$entry")"
  if [[ -d "$entry" && -f "$entry/SKILL.md" ]]; then
    if [[ -e "agent-skills/$name" ]]; then
      if diff -rq "$entry" "agent-skills/$name" >/dev/null 2>&1; then same+=("$name"); else conflict+=("$name"); fi
    else
      copy+=("$name")
    fi
  elif [[ -d "$entry" ]]; then
    blocked+=("$name")
  else
    skipped+=("$name")
  fi
done

echo "Source:  $PWD/$SOURCE"
echo "Target:  $PWD/agent-skills/"
for n in ${copy[@]+"${copy[@]}"};         do echo "copy      $n"; done
for n in ${same[@]+"${same[@]}"};         do echo "identical $n (already in agent-skills/, skipped)"; done
for n in ${skipped[@]+"${skipped[@]}"};   do echo "ignore    $n (file, not copied, deleted with the source)"; done
for n in ${blocked[@]+"${blocked[@]}"};   do echo "BLOCKED   $n/ (directory without SKILL.md, would be lost with the source)"; done
for n in ${conflict[@]+"${conflict[@]}"}; do echo "CONFLICT  $n (exists in agent-skills/ with different content)"; done

echo "delete    $SOURCE (after verifying the copies)"

gi_add=()
if [[ -f .gitignore ]]; then
  for p in .claude/skills .agents/skills .codex/skills; do
    grep -qxF "$p" .gitignore || grep -qxF "/$p" .gitignore || gi_add+=("$p")
  done
  for p in ${gi_add[@]+"${gi_add[@]}"}; do echo "gitignore $p"; done
fi

for other in .claude/skills .agents/skills .codex/skills; do
  [[ "$other" == "$SOURCE" ]] && continue
  if [[ -d "$other" && ! -L "$other" ]]; then
    echo "NOTE      $other is a second real skills folder. Not touched. Migrate it with its own run."
  fi
done

if [[ ${#conflict[@]} -gt 0 || ${#blocked[@]} -gt 0 ]]; then
  echo "Aborted: resolve the CONFLICT/BLOCKED entries first. Nothing changed." >&2
  exit 2
fi
if [[ $APPLY -eq 0 ]]; then
  echo "Dry run. Rerun with --apply to make these changes."
  exit 0
fi

# Apply
mkdir -p agent-skills
for n in ${copy[@]+"${copy[@]}"}; do
  cp -Rp "$SOURCE/$n" "agent-skills/$n"
  if ! diff -rq "$SOURCE/$n" "agent-skills/$n" >/dev/null; then
    echo "Verification failed for $n. Stopping before the source is deleted." >&2
    exit 1
  fi
done
tracked=0
if git rev-parse --is-inside-work-tree >/dev/null 2>&1 && [[ -n "$(git ls-files -- "$SOURCE")" ]]; then tracked=1; fi
rm -rf "$SOURCE"
if [[ ${#gi_add[@]} -gt 0 ]]; then
  [[ -s .gitignore && "$(tail -c1 .gitignore)" != "" ]] && echo >> .gitignore
  printf '%s\n' "${gi_add[@]}" >> .gitignore
fi
if [[ $tracked -eq 1 ]]; then
  echo "NOTE      $SOURCE was tracked by git. Stage the removal: git rm -r --cached \"$SOURCE\""
fi
other_types="$(find agent-skills -type f ! -name '*.md' 2>/dev/null | sed -E 's/.*\.([^./]+)$/.\1/; /\//d' | sort -u | tr '\n' ' ')"
if [[ -n "$other_types" ]]; then
  echo "NOTE      agent-skills/ contains non-Markdown files (${other_types% })."
  echo "          If it is synced to other devices with a note app, make sure these are synced too:"
  echo "          in Obsidian Sync enable \"Sync all other types\" (Settings > Sync) on every device."
fi
echo "Done. Next: run agent-skills-share to create the symlinks."
