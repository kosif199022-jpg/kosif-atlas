#!/usr/bin/env python3
"""
Download Trello-hosted images referenced in Markdown files.

Scans markdown files under an explicit --root path and stores images in the same
folder as each markdown file.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse
from urllib.request import Request, urlopen

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg", ".avif"}
IMAGE_LINK_RE = re.compile(r"!\[(?P<alt>[^\]]*)\]\((?P<target>[^)]+)\)")
MAX_FILENAME_LEN = 180


def clean_url(raw: str) -> str:
    value = raw.strip()
    if value.startswith("<") and value.endswith(">"):
        value = value[1:-1].strip()
    if " " in value:
        value = value.split(" ", 1)[0]
    return value


def is_trello_host(url: str) -> bool:
    host = (urlparse(url).hostname or "").lower()
    return host.endswith("trello.com") or host.endswith("trello-attachments.s3.amazonaws.com")


def is_image_url(url: str) -> bool:
    path = urlparse(url).path.lower()
    return Path(path).suffix in IMAGE_EXTENSIONS


def safe_filename_from_url(url: str, fallback_index: int) -> str:
    raw_name = unquote(Path(urlparse(url).path).name).strip()
    raw_name = raw_name.replace("/", "_").replace("\\", "_")
    raw_name = re.sub(r'[<>:"|?*\x00-\x1F]', "_", raw_name).strip(" .")
    if raw_name:
        base = Path(raw_name).stem
        ext = Path(raw_name).suffix
        max_base_len = MAX_FILENAME_LEN - len(ext)
        if len(raw_name) > MAX_FILENAME_LEN and max_base_len > 0:
            raw_name = f"{base[:max_base_len].rstrip(' .')}{ext}"
    if raw_name:
        return raw_name
    return f"image_{fallback_index:04d}.bin"


def out(message: str) -> None:
    try:
        print(message)
    except BrokenPipeError:
        raise SystemExit(0) from None


def extract_trello_image_urls(markdown_text: str) -> list[str]:
    seen: set[str] = set()
    urls: list[str] = []
    for match in IMAGE_LINK_RE.finditer(markdown_text):
        url = clean_url(match.group("target"))
        if not url.startswith(("http://", "https://")):
            continue
        if not is_trello_host(url):
            continue
        if not is_image_url(url):
            continue
        if url in seen:
            continue
        seen.add(url)
        urls.append(url)
    return urls


def rewrite_trello_image_links(markdown_text: str, url_to_filename: dict[str, str]) -> tuple[str, int]:
    rewritten = 0

    def _replace(match: re.Match[str]) -> str:
        nonlocal rewritten
        alt = match.group("alt")
        target = match.group("target")
        url = clean_url(target)
        filename = url_to_filename.get(url)
        if not filename:
            return match.group(0)
        rewritten += 1
        return f"![{alt}](./{filename})"

    return IMAGE_LINK_RE.sub(_replace, markdown_text), rewritten


def download_file(url: str, destination: Path, timeout: int) -> None:
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; trello-media-downloader/1.0)",
            "Accept": "*/*",
        },
    )
    with urlopen(request, timeout=timeout) as response:
        data = response.read()
    destination.write_bytes(data)


def process_markdown_file(
    markdown_path: Path,
    dry_run: bool,
    overwrite: bool,
    timeout: int,
) -> tuple[int, int, int]:
    text = markdown_path.read_text(encoding="utf-8")
    urls = extract_trello_image_urls(text)

    downloaded = 0
    skipped = 0
    failed = 0
    rewritten = 0
    folder = markdown_path.parent
    url_to_filename: dict[str, str] = {}

    for index, url in enumerate(urls, start=1):
        filename = safe_filename_from_url(url, index)
        target = folder / filename

        if target.exists() and not overwrite:
            skipped += 1
            url_to_filename[url] = filename
            out(f"SKIP  {target} (already exists)")
            continue

        if dry_run:
            downloaded += 1
            url_to_filename[url] = filename
            out(f"PLAN  {url} -> {target}")
            continue

        try:
            download_file(url, target, timeout)
            downloaded += 1
            url_to_filename[url] = filename
            out(f"OK    {url} -> {target}")
        except Exception as exc:  # noqa: BLE001
            failed += 1
            out(f"FAIL  {url} ({exc})")

    rewritten_text, rewritten = rewrite_trello_image_links(text, url_to_filename)
    if rewritten:
        if dry_run:
            out(f"PLAN  rewrite {rewritten} link(s) in {markdown_path}")
        else:
            markdown_path.write_text(rewritten_text, encoding="utf-8")
            out(f"OK    rewrote {rewritten} link(s) in {markdown_path}")

    return downloaded, skipped, failed, rewritten


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Download Trello-hosted images referenced in markdown files."
    )
    parser.add_argument(
        "--root",
        type=Path,
        required=True,
        help="Directory to scan for markdown files (required).",
    )
    parser.add_argument(
        "--pattern",
        default="**/index.md",
        help="Glob pattern under --root (default: **/index.md).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List planned downloads without writing files.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing files with the same name.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=30,
        help="HTTP timeout in seconds (default: 30).",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()

    root = args.root
    if not root.exists():
        out(f"Root not found: {root}")
        return 1

    markdown_files = sorted(path for path in root.glob(args.pattern) if path.is_file())
    if not markdown_files:
        out(f"No markdown files found via {root}/{args.pattern}")
        return 0

    out(f"Scanning {len(markdown_files)} markdown file(s)")
    total_downloaded = 0
    total_skipped = 0
    total_failed = 0
    total_rewritten = 0

    for markdown_path in markdown_files:
        downloaded, skipped, failed, rewritten = process_markdown_file(
            markdown_path=markdown_path,
            dry_run=args.dry_run,
            overwrite=args.overwrite,
            timeout=args.timeout,
        )
        total_downloaded += downloaded
        total_skipped += skipped
        total_failed += failed
        total_rewritten += rewritten

    out(
        "Done. "
        f"downloaded={total_downloaded}, skipped={total_skipped}, "
        f"failed={total_failed}, rewritten={total_rewritten}"
    )
    return 1 if total_failed else 0


if __name__ == "__main__":
    sys.exit(main())
