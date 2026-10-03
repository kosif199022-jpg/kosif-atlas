#!/usr/bin/env python3
"""
export-conversation.py v1.2

Export a Cowork/Claude Code session to clean markdown — human and assistant
turns only, no tool calls, no reasoning, no intermediate messages.

Two modes:
  capture  (default)  — conversation markdown only → single .md file
  export   (--artifacts) — conversation + artifact files → folder

Usage:
  python3 export-conversation.py                           # capture, auto-detect session
  python3 export-conversation.py path/to/session.jsonl    # capture, explicit JSONL
  python3 export-conversation.py --out inbox/             # capture to inbox/
  python3 export-conversation.py --out my-chat.md         # capture to specific file
  python3 export-conversation.py --artifacts --out inbox/ # export (conversation + files)
  python3 export-conversation.py --version                # print version and exit

Output filename when --out is a directory:
  capture mode : YYYY-MM-DD-conversation-export.md
  export mode  : YYYY-MM-DD-session-export/  (folder)
"""

import json
import sys
import os
import glob
import shutil
from datetime import datetime, timezone

VERSION = "1.2"


# ---------------------------------------------------------------------------
# Session discovery
# ---------------------------------------------------------------------------

def find_latest_jsonl():
    """
    Auto-detect the most recent session JSONL.
    Searches two locations:
      1. ~/.claude/projects/ — Claude Code sessions
      2. /var/folders/.../T/claude-hostloop-plugins/*/projects/ — Cowork sessions
    """
    candidates = []

    # Claude Code sessions
    for root in [os.path.dirname(os.path.abspath(__file__)), os.getcwd(), os.path.expanduser("~")]:
        pattern = os.path.join(root, ".claude", "projects", "**", "*.jsonl")
        candidates.extend(glob.glob(pattern, recursive=True))

    # Cowork / hostloop sessions (Mac-specific temp path)
    cowork_pattern = "/private/var/folders/*/*/T/claude-hostloop-plugins/*/projects/**/*.jsonl"
    candidates.extend(glob.glob(cowork_pattern, recursive=True))
    # Also try without /private prefix
    cowork_pattern2 = "/var/folders/*/*/T/claude-hostloop-plugins/*/projects/**/*.jsonl"
    candidates.extend(glob.glob(cowork_pattern2, recursive=True))

    if not candidates:
        sys.exit(
            "ERROR: No JSONL session files found.\n"
            "Pass the path explicitly: python3 export-conversation.py path/to/session.jsonl\n"
            "For Cowork sessions, find the JSONL under:\n"
            "  /var/folders/.../T/claude-hostloop-plugins/*/projects/"
        )
    return max(candidates, key=os.path.getmtime)


# ---------------------------------------------------------------------------
# Conversation extraction
# ---------------------------------------------------------------------------

def extract_turns(jsonl_path):
    """Extract human and assistant text turns from session JSONL."""
    turns = []
    with open(jsonl_path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)

            # Skip sub-agent sidechains
            if obj.get('isSidechain'):
                continue

            t = obj.get('type')

            # Human turns — external user messages only
            if t == 'user' and obj.get('userType') == 'external':
                content = obj['message']['content']
                if isinstance(content, str):
                    text = content.strip()
                elif isinstance(content, list):
                    text = '\n\n'.join(
                        b['text'] for b in content
                        if isinstance(b, dict) and b.get('type') == 'text'
                    ).strip()
                else:
                    continue
                if text:
                    turns.append(('human', obj.get('timestamp', ''), text))

            # Assistant turns — text blocks only (skip thinking, tool_use)
            elif t == 'assistant':
                content = obj['message'].get('content', [])
                if isinstance(content, list):
                    text = '\n\n'.join(
                        b['text'] for b in content
                        if isinstance(b, dict) and b.get('type') == 'text'
                    ).strip()
                    if text:
                        turns.append(('assistant', obj.get('timestamp', ''), text))

    return turns


# ---------------------------------------------------------------------------
# Artifact extraction
# ---------------------------------------------------------------------------

def extract_artifact_paths(jsonl_path):
    """
    Scan session JSONL for Write tool_use blocks and return the list of
    file paths written during the session (deduplicated, last write wins).
    """
    seen = {}  # path -> path (ordered by last occurrence)
    with open(jsonl_path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            if obj.get('isSidechain'):
                continue
            if obj.get('type') == 'assistant':
                content = obj['message'].get('content', [])
                if isinstance(content, list):
                    for block in content:
                        if (isinstance(block, dict)
                                and block.get('type') == 'tool_use'
                                and block.get('name') == 'Write'):
                            fp = block.get('input', {}).get('file_path')
                            if fp:
                                seen[fp] = fp
    return list(seen.values())


# ---------------------------------------------------------------------------
# Markdown formatting
# ---------------------------------------------------------------------------

def format_markdown(turns, jsonl_path, human_name='Lou'):
    session_id = os.path.basename(os.path.dirname(jsonl_path))
    lines = [
        "# Conversation Export",
        "",
        f"**Exported:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}  ",
        f"**Session:** `{session_id}`  ",
        f"**Turns:** {len(turns)} "
        f"({sum(1 for t in turns if t[0]=='human')} human, "
        f"{sum(1 for t in turns if t[0]=='assistant')} assistant)  ",
        "",
        "---",
        "",
    ]
    for role, timestamp, text in turns:
        display = human_name if role == 'human' else 'Claude'
        lines.append(f"## {display}")
        lines.append("")
        lines.append(text)
        lines.append("")
        lines.append("---")
        lines.append("")
    return '\n'.join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    args = sys.argv[1:]

    # --version
    if '--version' in args:
        print(f"export-conversation.py v{VERSION}")
        return

    # Parse flags
    artifacts_mode = '--artifacts' in args
    args = [a for a in args if a != '--artifacts']

    out_path = None
    jsonl_path = None
    i = 0
    while i < len(args):
        if args[i] == '--out' and i + 1 < len(args):
            out_path = args[i + 1]
            i += 2
        else:
            jsonl_path = args[i]
            i += 1

    # Resolve JSONL path
    if not jsonl_path:
        jsonl_path = find_latest_jsonl()
        print(f"Auto-detected session: {jsonl_path}", file=sys.stderr)

    if not os.path.exists(jsonl_path):
        sys.exit(f"ERROR: File not found: {jsonl_path}")

    # Extract conversation
    turns = extract_turns(jsonl_path)
    if not turns:
        sys.exit("ERROR: No conversation turns found in session file.")

    md = format_markdown(turns, jsonl_path)

    date_str = datetime.now(timezone.utc).strftime('%Y-%m-%d')

    # -----------------------------------------------------------------------
    # Export mode — folder with conversation.md + artifacts/
    # -----------------------------------------------------------------------
    if artifacts_mode:
        folder_name = f"{date_str}-session-export"

        if not out_path:
            folder_path = folder_name
        elif os.path.isdir(out_path):
            folder_path = os.path.join(out_path, folder_name)
        else:
            folder_path = out_path  # treat as explicit folder name

        artifacts_dir = os.path.join(folder_path, 'artifacts')
        os.makedirs(artifacts_dir, exist_ok=True)

        # Write conversation
        conv_path = os.path.join(folder_path, 'conversation.md')
        with open(conv_path, 'w') as f:
            f.write(md)

        # Copy artifacts
        artifact_paths = extract_artifact_paths(jsonl_path)
        copied, skipped = [], []
        for fp in artifact_paths:
            if os.path.exists(fp):
                basename = os.path.basename(fp)
                dest = os.path.join(artifacts_dir, basename)
                # Avoid name collision: prefix with counter if needed
                if os.path.exists(dest):
                    base, ext = os.path.splitext(basename)
                    dest = os.path.join(artifacts_dir, f"{base}_{len(copied)}{ext}")
                shutil.copy2(fp, dest)
                copied.append(fp)
            else:
                skipped.append(fp)

        print(f"Exported -> {folder_path}/")
        print(f"  conversation.md  ({len(turns)} turns)")
        print(f"  artifacts/       ({len(copied)} file(s) copied)")
        if skipped:
            print(f"  skipped {len(skipped)} path(s) not found on disk:")
            for p in skipped:
                print(f"    {p}")

    # -----------------------------------------------------------------------
    # Capture mode — single markdown file
    # -----------------------------------------------------------------------
    else:
        default_filename = f"{date_str}-conversation-export.md"

        if not out_path:
            out_path = default_filename
        elif os.path.isdir(out_path):
            out_path = os.path.join(out_path, default_filename)

        with open(out_path, 'w') as f:
            f.write(md)

        human_count = sum(1 for t in turns if t[0] == 'human')
        assistant_count = sum(1 for t in turns if t[0] == 'assistant')
        print(f"Captured {len(turns)} turns -> {out_path}")
        print(f"  {human_count} human, {assistant_count} assistant")


if __name__ == '__main__':
    main()
