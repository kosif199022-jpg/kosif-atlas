#!/usr/bin/env python3
"""Push a markdown file (or inline text) to this app's dashboard as a page.

  push_page.py <page> --markdown <file> [--title "…"] [--nav]
  push_page.py <page> --text "…" [--title "…"] [--nav]

The page becomes one `markdown` widget. --nav adds it to nav.pages if missing.
Used at boot for the Help page (references/commands.md); handy for any static page.
"""
import argparse
import sys
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(APP_ROOT / "bridge"))
import bridge  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("page"); ap.add_argument("--markdown"); ap.add_argument("--text"); ap.add_argument("--title"); ap.add_argument("--nav", action="store_true")
    a = ap.parse_args()
    if not (a.markdown or a.text):
        ap.error("--markdown <file> or --text required")
    bridge.ensure_runtime()
    text = Path(a.markdown).read_text(encoding="utf-8") if a.markdown else a.text
    st = bridge.read_state()
    st.setdefault("pages", {})[a.page] = {"title": a.title or a.page.replace("-", " ").title(),
                                         "widgets": [{"id": "content", "type": "markdown", "text": text}]}
    if a.nav and a.page not in st.setdefault("nav", {}).setdefault("pages", []):
        st["nav"]["pages"].append(a.page)
    bridge.write_json(bridge.STATE, st)
    print({"ok": True, "page": a.page, "chars": len(text)})


if __name__ == "__main__":
    main()
