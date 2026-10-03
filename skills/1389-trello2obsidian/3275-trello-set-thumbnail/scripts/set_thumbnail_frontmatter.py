#!/usr/bin/env python3
"""
Set a frontmatter field `thumbnail` to the first image found in each markdown file.

Default scope: TRELLO_IMPORT/**/index.md
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
IMAGE_RE = re.compile(r"!\[[^\]]*]\(([^)]+)\)")
LEGACY_TYPO_FIELD = "thumnbnail"


def yaml_quote(value: str) -> str:
    escaped = value.replace('"', '\\"')
    return f'"{escaped}"'


def clean_target(target: str) -> str:
    value = target.strip()
    if value.startswith("<") and value.endswith(">"):
        value = value[1:-1].strip()
    if " " in value:
        value = value.split(" ", 1)[0]
    return value


def first_image_target(markdown_body: str) -> str | None:
    match = IMAGE_RE.search(markdown_body)
    if not match:
        return None
    target = clean_target(match.group(1))
    return target or None


def update_file(path: Path, field_name: str) -> tuple[bool, bool]:
    text = path.read_text(encoding="utf-8")
    fm_match = FRONTMATTER_RE.match(text)
    if not fm_match:
        return False, False

    body = text[fm_match.end() :]
    first_image = first_image_target(body)
    if not first_image:
        return False, False

    frontmatter_lines = fm_match.group(1).splitlines()
    filtered_lines = []
    for line in frontmatter_lines:
        if line.startswith(f"{field_name}:"):
            continue
        if line.startswith(f"{LEGACY_TYPO_FIELD}:"):
            continue
        filtered_lines.append(line)
    filtered_lines.append(f"{field_name}: {yaml_quote(first_image)}")

    frontmatter_text = "\n".join(filtered_lines)
    new_text = f"---\n{frontmatter_text}\n---\n{body}"
    if new_text == text:
        return False, True

    path.write_text(new_text, encoding="utf-8")
    return True, True


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Set frontmatter thumbnail field from first markdown image."
    )
    parser.add_argument("--root", type=Path, default=Path("TRELLO_IMPORT"))
    parser.add_argument("--pattern", default="**/index.md")
    parser.add_argument("--field", default="thumbnail")
    args = parser.parse_args()

    if not args.root.exists():
        print(f"Root not found: {args.root}")
        return 1

    files = sorted(path for path in args.root.glob(args.pattern) if path.is_file())
    total = len(files)
    changed = 0
    with_image = 0

    for path in files:
        file_changed, has_image = update_file(path, args.field)
        if file_changed:
            changed += 1
        if has_image:
            with_image += 1

    print(f"Scanned: {total}")
    print(f"With image: {with_image}")
    print(f"Updated: {changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
