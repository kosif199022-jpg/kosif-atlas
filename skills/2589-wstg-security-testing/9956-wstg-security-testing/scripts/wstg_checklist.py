#!/usr/bin/env python3
"""WSTG checklist — generate an engagement checklist, or score coverage of a filled one.

Reads data/wstg.json (canonical 12-category / 109-test set).

GENERATE a fresh checklist:
  python wstg_checklist.py                       Markdown, all 12 categories
  python wstg_checklist.py --cat INPV,ATHZ,SESS  Only those categories
  python wstg_checklist.py --format csv          CSV instead of Markdown
  python wstg_checklist.py --out checklist.md    Write to file (else stdout)

Status values used in the Status column: TODO | PASS | FAIL | N/A | INFO

SCORE a filled-in checklist (counts statuses, reports coverage %):
  python wstg_checklist.py --score checklist.md

Notes:
  - "Coverage" = tests that are no longer TODO (i.e. you reached a verdict).
  - Markdown columns: ID | Test | Status | Severity | Notes
  - CSV has the same columns; both are round-trippable by --score.
"""
import argparse
import json
import os
import sys

DATA = os.path.join(os.path.dirname(__file__), "..", "data", "wstg.json")
STATUSES = ["TODO", "PASS", "FAIL", "N/A", "INFO"]


def load():
    with open(DATA, encoding="utf-8") as f:
        return json.load(f)


def select(db, cats):
    if not cats:
        return db["categories"]
    want = {c.upper().replace("WSTG-", "") for c in cats}
    out = [c for c in db["categories"] if c["code"] in want]
    missing = want - {c["code"] for c in out}
    if missing:
        sys.exit(f"Unknown category code(s): {', '.join(sorted(missing))}")
    return out


def gen_markdown(cats):
    lines = ["# WSTG Engagement Checklist", "",
             "Status: TODO | PASS | FAIL | N/A | INFO  ·  fill Severity for FAILs (Info/Low/Medium/High/Critical)", ""]
    for c in cats:
        lines.append(f"## WSTG-{c['code']}: {c['name']}")
        lines.append("")
        lines.append("| ID | Test | Status | Severity | Notes |")
        lines.append("|----|------|--------|----------|-------|")
        for t in c["tests"]:
            name = t["name"].replace("|", "\\|")
            lines.append(f"| {t['id']} | {name} | TODO |  |  |")
        lines.append("")
    return "\n".join(lines)


def gen_csv(cats):
    import csv
    import io
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["ID", "Test", "Status", "Severity", "Notes"])
    for c in cats:
        for t in c["tests"]:
            w.writerow([t["id"], t["name"], "TODO", "", ""])
    return buf.getvalue()


def _row_cells(line):
    """Return trimmed cells for a Markdown or CSV checklist row, else None.

    Both formats put columns in order: ID, Test, Status, Severity, Notes.
    We read the Status cell (index 2) directly instead of scanning the whole
    line, so status tokens hidden inside IDs (e.g. INFO in WSTG-INFO-01) or
    test names never cause a false match.
    """
    if "|" in line:  # markdown table row
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
    elif "," in line:  # csv row
        import csv
        import io
        cells = next(csv.reader(io.StringIO(line)))
    else:
        return None
    if not cells or not cells[0].upper().startswith("WSTG-"):
        return None
    return cells


def score(path):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    counts = {s: 0 for s in STATUSES}
    fails = []
    for line in text.splitlines():
        cells = _row_cells(line)
        if not cells:
            continue
        wstg_id = cells[0]
        raw = cells[2].upper() if len(cells) > 2 else ""
        status = raw if raw in STATUSES else "TODO"
        counts[status] = counts.get(status, 0) + 1
        if status == "FAIL":
            fails.append(wstg_id)
    total = sum(counts.values())
    reached = total - counts.get("TODO", 0)
    pct = (reached / total * 100) if total else 0
    print(f"Checklist: {path}")
    print(f"  Total tests : {total}")
    for s in STATUSES:
        print(f"  {s:<5}       : {counts.get(s, 0)}")
    print(f"  Coverage    : {reached}/{total} ({pct:.0f}% verdict reached)")
    if fails:
        print(f"  FAILs       : {', '.join(fails)}")


def main():
    p = argparse.ArgumentParser(description="WSTG checklist generator / scorer")
    p.add_argument("--cat", help="comma-separated category codes, e.g. INPV,ATHZ")
    p.add_argument("--format", choices=["md", "csv"], default="md")
    p.add_argument("--out", help="output file (default: stdout)")
    p.add_argument("--score", help="score a filled-in checklist file")
    a = p.parse_args()

    if a.score:
        score(a.score)
        return

    db = load()
    cats = select(db, a.cat.split(",") if a.cat else None)
    content = gen_csv(cats) if a.format == "csv" else gen_markdown(cats)
    if a.out:
        with open(a.out, "w", encoding="utf-8") as f:
            f.write(content)
        n = sum(len(c["tests"]) for c in cats)
        print(f"Wrote {n} tests across {len(cats)} categories to {a.out}")
    else:
        print(content)


if __name__ == "__main__":
    main()
