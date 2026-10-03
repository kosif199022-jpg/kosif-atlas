#!/usr/bin/env python3
"""
Convert Trello board export JSON files to Markdown with one file per card.

Usage:
  python import_from_trello.py board1.json [board2.json ...]

Output:
  ./TRELLO_IMPORT/<board>/<list>/<card>/index.md
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"}
MAX_FILENAME_BASE = 120


def slugify_filename(name: str, max_len: int = MAX_FILENAME_BASE) -> str:
    name = (name or "untitled").strip().replace("/", "-").replace("\\", "-")
    name = re.sub(r"\s+", " ", name)
    name = re.sub(r"[^\w\-. ()]+", "", name, flags=re.UNICODE).strip(" .")
    if not name:
        name = "untitled"
    if len(name) > max_len:
        name = name[:max_len].rstrip(" .")
    return name or "untitled"


def yaml_quote(value: str) -> str:
    escaped = (value or "").replace('"', '\\"')
    return f'"{escaped}"'


def is_image_url(url: str) -> bool:
    lower = url.lower().split("?")[0]
    return any(lower.endswith(ext) for ext in IMAGE_EXTENSIONS)


def card_markdown(board_name: str, list_name: str, card: dict) -> str:
    title = card.get("name", "Untitled card")
    desc = (card.get("desc") or "").rstrip()
    attachments = card.get("attachments", [])
    trello_url = card.get("shortUrl") or card.get("url") or ""

    lines = [
        "---",
        f"title: {yaml_quote(title)}",
        f"board: {yaml_quote(board_name)}",
        f"list: {yaml_quote(list_name)}",
    ]
    if trello_url:
        lines.append(f"trello_url: {yaml_quote(trello_url)}")

    lines.extend([
        "---",
        "",
        f"# {title}",
        "",
    ])

    if trello_url:
        lines.extend(["## Trello", "", f"[Open in Trello]({trello_url})", ""])

    if desc:
        lines.extend(["## Description", "", desc, ""])

    if attachments:
        lines.extend(["## Attachments", ""])
        for attachment in attachments:
            url = attachment.get("url", "")
            if not url:
                continue
            name = attachment.get("name") or Path(url).name
            if is_image_url(url):
                lines.append(f"![{name}]({url})")
            else:
                lines.append(f"- [{name}]({url})")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def confirm_overwrite(board_dir: Path, json_path: Path) -> bool:
    prompt = (
        f"Board directory already exists for {json_path.name}: {board_dir}\n"
        "It will be deleted and recreated. Proceed? [y/N]: "
    )
    try:
        answer = input(prompt).strip().lower()
    except EOFError:
        return False
    return answer in {"y", "yes"}


def convert_json_file(json_path: Path, output_root: Path) -> int:
    with json_path.open("r", encoding="utf-8") as fp:
        data = json.load(fp)

    board_name = data.get("name") or json_path.stem
    board_dir = output_root / slugify_filename(board_name)
    if board_dir.exists():
        if not sys.stdin.isatty():
            raise SystemExit(
                "Refusing to overwrite existing board directory in non-interactive "
                f"mode: {board_dir}"
            )
        if not confirm_overwrite(board_dir, json_path):
            raise SystemExit("Aborted by user.")
        shutil.rmtree(board_dir)
    board_dir.mkdir(parents=True, exist_ok=True)

    lists = {
        item["id"]: {
            "name": item.get("name", "Unnamed List"),
            "pos": item.get("pos", 0),
        }
        for item in data.get("lists", [])
    }

    cards_by_list: dict[str, list[dict]] = {}
    for card in data.get("cards", []):
        list_id = card.get("idList")
        if list_id not in lists:
            continue
        cards_by_list.setdefault(list_id, []).append(card)

    sorted_lists = sorted(lists.items(), key=lambda kv: kv[1]["pos"])

    written = 0
    for list_index, (list_id, list_info) in enumerate(sorted_lists, start=1):
        list_name = list_info["name"]
        list_dir_name = f"{list_index:03d} {slugify_filename(list_name)}"
        list_dir = board_dir / list_dir_name
        list_dir.mkdir(parents=True, exist_ok=True)

        cards = sorted(cards_by_list.get(list_id, []), key=lambda c: c.get("pos", 0))
        slug_counts: dict[str, int] = {}
        for card in cards:
            slug = slugify_filename(card.get("name", "Untitled card"))
            slug_counts[slug] = slug_counts.get(slug, 0) + 1

        for card in cards:
            content = card_markdown(board_name, list_name, card)
            slug = slugify_filename(card.get("name", "Untitled card"))
            card_id = str(card.get("id", "dup"))

            if slug_counts.get(slug, 0) > 1:
                dup_slug = slugify_filename(slug, max_len=90)
                safe_id = slugify_filename(card_id, max_len=40)
                card_dir = list_dir / f"{dup_slug} [{safe_id}]"
            else:
                card_dir = list_dir / slug

            card_dir.mkdir(parents=True, exist_ok=True)
            card_file = card_dir / "index.md"

            card_file.write_text(content, encoding="utf-8")
            written += 1

    return written


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Convert explicit Trello JSON exports into Obsidian markdown notes."
        )
    )
    parser.add_argument(
        "json_files",
        nargs="+",
        help="JSON export files to import (relative to current directory).",
    )
    return parser.parse_args()


def resolve_json_files(cwd: Path, paths: list[str]) -> list[Path]:
    resolved: list[Path] = []
    missing: list[str] = []
    wrong_ext: list[str] = []

    for raw in paths:
        path = (cwd / raw).resolve()
        if path.suffix.lower() != ".json":
            wrong_ext.append(raw)
            continue
        if not path.exists():
            missing.append(raw)
            continue
        resolved.append(path)

    if wrong_ext:
        raise SystemExit(f"Expected .json files, got: {', '.join(wrong_ext)}")
    if missing:
        raise SystemExit(f"JSON file(s) not found: {', '.join(missing)}")

    return sorted(dict.fromkeys(resolved))


def main() -> None:
    args = parse_args()
    cwd = Path(".").resolve()
    output_dir = cwd / "TRELLO_IMPORT"
    output_dir.mkdir(parents=True, exist_ok=True)

    json_files = resolve_json_files(cwd, args.json_files)

    total = 0
    print(f"Found {len(json_files)} JSON file(s)")
    for json_file in json_files:
        print(f"Converting {json_file.name} ...")
        count = convert_json_file(json_file, output_dir)
        total += count
        print(f"  -> wrote {count} card files")

    print(f"Done. Total card files: {total}")


if __name__ == "__main__":
    main()
