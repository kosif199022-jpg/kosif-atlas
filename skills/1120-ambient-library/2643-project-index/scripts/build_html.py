#!/usr/bin/env python3
"""build_html.py — render PROJECT_INDEX.md into a self-contained searchable HTML page.

Usage:
  build_html.py <PROJECT_INDEX.md> [-o OUTPUT.html] [--title TITLE] [--subtitle TEXT]

Parses the markdown table (| Project | Location | Status | Description |) and
injects it into the template next to this script. Exit 0 on success, 1 on
parse failure (no rows found), 2 on bad arguments.
"""

import argparse
import html
import json
import os
import sys


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("index_md")
    ap.add_argument("-o", "--output")
    ap.add_argument("--title", default="Project Index")
    ap.add_argument("--subtitle", default="")
    a = ap.parse_args()

    try:
        md = open(a.index_md).read()
    except OSError as e:
        print(f"error: {e}", file=sys.stderr)
        sys.exit(2)

    rows = []
    for line in md.splitlines():
        if (
            not line.startswith("| ")
            or line.startswith("| Project")
            or line.startswith("|---")
        ):
            continue
        parts = [p.strip() for p in line.strip().strip("|").split("|")]
        if len(parts) != 4:
            continue
        rows.append(
            dict(
                zip(("name", "loc", "status", "desc"), (html.escape(p) for p in parts))
            )
        )
    if not rows:
        print("error: no table rows parsed from " + a.index_md, file=sys.stderr)
        sys.exit(1)

    tpl_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "..", "assets", "template.html"
    )
    tpl = open(tpl_path).read()
    subtitle = (
        a.subtitle
        or f"{len(rows)} projects. Generated from {os.path.basename(a.index_md)}."
    )
    # Pre-render rows server-side so the table shows content in no-JS viewers
    # (static snapshots, sandboxed previews); JS re-renders for search/filter/sort.
    families = []
    for r in rows:
        f = r["status"].split(",")[0].strip()
        if f not in families:
            families.append(f)
    families.sort(
        key=lambda f: -sum(1 for r in rows if r["status"].split(",")[0].strip() == f)
    )
    color = {f: i % 6 for i, f in enumerate(families)}
    static_rows = "".join(
        f'\n    <tr><td class="proj">{r["name"]}</td><td class="loc">{r["loc"]}</td>'
        f'<td><span class="status" style="--pc: var(--c{color[r["status"].split(",")[0].strip()]}); '
        f'--pb: var(--c{color[r["status"].split(",")[0].strip()]}-bg)">{r["status"]}</span></td>'
        f'<td class="desc">{r["desc"]}</td></tr>'
        for r in rows
    )
    out = (
        tpl.replace("__TITLE__", html.escape(a.title))
        .replace("__SUBTITLE__", html.escape(subtitle))
        .replace("__DATA_JSON__", json.dumps(rows))
        .replace("__STATIC_ROWS__", static_rows)
    )

    out_path = a.output or os.path.splitext(a.index_md)[0] + ".html"
    open(out_path, "w").write(out)
    print(out_path)


if __name__ == "__main__":
    main()
