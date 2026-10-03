#!/usr/bin/env bash
# context-run.sh — optional wrapper for non-Claude Code LLM CLIs
#
# Injects .context/ state before the session and offers a check-out prompt
# after the CLI exits. Claude Code should use .claude/settings.json hooks
# instead — this script is for Codex, Gemini, Ollama, and similar.
#
# Usage:
#   ./context-run.sh codex [args...]
#   ./context-run.sh gemini [args...]
#   ./context-run.sh "ollama run mistral" [args...]
#   ./context-run.sh --help

set -euo pipefail

CONTEXT_DIR=".context"
LOG_LINES=80   # how many lines of LOG.md to surface on check-in

# ── helpers ──────────────────────────────────────────────────────────────────

usage() {
  cat <<'EOF'
context-run.sh — wrap a CLI session with .context/ check-in / check-out prompts

USAGE
  ./context-run.sh <cli> [cli-args...]

EXAMPLES
  ./context-run.sh codex
  ./context-run.sh gemini
  ./context-run.sh "ollama run mistral"

WHAT IT DOES
  Before launch   Builds a check-in prompt from STATE.md + LOG.md and either
                  injects it as the CLI's first message (if supported) or
                  prints it for you to paste.

  After exit      Prints a check-out prompt for you to paste into a new
                  invocation. Does not force it — you decide whether to run it.

NOTES
  Claude Code users: use .claude/settings.json hooks instead of this script.
  This wrapper is for Codex, Gemini, Ollama, and other CLIs.
EOF
  exit 0
}

die() { echo "error: $*" >&2; exit 1; }

check_store() {
  [ -d "$CONTEXT_DIR" ] || die ".context/ not found. Run from the project root, or bootstrap with the session skill."
  [ -f "$CONTEXT_DIR/STATE.md" ] || die ".context/STATE.md missing."
  [ -f "$CONTEXT_DIR/LOG.md" ]   || die ".context/LOG.md missing."
}

# Build the check-in injection text — concise enough to paste, complete enough
# to orient a cold-start model.
build_checkin_prompt() {
  cat <<EOF
You are picking up work on this project. The .context/ directory is the shared
brain — it is the truth; your private conversation history is not.

=== .context/STATE.md ===
$(cat "$CONTEXT_DIR/STATE.md")

=== .context/LOG.md (most recent entries) ===
$(head -"$LOG_LINES" "$CONTEXT_DIR/LOG.md")

=== Instructions ===
Read .context/CHARTER.md for the full protocol. Then:
1. Check for stale Doing tasks (started: timestamp >4h old and not yours) and
   flag them under Needs Lou in STATE.
2. Select a task by routing rules: explicit @assignee first, then #focus match,
   then report idle if nothing matches.
3. Acquire .context/lock, move the task to Doing (stamp worker + started),
   release the lock.
4. Tell me which task you've claimed and the current active objective.
EOF
}

# Build the check-out prompt — printed after the CLI exits for the user to
# paste into a fresh invocation.
build_checkout_prompt() {
  cat <<EOF
=== CHECK-OUT PROMPT ===
Paste this into a new session to complete the check-out ritual:

---
Perform the check-out ritual from .context/CHARTER.md for the session that
just ended. Specifically:

1. Determine the task outcome (Done / Ready-for-Review / still Doing /
   Needs-Rework).
2. Acquire .context/lock.
3. Update .context/STATE.md: move the task to its new status; if
   Ready-for-Review, append a paired T-<N>-R review task.
4. Append a handoff block to the TOP of .context/LOG.md using this template:

   ## <ISO date> · <agent-id> · session
   **Worked:** T-<N>
   **Did:** <what happened>
   **Changed:** <files; commit SHA if any>
   **Learned:** <anything surprising; else "nothing notable">
   **Handoff / next:** <exactly where to resume, or what's next>
   **Raised:** <new decisions, proposed-supersedes, or Needs-Lou items>
   ---

5. If a durable decision was made, append it to .context/DECISIONS.md.
6. Release .context/lock.
7. Run: git add .context/ && git commit -m "context: <agent> check-out T-<N> <status>"
---
EOF
}

copy_to_clipboard() {
  local text="$1"
  if command -v pbcopy &>/dev/null; then
    echo "$text" | pbcopy && echo "(copied to clipboard)"
  elif command -v xclip &>/dev/null; then
    echo "$text" | xclip -selection clipboard && echo "(copied to clipboard)"
  elif command -v xsel &>/dev/null; then
    echo "$text" | xsel --clipboard --input && echo "(copied to clipboard)"
  else
    echo "(clipboard not available — paste manually)"
  fi
}

# ── per-CLI injection strategies ─────────────────────────────────────────────
# Each function launches the CLI, injecting the check-in prompt where possible.
# Add new CLIs here as needed.

launch_codex() {
  local prompt="$1"; shift
  # Codex CLI accepts an initial message via -m / --message
  if codex --help 2>&1 | grep -q -- '--message\|-m'; then
    codex --message "$prompt" "$@"
  else
    # Older builds: just print the prompt and let the user paste
    echo "$prompt"
    echo ""
    echo "--- Paste the above into Codex, then press Enter to launch ---"
    read -r _
    codex "$@"
  fi
}

launch_gemini() {
  local prompt="$1"; shift
  # Gemini CLI: try -p / --prompt flag; fall back to print-and-paste
  if gemini --help 2>&1 | grep -q -- '--prompt\|-p'; then
    gemini --prompt "$prompt" "$@"
  else
    echo "$prompt"
    echo ""
    echo "--- Paste the above into Gemini, then press Enter to launch ---"
    read -r _
    gemini "$@"
  fi
}

launch_ollama() {
  local prompt="$1"; shift
  # Ollama: first arg after 'run <model>' is treated as the initial prompt
  # Usage: context-run.sh "ollama run mistral"
  # The CLI string is the first arg; remaining are passed through.
  local cli_cmd="$1"; shift 2>/dev/null || true
  $cli_cmd "$prompt" "$@"
}

launch_generic() {
  local cli="$1"; local prompt="$2"; shift 2
  echo ""
  echo "=== CHECK-IN PROMPT ==="
  echo "$prompt"
  echo ""
  printf "Copy the above and paste it as your first message to %s. " "$cli"
  echo "Press Enter to launch."
  read -r _
  $cli "$@"
}

# ── main ─────────────────────────────────────────────────────────────────────

[ $# -eq 0 ] && usage
[ "$1" = "--help" ] || [ "$1" = "-h" ] && usage

check_store

CLI="$1"; shift
CHECKIN_PROMPT="$(build_checkin_prompt)"

echo ""
echo "=== context-run: check-in for $CLI ==="
echo ""

case "$CLI" in
  codex)
    launch_codex "$CHECKIN_PROMPT" "$@"
    ;;
  gemini)
    launch_gemini "$CHECKIN_PROMPT" "$@"
    ;;
  ollama)
    # For ollama, the next arg should be "run <model>" or similar
    launch_generic "ollama" "$CHECKIN_PROMPT" ollama "$@"
    ;;
  *)
    # Unknown CLI — print prompt, let user paste, then launch
    launch_generic "$CLI" "$CHECKIN_PROMPT" "$CLI" "$@"
    ;;
esac

EXIT_CODE=$?

# ── check-out offer ───────────────────────────────────────────────────────────

echo ""
echo "=== context-run: $CLI session ended (exit $EXIT_CODE) ==="
echo ""
printf "Show check-out prompt? [y/N] "
read -r answer

if [[ "$answer" =~ ^[Yy]$ ]]; then
  CHECKOUT="$(build_checkout_prompt)"
  echo ""
  echo "$CHECKOUT"
  echo ""
  printf "Copy to clipboard? [y/N] "
  read -r clip_answer
  if [[ "$clip_answer" =~ ^[Yy]$ ]]; then
    copy_to_clipboard "$CHECKOUT"
  fi
fi

exit $EXIT_CODE
