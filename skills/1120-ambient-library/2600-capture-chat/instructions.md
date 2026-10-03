# capture-chat

Export and capture chat sessions as portable markdown for archiving or ingest.

## Purpose

Exports a chat session (Claude Code, Codex, Cowork — any harness that keeps a
JSONL session log) into a clean, structured format for later use or immediate
vault ingest. This skill is also the **canonical source** for
`export-conversation.py` — the script deployed to every ALV vault root at
scaffold time.

## Two Modes

### Capture (conversation only)

- **Output:** a single `.md` file with all human and assistant turns
- **Use when:** the conversation itself is the artifact — design discussions,
  strategy sessions, Q&A, decisions made in chat
- **Filename:** `YYYY-MM-DD-conversation-export.md`
- **Run:** `python3 "${CLAUDE_PLUGIN_ROOT}/library/capture-chat/export-conversation.py" --out <destination>`

### Export (conversation + artifacts)

- **Output:** a folder containing `conversation.md` + `artifacts/` subdirectory
  with copies of every file written during the session
- **Use when:** the session produced code, documents, or other files you want
  to preserve alongside the conversation record
- **Folder:** `YYYY-MM-DD-session-export/`
- **Run:** `python3 "${CLAUDE_PLUGIN_ROOT}/library/capture-chat/export-conversation.py" --artifacts --out <destination>`

**When in doubt, capture.** Export adds artifact copying — if you only care
about the conversation, capture is sufficient and simpler.

## Running the Script

When installed standalone, resolve `${CLAUDE_PLUGIN_ROOT}/library/capture-chat/`
to this skill's directory; the examples below use the library-plugin form.

```bash
# Capture mode (conversation only) — default: .aai project session archive
python3 "${CLAUDE_PLUGIN_ROOT}/library/capture-chat/export-conversation.py" --out ~/.aai/projects/<slug>/sessions/

# Capture to vault inbox for vault ingest
python3 "${CLAUDE_PLUGIN_ROOT}/library/capture-chat/export-conversation.py" --out inbox/

# Export mode (conversation + artifacts) — then organize under the same sessions/ destination
python3 "${CLAUDE_PLUGIN_ROOT}/library/capture-chat/export-conversation.py" --artifacts --out ~/.aai/projects/<slug>/sessions/

# Capture to a specific file
python3 "${CLAUDE_PLUGIN_ROOT}/library/capture-chat/export-conversation.py" --out my-session-notes.md

# Export to Desktop
python3 "${CLAUDE_PLUGIN_ROOT}/library/capture-chat/export-conversation.py" --artifacts --out ~/Desktop/

# Explicit JSONL path (override auto-detect)
python3 "${CLAUDE_PLUGIN_ROOT}/library/capture-chat/export-conversation.py" path/to/session.jsonl --out ~/.aai/projects/<slug>/sessions/

# Check script version
python3 "${CLAUDE_PLUGIN_ROOT}/library/capture-chat/export-conversation.py" --version
```

**Auto-detect limitation:** without an explicit JSONL path, the script finds
the most recently modified `.jsonl` under Claude/Codex/Cowork session paths.
This is usually correct for an active session but may pick the wrong file if
multiple sessions are open. Pass the path explicitly when in doubt.

## Destination

Default destination is the cross-harness session archive:
`~/.aai/projects/<slug>/sessions/`, where `<slug>` is the current repo/vault
project name or its match in `~/.aai/projects/index.md`; use `_general` for
non-project conversations. Contract: `~/.aai/projects/README.md`.

When invoked via a vault's `capture conversation` or `export conversation`
command (AGENTS.md §2.5), or when the destination is ambiguous, confirm
interactively via `AskUserQuestion`:

1. `~/.aai/projects/<slug>/sessions/` — cross-harness session archive
   (recommended default)
2. `inbox/` — deposit for vault ingest
3. Custom path — user specifies

## How the Script Works

The script reads the session JSONL, filtering to:

- **Human turns:** `type == "user"`, `userType == "external"`, `isSidechain == false`
- **Assistant turns:** `type == "assistant"`, `isSidechain == false`, `type == "text"` content blocks only (skips tool_use, thinking, reasoning)

In `--artifacts` mode, it additionally scans assistant messages for `tool_use`
blocks with `name == "Write"`, collects all `file_path` values, and copies any
files that still exist on disk into the `artifacts/` subfolder of the output
folder.

## Upgrade Path (Keeping Vaults Current)

This skill is the canonical source. Each ALV vault gets a copy of the script
at scaffold time, with the version recorded in `MANIFEST.yaml` under
`scripts.export-conversation.py`.

**When this skill is updated:**

1. Bump `VERSION` in `export-conversation.py` (e.g., `1.1` → `1.2`)
2. Update `CHANGELOG.md` in this directory
3. Copy the updated script to the alv-scaffold repo's
   `templates/export-conversation.py` (keeps the scaffold template current for
   new vaults)
4. New vaults scaffolded after this point will get the updated version automatically

**To update an existing vault:**

Run `upgrade vault scripts` from within the vault session. The vault's
AGENTS.md §2.6 describes the full upgrade operation — it reads MANIFEST.yaml,
locates this skill, diffs the scripts, copies on approval, and commits.

## Files in This Skill

- `instructions.md` — this file; entry point and upgrade documentation
- `SKILL.md` — standalone-install entry point
- `export-conversation.py` — canonical export script
- `CHANGELOG.md` — version history
