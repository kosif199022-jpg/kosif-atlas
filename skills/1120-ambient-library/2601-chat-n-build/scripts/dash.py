#!/usr/bin/env python3
"""dash: the agent's only way to read or change a chat-n-build dashboard.

Standard library only. Never prompts. JSON on stdout, diagnostics on stderr.
Exit codes: 0 ok, 1 usage, 2 validation, 3 not found, 4 server, 5 wait timeout, 6 conflict.
Every change: lock -> read -> change -> validate -> snapshot history -> atomic write -> one log entry.
Run `dash.py <command> --help` for flags.
"""

import argparse
import contextlib
import copy
import inspect
import json
import os
import re
import secrets
import shutil
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import urllib.parse

if os.name == "nt":
    import msvcrt
else:
    import fcntl

NAME_RE = re.compile(
    r"^[a-z0-9][a-z0-9-]{0,39}$"
)  # dashboard, widget type and skill names
ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$")  # widget and action ids
BUILTIN = {"metric", "table", "list", "note", "chart", "group"}
STATUSES = {"done", "active", "todo", "blocked"}
HISTORY_KEEP, LOG_KEEP = 20, 50
MISSING = object()
MAX_BODY = 16 * 1024
FAILED_SHOWN = 10  # recently failed events listed by status and the renderer summary
DEFAULT_PORT = 8765
ASSETS = Path(__file__).resolve().parent.parent / "assets"
TOKEN_SLOT = '"__DASH_TOKEN__"'  # renderer.html placeholder, replaced by a JSON string
FRAME_SLOT = '"__DASH_FRAME__"'  # renderer.html placeholder for widget-frame.html, as a JSON string

# ponytail: stub until milestone 5 ships assets/process.template.md
GITIGNORE = (
    ".server.json\n*/.lock\n*/history/\n*/events.jsonl\n*/errors.jsonl\n*/.*.tmp\n"
)


class DashError(Exception):
    def __init__(self, code, msg):
        super().__init__(msg)
        self.code = code


def fail(code, msg):
    raise DashError(code, msg)


def now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------- paths, locking, atomic writes ----------


def inside(root, name, what):
    """Slug check plus containment: the resolved path must sit directly in root."""
    if not isinstance(name, str) or not NAME_RE.match(name):
        fail(2, f"{what} {name!r}: must match {NAME_RE.pattern}")
    p = (root / name).resolve()
    if p.parent != root.resolve():
        fail(2, f"{what} {name!r}: resolves outside {root}")
    return p


def dashboards_dir(root):
    return Path(root).resolve() / "dashboards"


def list_dashboards(root):
    dd = dashboards_dir(root)
    if not dd.is_dir():
        return []
    return sorted(
        p.name
        for p in dd.iterdir()
        if NAME_RE.match(p.name) and (p / "state.json").is_file()
    )


def pick(root, name):
    dd = dashboards_dir(root)
    if name is not None:
        ddir = inside(dd, name, "dashboard")
        if not (ddir / "state.json").is_file():
            fail(3, f"no dashboard {name!r}; run: dash init {name}")
        return ddir
    names = list_dashboards(root)
    if not names:
        fail(3, "no dashboards here; run: dash init <name>")
    if len(names) > 1:
        fail(1, f"several dashboards ({', '.join(names)}); pass -d <name>")
    return dd / names[0]


@contextlib.contextmanager
def locked(ddir):
    """One exclusive lock per dashboard, held across read, change and write."""
    with open(ddir / ".lock", "a+") as f:
        if os.name == "nt":
            f.seek(0)
            msvcrt.locking(f.fileno(), msvcrt.LK_LOCK, 1)
            try:
                yield
            finally:
                f.seek(0)
                msvcrt.locking(f.fileno(), msvcrt.LK_UNLCK, 1)
        else:
            fcntl.flock(f, fcntl.LOCK_EX)
            yield  # released when the file closes


def write_json(path, obj):
    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    try:
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(obj, f, indent=2, ensure_ascii=False)
            f.write("\n")
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    except BaseException:
        with contextlib.suppress(FileNotFoundError):
            tmp.unlink()
        raise


def load(ddir):
    try:
        return json.loads((ddir / "state.json").read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(3, f"{ddir / 'state.json'} not found")
    except ValueError as e:
        fail(2, f"{ddir / 'state.json'} is not valid JSON: {e}")


def snapshots(ddir):
    hist = ddir / "history"
    return sorted(
        (p for p in hist.glob("*.json") if p.stem.isdigit()), key=lambda p: int(p.stem)
    )


# ---------- validation ----------


def is_str(v):
    return isinstance(v, str)


def is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def is_scalar(v):
    return v is None or isinstance(v, (str, int, float, bool))


def check(obj, key, p, ok, desc, required=False):
    if key not in obj:
        if required:
            fail(2, f"{p}.{key}: required ({desc})")
        return
    if not ok(obj[key]):
        fail(2, f"{p}.{key}: must be {desc}")


def validate_widget(w, i, ddir):
    if not isinstance(w, dict):
        fail(2, f"widgets[{i}]: must be an object")
    check(
        w,
        "id",
        f"widgets[{i}]",
        lambda v: is_str(v) and ID_RE.match(v),
        f"an id matching {ID_RE.pattern}",
        True,
    )
    p = w["id"]
    check(w, "type", p, is_str, "a widget type name", True)
    check(w, "tab", p, lambda v: is_str(v) and v.strip(), "a non-empty string")
    check(w, "label", p, is_str, "a string")
    check(
        w, "span", p, lambda v: v in (1, 2, 3) and not isinstance(v, bool), "1, 2 or 3"
    )
    check(w, "ephemeral", p, lambda v: isinstance(v, bool), "true or false")
    check(w, "actions", p, lambda v: isinstance(v, list), "a list")
    seen = set()
    for j, a in enumerate(w.get("actions", [])):
        ap = f"{p}.actions[{j}]"
        if not isinstance(a, dict):
            fail(2, f"{ap}: must be an object {{id, label, say, confirm?}}")
        check(
            a,
            "id",
            ap,
            lambda v: is_str(v) and ID_RE.match(v),
            f"an id matching {ID_RE.pattern}",
            True,
        )
        check(a, "label", ap, is_str, "a string", True)
        check(a, "say", ap, is_str, "the message text the agent receives", True)
        check(a, "confirm", ap, lambda v: isinstance(v, bool), "true or false")
        if a["id"] in seen:
            fail(2, f"{ap}.id: duplicate action id {a['id']!r}")
        seen.add(a["id"])

    t = w["type"]
    if t == "metric":
        check(
            w, "value", p, lambda v: is_str(v) or is_num(v), "a string or number", True
        )
        check(w, "delta", p, lambda v: is_str(v) or is_num(v), "a string or number")
    elif t == "table":
        check(
            w,
            "columns",
            p,
            lambda v: isinstance(v, list) and all(map(is_str, v)),
            "a list of strings",
            True,
        )
        check(w, "rows", p, lambda v: isinstance(v, list), "a list of rows", True)
        for j, row in enumerate(w["rows"]):
            if not isinstance(row, list) or not all(map(is_scalar, row)):
                fail(2, f"{p}.rows[{j}]: must be a list of plain values")
    elif t == "list":
        check(w, "items", p, lambda v: isinstance(v, list), "a list", True)
        for j, it in enumerate(w["items"]):
            ip = f"{p}.items[{j}]"
            if is_str(it):
                continue
            if not isinstance(it, dict):
                fail(2, f"{ip}: must be a string or {{text, status}}")
            check(it, "text", ip, is_str, "a string", True)
            check(
                it,
                "status",
                ip,
                lambda v: v in STATUSES,
                "one of " + "/".join(sorted(STATUSES)),
            )
    elif t == "note":
        check(w, "md", p, is_str, "a markdown string", True)
    elif t == "chart":
        check(w, "kind", p, lambda v: v in ("bar", "line"), "bar or line", True)
        check(
            w,
            "series",
            p,
            lambda v: isinstance(v, list),
            "a list of {label, value}",
            True,
        )
        for j, pt in enumerate(w["series"]):
            sp = f"{p}.series[{j}]"
            if not isinstance(pt, dict):
                fail(2, f"{sp}: must be {{label, value}}")
            check(pt, "label", sp, lambda v: is_str(v) or is_num(v), "a string", True)
            check(pt, "value", sp, is_num, "a number", True)
    elif t == "group":
        check(
            w,
            "children",
            p,
            lambda v: isinstance(v, list) and all(map(is_str, v)),
            "a list of widget ids",
            True,
        )
        check(w, "collapsed", p, lambda v: isinstance(v, bool), "true or false")
    else:  # custom type: only id/type/tab are ours; the rest belongs to the widget
        if not NAME_RE.match(t):
            fail(
                2,
                f"{p}.type: {t!r} is not a built-in type and not a valid custom type name",
            )
        if not (ddir / "widgets" / f"{t}.js").is_file():
            fail(
                2,
                f"{p}.type: unknown type {t!r} (built-ins: {', '.join(sorted(BUILTIN))}; "
                f"or create it: dash widget new {t})",
            )


def validate(state, ddir):
    if not isinstance(state, dict):
        fail(2, "state: must be an object")
    check(state, "title", "state", is_str, "a string")
    check(state, "view", "state", lambda v: isinstance(v, dict), "an object")
    view = state.get("view", {})
    check(view, "tab", "view", is_str, "a string")
    check(
        view,
        "highlight",
        "view",
        lambda v: isinstance(v, list) and all(map(is_str, v)),
        "a list of widget ids",
    )
    check(state, "widgets", "state", lambda v: isinstance(v, list), "a list", True)
    check(state, "log", "state", lambda v: isinstance(v, list), "a list")
    ids = set()
    for i, w in enumerate(state["widgets"]):
        validate_widget(w, i, ddir)
        if w["id"] in ids:
            fail(2, f"widgets[{i}].id: duplicate id {w['id']!r}")
        ids.add(w["id"])
    for w in state["widgets"]:
        if w["type"] == "group":
            for j, c in enumerate(w["children"]):
                if c not in ids or c == w["id"]:
                    fail(
                        2,
                        f"{w['id']}.children[{j}]: no widget {c!r} (create children before the group)",
                    )


# ---------- operations (shared by the single commands and `apply`) ----------


def find(state, wid):
    for i, w in enumerate(state["widgets"]):
        if w.get("id") == wid:
            return i
    fail(3, f"widget {wid!r} not found")


def op_set(state, id, body):
    if not isinstance(body, dict):
        fail(2, f"{id}: --json must be an object")
    w = dict(body)
    if w.setdefault("id", id) != id:
        fail(2, f"{id}.id: body says {w['id']!r}, command says {id!r}")
    try:
        state["widgets"][find(state, id)] = w
    except DashError:
        state["widgets"].append(w)
    return f"set {id}"


def op_patch(state, id, body=None, path=None, value=MISSING):
    w = state["widgets"][find(state, id)]
    if body is not None and path is None:
        if not isinstance(body, dict):
            fail(2, f"{id}: --json must be an object")
        if body.get("id", id) != id:
            fail(
                2,
                f"{id}.id: a widget's id can't be changed (set a new widget and rm the old one)",
            )
        w.update(body)
        return f"patch {id}"
    if path is None or value is MISSING or body is not None:
        fail(1, "patch needs either --json, or --path with --value")
    parts = path.split(".")
    if parts[0] == "id":
        fail(2, f"{id}.id: a widget's id can't be changed")
    obj = w
    for k, part in enumerate(parts):
        last = k == len(parts) - 1
        if isinstance(obj, list):
            if not part.isdigit() or int(part) >= len(obj):
                fail(3, f"{id}.{path}: no index {part}")
            key = int(part)
        elif isinstance(obj, dict):
            if not last and part not in obj:
                fail(3, f"{id}.{path}: no field {part!r}")
            key = part
        else:
            fail(3, f"{id}.{path}: {'.'.join(parts[:k])} is not an object or list")
        if last:
            obj[key] = value
        else:
            obj = obj[key]
    return f"patch {id}.{path}"


def op_rm(state, id, yes=False):
    if not yes:
        fail(1, f"rm {id}: needs --yes, and only after the user confirmed the removal")
    state["widgets"].pop(find(state, id))
    for w in state["widgets"]:
        if w.get("type") == "group" and id in w.get("children", []):
            w["children"] = [c for c in w["children"] if c != id]
    return f"rm {id}"


def op_move(state, id, before=None, after=None, tab=None):
    if sum(x is not None for x in (before, after, tab)) != 1:
        fail(1, "move needs exactly one of --before, --after, --tab")
    i = find(state, id)
    if tab is not None:
        state["widgets"][i]["tab"] = tab
        return f"move {id} to tab {tab}"
    target = before if before is not None else after
    if target == id:
        fail(2, f"move {id}: can't move a widget relative to itself")
    find(state, target)
    w = state["widgets"].pop(i)
    j = find(state, target) + (1 if after is not None else 0)
    state["widgets"].insert(j, w)
    return f"move {id} {'before' if before is not None else 'after'} {target}"


def op_view(state, tab=None, highlight=None):
    view = {}
    if tab is not None:
        view["tab"] = tab
    if highlight is not None:
        view["highlight"] = highlight
    state["view"] = view
    return "view " + " ".join(f"{k}={v}" for k, v in view.items())


def op_log(state, msg):
    if not is_str(msg) or not msg.strip():
        fail(2, "log: msg must be a non-empty string")
    return msg


OPS = {
    "set": op_set,
    "patch": op_patch,
    "rm": op_rm,
    "move": op_move,
    "view": op_view,
    "log": op_log,
}


def run_op(state, op, i):
    if not isinstance(op, dict) or op.get("op") not in OPS:
        fail(2, f"ops[{i}].op: must be one of {', '.join(OPS)}")
    fn, args = OPS[op["op"]], {k: v for k, v in op.items() if k != "op"}
    if "json" in args:
        args["body"] = args.pop("json")
    try:
        inspect.signature(fn).bind(state, **args)
    except TypeError as e:
        fail(2, f"ops[{i}] ({op['op']}): {e}")
    return fn(state, **args)


def add_log(state, msg, by="agent"):
    state["log"] = (state.get("log") or []) + [{"at": now(), "by": by, "msg": msg}]
    state["log"] = state["log"][-LOG_KEEP:]


def mutate(ddir, ops, dry_run=False, msg=None):
    """Apply ops as one change: one lock, one validation, one history step, one log entry."""
    with locked(ddir):
        old = load(ddir)
        new = copy.deepcopy(old)
        new.setdefault("widgets", [])
        summaries = [run_op(new, op, i) for i, op in enumerate(ops)]
        add_log(new, msg or "; ".join(summaries))
        validate(new, ddir)
        if not dry_run:
            hist = ddir / "history"
            hist.mkdir(exist_ok=True)
            snaps = snapshots(ddir)
            snap = hist / f"{(int(snaps[-1].stem) + 1) if snaps else 1:04d}.json"
            write_json(snap, old)
            try:
                write_json(ddir / "state.json", new)
            except BaseException:
                snap.unlink()  # the change didn't happen, so it must not become an undo step
                raise
            for p in snapshots(ddir)[:-HISTORY_KEEP]:
                p.unlink()
    return new, summaries


# ---------- commands ----------


def parse_json(text, what="--json"):
    try:
        return json.loads(text)
    except ValueError as e:
        fail(2, f"{what}: not valid JSON: {e}")


def cmd_init(a):
    dd = dashboards_dir(a.root)
    ddir = inside(dd, a.name, "dashboard name")
    src = None
    if a.from_skill is not None:
        # ponytail: project skills only (.aai/skills); add ~/.aai/skills when one gets promoted
        src = inside(Path(a.root).resolve() / ".aai" / "skills", a.from_skill, "skill name") / "assets"
        if not (src / "state.template.json").is_file():
            fail(3, f"no skill {a.from_skill!r} with assets/state.template.json")
        tpl = json.loads((src / "state.template.json").read_text(encoding="utf-8"))
        validate(tpl, src)  # before creating anything, so a bad template leaves no half-made dashboard
    dd.mkdir(parents=True, exist_ok=True)
    if not (dd / ".gitignore").exists():
        (dd / ".gitignore").write_text(GITIGNORE)
    try:
        ddir.mkdir()
    except FileExistsError:
        fail(6, f"dashboard {a.name!r} already exists")
    (ddir / "widgets").mkdir()
    (ddir / "history").mkdir()
    with locked(ddir):
        state = {
            "title": a.name.replace("-", " ").title(),
            "view": {},
            "widgets": [],
            "log": [],
        }
        if src:
            state |= {"widgets": tpl["widgets"], "title": tpl.get("title") or state["title"]}
            for js in (src / "widgets").glob("*.js"):
                shutil.copyfile(js, ddir / "widgets" / js.name)
            shutil.copyfile(src / "process.md", ddir / "process.md")
            add_log(state, f"dashboard {a.name} created from {a.from_skill}")
        else:
            add_log(state, f"dashboard {a.name} created")
            (ddir / "process.md").write_text(
                (ASSETS / "process.template.md")
                .read_text(encoding="utf-8")
                .replace("{name}", a.name),  # replace, not format: templates may hold JSON braces
                encoding="utf-8",
            )
        write_json(ddir / "state.json", state)
    return {"ok": True, "dashboard": a.name, "path": str(ddir)}


def cmd_get(a):
    state = load(pick(a.root, a.dashboard))
    return state if a.id is None else state["widgets"][find(state, a.id)]


def mutating(a, ops):
    ddir = pick(a.root, a.dashboard)
    new, summaries = mutate(ddir, ops, a.dry_run, a.msg)
    out = {
        "ok": True,
        "dashboard": ddir.name,
        "dry_run": a.dry_run,
        "changes": summaries,
    }
    if len(ops) == 1 and ops[0]["op"] in ("set", "patch"):
        out["widget"] = new["widgets"][find(new, ops[0]["id"])]
    return out


def cmd_set(a):
    return mutating(a, [{"op": "set", "id": a.id, "json": parse_json(a.json)}])


def cmd_patch(a):
    op = {"op": "patch", "id": a.id}
    if a.json is not None:
        op["json"] = parse_json(a.json)
    if a.path is not None:
        op["path"] = a.path
    if a.value is not None:
        try:
            op["value"] = json.loads(
                a.value
            )  # 2 -> number, true -> bool; plain words stay strings
        except ValueError:
            op["value"] = a.value
    return mutating(a, [op])


def cmd_rm(a):
    return mutating(a, [{"op": "rm", "id": a.id, "yes": a.yes}])


def cmd_move(a):
    return mutating(
        a,
        [
            {
                "op": "move",
                "id": a.id,
                "before": a.before,
                "after": a.after,
                "tab": a.tab,
            }
        ],
    )


def cmd_view(a):
    hl = None if a.highlight is None else [h for h in a.highlight.split(",") if h]
    return mutating(a, [{"op": "view", "tab": a.tab, "highlight": hl}])


def cmd_log(a):
    return mutating(a, [{"op": "log", "msg": a.message}])


def cmd_apply(a):
    ops = parse_json(a.json)
    if not isinstance(ops, list) or not ops:
        fail(2, "--json: must be a non-empty list of ops")
    return mutating(a, ops)


def cmd_undo(a):
    if a.steps < 1:
        fail(1, "--steps must be at least 1")
    ddir = pick(a.root, a.dashboard)
    with locked(ddir):
        snaps = snapshots(ddir)
        if len(snaps) < a.steps:
            fail(3, f"only {len(snaps)} undo step(s) available")
        state = json.loads(snaps[-a.steps].read_text(encoding="utf-8"))
        add_log(state, f"undo {a.steps} step(s)")
        if not a.dry_run:
            write_json(ddir / "state.json", state)
            for p in snaps[-a.steps :]:
                p.unlink()
    return {"ok": True, "dashboard": ddir.name, "dry_run": a.dry_run, "undone": a.steps}


def server_record(root):
    try:
        info = json.loads((dashboards_dir(root) / ".server.json").read_text())
        return {"port": int(info["port"]), "token": str(info["token"])}
    except (OSError, ValueError, KeyError, TypeError):
        return None


def server_base(root):
    rec = server_record(root)
    return f"http://127.0.0.1:{rec['port']}" if rec else None


def cmd_status(a):
    base = server_base(a.root)
    names = (
        list_dashboards(a.root)
        if a.dashboard is None
        else [pick(a.root, a.dashboard).name]
    )
    out = []
    for name in names:
        ddir = dashboards_dir(a.root) / name
        s = load(ddir)
        widgets = s.get("widgets", [])
        evs = event_table(ddir).values()
        out.append(
            {
                "name": name,
                "title": s.get("title", ""),
                "tabs": list(dict.fromkeys(w.get("tab", "main") for w in widgets)),
                "widgets": [w.get("id") for w in widgets],
                "view": s.get("view", {}),
                "events": {
                    "pending": [e["id"] for e in evs if e["status"] == "pending"],
                    "interrupted": [e["id"] for e in evs if e["status"] == "started"],
                    "failed": [
                        {"id": e["id"], "why": e.get("why", "")}
                        for e in evs
                        if e["status"] == "failed"
                    ][-FAILED_SHOWN:],
                },
                "errors": len(read_jsonl(ddir / "errors.jsonl")),
                "url": f"{base}/d/{name}/" if base else None,
            }
        )
    return {"server": {"url": base + "/"} if base else None, "dashboards": out}


# ---------- events and errors (append-only jsonl, written under the dashboard lock) ----------


def read_jsonl(path):
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except FileNotFoundError:
        return []
    out = []
    for line in lines:
        with contextlib.suppress(ValueError):  # a torn last line from a crash is skipped
            rec = json.loads(line)
            if isinstance(rec, dict):
                out.append(rec)
    return out


def append_jsonl(path, rec):
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")
        f.flush()
        os.fsync(f.fileno())


def event_table(ddir):
    """Replay events.jsonl: a click record creates an event, later records move its status."""
    table = {}
    for rec in read_jsonl(ddir / "events.jsonl"):
        eid = rec.get("id")
        if "widget" in rec:
            table[eid] = dict(rec)
        elif eid in table and rec.get("status"):
            table[eid]["status"] = rec["status"]
            if "why" in rec:
                table[eid]["why"] = rec["why"]
    return table


def event_view(e):
    status = "interrupted" if e["status"] == "started" else e["status"]
    keys = ("id", "dashboard", "widget", "action", "say", "at")
    return {**{k: e.get(k) for k in keys}, "status": status}


def open_events(root, name, statuses):
    names = list_dashboards(root) if name is None else [pick(root, name).name]
    evs = []
    for n in names:
        evs += [
            e
            for e in event_table(dashboards_dir(root) / n).values()
            if e["status"] in statuses
        ]
    return [event_view(e) for e in sorted(evs, key=lambda e: e.get("at", ""))]


def record_click(ddir, widget, action):
    """Server side of a click. The say text is read from the state, never from the request."""
    with locked(ddir):
        state = load(ddir)
        w = next(
            (w for w in state.get("widgets", []) if w.get("id") == widget), None
        )
        act = next(
            (x for x in (w or {}).get("actions", []) if x.get("id") == action), None
        )
        if act is None:
            return None
        ev = {
            "id": f"e-{time.time_ns() // 1000:x}-{secrets.token_hex(3)}",
            "at": now(),
            "dashboard": ddir.name,
            "widget": widget,
            "action": action,
            "say": act["say"],
            "status": "pending",
        }
        append_jsonl(ddir / "events.jsonl", ev)
    return ev


def locate_events(root, name, ids):
    names = list_dashboards(root) if name is None else [pick(root, name).name]
    found = {}
    for n in names:
        for eid in event_table(dashboards_dir(root) / n):
            found.setdefault(eid, n)
    missing = [i for i in ids if i not in found]
    if missing:
        fail(3, f"no event {', '.join(missing)}")
    return found


def transition(root, name, ids, allowed, status, why=None):
    """Move events to status under the lock. All ids are checked before anything is written."""
    where = locate_events(root, name, ids)
    by_dash = {}
    for eid in ids:
        by_dash.setdefault(where[eid], []).append(eid)
    with contextlib.ExitStack() as stack:
        for n in sorted(by_dash):
            stack.enter_context(locked(dashboards_dir(root) / n))
        for n, eids in by_dash.items():
            table = event_table(dashboards_dir(root) / n)
            for eid in eids:
                if table[eid]["status"] not in allowed:
                    fail(6, f"event {eid} is already {table[eid]['status']}")
        for n, eids in by_dash.items():
            for eid in eids:
                rec = {"id": eid, "status": status, "at": now()}
                if why is not None:
                    rec["why"] = why
                append_jsonl(dashboards_dir(root) / n / "events.jsonl", rec)
    return {"ok": True, "status": status, "events": list(ids)}


def cmd_events(a):
    return {"events": open_events(a.root, a.dashboard, {"pending", "started"})}


def cmd_begin(a):
    return transition(a.root, a.dashboard, [a.id], {"pending"}, "started")


def cmd_ack(a):
    if a.failed is not None and not a.failed.strip():
        fail(1, "--failed needs a reason")
    status = "failed" if a.failed is not None else "done"
    return transition(
        a.root, a.dashboard, a.ids, {"pending", "started"}, status, a.failed
    )


def cmd_wait(a):
    """Block until a pending event exists (interrupted ones never wake anyone)."""
    deadline = time.monotonic() + a.timeout
    while True:
        evs = open_events(a.root, a.dashboard, {"pending"})
        if evs:
            return {"events": evs}
        if time.monotonic() >= deadline:
            fail(5, f"no events in {a.timeout:g}s")
        time.sleep(min(0.5, max(0.0, deadline - time.monotonic())))


def cmd_errors(a):
    names = list_dashboards(a.root) if a.dashboard is None else [pick(a.root, a.dashboard).name]
    out = []
    for n in names:
        ddir = dashboards_dir(a.root) / n
        out += [{**e, "dashboard": n} for e in read_jsonl(ddir / "errors.jsonl")]
        if a.clear:
            with locked(ddir):
                with contextlib.suppress(FileNotFoundError):
                    (ddir / "errors.jsonl").unlink()
    return {"errors": out, "cleared": a.clear}


# ---------- server ----------


WIDGET_MAX = 20 * 1024
# ponytail: a lint, not the guard. The frame's CSP (default-src 'none') is what blocks the network.
WIDGET_BANNED = re.compile(r"\b(fetch|XMLHttpRequest|import)\b")
WIDGET_STUB = """\
// {type}: custom widget. Contract: references/widget-authoring.md
// widget = this widget's object from state.json. Its text is untrusted: pass it through api.esc.
// Return an HTML string, or build DOM into api.root and return nothing.
// api.act(actionId) queues one of widget.actions; call api.resize() if the height changes later.
function render(widget, api) {{
  return `<div>${{api.esc(widget.label || widget.id)}}</div>`;
}}
"""


def cmd_widget(a):
    ddir = pick(a.root, a.dashboard)
    if a.type in BUILTIN:
        fail(2, f"{a.type!r} is a built-in type; pick another name")
    js = inside(ddir / "widgets", a.type, "widget type").with_suffix(".js")
    if a.op == "new":
        js.parent.mkdir(exist_ok=True)
        try:
            with open(js, "x", encoding="utf-8") as f:  # "x": never clobbers the agent's edits
                f.write(WIDGET_STUB.format(type=a.type))
        except FileExistsError:
            fail(6, f"{js} exists; edit it, then: dash widget check {a.type}")
        return {"ok": True, "type": a.type, "path": str(js)}
    if not js.is_file():
        fail(3, f"no widget {a.type!r}; run: dash widget new {a.type}")
    src = js.read_text(encoding="utf-8")
    problems = []
    if len(src.encode()) > WIDGET_MAX:
        problems.append(f"over {WIDGET_MAX} bytes")
    banned = sorted(set(WIDGET_BANNED.findall(src)))
    if banned:
        problems.append(f"uses {', '.join(banned)}: widgets get data only through render(widget, api)")
    if not re.search(r"\bfunction\s+render\s*\(", src):
        problems.append("no `function render(widget, api)`")
    syntax = "skipped (node not installed)"
    node = shutil.which("node")
    if node:
        r = subprocess.run([node, "--check", str(js)], capture_output=True, text=True, timeout=30)
        syntax = "ok"
        if r.returncode:
            problems.append("syntax error:\n" + r.stderr.strip())
    if problems:
        fail(2, f"{js.name}: " + "; ".join(problems))
    return {"ok": True, "type": a.type, "bytes": len(src.encode()), "syntax": syntax,
            "note": "real render is checked on next page load; see dash errors"}


# Pages are inline-only: no external script/style, fetches back to this server only.
# srcdoc widget iframes (M4) inherit this and add their own stricter meta CSP.
CSP = (
    "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; "
    "img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; "
    "frame-ancestors 'none'"
)


def dashboard_title(root, name):
    try:
        t = json.loads((dashboards_dir(root) / name / "state.json").read_text(encoding="utf-8")).get("title")
    except (OSError, ValueError, AttributeError):
        return ""  # a broken dashboard still shows in the launcher, untitled
    return t if isinstance(t, str) else ""


class Handler(BaseHTTPRequestHandler):
    server_version = "dash"

    def log_message(self, *args):  # quiet: stdout belongs to nobody in a detached server
        pass

    def send(self, code, body=b"", ctype="application/json"):
        if isinstance(body, (dict, list)):
            body = json.dumps(body).encode()
        elif isinstance(body, str):
            body = body.encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        if ctype.startswith("text/html"):
            self.send_header("Content-Security-Policy", CSP)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def origins(self):
        port = self.server.server_address[1]
        return {f"127.0.0.1:{port}", f"localhost:{port}"}

    def token_ok(self):
        given = self.headers.get("X-Dash-Token", "")
        return secrets.compare_digest(given.encode(), self.server.token.encode())

    def route(self):
        """Returns (dashboard dir or None, rest) for /d/<name>/<rest>; None if not a dashboard route."""
        path = urllib.parse.unquote(urllib.parse.urlsplit(self.path).path)
        m = re.match(r"^/d/([^/]+)/(.*)$", path)
        if not m:
            return path, None, None
        name, rest = m.groups()
        if not NAME_RE.match(name):
            return path, False, None
        ddir = dashboards_dir(self.server.root) / name
        if not (ddir / "state.json").is_file():
            return path, False, None
        return path, ddir, rest

    def guard(self):
        """DNS-rebinding guard: only answer requests addressed to this loopback server."""
        if self.headers.get("Host", "") not in self.origins():
            self.send(403, {"error": "wrong host"})
            return False
        return True

    def do_GET(self):
        if not self.guard():
            return
        path, ddir, rest = self.route()
        if ddir is None:
            if path == "/health":
                if not self.token_ok():
                    return self.send(403, {"error": "token required"})
                return self.send(200, {"ok": True, "pid": os.getpid()})
            if path == "/":
                return self.asset("launcher.html")
            if path == "/dashboards.json":
                return self.send(200, [
                    {"name": n, "title": dashboard_title(self.server.root, n)}
                    for n in list_dashboards(self.server.root)
                ])
            return self.send(404, {"error": "not found"})
        if ddir is False:
            return self.send(404, {"error": "not found"})
        if rest == "":
            return self.asset("renderer.html")
        if rest == "state.json":
            try:
                return self.send(200, (ddir / "state.json").read_bytes())
            except OSError:
                return self.send(404, {"error": "not found"})
        if rest == "events":
            evs = event_table(ddir).values()
            return self.send(
                200,
                {
                    "pending": [
                        e["id"] for e in evs if e["status"] in ("pending", "started")
                    ],
                    "failed": [e["id"] for e in evs if e["status"] == "failed"][
                        -FAILED_SHOWN:
                    ],
                },
            )
        m = re.match(r"^widgets/([^/]+)\.js$", rest)
        if m and NAME_RE.match(m.group(1)):
            js = ddir / "widgets" / f"{m.group(1)}.js"
            if js.is_file():
                return self.send(200, js.read_bytes(), "text/javascript; charset=utf-8")
        return self.send(404, {"error": "not found"})

    def asset(self, name):
        try:
            html = (ASSETS / name).read_text(encoding="utf-8")
        except OSError:
            return self.send(404, {"error": f"{name} missing"})
        # the token lives in a script variable only, never in the DOM
        html = html.replace(TOKEN_SLOT, json.dumps(self.server.token))
        if FRAME_SLOT in html:
            try:
                frame = (ASSETS / "widget-frame.html").read_text(encoding="utf-8")
            except OSError:
                return self.send(404, {"error": "widget-frame.html missing"})
            # "<" as \u003c: the frame's own </script> must not close the renderer's script tag
            html = html.replace(FRAME_SLOT, json.dumps(frame).replace("<", "\\u003c"))
        return self.send(200, html, "text/html; charset=utf-8")

    def body(self):
        try:
            n = int(self.headers.get("Content-Length", ""))
        except ValueError:
            self.send(411, {"error": "Content-Length required"})
            return None
        if n > MAX_BODY:
            self.send(413, {"error": f"body over {MAX_BODY} bytes"})
            self.close_connection = True
            return None
        try:
            data = json.loads(self.rfile.read(n) or b"{}")
        except ValueError:
            data = None
        if not isinstance(data, dict):
            self.send(400, {"error": "body must be a JSON object"})
            return None
        return data

    def do_POST(self):
        if not self.guard():
            return
        path, ddir, rest = self.route()
        if ddir is None and path == "/shutdown":
            if not self.token_ok():
                return self.send(403, {"error": "token required"})
            self.send(200, {"ok": True})
            threading.Thread(target=self.server.shutdown, daemon=True).start()
            return
        if not ddir or rest not in ("events", "errors"):
            return self.send(404, {"error": "not found"})
        origin = self.headers.get("Origin", "")
        if not self.token_ok() or origin not in {f"http://{o}" for o in self.origins()}:
            return self.send(403, {"error": "token and same-origin Origin required"})
        data = self.body()
        if data is None:
            return
        if rest == "events":
            w, act = data.get("widget"), data.get("action")
            ev = record_click(ddir, w, act) if is_str(w) and is_str(act) else None
            if ev is None:
                return self.send(400, {"error": "no such widget action in the state"})
            return self.send(201, {"id": ev["id"]})
        err = {"at": now()}
        for k in ("kind", "type", "widget", "message", "source"):
            if k in data:
                err[k] = str(data[k])[:2000]
        with locked(ddir):
            append_jsonl(ddir / "errors.jsonl", err)
        return self.send(201, {"ok": True})


def make_server(root, port):
    srv = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    srv.daemon_threads = True
    srv.root = Path(root).resolve()
    srv.token = secrets.token_urlsafe(24)
    return srv


def ping(rec):
    r = urllib.request.Request(
        f"http://127.0.0.1:{rec['port']}/health", headers={"X-Dash-Token": rec["token"]}
    )
    try:
        with urllib.request.urlopen(r, timeout=2) as resp:
            return resp.status == 200
    except (OSError, ValueError):
        return False


PREVIEW_HINT = (
    "Claude Code: open it with preview_start (see references/harness-notes.md). "
    "Other harnesses: dash serve --open, or give the user the URL."
)


def cmd_serve(a):
    dd = dashboards_dir(a.root)
    if not dd.is_dir():
        fail(3, "no dashboards here; run: dash init <name>")
    rec = server_record(a.root)
    if rec and ping(rec):
        url = f"http://127.0.0.1:{rec['port']}/"
        if a.open:
            webbrowser.open(url)
        return {"ok": True, "started": False, "url": url, "hint": PREVIEW_HINT}
    if a.foreground:
        return serve_foreground(a, dd)
    args = [sys.executable, str(Path(__file__).resolve()), "serve", "--foreground"]
    args += ["--root", str(Path(a.root).resolve()), "--port", str(a.port)]
    with contextlib.suppress(FileNotFoundError):
        (dd / ".server.json").unlink()  # stale: nothing answered with its token
    subprocess.Popen(
        args,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,  # outlives this command and the agent's shell
    )
    deadline = time.monotonic() + 10
    while time.monotonic() < deadline:
        rec = server_record(a.root)
        if rec and ping(rec):
            url = f"http://127.0.0.1:{rec['port']}/"
            if a.open:
                webbrowser.open(url)
            return {"ok": True, "started": True, "url": url, "hint": PREVIEW_HINT}
        time.sleep(0.1)
    fail(4, f"server did not start on port {a.port} (in use? try --port 0)")


def serve_foreground(a, dd):
    """Runs until POST /shutdown. Used by the detached child and by .claude/launch.json."""
    try:
        srv = make_server(a.root, a.port)
    except OSError as e:
        fail(4, f"can't listen on 127.0.0.1:{a.port}: {e}")
    port = srv.server_address[1]
    rec_path = dd / ".server.json"
    write_json(rec_path, {"port": port, "token": srv.token, "pid": os.getpid()})
    url = f"http://127.0.0.1:{port}/"
    print(json.dumps({"ok": True, "url": url}), flush=True)
    if a.open:
        webbrowser.open(url)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.server_close()
        if (server_record(a.root) or {}).get("token") == srv.token:
            with contextlib.suppress(FileNotFoundError):
                rec_path.unlink()
    return None


def cmd_stop(a):
    rec_path = dashboards_dir(a.root) / ".server.json"
    rec = server_record(a.root)
    if rec is None:
        fail(4, "no server record (dashboards/.server.json); nothing to stop")
    r = urllib.request.Request(
        f"http://127.0.0.1:{rec['port']}/shutdown",
        data=b"",
        method="POST",
        headers={"X-Dash-Token": rec["token"]},
    )
    try:
        with urllib.request.urlopen(r, timeout=3):
            pass
    except (OSError, ValueError) as e:
        # never signal a pid: the record may be stale and the pid reused
        with contextlib.suppress(FileNotFoundError):
            rec_path.unlink()
        fail(4, f"no server answered ({e}); removed the stale record")
    with contextlib.suppress(FileNotFoundError):
        rec_path.unlink()
    return {"ok": True, "stopped": f"http://127.0.0.1:{rec['port']}/"}


# ---------- argument parsing ----------


class Parser(argparse.ArgumentParser):
    def error(self, message):  # argparse exits 2 by default; 2 means validation here
        raise DashError(1, f"{self.prog}: {message}")


def build_parser():
    common = Parser(add_help=False)
    common.add_argument(
        "--root", default=".", help="project root holding dashboards/ (default: cwd)"
    )
    common.add_argument(
        "-d", "--dashboard", help="dashboard name (default: the only one)"
    )
    change = Parser(add_help=False, parents=[common])
    change.add_argument(
        "--dry-run", action="store_true", help="show the result, write nothing"
    )
    change.add_argument(
        "--msg", help="log/toast text for this change (default: a summary)"
    )

    p = Parser(
        prog="dash",
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = p.add_subparsers(dest="command", required=True)

    def cmd(name, fn, parents, help):
        sp = sub.add_parser(name, parents=parents, help=help)
        sp.set_defaults(fn=fn)
        return sp

    sp = cmd("init", cmd_init, [common], "create dashboards/<name>/")
    sp.add_argument("name")
    sp.add_argument("--from", dest="from_skill", metavar="SKILL", help="start from .aai/skills/<skill>/ (made by skillify)")
    sp = cmd("get", cmd_get, [common], "print the whole state or one widget")
    sp.add_argument("id", nargs="?")
    sp = cmd("set", cmd_set, [change], "create or replace a widget")
    sp.add_argument("id")
    sp.add_argument("--json", required=True)
    sp = cmd(
        "patch",
        cmd_patch,
        [change],
        "merge fields into a widget, or set one field by --path",
    )
    sp.add_argument("id")
    sp.add_argument("--json")
    sp.add_argument("--path", help="dotted path, e.g. items.2.status")
    sp.add_argument(
        "--value", help="parsed as JSON if it can be, else kept as a string"
    )
    sp = cmd("rm", cmd_rm, [change], "remove a widget (only after the user confirmed)")
    sp.add_argument("id")
    sp.add_argument("--yes", action="store_true")
    sp = cmd("move", cmd_move, [change], "reorder a widget or move it to another tab")
    sp.add_argument("id")
    g = sp.add_mutually_exclusive_group(required=True)
    g.add_argument("--before")
    g.add_argument("--after")
    g.add_argument("--tab")
    sp = cmd("view", cmd_view, [change], "point the user at a tab and/or widgets")
    sp.add_argument("--tab")
    sp.add_argument("--highlight", help="comma-separated widget ids")
    sp = cmd("log", cmd_log, [change], "add a log entry (shows as a toast)")
    sp.add_argument("message")
    sp = cmd(
        "apply",
        cmd_apply,
        [change],
        "apply a list of ops as one change and one undo step",
    )
    sp.add_argument(
        "--json",
        required=True,
        help='[{"op":"set|patch|rm|move|view|log", ...same fields as the commands}]',
    )
    sp = cmd("undo", cmd_undo, [change], "restore from history")
    sp.add_argument("--steps", type=int, default=1)
    cmd(
        "status",
        cmd_status,
        [common],
        "orientation: dashboards, tabs, widgets, events, errors, server URL",
    )
    sp = cmd("serve", cmd_serve, [common], "start the server (or report the running one)")
    sp.add_argument("--port", type=int, default=DEFAULT_PORT, help="0 picks a free port")
    sp.add_argument("--open", action="store_true", help="open the launcher in a browser")
    sp.add_argument(
        "--foreground", action="store_true", help="run in this process (for launch.json)"
    )
    cmd("stop", cmd_stop, [common], "stop the server via its token; never signals")
    cmd("events", cmd_events, [common], "unacked clicks, oldest first (read-only)")
    sp = cmd("begin", cmd_begin, [common], "claim a pending event before doing its work")
    sp.add_argument("id")
    sp = cmd("ack", cmd_ack, [common], "mark events handled (after their change is written)")
    sp.add_argument("ids", nargs="+")
    sp.add_argument("--failed", metavar="WHY", help="record the event as failed, and why")
    sp = cmd("wait", cmd_wait, [common], "block until a click arrives; exit 5 on timeout")
    sp.add_argument("--timeout", type=float, default=1800)
    sp = cmd("widget", cmd_widget, [common], "new: stub widgets/<type>.js; check: size, banned calls, syntax")
    sp.add_argument("op", choices=["new", "check"])
    sp.add_argument("type")
    sp = cmd("errors", cmd_errors, [common], "renderer and widget errors")
    sp.add_argument("--clear", action="store_true")
    sp = cmd("skillify", cmd_skillify, [], "package a dashboard's process as .aai/skills/<skill>/")
    sp.add_argument("source", metavar="dashboard")
    sp.add_argument("skill")
    sp.add_argument("--root", default=".", help="project root holding dashboards/ (default: cwd)")
    sp.add_argument("--dry-run", action="store_true", help="list every string that would be kept; write nothing")
    sp.add_argument("--drop", help="comma-separated widget ids that are per-run content")
    sp.add_argument("--blank", help="comma-separated <id>.<field> (or title) to empty, e.g. client.label")
    sp.add_argument("--force", action="store_true", help="overwrite an existing skill's generated files")
    return p


# ---------- skillify ----------

KEPT = ("id", "type", "tab", "label", "span", "actions")
EMPTY = {str: "", list: [], dict: {}}
SKILL_MD = """---
name: {skill}
description: Use this skill when the user wants to start or run a {title} on a live dashboard. TODO (agent, at skillify time): rewrite from what users actually say.
---

Read `instructions.md` in this skill's directory and follow it.
"""
SKILL_INSTRUCTIONS = """# {title}

A process packaged from a chat-n-build dashboard. **Requires the chat-n-build skill**: it
provides `dash` and the operating rules (read its `instructions.md` first).

## Start a run

1. `dash init <run-name> --from {skill}`: a new dashboard with this process's tabs, widgets,
   custom widget types and rules. Content starts blank.
2. Fire it up as chat-n-build describes, then read `dashboards/<run-name>/process.md`.

`assets/process.md` holds the process rules and is copied into each run. Edit it here to
change future runs; edit the run's copy to change only that run.

## Gotchas from real runs

<!-- agent, at skillify time: what failed or got corrected, and the fix. No client or content details. -->
"""


def blank_widget(w):
    """Structure stays, content goes. A custom type's own fields all count as content."""
    out = {k: w[k] for k in KEPT if k in w}
    t = w["type"]
    if t == "list":
        out["items"] = [
            {"text": it if is_str(it) else it["text"], "status": "todo" if i else "active"}
            for i, it in enumerate(w["items"])
        ]
    elif t == "table":
        out |= {"columns": w["columns"], "rows": []}
    elif t == "note":
        out["md"] = ""
    elif t == "chart":
        out |= {"kind": w["kind"], "series": []}
    elif t == "metric":
        out["value"] = ""
    elif t == "group":
        out |= {k: w[k] for k in ("children", "collapsed") if k in w}
    return out


def strings(v):
    if isinstance(v, str):
        yield v
    elif isinstance(v, (list, dict)):
        for x in v.values() if isinstance(v, dict) else v:
            yield from strings(x)


def cmd_skillify(a):
    ddir = pick(a.root, a.source)
    sdir = inside(Path(a.root).resolve() / ".aai" / "skills", a.skill, "skill name")
    with locked(ddir):
        state = load(ddir)
        process = (ddir / "process.md").read_text(encoding="utf-8") if (ddir / "process.md").is_file() else ""
    ids = [w["id"] for w in state["widgets"]]
    drop = set(filter(None, (a.drop or "").split(",")))
    if drop - set(ids):
        fail(2, f"--drop: no widget {', '.join(sorted(drop - set(ids)))}")
    dropped = [w["id"] for w in state["widgets"] if w["id"] in drop or w.get("ephemeral")]
    widgets = [blank_widget(w) for w in state["widgets"] if w["id"] not in dropped]
    by = {w["id"]: w for w in widgets}
    for w in widgets:
        if w["type"] == "group":
            w["children"] = [c for c in w["children"] if c in by]
    tpl = {"title": state.get("title", ""), "view": {}, "widgets": widgets, "log": []}
    for spec in filter(None, (a.blank or "").split(",")):
        if spec == "title":
            tpl["title"] = ""
            continue
        wid, _, field = spec.partition(".")
        w = by.get(wid, {})
        if field in ("id", "type") or type(w.get(field)) not in EMPTY:
            fail(2, f"--blank {spec!r}: expected title or <kept widget id>.<kept text/list field>")
        w[field] = type(w[field])()
    validate(tpl, ddir)  # e.g. blanking a tab leaves an invalid template: refuse it here
    types = sorted({w["type"] for w in widgets} - BUILTIN)
    files = {
        "SKILL.md": SKILL_MD.format(skill=a.skill, title=tpl["title"] or a.skill),
        "instructions.md": SKILL_INSTRUCTIONS.format(skill=a.skill, title=tpl["title"] or a.skill),
        "assets/process.md": process,
        "assets/state.template.json": json.dumps(tpl, indent=2, ensure_ascii=False) + "\n",
        **{f"assets/widgets/{t}.js": (ddir / "widgets" / f"{t}.js").read_text(encoding="utf-8") for t in types},
    }
    kept = {"(title)": [tpl["title"]]} | {
        w["id"]: list(dict.fromkeys(s for s in strings({k: v for k, v in w.items() if k not in ("id", "type")}) if s))
        for w in widgets
    }
    out = {"ok": True, "skill": str(sdir), "kept": kept, "dropped": dropped, "files": sorted(files),
           "review": "assets/process.md is copied as-is; check it for private details too"}
    if a.dry_run:
        return out | {"dry_run": True}
    if sdir.exists() and not a.force:
        fail(6, f"{sdir} exists; pass --force to overwrite its generated files")
    # ponytail: --force overwrites generated files only; stale widget JS from an earlier run stays
    for rel, text in files.items():
        (sdir / rel).parent.mkdir(parents=True, exist_ok=True)
        (sdir / rel).write_text(text, encoding="utf-8")
    return out


def main(argv=None):
    try:
        a = build_parser().parse_args(argv)
        out = a.fn(a)
        if out is not None:  # serve --foreground prints its own line, then blocks
            print(json.dumps(out, indent=2, ensure_ascii=False))
        return 0
    except DashError as e:
        print(f"dash: {e}", file=sys.stderr)
        return e.code
    except OSError as e:
        print(f"dash: file error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
