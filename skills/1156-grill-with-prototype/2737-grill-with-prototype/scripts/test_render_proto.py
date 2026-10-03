#!/usr/bin/env python3
"""Check variants and simulated outcomes render as the bar and proto.js expect.

python3 scripts/test_render_proto.py     # exit 0 = pass; renders the admin example in a temp dir
"""

import html
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent


def attr(page, name):
    m = re.search(rf'{name}="([^"]*)"', page)
    return json.loads(html.unescape(m.group(1))) if m else None


with tempfile.TemporaryDirectory() as tmp:
    proj = Path(tmp) / "admin"
    shutil.copytree(HERE.parent / "examples" / "admin", proj)
    spec = json.loads((proj / "spec.json").read_text())
    screens = {s["id"]: s for s in spec["screens"]}
    screens["invoices"]["variants"] = [
        {"name": "Cards", "view": "cards"},
        {"name": "Board", "view": "cards", "filters": []},
        {"name": "Ignored", "view": "table"},  # a 4th: dropped with a warning
    ]
    screens["new-invoice"]["simulate"] = {
        "submit": {
            "delay": 1200,
            "outcomes": [
                {
                    "name": "ok",
                    "target": "invoices",
                    "toast": "Invoice created",
                    "response": {"id": "INV-20491"},
                },
                {
                    "name": "declined",
                    "toast": "Customer is on credit hold",
                    "stay": True,
                },
                {"name": "timeout", "target": "nowhere", "delay": 8000},
            ],
        }
    }
    del screens["new-invoice"][
        "submit"
    ]  # no target: the simulate block alone specifies it
    spec["entities"]["Loan"] = {"count": 8, "fields": [
        {"name": "tool", "type": "title"}, {"name": "from", "type": "date"},
        {"name": "to", "type": "date"}, {"name": "status", "type": "status", "options": ["Approved", "Requested"]}]}
    spec["screens"].append({"id": "loan", "title": "Loan", "archetype": "detail", "entity": "Loan",
                            "row": {"status": "Requested"}, "actions": [{"label": "Approve"}]})
    (proj / "spec.json").write_text(json.dumps(spec))

    r = subprocess.run(
        [sys.executable, str(HERE / "render_proto.py"), str(proj)],
        capture_output=True,
        text=True,
    )
    assert r.returncode == 0, r.stderr
    assert "more than 3 variants" in r.stderr, r.stderr
    out = proj / "prototype"
    man = json.loads((out / "manifest.json").read_text())

    # variants: A is the screen, B/C are siblings; the 4th is gone
    assert (out / "invoices--b.html").exists() and (out / "invoices--c.html").exists()
    assert not (out / "invoices--d.html").exists()
    a, b = (out / "invoices.html").read_text(), (out / "invoices--b.html").read_text()
    assert [v["file"] for v in attr(a, "data-variants")] == [
        "invoices.html",
        "invoices--b.html",
        "invoices--c.html",
    ]
    assert 'data-variant="a"' in a and 'data-variant="b"' in b
    assert a != b, "variant B rendered identical to A"
    assert next(s for s in man["screens"] if s["id"] == "invoices")["variants"] == [
        "Current",
        "Cards",
        "Board",
    ]
    assert "data-variants" not in (out / "customers.html").read_text()

    # simulate: outcomes resolved to a page or stay; unknown outcome target is a question
    form = (out / "new-invoice.html").read_text()
    sim = attr(form, "data-sim")
    assert [o["go"] for o in sim["outcomes"]] == ["invoices.html", None, None]
    assert man["scenarios"] == ["ok", "declined", "timeout"]
    assert attr(form, "data-scenarios") == man["scenarios"]
    unspec = {(u["screen"], u["control"]) for u in man["unspecified"]}
    assert ("new-invoice", "submit") not in unspec
    assert ("new-invoice", "submit@timeout") in unspec

    # sample data agrees with itself: dates in order, the detail shows a row its actions fit, no stock gallery
    loan = (out / "loan.html").read_text()
    assert ">Requested<" in loan and ">Approved<" not in loan, "detail shows a row its actions contradict"
    assert 'class="gallery"' not in loan
    ds = re.findall(r"<dd>([A-Z][a-z]{2} \d{1,2}, \d{4})</dd>", loan)
    from datetime import datetime as dt
    assert len(ds) == 2 and dt.strptime(ds[0], "%b %d, %Y") < dt.strptime(ds[1], "%b %d, %Y"), ds

print("ok: variants and simulate render")
