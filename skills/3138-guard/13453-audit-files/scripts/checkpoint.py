#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///
"""Host adapter for Guard's shared file-checkpoint command."""

from __future__ import annotations

import os
import sys
from pathlib import Path


def _plugin_root() -> Path:
    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / "scripts" / "guard_core" / "__init__.py").is_file():
            return parent
    raise RuntimeError("Guard plugin root not found")


host = "codex" if os.environ.get("CODEX_THREAD_ID") else "claude"
if "--host" in sys.argv:
    index = sys.argv.index("--host")
    if index + 1 < len(sys.argv):
        host = sys.argv[index + 1].lower()
os.environ["GUARD_HOST"] = host
sys.path.insert(0, str(_plugin_root() / "scripts"))

from guard_core.cmd_checkpoint import cmd_file_checkpoint  # noqa: E402


raise SystemExit(cmd_file_checkpoint())
