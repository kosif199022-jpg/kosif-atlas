#!/usr/bin/env bash
# install.sh — scaffold the multi-agent context manager into a target project
#
# Usage:
#   bash install.sh [target-dir]              # install (skip existing files)
#   bash install.sh --check [target-dir]      # report what would happen
#   bash install.sh --force [target-dir]      # overwrite existing files
#   bash install.sh --skip-hooks [target-dir] # don't touch .claude/settings.json
#   bash install.sh --help

set -euo pipefail

# ── resolve script location and templates ────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES="$SCRIPT_DIR/templates"

# ── argv parsing ─────────────────────────────────────────────────────────────

CHECK_ONLY=0
FORCE=0
SKIP_HOOKS=0
TARGET=""

while [ $# -gt 0 ]; do
  case "$1" in
    --check)      CHECK_ONLY=1; shift ;;
    --force)      FORCE=1; shift ;;
    --skip-hooks) SKIP_HOOKS=1; shift ;;
    --help|-h)    sed -n '3,9p' "$0"; exit 0 ;;
    --*)          echo "unknown flag: $1" >&2; exit 2 ;;
    *)            TARGET="$1"; shift ;;
  esac
done

TARGET="${TARGET:-$PWD}"
TARGET="$(cd "$TARGET" && pwd)"   # canonicalise

# ── helpers ──────────────────────────────────────────────────────────────────

say()  { printf '%s\n' "$*"; }
warn() { printf 'warning: %s\n' "$*" >&2; }
die()  { printf 'error: %s\n' "$*" >&2; exit 1; }

# Mapping: template filename -> destination path relative to target
# Format: "<template>|<dest>"
declare -a MAPPINGS=(
  "context-charter.md|.context/CHARTER.md"
  "context-state.md|.context/STATE.md"
  "context-log.md|.context/LOG.md"
  "context-decisions.md|.context/DECISIONS.md"
  "context-readme.md|.context/README.md"
  "context-archive-gitkeep|.context/archive/.gitkeep"
  "agents.yaml|agents.yaml"
  "agents-md.md|AGENTS.md"
  "gemini-md.md|GEMINI.md"
  "context-run.sh|context-run.sh"
)

# ── pre-flight ───────────────────────────────────────────────────────────────

[ -d "$TARGET" ] || die "target directory does not exist: $TARGET"
[ -d "$TEMPLATES" ] || die "templates dir not found: $TEMPLATES"

if [ ! -d "$TARGET/.git" ]; then
  warn "$TARGET is not a git repository. The protocol relies on git for"
  warn "attribution and history. Consider 'git init' before running this."
fi

say "Target: $TARGET"
[ $CHECK_ONLY -eq 1 ] && say "Mode:   --check (dry run)"
[ $FORCE -eq 1 ]      && say "Mode:   --force (will overwrite)"

# ── file installation loop ───────────────────────────────────────────────────

WOULD_OVERWRITE=()
INSTALLED=()
SKIPPED=()

for entry in "${MAPPINGS[@]}"; do
  src_name="${entry%%|*}"
  dst_rel="${entry##*|}"
  src="$TEMPLATES/$src_name"
  dst="$TARGET/$dst_rel"

  [ -f "$src" ] || die "missing template: $src"

  if [ -e "$dst" ] && [ $FORCE -ne 1 ]; then
    WOULD_OVERWRITE+=("$dst_rel")
    [ $CHECK_ONLY -ne 1 ] && SKIPPED+=("$dst_rel")
    continue
  fi

  if [ $CHECK_ONLY -eq 1 ]; then
    say "  would install: $dst_rel"
    continue
  fi

  mkdir -p "$(dirname "$dst")"
  cp "$src" "$dst"

  # context-run.sh must be executable
  [ "$dst_rel" = "context-run.sh" ] && chmod +x "$dst"

  INSTALLED+=("$dst_rel")
done

# ── .claude/settings.json — merge case ───────────────────────────────────────

if [ $SKIP_HOOKS -eq 0 ]; then
  hooks_src="$TEMPLATES/claude-settings.json"
  hooks_dst="$TARGET/.claude/settings.json"

  if [ ! -f "$hooks_src" ]; then
    warn "hook template missing: $hooks_src — skipping hooks"
  elif [ -e "$hooks_dst" ] && [ $FORCE -ne 1 ]; then
    if [ $CHECK_ONLY -eq 1 ]; then
      say "  would skip (already exists): .claude/settings.json"
      say "  (rerun with --force to overwrite, or merge hooks manually)"
    else
      WOULD_OVERWRITE+=(".claude/settings.json")
      SKIPPED+=(".claude/settings.json (rerun with --force or merge manually)")
    fi
  else
    if [ $CHECK_ONLY -eq 1 ]; then
      say "  would install: .claude/settings.json"
    else
      mkdir -p "$TARGET/.claude"
      cp "$hooks_src" "$hooks_dst"
      INSTALLED+=(".claude/settings.json")
    fi
  fi
fi

# ── .gitignore — ensure .context/lock is ignored ─────────────────────────────

if [ $CHECK_ONLY -eq 0 ]; then
  gitignore="$TARGET/.gitignore"
  if [ ! -f "$gitignore" ] || ! grep -qxF ".context/lock" "$gitignore"; then
    echo ".context/lock" >> "$gitignore"
    INSTALLED+=(".gitignore (appended .context/lock)")
  fi
fi

# ── summary ──────────────────────────────────────────────────────────────────

say ""

if [ $CHECK_ONLY -eq 1 ]; then
  if [ ${#WOULD_OVERWRITE[@]} -gt 0 ]; then
    say "Would skip (already exist):"
    for f in "${WOULD_OVERWRITE[@]}"; do say "  - $f"; done
    say ""
    say "Rerun with --force to overwrite, or remove these files first."
  else
    say "No conflicts. Run without --check to install."
  fi
  exit 0
fi

if [ ${#INSTALLED[@]} -gt 0 ]; then
  say "Installed:"
  for f in "${INSTALLED[@]}"; do say "  + $f"; done
fi

if [ ${#SKIPPED[@]} -gt 0 ]; then
  say ""
  say "Skipped (already existed; rerun with --force to overwrite):"
  for f in "${SKIPPED[@]}"; do say "  - $f"; done
fi

say ""
say "Next steps:"
say "  1. Edit $TARGET/agents.yaml — reflect your model lineup."
say "  2. Define the active objective in $TARGET/.context/STATE.md."

# Detect whether the session skill is reachable — either as a direct user
# skill (~/.claude/skills/session/) or via an installed plugin
# (~/.claude/plugins/.../skills/session/). Only nag if it's missing.
session_installed=0
if [ -f "$HOME/.claude/skills/session/SKILL.md" ]; then
  session_installed=1
elif [ -d "$HOME/.claude/plugins" ]; then
  matches=$(find "$HOME/.claude/plugins" -name "SKILL.md" -path "*/skills/session/SKILL.md" 2>/dev/null) || true
  [ -n "$matches" ] && session_installed=1
fi

if [ $session_installed -eq 1 ]; then
  say "  3. Start any session with 'what should I work on?' — the session"
  say "     skill takes over from there."
else
  say "  3. Install the companion session skill — it's what drives check-in /"
  say "     check-out in Claude Code:"
  say "       /plugin install loudalo/session"
  say "     Then start any session with 'what should I work on?'."
fi
