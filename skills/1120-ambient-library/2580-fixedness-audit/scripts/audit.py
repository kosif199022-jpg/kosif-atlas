#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""The Fixedness Audit — deterministic halves of the procedure.

  scan       walk an archive, cluster files into assets, emit inventory JSON
  rank       validate re-pricing judgments, score them, emit ranked list
  selfcheck  assert-based self-test (no framework)

The judgment between scan and rank is the agent's job, not this script's.
Exit codes: 0 ok · 1 bad input/validation failure · 2 nothing found
"""

import argparse
import json
import math
import os
import sys
import time
from collections import defaultdict

# ---------------------------------------------------------------- scan

SKIP_DIRS = {
    ".git",
    ".svn",
    "node_modules",
    "__pycache__",
    ".venv",
    "venv",
    ".tox",
    ".mypy_cache",
    ".pytest_cache",
    ".cache",
    "Library",
    ".Trash",
    "dist",
    "build",
    ".next",
    ".DS_Store",
    ".obsidian",
    ".terraform",
}
SKIP_FILES = {".DS_Store", "Thumbs.db", ".gitignore", ".gitkeep"}

# ponytail: extension+keyword heuristic, not a classifier. Categories exist to
# group the ranked output for a human, and the agent may override any of them.
EXT_CATEGORY = {
    ".mp3": "recording",
    ".m4a": "recording",
    ".wav": "recording",
    ".mp4": "recording",
    ".mov": "recording",
    ".m4v": "recording",
    ".vtt": "transcript",
    ".srt": "transcript",
    ".md": "notes",
    ".txt": "notes",
    ".rtf": "notes",
    ".docx": "document",
    ".doc": "document",
    ".pdf": "document",
    ".pptx": "deck",
    ".key": "deck",
    ".xlsx": "spreadsheet",
    ".csv": "spreadsheet",
    ".numbers": "spreadsheet",
    ".png": "visual",
    ".jpg": "visual",
    ".jpeg": "visual",
    ".svg": "visual",
    ".py": "tooling",
    ".js": "tooling",
    ".ts": "tooling",
    ".sh": "tooling",
    ".json": "data",
    ".yaml": "data",
    ".yml": "data",
}
NAME_CATEGORY = [  # checked against the asset's path, first hit wins
    ("transcript", "transcript"),
    ("recording", "recording"),
    ("intake", "client-artifact"),
    ("client", "client-artifact"),
    ("course", "course-module"),
    ("module", "course-module"),
    ("lesson", "course-module"),
    ("curricul", "course-module"),
    ("offer", "offer"),
    ("launch", "offer"),
    ("sales", "offer"),
    ("proposal", "offer"),
    ("pricing", "offer"),
    ("archive", "dormant-store"),
    ("old", "dormant-store"),
    ("backup", "dormant-store"),
    ("deprecated", "dormant-store"),
    ("template", "template"),
    ("framework", "method"),
    ("method", "method"),
    ("sop", "method"),
    ("process", "method"),
]


def categorize(rel_path: str, ext_counts: dict) -> str:
    low = rel_path.lower()
    for needle, cat in NAME_CATEGORY:
        if needle in low:
            return cat
    if ext_counts:
        top_ext = max(ext_counts.items(), key=lambda kv: kv[1])[0]
        return EXT_CATEGORY.get(top_ext, "other")
    return "other"


def scan(roots, depth, min_files, limit, now=None):
    now = now or time.time()
    buckets = defaultdict(
        lambda: {
            "files": 0,
            "bytes": 0,
            "newest": 0.0,
            "oldest": math.inf,
            "exts": defaultdict(int),
            "samples": [],
        }
    )
    skipped = 0
    for root in roots:
        root = os.path.abspath(os.path.expanduser(root))
        if not os.path.isdir(root):
            print(f"warn: not a directory, skipping: {root}", file=sys.stderr)
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [
                d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".")
            ]
            rel = os.path.relpath(dirpath, root)
            parts = [] if rel == "." else rel.split(os.sep)
            # every file belongs to exactly one asset: its ancestor truncated
            # to `depth` components. Guarantees a partition, no double-counting.
            key = (root, tuple(parts[:depth]))
            b = buckets[key]
            for fn in filenames:
                if fn in SKIP_FILES or fn.startswith("."):
                    skipped += 1
                    continue
                fp = os.path.join(dirpath, fn)
                try:
                    st = os.stat(fp)
                except OSError:
                    skipped += 1
                    continue
                b["files"] += 1
                b["bytes"] += st.st_size
                b["newest"] = max(b["newest"], st.st_mtime)
                b["oldest"] = min(b["oldest"], st.st_mtime)
                b["exts"][os.path.splitext(fn)[1].lower()] += 1
                if len(b["samples"]) < 5:
                    b["samples"].append(fn)

    assets = []
    for (root, parts), b in buckets.items():
        if b["files"] < min_files:
            continue
        rel = os.path.join(*parts) if parts else "."
        path = os.path.join(root, rel) if parts else root
        assets.append(
            {
                "id": "",
                "path": path,
                "label": rel
                if rel != "."
                else os.path.basename(root) + " (loose files)",
                "category": categorize(
                    os.path.join(os.path.basename(root), rel), b["exts"]
                ),
                "file_count": b["files"],
                "megabytes": round(b["bytes"] / 1e6, 2),
                "dormant_days": int((now - b["newest"]) / 86400),
                "span_days": int((b["newest"] - b["oldest"]) / 86400),
                "top_extensions": sorted(b["exts"], key=b["exts"].get, reverse=True)[
                    :4
                ],
                "sample_files": b["samples"],
            }
        )

    # substrate mass proxy: accumulation over time, not just file count.
    assets.sort(
        key=lambda a: a["file_count"] * (1 + math.log1p(a["span_days"])), reverse=True
    )
    truncated = max(0, len(assets) - limit)
    assets = assets[:limit]
    for i, a in enumerate(assets, 1):
        a["id"] = f"A{i:03d}"
    return {
        "generated": time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(now)),
        "roots": [os.path.abspath(os.path.expanduser(r)) for r in roots],
        "asset_count": len(assets),
        "truncated_assets": truncated,
        "skipped_files": skipped,
        "assets": assets,
    }


# ---------------------------------------------------------------- rank

DIMENSIONS = {  # weight, must sum to 1.0
    "pressure_fit": 0.30,  # does the NEW selection pressure demand this function
    "substrate_depth": 0.25,  # irreplaceable accumulated reality inside it
    "exclusivity": 0.25,  # can a competent rival + AI reproduce it this quarter
    "distance": 0.20,  # 5 = shippable this week as-is
}
REQUIRED = {"id", "new_function", "buyer", "evidence"} | set(DIMENSIONS)


def score_one(j):
    """Composite 0-100 with two honesty gates."""
    if j["pressure_fit"] == 0:
        return 0.0, "no-new-function"  # legitimate answer; do not inflate
    raw = sum(j[d] * w for d, w in DIMENSIONS.items()) / 5 * 100
    if j["exclusivity"] <= 1:
        return round(min(raw, 40.0), 1), "commodity-capped"
    return round(raw, 1), "ok"


def validate(judgments, inventory_ids):
    errs = []
    seen = set()
    for n, j in enumerate(judgments):
        if not isinstance(j, dict):
            errs.append(f"[{n}] not an object")
            continue
        missing = REQUIRED - set(j)
        if missing:
            errs.append(f"[{n}] missing fields: {sorted(missing)}")
            continue
        if inventory_ids and j["id"] not in inventory_ids:
            errs.append(f"[{n}] id {j['id']!r} not in inventory")
        if j["id"] in seen:
            errs.append(f"[{n}] duplicate id {j['id']!r}")
        seen.add(j["id"])
        for d in DIMENSIONS:
            v = j[d]
            if not isinstance(v, int) or not 0 <= v <= 5:
                errs.append(f"[{n}] {d}={v!r} must be int 0-5")
        for f in ("new_function", "buyer", "evidence"):
            if not isinstance(j[f], str) or len(j[f].strip()) < 10:
                errs.append(f"[{n}] {f} must be a real sentence (>=10 chars)")
    return errs


def rank(judgments, inventory):
    by_id = {a["id"]: a for a in inventory.get("assets", [])}
    rows = []
    for j in judgments:
        s, flag = score_one(j)
        a = by_id.get(j["id"], {})
        rows.append(
            {
                **j,
                "score": s,
                "flag": flag,
                "label": a.get("label", j["id"]),
                "path": a.get("path", ""),
                "category": a.get("category", ""),
            }
        )
    rows.sort(key=lambda r: r["score"], reverse=True)
    for i, r in enumerate(rows, 1):
        r["rank"] = i
        r["recommended"] = i <= 3 and r["score"] >= 50
    return rows


def render(rows, inventory):
    live = [r for r in rows if r["score"] > 0]
    out = [
        "# The Fixedness Audit — ranked list",
        "",
        f"Scanned {inventory.get('asset_count', '?')} assets across "
        f"{len(inventory.get('roots', []))} root(s) on "
        f"{inventory.get('generated', 'unknown date')}.",
        f"{len(live)} of {len(rows)} judged assets have a live new function.",
        "",
    ]
    top = [r for r in rows if r["recommended"]]
    if top:
        out.append("## Act on these now")
        for r in top:
            out += [
                f"### {r['rank']}. {r['label']} — {r['score']}",
                f"- **New function:** {r['new_function']}",
                f"- **Buyer:** {r['buyer']}",
                f"- **Evidence it's real:** {r['evidence']}",
                f"- **Path:** `{r['path']}`",
                f"- pressure {r['pressure_fit']}/5 · depth {r['substrate_depth']}/5 "
                f"· exclusivity {r['exclusivity']}/5 · distance {r['distance']}/5",
                "",
            ]
    else:
        out += [
            "## Act on these now",
            "",
            "Nothing cleared the bar (score >= 50). That is a real result, not a "
            "failure — the substrate here is either commodity or has no new "
            "function under the stated pressure.",
            "",
        ]
    out += [
        "## Full ranking",
        "",
        "| # | Asset | Score | New function | Flag |",
        "|---|---|---|---|---|",
    ]
    for r in rows:
        fn = r["new_function"].replace("|", "/")
        fn = fn[:70] + ("…" if len(fn) > 70 else "")
        out.append(
            f"| {r['rank']} | {r['label']} | {r['score']} | {fn} | {r['flag']} |"
        )
    out.append("")
    return "\n".join(out)


# ---------------------------------------------------------------- selfcheck


def selfcheck():
    import tempfile

    # scoring gates
    base = dict(id="A001", new_function="x" * 20, buyer="y" * 20, evidence="z" * 20)
    assert score_one(
        {
            **base,
            "pressure_fit": 0,
            "substrate_depth": 5,
            "exclusivity": 5,
            "distance": 5,
        }
    ) == (0.0, "no-new-function")
    s, f = score_one(
        {
            **base,
            "pressure_fit": 5,
            "substrate_depth": 5,
            "exclusivity": 1,
            "distance": 5,
        }
    )
    assert (s, f) == (40.0, "commodity-capped"), (s, f)
    assert score_one(
        {
            **base,
            "pressure_fit": 5,
            "substrate_depth": 5,
            "exclusivity": 5,
            "distance": 5,
        }
    ) == (100.0, "ok")
    assert abs(sum(DIMENSIONS.values()) - 1.0) < 1e-9

    # validation catches the four ways an inference step goes wrong
    good = {
        **base,
        "pressure_fit": 3,
        "substrate_depth": 3,
        "exclusivity": 3,
        "distance": 3,
    }
    assert validate([good], {"A001"}) == []
    assert validate([good], {"A999"}), "unknown id must fail"
    assert validate([good, good], {"A001"}), "duplicate id must fail"
    assert validate([{**good, "pressure_fit": 9}], {"A001"}), "out-of-range must fail"
    assert validate([{**good, "buyer": "n/a"}], {"A001"}), "stub prose must fail"
    assert validate([{k: v for k, v in good.items() if k != "evidence"}], {"A001"})

    # ranking: order, top-3 cap, sub-50 exclusion
    js = [
        {
            **base,
            "id": f"A{i:03d}",
            "pressure_fit": p,
            "substrate_depth": p,
            "exclusivity": p,
            "distance": p,
        }
        for i, p in enumerate([1, 5, 4, 3, 2], start=1)
    ]
    rows = rank(js, {"assets": []})
    assert [r["id"] for r in rows] == ["A002", "A003", "A004", "A005", "A001"]
    # top 3 by score, but only those clearing 50: p=5,4,3 -> 100,80,60
    assert [r["recommended"] for r in rows] == [True, True, True, False, False]
    weak = [
        {
            **base,
            "id": "A001",
            "pressure_fit": 2,
            "substrate_depth": 2,
            "exclusivity": 2,
            "distance": 2,
        }
    ]
    assert rank(weak, {"assets": []})[0]["recommended"] is False, (
        "sub-50 never recommended"
    )

    # scan: partition is exhaustive and non-overlapping
    with tempfile.TemporaryDirectory() as td:
        os.makedirs(os.path.join(td, "course", "m1", "deep"))
        os.makedirs(os.path.join(td, "transcripts"))
        for p in [
            ("loose.md",),
            ("course", "a.md"),
            ("course", "m1", "b.md"),
            ("course", "m1", "deep", "c.md"),
            ("transcripts", "t.vtt"),
            ("course", ".hidden"),
            (".DS_Store",),
        ]:
            open(os.path.join(td, *p), "w").write("x")
        os.makedirs(os.path.join(td, "node_modules"))
        open(os.path.join(td, "node_modules", "junk.js"), "w").write("x")
        inv = scan([td], depth=1, min_files=1, limit=50)
        assert sum(a["file_count"] for a in inv["assets"]) == 5, inv
        cats = {a["label"].split(os.sep)[0]: a["category"] for a in inv["assets"]}
        assert cats["course"] == "course-module", cats
        assert cats["transcripts"] == "transcript", cats
        assert len({a["id"] for a in inv["assets"]}) == len(inv["assets"])
        deep = scan([td], depth=2, min_files=1, limit=50)
        assert sum(a["file_count"] for a in deep["assets"]) == 5
        assert len(deep["assets"]) > len(inv["assets"])
        assert scan([td], depth=1, min_files=99, limit=50)["assets"] == []
    print("selfcheck: all assertions passed")


# ---------------------------------------------------------------- cli


def main():
    p = argparse.ArgumentParser(
        prog="audit.py",
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("scan", help="inventory an archive into asset clusters")
    s.add_argument("roots", nargs="+", help="directories to walk")
    s.add_argument(
        "--depth",
        type=int,
        default=2,
        help="path components that define one asset (default 2)",
    )
    s.add_argument(
        "--min-files",
        type=int,
        default=2,
        help="drop clusters smaller than this (default 2)",
    )
    s.add_argument(
        "--limit", type=int, default=60, help="max assets in output (default 60)"
    )
    s.add_argument("--out", help="write JSON here instead of stdout")

    r = sub.add_parser("rank", help="score + rank re-pricing judgments")
    r.add_argument("judgments", help="JSON file: list of judgment objects")
    r.add_argument("--inventory", help="scan output, for labels and id validation")
    r.add_argument("--out", help="write markdown here instead of stdout")
    r.add_argument("--json", action="store_true", help="emit JSON instead of markdown")
    r.add_argument(
        "--dry-run", action="store_true", help="validate and report, write nothing"
    )

    sub.add_parser("selfcheck", help="run assert-based self-test")

    a = p.parse_args()

    if a.cmd == "selfcheck":
        selfcheck()
        return 0

    if a.cmd == "scan":
        inv = scan(a.roots, a.depth, a.min_files, a.limit)
        if not inv["assets"]:
            print(
                "no assets found — check roots, or lower --min-files", file=sys.stderr
            )
            return 2
        text = json.dumps(inv, indent=2)
        if a.out:
            with open(a.out, "w") as fh:
                fh.write(text)
            print(
                f"{inv['asset_count']} assets -> {a.out}"
                + (
                    f" ({inv['truncated_assets']} truncated)"
                    if inv["truncated_assets"]
                    else ""
                ),
                file=sys.stderr,
            )
        else:
            print(text)
        return 0

    # rank
    with open(a.judgments) as fh:
        judgments = json.load(fh)
    if isinstance(judgments, dict):
        judgments = judgments.get("judgments", [])
    inventory = {}
    if a.inventory:
        with open(a.inventory) as fh:
            inventory = json.load(fh)
    errs = validate(judgments, {x["id"] for x in inventory.get("assets", [])})
    if errs:
        print("judgment validation failed:", file=sys.stderr)
        for e in errs[:20]:
            print("  " + e, file=sys.stderr)
        return 1
    rows = rank(judgments, inventory)
    out = json.dumps(rows, indent=2) if a.json else render(rows, inventory)
    if a.dry_run:
        print(
            f"dry-run: {len(rows)} judgments valid, "
            f"{sum(r['recommended'] for r in rows)} recommended; nothing written",
            file=sys.stderr,
        )
        return 0
    if a.out:
        with open(a.out, "w") as fh:
            fh.write(out)
        print(f"ranked {len(rows)} assets -> {a.out}", file=sys.stderr)
    else:
        print(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
