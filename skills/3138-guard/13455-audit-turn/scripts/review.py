#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///
"""Resolve a host's turn evidence for the explicit audit-turn skill."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", choices=("claude", "codex"), required=True)
    parser.add_argument("--project", type=Path, required=True)
    parser.add_argument("--session")
    parser.add_argument("--turn", default="")
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

    from guard_core.config import _load_config
    from guard_core.payload import _SESSION_ID_RE
    from guard_core.state import _read_state
    from guard_core.turn_review import configured_reviewer, prepare_review

    def valid_id(value: str) -> bool:
        return bool(value and _SESSION_ID_RE.fullmatch(value) and ".." not in value)

    try:
        if not valid_id(session_id):
            raise ValueError("A valid calling session id is required; pass --session if unavailable")
        if args.turn and not valid_id(args.turn):
            raise ValueError("Invalid turn id")
        project_dir = args.project.expanduser().resolve(strict=True)
        if not project_dir.is_dir():
            raise ValueError("--project must name the project directory")
        reviewer = configured_reviewer(project_dir)
        if reviewer is None:
            print(json.dumps({"status": "no_reviewer"}))
            return 0
        state = _read_state(project_dir, session_id, _load_config(project_dir))
        turn_id = args.turn
        if args.host == "claude":
            from guard_core.transcript import _last_auditable_prompt_id, _turn_slice

            transcript = state.get("transcript_path")
            if not isinstance(transcript, str) or not Path(transcript).is_file():
                raise ValueError("No readable transcript recorded for this session")
            turn_id = turn_id or _last_auditable_prompt_id(transcript) or ""
            turn = _turn_slice(transcript, turn_id)
            source_path = Path(transcript).resolve()
        else:
            from guard_core.codex_turns import _load_turn, _turn_path

            turn_id = turn_id or state.get("pending_verify_prompt_id", "")
            if not isinstance(turn_id, str) or not valid_id(turn_id):
                raise ValueError("No completed turn recorded for this session")
            turn = _load_turn(project_dir, session_id, turn_id)
            source_path = _turn_path(project_dir, session_id, turn_id).resolve()
        if not turn_id or not turn:
            raise ValueError("The requested turn is not available in this session")
        result = prepare_review(project_dir, session_id, reviewer, turn_id, turn, source_path)
    except (OSError, ValueError) as error:
        print(json.dumps({"status": "error", "error": str(error)}))
        return 1
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
