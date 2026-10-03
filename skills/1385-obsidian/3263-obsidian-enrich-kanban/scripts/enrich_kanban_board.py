#!/usr/bin/env python3
"""Enrich one Obsidian Kanban board from linked note frontmatter.

For each card task with a wiki-link, update card rendering using linked note frontmatter:
- title -> wiki-link alias
- thumbnail -> markdown image above the alias
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import quote

WIKILINK_RE = re.compile(r"\[\[([^\]]+)\]\]")
TASK_PREFIX_RE = re.compile(r"^(?P<prefix>- \[[ xX]\])\s+(?P<body>.*)$")
URL_RE = re.compile(r"^[a-zA-Z][a-zA-Z0-9+.-]*://")


def parse_frontmatter(note_path: Path) -> dict[str, str]:
    text = note_path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        return {}

    end = text.find("\n---", 4)
    if end == -1:
        return {}

    frontmatter = text[4:end]
    data: dict[str, str] = {}
    for line in frontmatter.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()
        if not key:
            continue
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        data[key] = value
    return data


def parse_wikilink_parts(wikilink: str) -> tuple[str, str | None]:
    if "|" in wikilink:
        path_part, alias = wikilink.split("|", 1)
        return path_part.strip(), alias.strip()
    return wikilink.strip(), None


def strip_anchor(path_part: str) -> str:
    for sep in ("#", "^"):
        if sep in path_part:
            return path_part.split(sep, 1)[0]
    return path_part


def resolve_note_path(board_path: Path, link_path: str) -> Path | None:
    normalized = strip_anchor(link_path)
    if not normalized:
        return None

    candidates: list[Path] = []
    raw = Path(normalized)
    if raw.suffix:
        candidates.extend([board_path.parent / raw, Path.cwd() / raw])
    else:
        candidates.extend([board_path.parent / f"{normalized}.md", Path.cwd() / f"{normalized}.md"])

    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return candidate
    return None


def normalize_thumbnail(value: str) -> str:
    thumb = value.strip()
    if thumb.startswith("![[") and thumb.endswith("]]"):
        return thumb[3:-2].strip()
    if thumb.startswith("[[") and thumb.endswith("]]"):
        return thumb[2:-2].strip()
    return thumb


def to_board_relative_thumbnail(raw_thumbnail: str, note_path: Path, board_path: Path) -> str:
    if not raw_thumbnail:
        return raw_thumbnail
    if URL_RE.match(raw_thumbnail):
        return raw_thumbnail

    thumb_path = Path(raw_thumbnail)
    if thumb_path.is_absolute():
        return raw_thumbnail

    candidate = (note_path.parent / thumb_path).resolve()
    board_base = board_path.parent.resolve()
    if candidate.exists() and candidate.is_file():
        rel = candidate.relative_to(board_base) if candidate.is_relative_to(board_base) else None
        if rel is not None:
            return quote(rel.as_posix(), safe="/:@!$&'()*+,;=-._~")
    return raw_thumbnail


def escape_alias(text: str) -> str:
    return text.replace("|", "\\|").replace("]", "\\]")


def extract_wikilink(line: str) -> str | None:
    match = WIKILINK_RE.search(line)
    return match.group(1) if match else None


def enrich_task(prefix: str, wikilink: str, board_path: Path) -> list[str]:
    link_path, existing_alias = parse_wikilink_parts(wikilink)
    note_path = resolve_note_path(board_path, link_path)
    if note_path is None:
        if existing_alias:
            return [f"{prefix} [[{link_path}|{escape_alias(existing_alias)}]]"]
        return [f"{prefix} [[{link_path}]]"]

    frontmatter = parse_frontmatter(note_path)
    title = frontmatter.get("title", "").strip() or existing_alias or Path(link_path).name
    title = escape_alias(title)
    thumbnail = normalize_thumbnail(frontmatter.get("thumbnail", ""))
    thumbnail = to_board_relative_thumbnail(thumbnail, note_path, board_path)

    if thumbnail:
        return [f"{prefix} ![]({thumbnail})", f"  [[{link_path}|{title}]]"]
    return [f"{prefix} [[{link_path}|{title}]]"]


def enrich_board(board_path: Path) -> tuple[str, int]:
    lines = board_path.read_text(encoding="utf-8").splitlines()
    out: list[str] = []
    changes = 0
    i = 0

    while i < len(lines):
        line = lines[i]
        task_match = TASK_PREFIX_RE.match(line)
        if not task_match:
            out.append(line)
            i += 1
            continue

        prefix = task_match.group("prefix")
        body = task_match.group("body")
        link_inline = extract_wikilink(body)
        source_block = [line]

        # Handle existing 2-line enriched cards: image on task line + indented wikilink on next line.
        if link_inline is None and i + 1 < len(lines):
            next_line = lines[i + 1]
            if next_line.startswith((" ", "\t")):
                link_inline = extract_wikilink(next_line)
                if link_inline is not None:
                    source_block.append(next_line)

        if link_inline is None:
            out.append(line)
            i += 1
            continue

        new_lines = enrich_task(prefix, link_inline, board_path)
        if source_block != new_lines:
            changes += 1

        out.extend(new_lines)
        i += len(source_block)

    return "\n".join(out) + "\n", changes


def main() -> None:
    args = sys.argv[1:]
    if len(args) != 1:
        print(
            "Usage: python3 .claude/skills/obsidian-enrich-kanban-board/scripts/enrich_kanban_board.py <existing-board.md>",
            file=sys.stderr,
        )
        print("Error: provide exactly one existing Kanban board path.", file=sys.stderr)
        sys.exit(1)

    board_path = Path(args[0])
    if not board_path.exists() or not board_path.is_file():
        print(f"Error: board file not found: {board_path}", file=sys.stderr)
        sys.exit(1)

    content, changes = enrich_board(board_path)
    board_path.write_text(content, encoding="utf-8")
    print(f"Updated: {board_path} ({changes} card entries refreshed)")


if __name__ == "__main__":
    main()
