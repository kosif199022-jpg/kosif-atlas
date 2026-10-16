#!/usr/bin/env python3
"""Export KOSIF Atlas skill graphs from the repository CSV indexes.

No external dependencies, no execution of third-party skills.
Run: python3 tools/export_atlas_graph.py
"""
import argparse
import collections
import csv
import html
import json
from pathlib import Path
import xml.etree.ElementTree as ET

INPUTS = ("index.csv", "index-copyleft.csv")

def collect(root):
    rows, inputs = [], []
    required = {"plugin", "skill", "license", "path", "verdict"}
    for filename in INPUTS:
        path = root / filename
        if not path.exists():
            continue
        with path.open(encoding="utf-8-sig", newline="") as stream:
            reader = csv.DictReader(stream)
            if not required.issubset(reader.fieldnames or []):
                raise ValueError(f"Unexpected columns in {filename}: {reader.fieldnames}")
            for row in reader:
                if any((v or "").strip() for v in row.values()):
                    row["source_index"] = filename
                    rows.append(row)
        inputs.append(filename)
    if not inputs:
        raise FileNotFoundError("Expected index.csv and/or index-copyleft.csv")
    return rows, inputs

def ordered(counter):
    return dict(sorted(counter.items(), key=lambda item: (-item[1], item[0].lower())))

def summary(rows, inputs):
    counter_keys = {
        "by_plugin": "plugin",
        "by_license": "license",
        "by_license_class": "license_class",
        "by_verdict": "verdict",
        "by_index": "source_index",
    }
    counters = {key: collections.Counter() for key in counter_keys}
    blocked = 0
    for row in rows:
        for out_key, field in counter_keys.items():
            counters[out_key][(row.get(field) or "").strip() or "(unknown)"] += 1
        blocked += str(row.get("blocked", "")).strip().lower() in ("true", "1", "yes")
    return {
        "repository": "kosif199022-jpg/kosif-atlas",
        "source_indexes": inputs,
        "total_skills": len(rows),
        "unique_plugins": len(counters["by_plugin"]),
        "copyleft_skills": counters["by_index"]["index-copyleft.csv"],
        "blocked_flagged": blocked,
        **{key: ordered(value) for key, value in counters.items()},
    }

def xml(s):
    return html.escape(str(s), quote=True)

def shortened(s, length=31):
    return s if len(s) <= length else s[:length - 1] + "…"

def svg_chart(data):
    top = list(data["by_plugin"].items())[:18]
    width = 1240
    height = max(810, 260 + 34 * len(top) + 80)
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="KOSIF Atlas skill chart">',
        '<rect width="100%" height="100%" fill="#0b1220"/>',
        '<text x="50" y="55" fill="#f8fafc" font-size="32" font-weight="bold" font-family="Arial,sans-serif">KOSIF ATLAS / SKILL MAP</text>',
        '<text x="50" y="86" fill="#94a3b8" font-size="16" font-family="Arial,sans-serif">Live source: repository index.csv + index-copyleft.csv</text>',
    ]
    cards = [
        ("Indexed skills", data["total_skills"]),
        ("Plugins", data["unique_plugins"]),
        ("Copyleft skills", data["copyleft_skills"]),
        ("Blocked flags", data["blocked_flagged"]),
    ]
    for i, (label, value) in enumerate(cards):
        x = 50 + 295 * i
        out += [
            f'<rect x="{x}" y="109" width="278" height="86" rx="12" fill="#18263c"/>',
            f'<text x="{x + 18}" y="138" fill="#93c5fd" font-size="14" font-family="Arial,sans-serif">{xml(label)}</text>',
            f'<text x="{x + 18}" y="176" fill="white" font-size="28" font-weight="bold" font-family="Arial,sans-serif">{value:,}</text>',
        ]
    out.append('<text x="50" y="224" fill="white" font-size="19" font-family="Arial,sans-serif">Top plugins by skill count</text>')
    maximum = max((v for _, v in top), default=1)
    for i, (name, count) in enumerate(top):
        y = 240 + i * 34
        w = max(2, round(count / maximum * 470))
        out += [
            f'<text x="50" y="{y + 18}" fill="#cbd5e1" font-size="13" font-family="Arial,sans-serif">{xml(shortened(name))}</text>',
            f'<rect x="330" y="{y + 2}" width="{w}" height="22" rx="4" fill="#38bdf8"/>',
            f'<text x="{w + 341}" y="{y + 19}" fill="white" font-size="13" font-family="Arial,sans-serif">{count}</text>',
        ]
    x, y = 870, 233
    for heading, section in (("License classes", "by_license_class"), ("Security verdicts", "by_verdict")):
        out.append(f'<text x="{x}" y="{y}" fill="white" font-size="19" font-family="Arial,sans-serif">{heading}</text>')
        y += 29
        for name, count in list(data[section].items())[:8]:
            out.append(f'<text x="{x}" y="{y}" fill="#cbd5e1" font-size="13" font-family="Arial,sans-serif">{xml(shortened(name, 24))}: {count:,}</text>')
            y += 31
        y += 42
    out += [
        f'<text x="50" y="{height - 28}" fill="#64748b" font-size="13" font-family="Arial,sans-serif">Generated from index metadata, not an executable dependency graph</text>',
        '</svg>',
    ]
    result = "\n".join(out) + "\n"
    ET.fromstring(result)
    return result

def html_dashboard(data, svg):
    plugin_rows = "".join(
        f"<tr><td>{xml(name)}</td><td>{count:,}</td></tr>"
        for name, count in data["by_plugin"].items()
    )
    def tabulate(section):
        return "".join(
            f"<tr><td>{xml(name)}</td><td>{count:,}</td></tr>"
            for name, count in data[section].items()
        )
    return ("""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>KOSIF Atlas — Skill Graph</title>
<style>
:root{color-scheme:dark}body{background:#0b1220;color:#e2e8f0;font:15px/1.5 system-ui,Arial,sans-serif;margin:0}
main{max-width:1240px;margin:auto;padding:18px}section{background:#132034;border:1px solid #334155;border-radius:14px;padding:20px;margin:25px 0}
.graph{overflow:auto;border:1px solid #334155;border-radius:14px}.graph svg{min-width:780px;width:100%;height:auto;display:block}
input{font:inherit;box-sizing:border-box;width:100%;padding:12px;border-radius:9px;border:1px solid #475569;background:#0b1220;color:white}
table{width:100%;border-collapse:collapse}td,th{padding:8px 12px;border-bottom:1px solid #334155;text-align:left}td:last-child,th:last-child{text-align:right}
a{color:#7dd3fc}p{color:#94a3b8}h2{font-size:22px}
</style></head><body><main><div class="graph">""" + svg +
"""</div><p>Statistics derived from the repository CSV indexes. This is a skills distribution chart, not a dependency graph.</p>
<section><h2>Plugins</h2><input id="filter" type="search" placeholder="Filter plugin names…">
<table><thead><tr><th>Plugin</th><th>Skill count</th></tr></thead><tbody id="plugins">""" + plugin_rows +
"""</tbody></table></section><section><h2>Licenses</h2>
<table><thead><tr><th>License</th><th>Skill count</th></tr></thead><tbody>""" + tabulate("by_license") +
"""</tbody></table></section><section><h2>Security verdicts</h2>
<table><thead><tr><th>Verdict</th><th>Skill count</th></tr></thead><tbody>""" + tabulate("by_verdict") +
"""</tbody></table></section>
<p>Third-party skills are not fully audited; do not run their scripts without reviewing them. Observe copyleft terms.</p>
<p><a href="graph.svg">SVG</a> · <a href="plugins.csv">CSV</a> · <a href="summary.json">JSON</a> ·
<a href="https://github.com/kosif199022-jpg/kosif-atlas">GitHub repository</a></p>
</main><script>
const q=document.getElementById("filter");
q.addEventListener("input",()=>{const term=q.value.toLocaleLowerCase();
for(const row of document.querySelectorAll("#plugins tr"))row.hidden=!row.cells[0].textContent.toLocaleLowerCase().includes(term);
});
</script></body></html>
""")

def main():
    cli = argparse.ArgumentParser()
    cli.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent)
    cli.add_argument("--out", type=Path, default=Path("reports/atlas-graph"))
    args = cli.parse_args()
    rows, inputs = collect(args.root)
    result = summary(rows, inputs)
    directory = args.out if args.out.is_absolute() else args.root / args.out
    directory.mkdir(parents=True, exist_ok=True)
    svg = svg_chart(result)
    (directory / "graph.svg").write_text(svg, encoding="utf-8")
    (directory / "index.html").write_text(html_dashboard(result, svg), encoding="utf-8")
    (directory / "summary.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with (directory / "plugins.csv").open("w", newline="", encoding="utf-8-sig") as stream:
        writer = csv.writer(stream)
        writer.writerow(("plugin", "skill_count"))
        writer.writerows(result["by_plugin"].items())
    print(f"Exported {result['total_skills']:,} skills across {result['unique_plugins']:,} plugins into {directory}")

if __name__ == "__main__":
    main()
