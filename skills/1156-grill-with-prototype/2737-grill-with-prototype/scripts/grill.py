#!/usr/bin/env python3
"""Interview-loop mechanics for grill-with-prototype. The agent supplies judgement; this
script owns the files and the dashboard.

  grill.py new "<Product name>" [--from blank|marketplace|admin|content] [--slug s]
  grill.py use <slug>                    switch the current project
  grill.py sync [--message "…"]          re-render the prototype, bump its version, refresh both pages
  grill.py drain                         dashboard events → ledger (clicks, answers, project pick); prints them + queue
  grill.py next                          ranked question queue: clicked-unspecified, unspecified, unasked bank
  grill.py ask '<questions json>'        put a multi-question form on the Prototype page (use when >3 pending)
  grill.py lock "<decision>" --because "<why>"
  grill.py req '<json>'                  add or update a requirement; REQ-### assigned when id is missing
  grill.py asked <bank-id> [...]         mark bank questions as asked (chat questions; forms mark themselves)
  grill.py phase frame|shape|grill|contract|prd
  grill.py prd [--out PATH] [--force]    write SPEC.md (init-dev-project format); open items become TODO: lines
  grill.py show                          ledger summary

Project files live in <workspace>/<slug>/: spec.json, theme.json, ledger.json, prototype/.
The current slug is runtime/config.json → "project". Output is JSON on stdout.

questions json: [{"id":"P1","label":"Who is the primary user?","type":"text|textarea|select|checkbox",
                  "options":[…], "default":"…"}]  — default becomes the field value so a blank submit accepts it.
requirement json: {"id?":"REQ-001","actor":…,"trigger":…,"result":…,"evidence":…,"failure":…,
                   "priority":"now|later|out","constraints":…,"assumptions":…,"screens":[…]}
"""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(APP / "bridge"))
import bridge  # noqa: E402

CONFIG = APP / "runtime" / "config.json"
BANK = APP / "references" / "question-bank.md"
PHASES = ["frame", "shape", "grill", "contract", "prd"]

BLANK_THEME = {
    "brand": "#1f4fd8",
    "brand_ink": "#ffffff",
    "accent": "#e0851c",
    "bg": "#f7f8fb",
    "surface": "#ffffff",
    "surface_2": "#eef1f7",
    "ink": "#151a26",
    "ink_2": "#3f4757",
    "muted": "#7a8394",
    "rule": "#e1e5ee",
    "radius": "10px",
    "radius_sm": "6px",
    "hue": 225,
    "font": "'Inter', system-ui, sans-serif",
    "heading_font": "'Inter', system-ui, sans-serif",
    "font_url": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
}


def now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "project"


def rjson(p, default):
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else default


def wjson(p, obj):
    p.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def cfg():
    c = rjson(CONFIG, {})
    if not c.get("workspace"):
        sys.exit("runtime/config.json has no workspace — boot step 4")
    return c


def workspace():
    return Path(cfg()["workspace"]).expanduser()


def project_dir(slug=None):
    slug = slug or cfg().get("project")
    if not slug:
        sys.exit("no current project — grill.py new … or grill.py use <slug>")
    d = workspace() / slug
    if not (d / "spec.json").exists():
        sys.exit(f"no spec.json in {d}")
    return d


def ledger_of(d):
    return rjson(
        d / "ledger.json",
        {
            "version": 0,
            "phase": "frame",
            "decisions": [],
            "requirements": [],
            "answers": [],
            "asked": [],
            "clicks": [],
            "open": [],
        },
    )


def projects():
    ws = workspace()
    out = []
    for p in sorted(ws.iterdir()) if ws.exists() else []:
        if (p / "spec.json").exists():
            out.append(
                {"slug": p.name, "name": rjson(p / "spec.json", {}).get("name", p.name)}
            )
    return out


def bank():
    """Parse references/question-bank.md: '## Section' headers and '- **ID** question — *Default:* hint' lines."""
    items, section = [], ""
    for line in BANK.read_text(encoding="utf-8").splitlines() if BANK.exists() else []:
        if line.startswith("## "):
            section = line[3:].strip()
        m = re.match(
            r"^- \*\*([A-Z]+\d+)\*\*\s+(.*?)(?:\s+—\s+\*Default:\*\s+(.*))?$", line
        )
        if m:
            items.append(
                {
                    "id": m.group(1),
                    "section": section,
                    "q": m.group(2).strip(),
                    "default": (m.group(3) or "").strip(),
                }
            )
    return items


# ---------- dashboard ----------


def render(d):
    r = subprocess.run(
        [sys.executable, str(APP / "scripts" / "render_proto.py"), str(d)],
        capture_output=True,
        text=True,
    )
    if r.returncode:
        sys.exit(r.stderr or r.stdout)
    return rjson(d / "prototype" / "manifest.json", {})


def publish(d, message=None):
    spec, led = rjson(d / "spec.json", {}), ledger_of(d)
    man = rjson(d / "prototype" / "manifest.json", {})
    slug = d.name
    st = bridge.read_state()
    pages = st.setdefault("pages", {})
    unspec = man.get("unspecified", [])
    picks = [
        {
            "name": "pick",
            "label": p["name"],
            "payload": {"slug": p["slug"]},
            "tone": "primary" if p["slug"] == slug else None,
        }
        for p in projects()
    ]
    keep = [
        w for w in pages.get("prototype", {}).get("widgets", []) if w.get("id") == "ask"
    ]  # an open form survives a sync
    pages["prototype"] = {
        "title": "Prototype",
        "widgets": [
            {"id": "pick", "type": "buttons", "buttons": picks},
            *keep,  # an open form goes above the 78vh preview, or nobody scrolls to it
            {
                "id": "proto",
                "type": "iframe",
                "src": f"/workspace/{slug}/prototype/index.html",
                "title": spec.get("name", slug),
                "version": str(led["version"]),
                "height": "78vh",
                "caption": f"{len(man.get('screens', []))} screens · {len(unspec)} controls not specified · v{led['version']}",
            },
        ],
    }
    reqs = led["requirements"]
    pages["requirements"] = {
        "title": "Requirements",
        "widgets": [
            {
                "id": "phase",
                "type": "steps",
                "title": spec.get("name", slug),
                "items": [
                    {
                        "label": p.title(),
                        "state": "done"
                        if PHASES.index(p) < PHASES.index(led["phase"])
                        else "current"
                        if p == led["phase"]
                        else "todo",
                    }
                    for p in PHASES
                ],
            },
            {
                "id": "ledger",
                "type": "table",
                "title": f"Requirements ({len(reqs)})",
                "columns": ["ID", "Actor", "Result", "Evidence", "Priority"],
                "rows": [
                    [
                        r.get("id", ""),
                        r.get("actor", ""),
                        r.get("result", ""),
                        r.get("evidence", ""),
                        r.get("priority", "now"),
                    ]
                    for r in reqs
                ],
            },
            {
                "id": "decisions",
                "type": "list",
                "title": f"Locked decisions ({len(led['decisions'])})",
                "items": [
                    {"text": x["text"], "meta": x.get("because", "")}
                    for x in led["decisions"]
                ]
                or ["Nothing locked yet."],
            },
            {
                "id": "open",
                "type": "list",
                "title": "Open",
                "items": [
                    {
                        "text": f"{u['screen']} → {u['label']}",
                        "meta": f"target “{u.get('target') or '?'}” not specified",
                        "tone": "warn",
                    }
                    for u in unspec
                ]
                + [{"text": o, "tone": "neutral"} for o in led["open"]]
                or ["Nothing open."],
            },
        ],
    }
    st["status"] = {
        "phase": led["phase"],
        "message": message
        or f"{spec.get('name', slug)} · v{led['version']} · {len(unspec)} not specified",
        "busy": False,
    }
    bridge.write_state(st)


def sync(d, message=None):
    led = ledger_of(d)
    led["version"] += 1
    wjson(d / "ledger.json", led)
    man = render(d)
    publish(d, message)
    bridge.log(
        f"{d.name}: rendered v{led['version']} ({len(man.get('screens', []))} screens, {len(man.get('unspecified', []))} unspecified)"
    )
    return {
        "ok": True,
        "slug": d.name,
        "version": led["version"],
        "screens": len(man.get("screens", [])),
        "unspecified": man.get("unspecified", []),
    }


# ---------- queue ----------


def queue(d):
    led = ledger_of(d)
    man = rjson(d / "prototype" / "manifest.json", {})
    unspec = man.get("unspecified", [])
    clicked_keys = []
    for c in reversed(led["clicks"]):  # most recent first
        k = (c.get("screen"), c.get("control"))
        if k not in clicked_keys:
            clicked_keys.append(k)
    by_key = {(u["screen"], u["control"]): u for u in unspec}
    clicked = [by_key[k] for k in clicked_keys if k in by_key]
    rest = [u for u in unspec if (u["screen"], u["control"]) not in clicked_keys]
    asked = set(led["asked"])
    return {
        "phase": led["phase"],
        "clicked_unspecified": clicked,
        "unspecified": rest,
        "bank": [b for b in bank() if b["id"] not in asked],
        "pending_form": any(
            w.get("id") == "ask"
            for w in bridge.read_state()
            .get("pages", {})
            .get("prototype", {})
            .get("widgets", [])
        ),
    }


def click_of(ev, p):
    """proto.js reports control as '<screen>.<control>'; the manifest stores bare control names."""
    ctl = p.get("control") or ""
    scr = p.get("screen") or ""
    if scr and ctl.startswith(scr + "."):
        ctl = ctl[len(scr) + 1:]
    return {"ts": ev.get("ts"), "screen": scr, "control": ctl, "target": p.get("target"), "label": p.get("label"),
            **{k: p[k] for k in ("variant", "scenario") if p.get(k)}}


# ---------- commands ----------


def cmd_new(a):
    slug = a.slug or slugify(a.name)
    d = workspace() / slug
    if (d / "spec.json").exists() and not a.force:
        sys.exit(f"{d} exists — grill.py use {slug}, or --force to reseed")
    d.mkdir(parents=True, exist_ok=True)
    if a.src == "blank":
        spec = {
            "name": a.name,
            "slug": slug,
            "tagline": "",
            "seed": 3,
            "currency": "$",
            "nav": {"style": "topbar", "items": ["home"]},
            "footer": [],
            "entities": {},
            "screens": [
                {
                    "id": "home",
                    "archetype": "landing",
                    "title": "Home",
                    "hero": {
                        "headline": a.name,
                        "sub": "One sentence on who this is for and what changes for them.",
                        "cta": {"label": "Get started"},
                    },
                }
            ],
            "journeys": [],
        }
        theme = dict(BLANK_THEME)
    else:
        ex = APP / "examples" / a.src
        spec, theme = rjson(ex / "spec.json", {}), rjson(ex / "theme.json", {})
        spec["name"], spec["slug"] = a.name, slug
    wjson(d / "spec.json", spec)
    wjson(d / "theme.json", theme)
    wjson(d / "ledger.json", {**ledger_of(d), "created": now()})
    c = cfg()
    c["project"] = slug
    wjson(CONFIG, c)
    out = sync(d, f"New project {a.name} — framing")
    out["queue"] = queue(d)
    print(json.dumps(out, indent=2))


def cmd_use(a):
    d = project_dir(a.slug)
    c = cfg()
    c["project"] = a.slug
    wjson(CONFIG, c)
    publish(d)
    print(json.dumps({"ok": True, "slug": a.slug, "queue": queue(d)}, indent=2))


def cmd_sync(a):
    print(json.dumps(sync(project_dir(), a.message), indent=2))


def cmd_drain(a):
    events = bridge.drain()
    d = project_dir() if cfg().get("project") else None
    led = ledger_of(d) if d else None
    switched = None
    for ev in events:
        name, p = ev.get("name"), ev.get("payload") or {}
        if name == "proto_click":
            # clicks carry the prototype's slug, so a stale frame or another project's frame files under its own ledger
            tgt = workspace() / p.get("slug", "") if p.get("slug") else None
            if tgt is not None and (tgt / "spec.json").exists() and (d is None or tgt != d):
                other = ledger_of(tgt)
                other["clicks"].append(click_of(ev, p))
                wjson(tgt / "ledger.json", other)
                continue
            if led is None:
                continue
            led["clicks"].append(click_of(ev, p))
        elif name == "answers" and led is not None:
            asked_form = next(
                (
                    w
                    for w in bridge.read_state()
                    .get("pages", {})
                    .get("prototype", {})
                    .get("widgets", [])
                    if w.get("id") == "ask"
                ),
                None,
            )
            labels = {
                f["name"]: f.get("label", f["name"])
                for f in (asked_form or {}).get("fields", [])
            }
            for k, v in p.items():
                led["answers"].append(
                    {
                        "ts": ev.get("ts"),
                        "id": k,
                        "question": labels.get(k, k),
                        "answer": v,
                    }
                )
                if k not in led["asked"]:
                    led["asked"].append(k)
            st = bridge.read_state()
            st["pages"]["prototype"]["widgets"] = [
                w for w in st["pages"]["prototype"]["widgets"] if w.get("id") != "ask"
            ]
            bridge.write_state(st)
        elif name == "pick" and p.get("slug"):
            switched = p["slug"]
    if led is not None:
        wjson(d / "ledger.json", led)
    if switched:
        c = cfg()
        c["project"] = switched
        wjson(CONFIG, c)
        d = project_dir(switched)
        publish(d)
    print(
        json.dumps(
            {
                "events": events,
                "project": d.name if d else None,
                "queue": queue(d) if d else None,
            },
            indent=2,
        )
    )


def cmd_next(a):
    print(json.dumps(queue(project_dir()), indent=2))


def cmd_ask(a):
    qs = json.loads(a.questions)
    fields = []
    for q in qs:
        f = {"name": q["id"], "label": q["label"], "type": q.get("type", "text")}
        if q.get("options"):
            f["type"] = "select"
            f["options"] = q["options"]
        if q.get("default") not in (None, ""):
            f["value"] = q["default"]
        if q.get("placeholder"):
            f["placeholder"] = q["placeholder"]
        fields.append(f)
    widget = {
        "id": "ask",
        "type": "form",
        "title": a.title
        or f"{len(fields)} questions — defaults are my recommendation; change what's wrong and send",
        "fields": fields,
        "submit": "answers",
        "submit_label": "Send answers",
        "clear_on_submit": False,
    }
    st = bridge.read_state()
    ws = (
        st.setdefault("pages", {})
        .setdefault("prototype", {"title": "Prototype", "widgets": []})
        .setdefault("widgets", [])
    )
    rest = [w for w in ws if w.get("id") != "ask"]
    ws[:] = rest[:1] + [widget] + rest[1:]  # under the project picker, above the preview
    st["status"]["message"] = f"{len(fields)} questions waiting on the Prototype page"
    bridge.write_state(st)
    bridge.log(
        f"asked {len(fields)} questions via form: {', '.join(q['id'] for q in qs)}"
    )
    print(json.dumps({"ok": True, "fields": [f["name"] for f in fields]}, indent=2))


def cmd_lock(a):
    d = project_dir()
    led = ledger_of(d)
    led["decisions"].append({"ts": now(), "text": a.text, "because": a.because or ""})
    wjson(d / "ledger.json", led)
    publish(d)
    bridge.log(f"locked: {a.text}")
    print(json.dumps({"ok": True, "decisions": len(led["decisions"])}))


def cmd_req(a):
    d = project_dir()
    led = ledger_of(d)
    r = json.loads(a.json)
    if not r.get("id"):
        r["id"] = f"REQ-{len(led['requirements']) + 1:03d}"
    r.setdefault("priority", "now")
    idx = next(
        (i for i, x in enumerate(led["requirements"]) if x["id"] == r["id"]), None
    )
    if idx is None:
        led["requirements"].append(r)
    else:
        led["requirements"][idx] = {**led["requirements"][idx], **r}
    wjson(d / "ledger.json", led)
    publish(d)
    print(
        json.dumps(
            {"ok": True, "id": r["id"], "requirements": len(led["requirements"])}
        )
    )


def cmd_asked(a):
    d = project_dir()
    led = ledger_of(d)
    led["asked"] = sorted(set(led["asked"]) | set(a.ids))
    wjson(d / "ledger.json", led)
    print(json.dumps({"ok": True, "asked": led["asked"]}))


def cmd_phase(a):
    d = project_dir()
    led = ledger_of(d)
    led["phase"] = a.phase
    wjson(d / "ledger.json", led)
    publish(d, f"Phase: {a.phase}")
    print(json.dumps({"ok": True, "phase": a.phase}))


SPEC_MARK = "<!-- generated by grill-with-prototype: grill.py prd -->"


def spec_md(d):
    """SPEC.md from spec.json + ledger + manifest. Anything still open is a TODO: line, so
    init-dev-project's `make spec` gate fails until the grill settles it."""
    spec, led, man = rjson(d / "spec.json", {}), ledger_of(d), render(d)
    todo, L = [], []
    for u in man.get("unspecified", []):
        when = f" when it is {u['control'].split('@')[1]}" if "@" in u["control"] else ""
        todo.append(f"TODO: {u['screen']} → “{u['label']}”{when}: what happens?")
    for s in man.get("screens", []):
        if s.get("variants"):
            todo.append(f"TODO: pick a layout for {s['id']}: {', '.join(s['variants'])}")
    todo += [f"TODO: {o}" for o in led["open"]]
    ids = {s["id"] for s in spec.get("screens", [])}
    todo += [f"TODO: {r['id']} names screen `{s}`, which does not exist yet"
             for r in led["requirements"] for s in r.get("screens", []) if s not in ids]

    reqs = led["requirements"]
    L += [f"# {spec.get('name', d.name)} spec", "", spec.get("tagline") or "", "", SPEC_MARK, "",
          "`make check` fails until no line starts with `TODO:`. Each example below gets a test in",
          "`tests/`. Change the spec through the grill (`grill.py req|lock`, spec.json edits) and rerun",
          "`grill.py prd`; edits made here are overwritten. The clickable prototype is",
          f"`{os.path.relpath(d / 'prototype' / 'index.html', d.parent if d.parent.name == 'spec' else d)}`.",
          "", "## What it must do", ""]
    for r in reqs:
        line = f"- {r['id']} ({r.get('priority', 'now')}) — {r.get('actor', '?')}: "
        line += " → ".join(x for x in (r.get("trigger"), r.get("result")) if x) + "."
        for k in ("constraints", "assumptions"):
            if r.get(k):
                line += f" {k.title()}: {r[k]}."
        if r.get("screens"):
            line += f" Screens: {', '.join(r['screens'])}."
        L.append(line)
    if not reqs:
        L.append("TODO: no requirements yet — run the Grill phase (`grill.py req`).")

    L += ["", "## Examples", ""]
    ex = []
    for r in reqs:
        if r.get("evidence"):
            ex.append(f"- {r['id']}: {r['evidence']}")
        if r.get("failure"):
            ex.append(f"- {r['id']}, failure: {r['failure']}")
    for act in man.get("actions", []):
        for o in (act.get("simulate") or {}).get("outcomes", []):
            go = f"goes to {o['go'][:-5]}" if o.get("go") else "stays"
            line = f"- `{act['screen']}.{act['control']}` → {o.get('name')}: {go}"
            if o.get("toast"):
                line += f", shows “{o['toast']}”"
            if "response" in o:
                line += f"; the back end returns `{json.dumps(o['response'], ensure_ascii=False)}`"
            ex.append(line)
    L += ex or ["TODO: one input → expected result per requirement, plus the main error case."]

    nav = spec.get("nav") or {}
    L += ["", "## Screens", "", f"Navigation ({nav.get('style', 'none')}): {', '.join(nav.get('items', [])) or '—'}.", ""]
    by_id = {s["id"]: s for s in spec.get("screens", [])}
    for s in man.get("screens", []):
        sub = by_id.get(s["id"], {}).get("sub")
        L.append(f"- `{s['id']}` {s.get('title', '')} ({'custom' if s.get('custom') else s.get('archetype')})"
                 + (f" — {sub}" if sub else ""))
    for j in spec.get("journeys", []):
        L.append(f"- Journey “{j['name']}”: {' → '.join(j.get('steps', []))}")

    L += ["", "## Data", "", "Field types are the prototype's; example rows are synthetic.", ""]
    for name, e in (spec.get("entities") or {}).items():
        fields = ", ".join(
            f"{f['name']} {f.get('type', 'text')}" + (f" [{' | '.join(f['options'])}]" if f.get("options") else "")
            for f in e.get("fields", []))
        L.append(f"- **{name}**: {fields}")
    if not spec.get("entities"):
        L.append("- None yet.")

    L += ["", "## Actions", ""]
    for act in man.get("actions", []):
        to = (f"simulated: {', '.join(o.get('name', '?') for o in act['simulate']['outcomes'])}"
              if act.get("simulate") else f"→ {act['target']}")
        L.append(f"- `{act['screen']}.{act['control']}` “{act['label']}” {to}")
    if not man.get("actions"):
        L.append("- None yet.")

    L += ["", "## Decisions", ""]
    L += [f"- {x.get('ts', '')[:10]}: {x['text']}" + (f" — {x['because']}" if x.get("because") else "")
          for x in led["decisions"]] or ["- None locked yet."]
    if todo:
        L += ["", "## Open", "", *todo]
    return "\n".join(L) + "\n", len(todo) + (not reqs) + (not ex)


def cmd_prd(a):
    d = project_dir()
    # Inside an init-dev-project repo the grill lives at spec/prototype/, so SPEC.md lands in spec/.
    out = Path(a.out) if a.out else (d.parent if d.parent.name == "spec" else d) / "SPEC.md"
    if out.exists() and not a.force:
        old = out.read_text(encoding="utf-8")
        # never overwrite a hand-written spec; the untouched scaffold (still has TODO: lines) is fair game
        if SPEC_MARK not in old and not re.search(r"^TODO:", old, re.M):
            sys.exit(f"{out} is hand-written — merge by hand, or --force to replace it")
        if SPEC_MARK not in old:  # the scaffold's dated decisions move into the ledger, so reruns keep them
            led = ledger_of(d)
            have = {x["text"] for x in led["decisions"]}
            for day, text in re.findall(r"^- (\d{4}-\d\d-\d\d): (.+)$", old, re.M):
                if text not in have:
                    led["decisions"].insert(0, {"ts": f"{day}T00:00:00Z", "text": text})
            wjson(d / "ledger.json", led)
    text, todos = spec_md(d)
    out.write_text(text, encoding="utf-8")
    led = ledger_of(d)
    led["phase"] = "prd"
    wjson(d / "ledger.json", led)
    publish(d, f"SPEC.md written · {todos} TODO" if todos else "SPEC.md written · nothing open")
    print(json.dumps({"ok": True, "path": str(out), "todo": todos}, indent=2))


def cmd_show(a):
    d = project_dir()
    led = ledger_of(d)
    print(
        json.dumps(
            {
                "slug": d.name,
                "dir": str(d),
                **{k: v for k, v in led.items() if k != "clicks"},
                "clicks": len(led["clicks"]),
            },
            indent=2,
        )
    )


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    sp = ap.add_subparsers(dest="cmd", required=True)
    p = sp.add_parser("new")
    p.add_argument("name")
    p.add_argument(
        "--from",
        dest="src",
        default="blank",
        choices=["blank", "marketplace", "admin", "content"],
    )
    p.add_argument("--slug")
    p.add_argument("--force", action="store_true")
    p.set_defaults(fn=cmd_new)
    p = sp.add_parser("use")
    p.add_argument("slug")
    p.set_defaults(fn=cmd_use)
    p = sp.add_parser("sync")
    p.add_argument("--message")
    p.set_defaults(fn=cmd_sync)
    sp.add_parser("drain").set_defaults(fn=cmd_drain)
    sp.add_parser("next").set_defaults(fn=cmd_next)
    p = sp.add_parser("ask")
    p.add_argument("questions")
    p.add_argument("--title")
    p.set_defaults(fn=cmd_ask)
    p = sp.add_parser("lock")
    p.add_argument("text")
    p.add_argument("--because")
    p.set_defaults(fn=cmd_lock)
    p = sp.add_parser("req")
    p.add_argument("json")
    p.set_defaults(fn=cmd_req)
    p = sp.add_parser("asked")
    p.add_argument("ids", nargs="+")
    p.set_defaults(fn=cmd_asked)
    p = sp.add_parser("phase")
    p.add_argument("phase", choices=PHASES)
    p.set_defaults(fn=cmd_phase)
    p = sp.add_parser("prd")
    p.add_argument("--out")
    p.add_argument("--force", action="store_true")
    p.set_defaults(fn=cmd_prd)
    sp.add_parser("show").set_defaults(fn=cmd_show)
    a = ap.parse_args()
    bridge.ensure_runtime()
    a.fn(a)


if __name__ == "__main__":
    main()
