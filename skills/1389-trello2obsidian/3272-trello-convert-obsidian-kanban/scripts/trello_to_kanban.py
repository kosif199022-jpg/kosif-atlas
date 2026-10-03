#!/usr/bin/env python3
"""Convert TRELLO_IMPORT board directories into Obsidian Kanban board files.

Reads the TRELLO_IMPORT/<Board>/<List>/<Card>/index.md structure produced by
the trello-import skill and generates one Kanban .md board file per board.

Usage:
    # Convert a specific board
    python3 .claude/skills/trello-convert-obsidian-kanban/scripts/trello_to_kanban.py "Foodie"

    # Convert all boards
    python3 .claude/skills/trello-convert-obsidian-kanban/scripts/trello_to_kanban.py

    # Custom output directory
    python3 .claude/skills/trello-convert-obsidian-kanban/scripts/trello_to_kanban.py -o KANBAN/ "Foodie"

Output: One .md file per board, placed next to the board directory by default
        (e.g. TRELLO_IMPORT/Foodie/Foodie Kanban.md).
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

TRELLO_IMPORT_DIR = Path("TRELLO_IMPORT")


def strip_list_prefix(name: str) -> str:
    """Remove the zero-padded index prefix from list folder names.

    '001 Ausprobieren-Ideen' -> 'Ausprobieren-Ideen'
    """
    return re.sub(r"^\d+\s+", "", name)


def build_kanban_board(board_dir: Path) -> str:
    """Build a Kanban board Markdown string from a board directory."""
    lines: list[str] = [
        "---",
        "",
        "kanban-plugin: board",
        "",
        "---",
        "",
    ]

    # Collect list directories (sorted by folder name, which is zero-padded)
    list_dirs = sorted(
        [d for d in board_dir.iterdir() if d.is_dir() and re.match(r"^\d+\s", d.name)],
        key=lambda d: d.name,
    )

    for list_dir in list_dirs:
        column_name = strip_list_prefix(list_dir.name)
        lines.append(f"## {column_name}")
        lines.append("")

        # Card folders sorted alphabetically
        card_dirs = sorted(
            [d for d in list_dir.iterdir() if d.is_dir()],
            key=lambda d: d.name.lower(),
        )

        for card_dir in card_dirs:
            index_md = card_dir / "index.md"
            if not index_md.exists():
                continue
            # Obsidian wiki-links resolve note paths without .md extension
            rel = card_dir / "index"
            lines.append(f"- [ ] [[{rel}]]")

        # Double blank line between columns (matches plugin output)
        lines.append("")
        lines.append("")

    # Archive separator + archive column
    lines.append("***")
    lines.append("")
    lines.append("## Archive")
    lines.append("")

    # Settings block (plain backticks, no language hint)
    collapse = ",".join(["false"] * len(list_dirs))
    lines.append("%% kanban:settings")
    lines.append("```")
    lines.append('{"kanban-plugin":"board","list-collapse":[' + collapse + "]}")
    lines.append("```")
    lines.append("%%")

    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert TRELLO_IMPORT boards into Obsidian Kanban board files."
    )
    parser.add_argument(
        "boards",
        nargs="*",
        help="Board names to convert (default: all boards in TRELLO_IMPORT/)",
    )
    parser.add_argument(
        "-o",
        "--output-dir",
        type=Path,
        default=None,
        help="Output directory for .md board files (default: inside each board directory)",
    )
    args = parser.parse_args()

    if not TRELLO_IMPORT_DIR.exists():
        print(f"Error: {TRELLO_IMPORT_DIR} not found. Run trello-import first.", file=sys.stderr)
        sys.exit(1)

    # Determine which boards to convert
    if args.boards:
        board_dirs = []
        for name in args.boards:
            board_dir = TRELLO_IMPORT_DIR / name
            if not board_dir.is_dir():
                print(f"Warning: Board directory not found: {board_dir}", file=sys.stderr)
                continue
            board_dirs.append(board_dir)
    else:
        board_dirs = sorted(
            [d for d in TRELLO_IMPORT_DIR.iterdir() if d.is_dir()],
            key=lambda d: d.name,
        )

    if not board_dirs:
        print("No boards found to convert.", file=sys.stderr)
        sys.exit(1)

    for board_dir in board_dirs:
        board_name = board_dir.name

        if args.output_dir:
            args.output_dir.mkdir(parents=True, exist_ok=True)
            output_file = args.output_dir / f"{board_name} Kanban.md"
        else:
            output_file = board_dir / f"{board_name} Kanban.md"

        if output_file.exists():
            print(f"Skipping {board_name}: {output_file} already exists (delete to regenerate)")
            continue

        content = build_kanban_board(board_dir)
        output_file.write_text(content, encoding="utf-8")

        # Count columns and cards
        col_count = content.count("\n## ") - 1  # minus Archive
        card_count = content.count("- [ ] [[")
        print(f"Created: {output_file} ({col_count} columns, {card_count} cards)")


if __name__ == "__main__":
    main()
