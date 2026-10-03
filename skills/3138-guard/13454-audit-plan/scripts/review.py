#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///
"""Skill/shell adapter for explicit plan reviews on Claude Code and Codex.

Host and project are explicit arguments. Session defaults come only from the selected
host's shell environment; callers can pass --session when those variables are unavailable.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("prepare", "complete"))
    parser.add_argument("plan", type=Path)
    parser.add_argument("--host", choices=("claude", "codex"), required=True)
    parser.add_argument("--project", type=Path, required=True)
    parser.add_argument("--session")
    args = parser.parse_args()
    session_id = args.session
    if session_id is None:
        key = "CODEX_THREAD_ID" if args.host == "codex" else "CLAUDE_CODE_SESSION_ID"
        session_id = os.environ.get(key, "")
    os.environ["GUARD_HOST"] = args.host
    for parent in Path(__file__).resolve().parents:
        if (parent / "scripts" / "guard_core" / "__init__.py").is_file():
            sys.path.insert(0, str(parent / "scripts"))
            break
    else:
        raise RuntimeError("Guard plugin root not found")

    from guard_core.payload import _SESSION_ID_RE
    from guard_core.plan_review import prepare_review, read_plan, record_plan_audit

    try:
        if not session_id or not _SESSION_ID_RE.fullmatch(session_id) or ".." in session_id:
            raise ValueError("A valid session id is required; pass --session for the calling session")
        project_dir = args.project.expanduser().resolve(strict=True)
        if not project_dir.is_dir():
            raise ValueError("--project must name the project directory")
        path = args.plan.expanduser()
        if not path.is_absolute():
            path = project_dir / path
        if args.action == "prepare":
            result = prepare_review(project_dir, session_id, path)
        else:
            resolved, plan = read_plan(path)
            digest = record_plan_audit(project_dir, session_id, plan)
            result = {"status": "recorded", "plan_path": str(resolved), "sha256": digest}
    except (OSError, ValueError) as error:
        print(json.dumps({"status": "error", "error": str(error)}))
        return 1
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
