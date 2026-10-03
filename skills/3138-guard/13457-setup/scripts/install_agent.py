#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///
"""Install guard's project-local Codex agents."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True, help="Project root that will receive .codex/agents")
    parser.add_argument("--force", action="store_true", help="Replace existing guard agent files")
    args = parser.parse_args()

    project = Path(args.project).expanduser().resolve()
    if not project.is_dir():
        parser.error(f"project is not a directory: {project}")
    skill_dir = Path(__file__).resolve().parents[1]
    plugin_dir = skill_dir.parents[1]
    target_dir = project / ".codex" / "agents"
    target_dir.mkdir(parents=True, exist_ok=True)

    specs = (
        ("guard_doc_auditor", plugin_dir / "agents" / "doc-auditor.md",
         "Review ordinary project documentation changed in this turn."),
        ("guard_agents_md_auditor", plugin_dir / "agents" / "agents-md-auditor.md",
         "Review AGENTS.md and CLAUDE.md instruction files changed in this turn."),
        ("guard_ext_docs_auditor", plugin_dir / "agents" / "ext-docs-auditor.md",
         "Review saved external reference documents changed in this turn."),
    )
    for name, source, description in specs:
        target = target_dir / f"{name}.toml"
        if target.exists() and not args.force:
            print(f"left existing agent unchanged: {target}")
            continue
        body = source.read_text(encoding="utf-8")
        body = re.sub(r"\A---\n.*?\n---\n", "", body, count=1, flags=re.DOTALL)
        rendered = (f"name = {json.dumps(name)}\n"
                    f"description = {json.dumps(description)}\n"
                    'sandbox_mode = "read-only"\n\n'
                    f"developer_instructions = {json.dumps(body)}\n")
        target.write_text(rendered, encoding="utf-8")
        print(f"installed guard agent: {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
