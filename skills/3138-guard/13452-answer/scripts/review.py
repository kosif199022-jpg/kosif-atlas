#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///
"""Explicit host/project adapter for answer reviewer preflight and document preparation."""

import argparse
import json
import os
from pathlib import Path
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("document", type=Path, nargs="?")
    parser.add_argument("--host", choices=("claude", "codex"), required=True)
    parser.add_argument("--project", type=Path, required=True)
    args = parser.parse_args()
    os.environ["GUARD_HOST"] = args.host
    for parent in Path(__file__).resolve().parents:
        if (parent / "scripts/guard_core/__init__.py").is_file():
            sys.path.insert(0, str(parent / "scripts"))
            break
    else:
        raise RuntimeError("Guard plugin root not found")

    from guard_core.answer_review import prepare_review

    try:
        project = args.project.expanduser().resolve(strict=True)
        if not project.is_dir():
            raise ValueError("--project must name the project directory")
        document = args.document.expanduser() if args.document is not None else None
        if document is not None and not document.is_absolute():
            document = project / document
        result = prepare_review(project, document)
    except (OSError, ValueError) as error:
        print(json.dumps({"status": "error", "error": str(error)}))
        return 1
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
