#!/usr/bin/env python3
"""Skill-side bridge CLI. Stdlib only. The files under runtime/ are the protocol;
this script is just a convenient, safe way to touch them.

  bridge.py init                      create runtime/, seed app.json from manifest
  bridge.py serve [--port N]          start server.py detached (idempotent), print URL
  bridge.py stop                      stop the server
  bridge.py status                    server + queue + tasks summary (JSON)
  bridge.py push <path> <value>       set one path in app.json (value parsed as JSON if possible)
  bridge.py push --json '{...}'       deep-merge an object into app.json
  bridge.py push --file f.json        replace app.json
  bridge.py get [<path>]              print app.json or one path
  bridge.py drain [--if-any] [--peek] print pending inbox events as JSON, mark processed
  bridge.py wait [--timeout S] [--task ID]  block until inbox non-empty (or task finishes)
  bridge.py log <message> [--level info|warn|error] [--source name]
  bridge.py tasks [--all]             list background tasks (--all: include aggregated apps)
  bridge.py apps                      status of every aggregated app (JSON)
  bridge.py open                      open the dashboard in a browser if possible

Aggregation: an app whose manifest has "aggregate": ["<glob>", ...] (paths relative to
the app folder), or whose server is started with --aggregate / VIBE_AGGREGATE, also
reads the tasks and logs of every app folder those globs match. Its dashboard's
Activity drawer then shows all of them, and `apps` reports each one's status.
"""
import argparse
import glob
import json
import os
import secrets
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

APP_ROOT = Path(os.environ.get("VIBE_APP_ROOT") or Path(__file__).resolve().parent.parent)
RT = APP_ROOT / "runtime"
STATE = RT / "state" / "app.json"
LOG = RT / "log.jsonl"
INBOX = RT / "queue" / "inbox.jsonl"
PROCESSED = RT / "queue" / "processed.jsonl"
TASKS = RT / "state" / "tasks"
SERVER_JSON = RT / "server.json"

_ULID_ALPHA = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"


def ulid():
    def enc(n, width):
        chars = []
        for _ in range(width):
            chars.append(_ULID_ALPHA[n & 31])
            n >>= 5
        return "".join(reversed(chars))
    return enc(int(time.time() * 1000), 10) + enc(secrets.randbits(80), 16)


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


# ---------- file primitives ----------

def write_json(path: Path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + f".{os.getpid()}.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp, path)


def read_json(path: Path, default=None):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def append_line(path: Path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(obj, ensure_ascii=False) + "\n"
    fd = os.open(path, os.O_WRONLY | os.O_APPEND | os.O_CREAT, 0o644)
    try:
        os.write(fd, line.encode("utf-8"))
    finally:
        os.close(fd)


def read_lines(path: Path):
    try:
        with open(path, encoding="utf-8") as f:
            return [json.loads(l) for l in f if l.strip()]
    except FileNotFoundError:
        return []


def count_lines(path: Path):
    try:
        with open(path, "rb") as f:
            return sum(1 for _ in f)
    except FileNotFoundError:
        return 0


# ---------- state ----------

def read_manifest():
    return read_json(APP_ROOT / "manifest.json", {}) or {}


def seed_state():
    m = read_manifest()
    pages = m.get("pages") or ["home"]
    defaults = {
        "log": [{"id": "log", "type": "log", "title": "Activity"}],
        "tasks": [{"id": "tasks", "type": "task-list", "title": "Background tasks"}],
    }
    return {
        "app": {"name": m.get("name", APP_ROOT.name), "version": m.get("version", "0.0.0"),
                "description": m.get("description", "")},
        "nav": {"current": m.get("entry_page", pages[0]), "pages": pages},
        "status": {"phase": "idle", "message": "Ready", "busy": False},
        "pages": {p: {"title": p.replace("-", " ").replace("_", " ").title(),
                      "widgets": defaults.get(p, [])} for p in pages},
    }


def ensure_runtime():
    for d in (RT / "state", RT / "queue", TASKS):
        d.mkdir(parents=True, exist_ok=True)
    if not STATE.exists():
        write_json(STATE, seed_state())
    gi = RT / ".gitignore"
    if not gi.exists():
        gi.write_text("*\n!.gitignore\n")


def read_state():
    st = read_json(STATE) or seed_state()
    # drop stray top-level keys left by older bridges (they merged `push --json … <path>`
    # into the root), so one bad write can't block every later one
    return {k: v for k, v in st.items() if k in ROOT_KEYS} if isinstance(st, dict) else seed_state()


def _parse_value(s: str):
    try:
        return json.loads(s)
    except (json.JSONDecodeError, TypeError):
        return s


def _walk(obj, keys, create):
    """Descend a dotted path. Lists are indexed by int or by element `id`."""
    for k in keys:
        if isinstance(obj, list):
            nxt = None
            if k.isdigit() and int(k) < len(obj):
                nxt = obj[int(k)]
            else:
                nxt = next((e for e in obj if isinstance(e, dict) and e.get("id") == k), None)
                if nxt is None and create:
                    nxt = {"id": k}
                    obj.append(nxt)
            if nxt is None:
                return None
            obj = nxt
        elif isinstance(obj, dict):
            if k not in obj:
                if not create:
                    return None
                obj[k] = {}
            obj = obj[k]
        else:
            return None
    return obj


class StateShapeError(ValueError):
    pass


ROOT_KEYS = {"app", "nav", "status", "pages"}


def validate_state(st):
    """Refuse shapes the dashboard cannot render, with a message that says what to push
    instead. Called on every write so a wrong push fails loudly instead of blanking a page."""
    extra = [k for k in st if k not in ROOT_KEYS]
    if extra:
        raise StateShapeError(f"unknown top-level key(s) {extra}: the state root holds only {sorted(ROOT_KEYS)}. "
                              f"To set something inside, push a path: push status.phase '\"draft\"', "
                              f"push --json '{{...}}' pages.<page>")
    pages = st.get("pages")
    if pages is None:
        return
    if not isinstance(pages, dict):
        raise StateShapeError("pages must be an object keyed by page name")
    for name, page in pages.items():
        if not isinstance(page, dict):
            raise StateShapeError(f"pages.{name} must be an object like {{\"title\": ..., \"widgets\": [...]}}")
        ws = page.get("widgets", [])
        if not isinstance(ws, list):
            raise StateShapeError(f"pages.{name}.widgets must be a list of widget objects")
        for i, w in enumerate(ws):
            if not isinstance(w, dict) or not w.get("id") or not w.get("type"):
                got = json.dumps(w)[:80]
                raise StateShapeError(
                    f"pages.{name}.widgets[{i}] must be an object with \"id\" and \"type\" (got {got}). "
                    f"Widgets are addressed by id: push pages.{name}.widgets.<id> '{{\"id\": \"<id>\", \"type\": \"markdown\", \"text\": \"...\"}}' "
                    f"or a property with push pages.{name}.widgets.<id>.<prop> <json>. See bridge/PROTOCOL.md.")


def write_state(st):
    validate_state(st)
    write_json(STATE, st)


def set_path(path: str, value):
    st = read_state()
    keys = path.split(".")
    parent = _walk(st, keys[:-1], create=True)
    last = keys[-1]
    if isinstance(parent, list) and last.isdigit() and int(last) < len(parent) and not any(
            isinstance(e, dict) and e.get("id") == last for e in parent):
        parent[int(last)] = value          # plain index into a list, e.g. table rows.1.2
    elif isinstance(parent, list):
        target = next((e for e in parent if isinstance(e, dict) and e.get("id") == last), None)
        if target is None:
            parent.append(value if isinstance(value, dict) else {"id": last, "value": value})
        else:
            idx = parent.index(target)
            parent[idx] = value
    else:
        parent[last] = value
    write_state(st)
    return st


def get_path(path: str):
    return _walk(read_state(), path.split("."), create=False)


def deep_merge(dst, src):
    for k, v in src.items():
        if isinstance(v, dict) and isinstance(dst.get(k), dict):
            deep_merge(dst[k], v)
        else:
            dst[k] = v
    return dst


# ---------- queue ----------

def enqueue(typ, name, page=None, payload=None):
    ev = {"id": ulid(), "ts": now_iso(), "type": typ, "name": name, "page": page, "payload": payload or {}}
    append_line(INBOX, ev)
    return ev


def pending_count():
    return count_lines(INBOX)


def drain(peek=False):
    events = read_lines(INBOX)
    if events and not peek:
        for ev in events:
            ev["processed"] = now_iso()
            append_line(PROCESSED, ev)
        # truncate atomically: write empty tmp then rename over inbox
        tmp = INBOX.with_suffix(".tmp")
        tmp.write_text("")
        os.replace(tmp, INBOX)
    return events


# ---------- log / tasks ----------

def app_name():
    return read_manifest().get("name") or APP_ROOT.name


def log(message, level="info", source="skill"):
    entry = {"ts": now_iso(), "level": level, "app": app_name(), "source": source, "message": message}
    append_line(LOG, entry)
    return entry


def tail_log(since=0, limit=500):
    lines = read_lines(LOG)
    return lines[since:since + limit]


# ---------- aggregation ----------

def manifest_at(root: Path):
    return read_json(root / "manifest.json", {}) or {}


def aggregate_globs():
    env = os.environ.get("VIBE_AGGREGATE")
    if env:
        return [g for g in env.split(os.pathsep) if g]
    return read_manifest().get("aggregate") or []


def aggregate_roots():
    """App folders matched by the aggregate globs, excluding this app."""
    me = APP_ROOT.resolve()
    roots = []
    for g in aggregate_globs():
        g = os.path.expanduser(g)
        pattern = g if os.path.isabs(g) else str(APP_ROOT / g)
        for m in sorted(glob.glob(pattern)):
            r = Path(m).resolve()
            if r != me and (r / "manifest.json").is_file() and r not in roots:
                roots.append(r)
    return roots


def sources(aggregate=False):
    """[(app_name, app_root)] — this app first, then aggregated apps when asked."""
    out = [(app_name(), APP_ROOT)]
    if aggregate:
        out += [(manifest_at(r).get("name") or r.name, r) for r in aggregate_roots()]
    return out


def list_tasks(aggregate=False):
    out = []
    for name, root in sources(aggregate):
        for p in sorted((root / "runtime" / "state" / "tasks").glob("*.json")):
            t = read_json(p)
            if t:
                t.setdefault("app", name)
                out.append(t)
    return out


def find_task(task_id, aggregate=False):
    for _, root in sources(aggregate):
        t = read_json(root / "runtime" / "state" / "tasks" / f"{task_id}.json")
        if t:
            return t
    return None


def read_new_lines(path: Path, offset: int, app=None):
    """Complete JSONL lines appended after byte `offset`. Returns (entries, new_offset).
    A file shorter than `offset` was truncated or replaced; read it from the start."""
    try:
        size = path.stat().st_size
    except FileNotFoundError:
        return [], 0
    if size < offset:
        offset = 0
    if size == offset:
        return [], offset
    with open(path, "rb") as f:
        f.seek(offset)
        chunk = f.read(size - offset)
    end = chunk.rfind(b"\n")
    if end < 0:
        return [], offset
    entries = []
    for raw in chunk[:end].splitlines():
        if not raw.strip():
            continue
        try:
            e = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if app:
            e.setdefault("app", app)
        entries.append(e)
    return entries, offset + end + 1


def merged_log(aggregate=False, limit=2000):
    lines = []
    for name, root in sources(aggregate):
        for e in read_lines(root / "runtime" / "log.jsonl"):
            e.setdefault("app", name)
            lines.append(e)
    lines.sort(key=lambda e: e.get("ts", ""))
    return lines[-limit:]


def _pid_alive(pid):
    try:
        os.kill(int(pid), 0)
        return True
    except (OSError, TypeError, ValueError):
        return False


def app_status(root: Path):
    m = manifest_at(root)
    rt = root / "runtime"
    info = read_json(rt / "server.json")
    alive = bool(info) and _pid_alive(info.get("pid"))
    tasks = [read_json(p) or {} for p in (rt / "state" / "tasks").glob("*.json")]
    last = read_lines(rt / "log.jsonl")[-1:] if (rt / "log.jsonl").exists() else []
    st = (read_json(rt / "state" / "app.json") or {}).get("status", {})
    return {
        "id": m.get("name") or root.name,
        "name": m.get("name") or root.name,
        "version": m.get("version", ""),
        "description": m.get("description", ""),
        "path": str(root),
        "status": "running" if alive else "stopped",
        "port": info.get("port") if alive else None,
        "url": info.get("url") if alive else None,
        "phase": st.get("phase"),
        "message": st.get("message"),
        "pending_events": count_lines(rt / "queue" / "inbox.jsonl"),
        "tasks_running": sum(1 for t in tasks if t.get("status") in ("running", "queued")),
        "tasks_failed": sum(1 for t in tasks if t.get("status") == "failed"),
        "last_activity": last[0].get("ts") if last else None,
        "adapters": m.get("harness_adapters", []),
    }


def apps_summary():
    return [app_status(r) for r in aggregate_roots()]


# ---------- server ----------

def server_info():
    info = read_json(SERVER_JSON)
    if not info:
        return None
    try:
        os.kill(info["pid"], 0)
    except (OSError, KeyError):
        try:
            SERVER_JSON.unlink()
        except FileNotFoundError:
            pass
        return None
    return info


def serve(port=0, aggregate=None):
    info = server_info()
    if info:
        return info
    ensure_runtime()
    cmd = [sys.executable, str(Path(__file__).with_name("server.py")), str(port)]
    logf = open(RT / "server.log", "ab")
    env = dict(os.environ)
    if aggregate:
        env["VIBE_AGGREGATE"] = os.pathsep.join(aggregate)
    kw = {"stdout": logf, "stderr": subprocess.STDOUT, "stdin": subprocess.DEVNULL, "cwd": str(APP_ROOT), "env": env}
    if os.name == "nt":
        kw["creationflags"] = 0x00000008 | 0x00000200  # DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP
    else:
        kw["start_new_session"] = True
    subprocess.Popen(cmd, **kw)
    for _ in range(40):
        time.sleep(0.1)
        info = server_info()
        if info:
            return info
    raise SystemExit("server did not start; see runtime/server.log")


def stop():
    info = server_info()
    if not info:
        return False
    import signal
    os.kill(info["pid"], signal.SIGTERM)
    for _ in range(30):  # wait so an immediate `serve` doesn't adopt the dying process
        time.sleep(0.1)
        try:
            os.kill(info["pid"], 0)
        except OSError:
            break
    try:
        SERVER_JSON.unlink()
    except FileNotFoundError:
        pass
    return True


# ---------- wait ----------

def wait(timeout=110.0, task_id=None, aggregate=False):
    deadline = time.time() + timeout
    interval = 0.2
    while time.time() < deadline:
        if task_id:
            t = find_task(task_id, aggregate)
            if t and t.get("status") in ("done", "failed"):
                return {"kind": "task", "task": t}
        elif pending_count() > 0:
            return {"kind": "events", "events": drain()}
        time.sleep(interval)
        interval = min(interval * 1.5, 1.0)
    return {"kind": "timeout", "events": []}


# ---------- CLI ----------

def main(argv=None):
    ap = argparse.ArgumentParser(prog="bridge.py")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("init")
    p = sub.add_parser("serve"); p.add_argument("--port", type=int, default=0)
    p.add_argument("--aggregate", action="append", metavar="GLOB", help="also show tasks/logs of app folders matching GLOB (repeatable)")
    sub.add_parser("stop")
    sub.add_parser("status")
    sub.add_parser("open")
    p = sub.add_parser("push")
    p.add_argument("path", nargs="?"); p.add_argument("value", nargs="?")
    p.add_argument("--json"); p.add_argument("--file")
    p = sub.add_parser("get"); p.add_argument("path", nargs="?")
    p = sub.add_parser("drain"); p.add_argument("--if-any", action="store_true"); p.add_argument("--peek", action="store_true")
    p = sub.add_parser("wait"); p.add_argument("--timeout", type=float, default=110); p.add_argument("--task")
    p.add_argument("--all", action="store_true", help="look for --task in aggregated apps too")
    p = sub.add_parser("log"); p.add_argument("message"); p.add_argument("--level", default="info"); p.add_argument("--source", default="skill")
    p = sub.add_parser("tasks"); p.add_argument("--all", action="store_true")
    sub.add_parser("apps")
    a = ap.parse_args(argv)

    if a.cmd == "init":
        ensure_runtime()
        print(json.dumps({"ok": True, "runtime": str(RT)}))
    elif a.cmd == "serve":
        info = serve(a.port, a.aggregate)
        print(info["url"])
    elif a.cmd == "stop":
        print(json.dumps({"stopped": stop()}))
    elif a.cmd == "status":
        ensure_runtime()
        st = read_state()
        print(json.dumps({
            "server": server_info(),
            "pending_events": pending_count(),
            "tasks": {t["id"]: t.get("status") for t in list_tasks()},
            "status": st.get("status"),
            "page": st.get("nav", {}).get("current"),
            "aggregating": [str(r) for r in aggregate_roots()],
        }, indent=2))
    elif a.cmd == "open":
        info = serve()
        import webbrowser
        ok = webbrowser.open(info["url"])
        print(json.dumps({"url": info["url"], "opened": bool(ok)}))
    elif a.cmd == "push":
        ensure_runtime()
        try:
            if a.file:
                write_state(read_json(Path(a.file)))
            elif a.json:
                val = json.loads(a.json)
                if a.path:
                    # `push --json '<json>' <path>`: the JSON is the value at that path; objects
                    # merge into what's there, anything else replaces it.
                    cur = get_path(a.path)
                    if isinstance(val, dict) and isinstance(cur, dict):
                        val = deep_merge(json.loads(json.dumps(cur)), val)
                    set_path(a.path, val)
                elif not isinstance(val, dict):
                    raise StateShapeError("push --json without a path merges into the whole state, so it needs an "
                                          "object like {\"status\": {...}}; to set one value use push <path> <json>")
                else:
                    st = read_state(); deep_merge(st, val); write_state(st)
            elif a.path is not None and a.value is not None:
                set_path(a.path, _parse_value(a.value))
            else:
                ap.error("push needs <path> <value>, --json, or --file")
        except StateShapeError as e:
            print(json.dumps({"ok": False, "error": str(e)}))
            return 1
        print(json.dumps({"ok": True}))
    elif a.cmd == "get":
        print(json.dumps(get_path(a.path) if a.path else read_state(), indent=2))
    elif a.cmd == "drain":
        ensure_runtime()
        evs = drain(peek=a.peek)
        if a.if_any and not evs:
            return 0
        print(json.dumps(evs, indent=2))
    elif a.cmd == "wait":
        ensure_runtime()
        print(json.dumps(wait(a.timeout, a.task, a.all), indent=2))
    elif a.cmd == "log":
        print(json.dumps(log(a.message, a.level, a.source)))
    elif a.cmd == "tasks":
        print(json.dumps(list_tasks(a.all), indent=2))
    elif a.cmd == "apps":
        print(json.dumps(apps_summary(), indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
