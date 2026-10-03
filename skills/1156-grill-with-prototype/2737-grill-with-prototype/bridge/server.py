#!/usr/bin/env python3
"""Local dashboard server for a skill-app. Stdlib only.

Serves dashboard/ statically, streams runtime/state changes over SSE, and
appends dashboard actions to runtime/queue/inbox.jsonl. The skill never talks
to this process; it reads and writes the runtime/ files through bridge.py.
"""
import json
import os
import socket
import sys
import threading
import time
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bridge  # noqa: E402

APP_ROOT = bridge.APP_ROOT
DASH = APP_ROOT / "dashboard"
RT = bridge.RT

POLL_S = 0.25


class Broadcaster:
    def __init__(self):
        self.lock = threading.Lock()
        self.clients = []  # list of queue-like lists guarded by cond

    def subscribe(self):
        cond = threading.Condition()
        q = {"cond": cond, "items": []}
        with self.lock:
            self.clients.append(q)
        return q

    def unsubscribe(self, q):
        with self.lock:
            if q in self.clients:
                self.clients.remove(q)

    def publish(self, event, data):
        payload = f"event: {event}\ndata: {json.dumps(data)}\n\n"
        with self.lock:
            targets = list(self.clients)
        for q in targets:
            with q["cond"]:
                q["items"].append(payload)
                q["cond"].notify()


BUS = Broadcaster()


def _mtime(p: Path):
    try:
        return p.stat().st_mtime_ns
    except FileNotFoundError:
        return 0


AGG = False          # set in main(): True when this server aggregates other apps
ROOTS_EVERY_S = 5.0  # how often to re-scan aggregate globs for new/removed apps
APPS_EVERY_S = 2.0   # how often to recompute per-app status


def _tasks_sig(srcs):
    sig = []
    for _, root in srcs:
        d = root / "runtime" / "state" / "tasks"
        if d.exists():
            sig.extend((str(p), _mtime(p)) for p in d.glob("*.json"))
    return tuple(sorted(sig))


def watcher():
    """Poll runtime files and publish diffs. Polling keeps this dependency-free.
    In aggregate mode the log/tasks watch spans every aggregated app."""
    srcs = bridge.sources(AGG)
    offsets = {}
    for name, root in srcs:  # stream only lines written after startup
        _, offsets[root] = bridge.read_new_lines(root / "runtime" / "log.jsonl", 0)
    last = {"state": 0, "inbox": 0, "tasks": None, "apps": None}
    next_roots = time.time() + ROOTS_EVERY_S
    next_apps = 0.0
    while True:
        now = time.time()
        if AGG and now >= next_roots:
            fresh = bridge.sources(True)
            for name, root in fresh:
                if root not in offsets:  # newly appeared app: start at its current end
                    _, offsets[root] = bridge.read_new_lines(root / "runtime" / "log.jsonl", 0)
            srcs = fresh
            next_roots = now + ROOTS_EVERY_S

        st = _mtime(RT / "state" / "app.json")
        if st != last["state"]:
            last["state"] = st
            BUS.publish("state", bridge.read_state())

        new_lines = []
        for name, root in srcs:
            entries, offsets[root] = bridge.read_new_lines(root / "runtime" / "log.jsonl", offsets.get(root, 0), app=name)
            new_lines.extend(entries)
        if new_lines:
            new_lines.sort(key=lambda e: e.get("ts", ""))
            BUS.publish("log", new_lines)
            next_apps = 0.0  # activity changed; refresh app summaries now

        tsig = _tasks_sig(srcs)
        if tsig != last["tasks"]:
            last["tasks"] = tsig
            BUS.publish("tasks", bridge.list_tasks(AGG))
            next_apps = 0.0

        ib = _mtime(RT / "queue" / "inbox.jsonl")
        if ib != last["inbox"]:
            last["inbox"] = ib
            BUS.publish("inbox", {"pending": bridge.pending_count()})

        if AGG and now >= next_apps:
            apps = bridge.apps_summary()
            if apps != last["apps"]:
                last["apps"] = apps
                BUS.publish("apps", apps)
            next_apps = now + APPS_EVERY_S

        time.sleep(POLL_S)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(DASH), **kw)

    def log_message(self, fmt, *args):  # quiet by default
        if os.environ.get("BRIDGE_DEBUG"):
            super().log_message(fmt, *args)

    def _json(self, obj, status=HTTPStatus.OK):
        body = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/events":
            return self._sse()
        if u.path == "/api/state":
            return self._json(bridge.read_state())
        if u.path == "/api/log":
            return self._json(bridge.merged_log(AGG, limit=int(parse_qs(u.query).get("limit", ["2000"])[0])))
        if u.path == "/api/tasks":
            return self._json(bridge.list_tasks(AGG))
        if u.path == "/api/apps":
            return self._json(bridge.apps_summary() if AGG else [])
        if u.path == "/api/inbox":
            return self._json({"pending": bridge.pending_count()})
        if u.path == "/api/manifest":
            return self._json(bridge.read_manifest())
        if u.path.startswith("/workspace/"):
            return self._workspace_file(u.path[len("/workspace/"):])
        if u.path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def _workspace_file(self, rel):
        """Read-only view of the user's workspace (runtime/config.json -> workspace), so
        files a skill writes there (a rendered prototype, a report) can be shown in the
        dashboard without copying them into the app. Resolved on every request so setting
        the workspace later needs no restart."""
        ws = (bridge.read_json(RT / "config.json") or {}).get("workspace")
        if not ws:
            return self._json({"error": "no workspace set in runtime/config.json"}, HTTPStatus.NOT_FOUND)
        root = Path(os.path.expanduser(ws)).resolve()
        target = (root / rel).resolve()
        if root not in target.parents and target != root:
            return self._json({"error": "outside workspace"}, HTTPStatus.FORBIDDEN)
        if target.is_dir():
            target = target / "index.html"
        if not target.is_file():
            return self._json({"error": "not found"}, HTTPStatus.NOT_FOUND)
        body = target.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", self.guess_type(str(target)))
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        u = urlparse(self.path)
        if u.path != "/api/action":
            return self._json({"error": "not found"}, HTTPStatus.NOT_FOUND)
        n = int(self.headers.get("Content-Length", "0"))
        try:
            body = json.loads(self.rfile.read(n) or b"{}")
        except json.JSONDecodeError:
            return self._json({"error": "invalid json"}, HTTPStatus.BAD_REQUEST)
        typ = body.get("type")
        name = body.get("name")
        if typ not in ("action", "form", "nav") or not isinstance(name, str) or not name:
            return self._json({"error": "type must be action|form|nav and name required"}, HTTPStatus.BAD_REQUEST)
        ev = bridge.enqueue(typ, name, body.get("page"), body.get("payload") or {})
        if typ == "nav":
            bridge.set_path("nav.current", name)
        return self._json({"ok": True, "id": ev["id"]})

    def _sse(self):
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Connection", "keep-alive")
        self.end_headers()
        q = BUS.subscribe()
        try:
            # initial snapshot so a fresh tab is fully hydrated
            self.wfile.write(f"event: state\ndata: {json.dumps(bridge.read_state())}\n\n".encode())
            self.wfile.write(f"event: tasks\ndata: {json.dumps(bridge.list_tasks(AGG))}\n\n".encode())
            if AGG:
                self.wfile.write(f"event: apps\ndata: {json.dumps(bridge.apps_summary())}\n\n".encode())
            self.wfile.write(f"event: inbox\ndata: {json.dumps({'pending': bridge.pending_count()})}\n\n".encode())
            self.wfile.flush()
            while True:
                with q["cond"]:
                    q["cond"].wait(timeout=15)
                    items, q["items"] = q["items"], []
                if not items:
                    self.wfile.write(b": ping\n\n")
                else:
                    for it in items:
                        self.wfile.write(it.encode())
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, OSError):
            pass
        finally:
            BUS.unsubscribe(q)


def free_port(preferred=0):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind(("127.0.0.1", preferred))
        except OSError:
            s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def main():
    global AGG
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    AGG = bool(bridge.aggregate_globs())
    port = free_port(port)
    bridge.ensure_runtime()
    httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    httpd.daemon_threads = True
    info = {"pid": os.getpid(), "port": port, "url": f"http://127.0.0.1:{port}/", "started": bridge.now_iso(),
            "aggregate": bridge.aggregate_globs() if AGG else []}
    bridge.write_json(RT / "server.json", info)
    threading.Thread(target=watcher, daemon=True).start()
    print(info["url"], flush=True)
    try:
        httpd.serve_forever()
    finally:
        try:
            (RT / "server.json").unlink()
        except FileNotFoundError:
            pass


if __name__ == "__main__":
    main()
