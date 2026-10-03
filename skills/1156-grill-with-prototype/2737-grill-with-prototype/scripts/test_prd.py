#!/usr/bin/env python3
"""Check `grill.py prd` writes an init-dev-project SPEC.md whose open items fail `make spec`.

python3 scripts/test_prd.py     # exit 0 = pass; runs a copy of the skill in a temp dir
"""

import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

APP = Path(__file__).resolve().parent.parent

with tempfile.TemporaryDirectory() as tmp:
    app = Path(tmp) / "app"
    shutil.copytree(APP, app, ignore=shutil.ignore_patterns("runtime", "__pycache__"))
    (app / "runtime").mkdir()
    spec_dir = Path(tmp) / "repo" / "spec"  # an init-dev-project repo's spec/
    spec_dir.mkdir(parents=True)
    (app / "runtime" / "config.json").write_text(
        json.dumps({"workspace": str(spec_dir)})
    )

    def g(*args, ok=True):
        r = subprocess.run(
            [sys.executable, str(app / "scripts" / "grill.py"), *args],
            capture_output=True,
            text=True,
        )
        assert (r.returncode == 0) == ok, r.stderr or r.stdout
        return r

    # a hand-written spec is never overwritten
    (spec_dir / "SPEC.md").write_text("# Mine\n\nWritten by hand.\n")
    g("new", "Ledgerline", "--from", "admin", "--slug", "prototype")
    assert "hand-written" in g("prd", ok=False).stderr

    # the untouched scaffold (TODO: lines) is replaced
    (spec_dir / "SPEC.md").write_text(
        "# x spec\n\n## What it must do\n\nTODO: one behavior\n\n## Decisions\n\n"
        "- 2026-10-01: scaffolded with init-dev-project. Add a dated line whenever the spec changes.\n"
    )
    proj = spec_dir / "prototype"
    spec = json.loads((proj / "spec.json").read_text())
    form = next(s for s in spec["screens"] if s["id"] == "new-invoice")
    form["simulate"] = {
        "submit": {
            "outcomes": [
                {
                    "name": "ok",
                    "target": "invoices",
                    "toast": "Invoice created",
                    "response": {"id": "INV-20491"},
                },
                {
                    "name": "declined",
                    "stay": True,
                    "toast": "Customer is on credit hold",
                },
            ]
        }
    }
    (proj / "spec.json").write_text(json.dumps(spec))
    g(
        "req",
        json.dumps(
            {
                "actor": "Finance clerk",
                "trigger": "saves a new invoice",
                "result": "it appears in Invoices as Open",
                "evidence": "Novak Logistics, €1,200 → INV-20491 Open",
                "failure": "credit hold blocks the save",
                "screens": ["new-invoice", "credit-check"],
            }
        ),
    )
    g(
        "lock",
        "Invoices are numbered INV-#####",
        "--because",
        "matches the ledger export",
    )
    out = json.loads(g("prd").stdout)

    md = (spec_dir / "SPEC.md").read_text()
    assert out["path"] == str(spec_dir / "SPEC.md")
    for h in (
        "## What it must do",
        "## Examples",
        "## Screens",
        "## Data",
        "## Actions",
        "## Decisions",
        "## Open",
    ):
        assert h in md, h
    assert (
        "- REQ-001 (now) — Finance clerk: saves a new invoice → it appears in Invoices as Open."
        in md
    )
    assert "- REQ-001, failure: credit hold blocks the save" in md
    assert (
        '`new-invoice.submit` → ok: goes to invoices, shows “Invoice created”; the back end returns `{"id": "INV-20491"}`'
        in md
    )
    assert "`new-invoice.submit` → declined: stays" in md
    assert "`new-invoice.submit` “Save invoice” simulated: ok, declined" in md
    assert "`overview.new-invoice` “New invoice” → new-invoice" in md
    assert "- **Invoice**: number text, customer title" in md
    assert re.search(
        r"^- \d{4}-\d\d-\d\d: Invoices are numbered INV-##### — matches the ledger export$",
        md,
        re.M,
    )
    todos = re.findall(r"^TODO:.*", md, re.M)
    assert todos and len(todos) == out["todo"], (todos, out)
    assert any("record-payment" in t or "Record payment" in t for t in todos), (
        todos
    )  # admin leaves it unspecified
    assert "TODO: REQ-001 names screen `credit-check`, which does not exist yet" in todos
    assert not any("`new-invoice`" in t for t in todos), todos
    assert "prototype/index.html" in md
    assert json.loads((proj / "ledger.json").read_text())["phase"] == "prd"

    # rerun overwrites its own output and keeps the scaffold's decision (it lives in the ledger now)
    g("prd")
    md = (spec_dir / "SPEC.md").read_text()
    assert md.count("- 2026-10-01: scaffolded with init-dev-project.") == 1, md

print("ok: prd writes SPEC.md")
