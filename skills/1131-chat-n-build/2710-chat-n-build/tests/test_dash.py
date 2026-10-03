"""Tests for scripts/dash.py. Standard library only: python3 -m unittest discover -s chat-n-build/tests"""

import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest import mock
import shutil
import socket
import threading
import time
import urllib.error
import urllib.request

SCRIPTS = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS))
import dash  # noqa: E402


class DashCase(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)

    def tearDown(self):
        self._tmp.cleanup()

    def run_dash(self, *args):
        """Run dash in-process. Returns (exit code, parsed stdout or raw text, stderr)."""
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = dash.main([*args[:1], "--root", str(self.root), *args[1:]])
        text = out.getvalue()
        try:
            text = json.loads(text)
        except ValueError:
            pass
        return code, text, err.getvalue()

    def ok(self, *args):
        code, out, err = self.run_dash(*args)
        self.assertEqual(code, 0, f"dash {args} exited {code}: {err}")
        return out

    def state(self, name="article"):
        return json.loads((self.root / "dashboards" / name / "state.json").read_text())

    def widget(self, wid, name="article"):
        return next(w for w in self.state(name)["widgets"] if w["id"] == wid)


class TestInit(DashCase):
    def test_init_creates_blank_dashboard(self):
        self.ok("init", "article")
        d = self.root / "dashboards" / "article"
        self.assertEqual(self.state()["widgets"], [])
        process = (d / "process.md").read_text()
        self.assertIn("# Process: article", process)  # from assets/process.template.md
        self.assertIn("## Stages (one tab each", process)
        self.assertNotIn("{name}", process)
        self.assertTrue((d / "widgets").is_dir())
        self.assertIn(
            "events.jsonl", (self.root / "dashboards" / ".gitignore").read_text()
        )

    def test_init_twice_conflicts(self):
        self.ok("init", "article")
        self.assertEqual(self.run_dash("init", "article")[0], 6)

    def test_bad_names_rejected(self):
        for bad in ["../x", "a/b", ".aai", "Upper", "", "-lead", "x" * 41]:
            code, _, err = self.run_dash("init", "--", bad)
            self.assertEqual(code, 2, f"{bad!r} should exit 2")
        self.assertEqual(list(self.root.glob("**/state.json")), [])
        self.assertFalse((self.root.parent / "x").exists())


class TestValidation(DashCase):
    def setUp(self):
        super().setUp()
        self.ok("init", "article")

    def assert_invalid(self, wid, widget, field):
        code, _, err = self.run_dash("set", wid, "--json", json.dumps(widget))
        self.assertEqual(code, 2, err)
        self.assertIn(field, err)

    def test_valid_builtins_accepted(self):
        self.ok("set", "m", "--json", '{"type":"metric","value":3,"delta":"+1"}')
        self.ok("set", "t", "--json", '{"type":"table","columns":["a"],"rows":[["x"]]}')
        self.ok(
            "set",
            "l",
            "--json",
            '{"type":"list","items":["a",{"text":"b","status":"done"}]}',
        )
        self.ok("set", "n", "--json", '{"type":"note","md":"# hi"}')
        self.ok(
            "set",
            "c",
            "--json",
            '{"type":"chart","kind":"bar","series":[{"label":"a","value":1}]}',
        )
        self.ok(
            "set",
            "g",
            "--json",
            '{"type":"group","children":["m","n"],"collapsed":true}',
        )
        self.assertEqual(
            [w["id"] for w in self.state()["widgets"]], ["m", "t", "l", "n", "c", "g"]
        )

    def test_bad_widgets_name_the_field(self):
        self.assert_invalid("c", {"type": "chart", "kind": "pie", "series": []}, "kind")
        self.assert_invalid(
            "c",
            {"type": "chart", "kind": "bar", "series": [{"label": "a", "value": "x"}]},
            "series[0].value",
        )
        self.assert_invalid(
            "l",
            {"type": "list", "items": [{"text": "a", "status": "nope"}]},
            "items[0].status",
        )
        self.assert_invalid("m", {"type": "metric"}, "value")
        self.assert_invalid("m", {"type": "metric", "value": 1, "span": 4}, "span")
        self.assert_invalid("n", {"type": "note", "md": 5}, "md")
        self.assert_invalid(
            "t", {"type": "table", "columns": "a", "rows": []}, "columns"
        )
        self.assert_invalid(
            "g", {"type": "group", "children": ["missing"]}, "children[0]"
        )
        self.assert_invalid(
            "x",
            {"type": "metric", "value": 1, "actions": [{"id": "go", "label": "Go"}]},
            "actions[0].say",
        )
        self.assert_invalid("x", {"value": 1}, "type")
        self.assert_invalid("Bad Id", {"type": "metric", "value": 1}, "id")
        self.assertEqual(self.state()["widgets"], [])

    def test_bad_json_is_validation_error(self):
        code, _, err = self.run_dash("set", "m", "--json", "{nope")
        self.assertEqual(code, 2)

    def test_custom_type_needs_widget_file(self):
        self.assert_invalid("k", {"type": "kanban", "cols": []}, "type")
        (self.root / "dashboards/article/widgets/kanban.js").write_text(
            "function render(){}"
        )
        self.ok(
            "set",
            "k",
            "--json",
            '{"type":"kanban","cols":[1,2],"anything":{"goes":true}}',
        )
        self.assertEqual(self.widget("k")["anything"], {"goes": True})

    def test_id_mismatch_rejected(self):
        code, _, err = self.run_dash(
            "set", "a", "--json", '{"id":"b","type":"note","md":""}'
        )
        self.assertEqual(code, 2)


class TestEdits(DashCase):
    def setUp(self):
        super().setUp()
        self.ok("init", "article")
        self.ok(
            "set",
            "stages",
            "--json",
            json.dumps(
                {
                    "type": "list",
                    "tab": "pipeline",
                    "items": [
                        {"text": "Brief", "status": "active"},
                        {"text": "Draft", "status": "todo"},
                    ],
                }
            ),
        )
        self.ok("set", "brief-md", "--json", '{"type":"note","tab":"brief","md":"old"}')

    def test_get(self):
        self.assertEqual(self.ok("get", "brief-md")["md"], "old")
        self.assertEqual(len(self.ok("get")["widgets"]), 2)
        self.assertEqual(self.run_dash("get", "nope")[0], 3)

    def test_set_replaces_in_place(self):
        self.ok("set", "stages", "--json", '{"type":"note","md":"x"}')
        self.assertEqual(
            [w["id"] for w in self.state()["widgets"]], ["stages", "brief-md"]
        )
        self.assertNotIn("items", self.widget("stages"))

    def test_patch_json_merges(self):
        self.ok("patch", "brief-md", "--json", '{"md":"new","label":"Brief"}')
        w = self.widget("brief-md")
        self.assertEqual((w["md"], w["label"], w["tab"]), ("new", "Brief", "brief"))

    def test_patch_path_value(self):
        self.ok("patch", "stages", "--path", "items.0.status", "--value", "done")
        self.ok("patch", "stages", "--path", "items.1.status", "--value", "active")
        self.ok("patch", "stages", "--path", "span", "--value", "2")
        w = self.widget("stages")
        self.assertEqual([i["status"] for i in w["items"]], ["done", "active"])
        self.assertEqual(w["span"], 2)
        self.assertEqual(
            self.run_dash(
                "patch", "stages", "--path", "items.9.status", "--value", "x"
            )[0],
            3,
        )
        self.assertEqual(
            self.run_dash(
                "patch", "stages", "--path", "items.0.status", "--value", "bogus"
            )[0],
            2,
        )
        self.assertEqual(self.run_dash("patch", "nope", "--json", "{}")[0], 3)

    def test_patch_cannot_change_id(self):
        self.assertEqual(
            self.run_dash("patch", "stages", "--json", '{"id":"other"}')[0], 2
        )

    def test_rm_requires_yes(self):
        self.assertEqual(self.run_dash("rm", "brief-md")[0], 1)
        self.assertEqual(len(self.state()["widgets"]), 2)
        self.ok("rm", "brief-md", "--yes")
        self.assertEqual([w["id"] for w in self.state()["widgets"]], ["stages"])
        self.assertEqual(self.run_dash("rm", "nope", "--yes")[0], 3)

    def test_rm_drops_id_from_groups(self):
        self.ok(
            "set", "g", "--json", '{"type":"group","children":["brief-md","stages"]}'
        )
        self.ok("rm", "brief-md", "--yes")
        self.assertEqual(self.widget("g")["children"], ["stages"])

    def test_move(self):
        self.ok("move", "brief-md", "--before", "stages")
        self.assertEqual(
            [w["id"] for w in self.state()["widgets"]], ["brief-md", "stages"]
        )
        self.ok("move", "brief-md", "--after", "stages")
        self.assertEqual(
            [w["id"] for w in self.state()["widgets"]], ["stages", "brief-md"]
        )
        self.ok("move", "brief-md", "--tab", "pipeline")
        self.assertEqual(self.widget("brief-md")["tab"], "pipeline")
        self.assertEqual(self.run_dash("move", "brief-md", "--before", "nope")[0], 3)

    def test_view(self):
        self.ok("view", "--tab", "brief", "--highlight", "brief-md,stages")
        self.assertEqual(
            self.state()["view"], {"tab": "brief", "highlight": ["brief-md", "stages"]}
        )

    def test_every_change_logs_one_entry(self):
        before = len(self.state()["log"])
        self.ok("patch", "brief-md", "--json", '{"md":"x"}', "--msg", "brief rewritten")
        log = self.state()["log"]
        self.assertEqual(len(log), before + 1)
        self.assertEqual(log[-1]["msg"], "brief rewritten")
        self.assertEqual(log[-1]["by"], "agent")
        self.assertRegex(log[-1]["at"], r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$")
        self.ok("log", "just a note")
        self.assertEqual(self.state()["log"][-1]["msg"], "just a note")

    def test_log_keeps_last_50(self):
        for i in range(60):
            self.ok("log", f"m{i}")
        log = self.state()["log"]
        self.assertEqual(len(log), 50)
        self.assertEqual(log[-1]["msg"], "m59")

    def test_dry_run_writes_nothing(self):
        before = self.state()
        hist = sorted((self.root / "dashboards/article/history").iterdir())
        out = self.ok("patch", "brief-md", "--json", '{"md":"new"}', "--dry-run")
        self.assertTrue(out["dry_run"])
        self.assertEqual(out["widget"]["md"], "new")
        self.ok("rm", "stages", "--yes", "--dry-run")
        self.assertEqual(self.state(), before)
        self.assertEqual(
            sorted((self.root / "dashboards/article/history").iterdir()), hist
        )


class TestUndoAndAtomicity(DashCase):
    def setUp(self):
        super().setUp()
        self.ok("init", "article")
        self.ok("set", "a", "--json", '{"type":"metric","value":1}')

    def test_apply_is_one_undo_step(self):
        before = self.state()
        ops = [
            {"op": "set", "id": "b", "json": {"type": "note", "md": "hi"}},
            {"op": "patch", "id": "a", "json": {"value": 2}},
            {"op": "patch", "id": "b", "path": "md", "value": "yo"},
            {"op": "view", "tab": "main", "highlight": ["b"]},
            {"op": "move", "id": "b", "before": "a"},
        ]
        self.ok("apply", "--json", json.dumps(ops))
        s = self.state()
        self.assertEqual([w["id"] for w in s["widgets"]], ["b", "a"])
        self.assertEqual(self.widget("b")["md"], "yo")
        self.assertEqual(len(s["log"]), len(before["log"]) + 1)
        self.ok("undo")
        after = self.state()
        self.assertEqual(after["widgets"], before["widgets"])
        self.assertEqual(after["view"], before["view"])

    def test_apply_is_all_or_nothing(self):
        before = self.state()
        ops = [
            {"op": "patch", "id": "a", "json": {"value": 9}},
            {"op": "patch", "id": "zzz", "json": {}},
        ]
        self.assertEqual(self.run_dash("apply", "--json", json.dumps(ops))[0], 3)
        self.assertEqual(self.state(), before)
        self.assertEqual(self.run_dash("apply", "--json", '[{"op":"explode"}]')[0], 2)

    def test_undo_steps_and_empty_history(self):
        self.ok("patch", "a", "--json", '{"value":2}')
        self.ok("patch", "a", "--json", '{"value":3}')
        self.ok("undo", "--steps", "2")
        self.assertEqual(self.widget("a")["value"], 1)
        self.ok("undo")  # back past set a, to blank init
        self.assertEqual(self.state()["widgets"], [])
        self.assertEqual(self.run_dash("undo")[0], 3)

    def test_history_keeps_last_20(self):
        for i in range(25):
            self.ok("patch", "a", "--json", json.dumps({"value": i}))
        self.assertEqual(
            len(list((self.root / "dashboards/article/history").glob("*.json"))), 20
        )

    def test_crash_mid_write_keeps_old_state(self):
        before = self.state()
        real_replace = os.replace

        def crash(src, dst):
            if str(dst).endswith("state.json"):
                raise OSError("disk died")
            real_replace(src, dst)

        with mock.patch.object(dash.os, "replace", crash):
            code, _, _ = self.run_dash("patch", "a", "--json", '{"value":99}')
        self.assertNotEqual(code, 0)
        self.assertEqual(self.state(), before)
        d = self.root / "dashboards/article"
        self.assertEqual([p.name for p in d.iterdir() if p.name.endswith(".tmp")], [])
        self.ok("undo")  # the failed change left no history step behind
        self.assertEqual(self.state()["widgets"], [])


class TestMultipleDashboards(DashCase):
    def test_isolated_and_d_required(self):
        self.ok("init", "article")
        self.ok("init", "intake")
        self.assertEqual(
            self.run_dash("set", "x", "--json", '{"type":"note","md":""}')[0], 1
        )
        self.ok("set", "x", "--json", '{"type":"note","md":"a"}', "-d", "article")
        self.ok("set", "y", "--json", '{"type":"note","md":"b"}', "-d", "intake")
        self.assertEqual([w["id"] for w in self.state("article")["widgets"]], ["x"])
        self.assertEqual([w["id"] for w in self.state("intake")["widgets"]], ["y"])
        self.ok("undo", "-d", "intake")
        self.assertEqual([w["id"] for w in self.state("article")["widgets"]], ["x"])
        self.assertEqual(self.run_dash("get", "-d", "nope")[0], 3)
        self.assertEqual(self.run_dash("get", "-d", "../article")[0], 2)

    def test_no_dashboards(self):
        self.assertEqual(self.run_dash("get")[0], 3)

    def test_status(self):
        self.ok("init", "article")
        self.ok("init", "intake")
        self.ok(
            "set",
            "stages",
            "--json",
            '{"type":"list","tab":"pipeline","items":[]}',
            "-d",
            "article",
        )
        self.ok(
            "set",
            "notes",
            "--json",
            '{"type":"note","tab":"brief","md":""}',
            "-d",
            "article",
        )
        (self.root / "dashboards/.server.json").write_text(
            '{"port": 8765, "token": "sekret-xyz"}'
        )
        out = self.ok("status")
        by = {d["name"]: d for d in out["dashboards"]}
        self.assertEqual(set(by), {"article", "intake"})
        self.assertEqual(by["article"]["tabs"], ["pipeline", "brief"])
        self.assertEqual(by["article"]["widgets"], ["stages", "notes"])
        self.assertEqual(by["article"]["url"], "http://127.0.0.1:8765/d/article/")
        self.assertNotIn("sekret-xyz", json.dumps(out))  # token never printed


class TestCli(DashCase):
    def test_usage_error_exits_1(self):
        self.assertEqual(self.run_dash("frobnicate")[0], 1)
        self.assertEqual(self.run_dash()[0], 1)


class TestConcurrency(DashCase):
    def test_concurrent_patches_all_survive(self):
        self.ok("init", "article")
        ids = [f"w{i}" for i in range(8)]
        for wid in ids:
            self.ok("set", wid, "--json", '{"type":"metric","value":0}')
        procs = [
            subprocess.Popen(
                [
                    sys.executable,
                    str(SCRIPTS / "dash.py"),
                    "patch",
                    wid,
                    "--json",
                    '{"value":1}',
                    "--root",
                    str(self.root),
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
            )
            for wid in ids
        ]
        for p in procs:
            _, err = p.communicate(timeout=30)
            self.assertEqual(p.returncode, 0, err)
        self.assertEqual([w["value"] for w in self.state()["widgets"]], [1] * 8)


def dash_proc(*args):
    return [sys.executable, str(SCRIPTS / "dash.py"), *args]


ADVANCE = {
    "type": "list",
    "items": ["a"],
    "actions": [{"id": "advance", "label": "Advance", "say": "advance the stage"}],
}


class ServerCase(DashCase):
    """A real server on a random port, in a thread of this process."""

    def setUp(self):
        super().setUp()
        self.ok("init", "article")
        self.ok("set", "stages", "--json", json.dumps(ADVANCE))
        self.start()

    def start(self):
        self.srv = dash.make_server(self.root, 0)
        self.port = self.srv.server_address[1]
        self.base = f"http://127.0.0.1:{self.port}"
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()

    def stop(self):
        self.srv.shutdown()
        self.srv.server_close()

    def tearDown(self):
        self.stop()
        super().tearDown()

    def req(self, method, path, body=None, token=True, origin=True, headers=()):
        h = dict(headers)
        if token:
            h["X-Dash-Token"] = self.srv.token if token is True else token
        if origin:
            h["Origin"] = self.base if origin is True else origin
        data = (
            body
            if isinstance(body, bytes) or body is None
            else json.dumps(body).encode()
        )
        r = urllib.request.Request(
            self.base + path, data=data, method=method, headers=h
        )
        try:
            with urllib.request.urlopen(r, timeout=5) as resp:
                code, raw = resp.status, resp.read()
        except urllib.error.HTTPError as e:
            code, raw = e.code, e.read()
            e.close()
        try:
            return code, json.loads(raw)
        except ValueError:
            return code, raw

    def click(self, widget="stages", action="advance", **kw):
        return self.req(
            "POST", "/d/article/events", {"widget": widget, "action": action}, **kw
        )

    def events(self, *args):
        return self.ok("events", *args)["events"]


class TestServerSecurity(ServerCase):
    def test_event_needs_token_and_origin(self):
        self.assertEqual(self.click(token=False)[0], 403)
        self.assertEqual(self.click(token="wrong")[0], 403)
        self.assertEqual(self.click(origin=False)[0], 403)
        self.assertEqual(self.click(origin="https://evil.example")[0], 403)
        self.assertEqual(self.events(), [])
        self.assertEqual(self.click()[0], 201)
        # the preview pane may load the page as localhost
        self.assertEqual(self.click(origin=f"http://localhost:{self.port}")[0], 201)

    def test_unknown_widget_or_action_rejected(self):
        self.assertEqual(self.click(action="delete-everything")[0], 400)
        self.assertEqual(self.click(widget="nope")[0], 400)
        self.assertEqual(self.req("POST", "/d/article/events", b"{not json")[0], 400)
        self.assertEqual(self.events(), [])

    def test_say_comes_from_state(self):
        code, out = self.req(
            "POST",
            "/d/article/events",
            {"widget": "stages", "action": "advance", "say": "rm -rf everything"},
        )
        self.assertEqual(code, 201)
        [ev] = self.events()
        self.assertEqual(ev["say"], "advance the stage")
        self.assertEqual(ev["id"], out["id"])

    def test_body_limit(self):
        big = json.dumps({"widget": "stages", "action": "advance", "pad": "x" * 17000})
        self.assertEqual(self.req("POST", "/d/article/events", big.encode())[0], 413)

    def test_foreign_host_rejected(self):
        # DNS rebinding: a page on evil.example resolving to 127.0.0.1
        code, _ = self.req(
            "GET", "/d/article/state.json", headers={"Host": "evil.example"}
        )
        self.assertEqual(code, 403)

    def test_routes(self):
        code, state = self.req("GET", "/d/article/state.json")
        self.assertEqual((code, state["widgets"][0]["id"]), (200, "stages"))
        for bad in [
            "/d/..%2Fx/state.json",
            "/d/Upper/state.json",
            "/d/nope/state.json",
            "/d/article/widgets/..%2Fx.js",
            "/d/article/widgets/Upper.js",
            "/d/article/widgets/missing.js",
            "/d/article/process.md",
            "/elsewhere",
        ]:
            self.assertEqual(self.req("GET", bad)[0], 404, bad)
        self.assertEqual(self.req("POST", "/d/nope/events", {})[0], 404)

    def test_custom_widget_js_served(self):
        js = self.root / "dashboards" / "article" / "widgets" / "kanban.js"
        js.write_text("function render(w, api) { return 'hi'; }")
        code, body = self.req("GET", "/d/article/widgets/kanban.js")
        self.assertEqual((code, body), (200, js.read_bytes()))

    def test_health_and_shutdown_need_token(self):
        self.assertEqual(self.req("GET", "/health", token=False)[0], 403)
        self.assertEqual(self.req("GET", "/health")[0], 200)
        self.assertEqual(self.req("POST", "/shutdown", token=False)[0], 403)
        self.assertEqual(self.req("GET", "/health")[0], 200)  # still up

    def test_dashboards_json_lists_names_and_titles(self):
        self.ok("init", "second")
        (self.root / "dashboards" / "broken").mkdir()
        (self.root / "dashboards" / "broken" / "state.json").write_text("{not json")
        code, body = self.req("GET", "/dashboards.json", token=False)
        self.assertEqual(code, 200)
        self.assertEqual([d["name"] for d in body], ["article", "broken", "second"])
        self.assertEqual(body[0]["title"], self.state()["title"])
        self.assertEqual(body[1]["title"], "")  # unreadable state still listed

    def test_html_has_csp_and_no_framing(self):
        for path in ("/", "/d/article/"):
            r = urllib.request.Request(self.base + path)
            with urllib.request.urlopen(r, timeout=5) as resp:
                csp = resp.headers["Content-Security-Policy"]
            self.assertIn("default-src 'self'", csp, path)
            self.assertIn("frame-ancestors 'none'", csp, path)
            self.assertNotIn(
                "script-src 'self'", csp, path
            )  # inline only; no external JS

    def test_frame_slot_filled_without_breaking_script(self):
        real = SCRIPTS.parent / "assets" / "widget-frame.html"
        frame = real.read_text()
        self.assertIn(
            "default-src 'none'", frame
        )  # the frame's own CSP: no network at all
        self.assertIn("</script>", frame)  # so the escaping below is actually exercised
        with tempfile.TemporaryDirectory() as d:
            shutil.copy(real, d)
            Path(d, "launcher.html").write_text(
                '<script>const F = "__DASH_FRAME__";</script>'
            )
            with mock.patch.object(dash, "ASSETS", Path(d)):
                page = self.req("GET", "/")[1].decode()
        body = page[len("<script>const F = ") : -len(";</script>")]
        self.assertEqual(page.count("</script>"), 1)
        self.assertEqual(json.loads(body), frame)

    def test_token_never_in_state_or_status(self):
        self.click()
        self.assertNotIn(self.srv.token, json.dumps(self.state()))
        self.assertNotIn(self.srv.token, json.dumps(self.ok("status")))


class TestEvents(ServerCase):
    def test_lifecycle(self):
        eid = self.click()[1]["id"]
        self.assertEqual([e["status"] for e in self.events()], ["pending"])
        self.assertEqual([e["status"] for e in self.events()], ["pending"])  # read-only
        self.ok("begin", eid)
        self.assertEqual([e["status"] for e in self.events()], ["interrupted"])
        self.assertEqual(self.run_dash("begin", eid)[0], 6)
        self.ok("ack", eid)
        self.assertEqual(self.events(), [])
        self.assertEqual(self.run_dash("ack", eid)[0], 6)
        self.assertEqual(self.run_dash("begin", eid)[0], 6)

    def test_oldest_first_and_unknown(self):
        ids = [self.click()[1]["id"] for _ in range(3)]
        self.assertEqual([e["id"] for e in self.events()], ids)
        self.assertEqual(self.run_dash("ack", "e-nope")[0], 3)
        self.assertEqual(self.run_dash("begin", "e-nope")[0], 3)
        # all-or-nothing: one unknown id means nothing is acked
        self.assertEqual(self.run_dash("ack", ids[0], "e-nope")[0], 3)
        self.assertEqual(len(self.events()), 3)
        self.ok("ack", *ids)
        self.assertEqual(self.events(), [])

    def test_pending_survives_restart(self):
        eid = self.click()[1]["id"]
        self.stop()
        self.start()
        self.assertEqual([e["id"] for e in self.events()], [eid])

    def test_failed_shows_in_status_and_summary(self):
        a, b = self.click()[1]["id"], self.click()[1]["id"]
        self.ok("begin", a)
        self.ok("ack", a, "--failed", "no draft to review")
        d = self.ok("status")["dashboards"][0]
        self.assertEqual(d["events"]["pending"], [b])
        self.assertEqual(
            d["events"]["failed"], [{"id": a, "why": "no draft to review"}]
        )
        code, summary = self.req("GET", "/d/article/events")
        self.assertEqual(code, 200)
        self.assertEqual(summary, {"pending": [b], "failed": [a]})

    def test_events_span_dashboards(self):
        self.ok("init", "second")
        self.ok("set", "stages", "--json", json.dumps(ADVANCE), "-d", "second")
        self.click()
        self.req("POST", "/d/second/events", {"widget": "stages", "action": "advance"})
        self.assertEqual([e["dashboard"] for e in self.events()], ["article", "second"])
        self.assertEqual(len(self.events("-d", "second")), 1)

    def test_wait_times_out(self):
        t = time.monotonic()
        code, _, _ = self.run_dash("wait", "--timeout", "0.6")
        self.assertEqual(code, 5)
        self.assertGreater(time.monotonic() - t, 0.5)

    def test_wait_returns_on_click(self):
        threading.Timer(0.4, self.click).start()
        code, out, err = self.run_dash("wait", "--timeout", "5")
        self.assertEqual(code, 0, err)
        self.assertEqual([e["say"] for e in out["events"]], ["advance the stage"])

    def test_wait_ignores_interrupted(self):
        self.ok("begin", self.click()[1]["id"])
        self.assertEqual(self.run_dash("wait", "--timeout", "0.6")[0], 5)

    def test_concurrent_begin_exactly_one_wins(self):
        for _ in range(3):
            eid = self.click()[1]["id"]
            procs = [
                subprocess.Popen(
                    dash_proc("begin", eid, "--root", str(self.root)),
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
                for _ in range(2)
            ]
            codes = sorted(p.wait(timeout=30) for p in procs)
            self.assertEqual(codes, [0, 6])


class TestErrors(ServerCase):
    def test_errors_persist_and_show_in_status(self):
        e = {"kind": "error", "type": "kanban", "widget": "board", "message": "boom"}
        self.assertEqual(self.req("POST", "/d/article/errors", e, token=False)[0], 403)
        self.assertEqual(self.req("POST", "/d/article/errors", e)[0], 201)
        self.assertEqual(self.ok("status")["dashboards"][0]["errors"], 1)
        [got] = self.ok("errors")["errors"]
        self.assertEqual(
            (got["type"], got["message"], got["dashboard"]),
            ("kanban", "boom", "article"),
        )
        self.ok("errors", "--clear")
        self.assertEqual(self.ok("errors")["errors"], [])
        self.assertEqual(self.ok("status")["dashboards"][0]["errors"], 0)


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


class TestServeStop(DashCase):
    def test_stale_stop_removes_record_without_signals(self):
        self.ok("init", "article")
        rec = self.root / "dashboards" / ".server.json"
        rec.write_text(json.dumps({"port": free_port(), "token": "t", "pid": 1}))
        with mock.patch("os.kill") as kill:
            code, _, err = self.run_dash("stop")
        self.assertEqual(code, 4, err)
        self.assertFalse(rec.exists())
        kill.assert_not_called()

    def test_stop_without_record(self):
        self.ok("init", "article")
        self.assertEqual(self.run_dash("stop")[0], 4)

    def test_serve_again_then_stop(self):
        self.ok("init", "article")
        root = str(self.root)

        def run(*args):
            p = subprocess.run(
                dash_proc(*args, "--root", root),
                capture_output=True,
                text=True,
                timeout=30,
            )
            return (
                p.returncode,
                (json.loads(p.stdout) if p.stdout.strip() else None),
                p.stderr,
            )

        code, first, err = run("serve", "--port", "0")
        self.assertEqual(code, 0, err)
        try:
            self.assertTrue(first["started"])
            rec = json.loads((self.root / "dashboards" / ".server.json").read_text())
            self.assertNotIn(rec["token"], json.dumps(first))
            code, again, err = run("serve", "--port", "0")
            self.assertEqual(
                (code, again["started"], again["url"]), (0, False, first["url"]), err
            )
            code, _, err = run("stop")
            self.assertEqual(code, 0, err)
        finally:
            run("stop")
        self.assertFalse((self.root / "dashboards" / ".server.json").exists())
        with self.assertRaises(OSError):
            urllib.request.urlopen(first["url"] + "health", timeout=2)


ASSETS = SCRIPTS.parent / "assets"
HOSTILE = Path(__file__).resolve().parent / "hostile-state.json"

RENDER_CHECKS = r"""
const assert = require('assert');
const state = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8'));
assert.strictEqual(esc(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
assert.strictEqual(esc(null), '');
assert.strictEqual(attr('a`b\nc'), 'a&#96;b&#10;c');
for (const ok of ['https://x.y', 'http://x.y', 'mailto:a@b.c', 'notes.md', '/d/x/', '#top'])
  assert.notStrictEqual(safeHref(ok), null, ok);
for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:x', 'java\tscript:x', ' javascript:x', 'data:text/html,x', 'vbscript:x', 'file:///etc/passwd'])
  assert.strictEqual(safeHref(bad), null, bad);
assert.ok(md('[a](https://x.y/?q=1&r=2)').includes('<a href="https://x.y/?q=1&amp;r=2" rel="noopener noreferrer"'));
assert.ok(!md('[a](javascript:alert(1))').includes('<a'));
assert.ok(md('see [**docs**](/d/x/) now').includes('<b>docs</b></a> now'));

const ctx = { hi: new Set(), byId: new Map(state.widgets.map(w => [w.id, w])), open: () => true, btn: () => 'queued' };
let html = state.widgets.map(w => card(w, ctx)).join('');
html += state.log.map(l => `<div>${esc(l.at)} <b>${esc(l.by)}</b> ${esc(l.msg)}</div>`).join('');
html += `<button data-t="${attr(state.view.tab)}">${esc(state.view.tab)}</button>`;
assert.ok(html.includes('&lt;script&gt;'), 'hostile text should still show, as text');
for (const tag of html.match(/<[^>]*>/g)) {
  const bare = tag.replace(/"[^"]*"/g, '""');
  assert.ok(!/^<\/?(img|script|iframe|object|embed|a)\b/i.test(tag), 'tag from data: ' + tag);
  assert.ok(!/\son\w*\s*=/i.test(bare), 'event handler: ' + tag);
  assert.ok(!/['`]/.test(bare) && (bare.match(/"/g) || []).length % 2 === 0, 'attribute breakout: ' + tag);
}
console.log('ok');
"""


def pure_block():
    html = (ASSETS / "renderer.html").read_text()
    start, end = html.index("// <pure>"), html.index("// </pure>")
    return html[start:end]


class TestWidgets(DashCase):
    def setUp(self):
        super().setUp()
        self.ok("init", "article")
        self.js = self.root / "dashboards" / "article" / "widgets" / "kanban.js"

    def test_new_writes_stub_usable_as_type(self):
        out = self.ok("widget", "new", "kanban")
        self.assertTrue(self.js.is_file())
        self.assertIn("function render(", self.js.read_text())
        self.assertEqual(out["type"], "kanban")
        self.ok("set", "board", "--json", '{"type": "kanban", "cards": [1, 2]}')
        self.assertEqual(self.widget("board")["cards"], [1, 2])
        self.ok("widget", "check", "kanban")

    def test_new_refuses_existing_builtin_and_bad_names(self):
        self.ok("widget", "new", "kanban")
        self.assertEqual(self.run_dash("widget", "new", "kanban")[0], 6)
        self.assertEqual(self.run_dash("widget", "new", "chart")[0], 2)
        for bad in ("../x", "a/b", ".aai", "Kanban", ""):
            self.assertEqual(self.run_dash("widget", "new", bad)[0], 2, bad)
        self.assertEqual(
            sorted(p.name for p in self.js.parent.iterdir()), ["kanban.js"]
        )

    def check(self, src):
        self.js.write_text(src)
        return self.run_dash("widget", "check", "kanban")

    def test_check_rejects_network_import_size_and_missing_render(self):
        ok = "function render(w, api) { return 'x'; }\n"
        self.assertEqual(self.check(ok)[0], 0)
        for bad in (
            ok + "fetch('/x');",
            ok + "new XMLHttpRequest();",
            ok + "import('./x.js');",
            "function draw(w) { return 'x'; }",
            ok + "//" + "x" * 20 * 1024,
        ):
            code, _, err = self.check(bad)
            self.assertEqual(code, 2, bad[:60])
            self.assertTrue(err.strip(), bad[:60])

    @unittest.skipUnless(shutil.which("node"), "node not installed")
    def test_check_catches_syntax_error(self):
        code, _, err = self.check("function render(w, api) { return 'x' ")
        self.assertEqual(code, 2)
        self.assertIn("syntax", err.lower())

    def test_check_missing_type_is_not_found(self):
        self.assertEqual(self.run_dash("widget", "check", "nope")[0], 3)


class TestRenderer(unittest.TestCase):
    def test_hostile_state_is_valid_state(self):
        with tempfile.TemporaryDirectory() as d:
            dash.validate(json.loads(HOSTILE.read_text()), Path(d))

    def test_token_slot_present(self):
        self.assertIn(dash.TOKEN_SLOT, (ASSETS / "renderer.html").read_text())

    @unittest.skipUnless(shutil.which("node"), "node not installed")
    def test_escaping_under_node(self):
        with tempfile.TemporaryDirectory() as d:
            js = Path(d) / "check.js"
            js.write_text(pure_block() + RENDER_CHECKS)
            p = subprocess.run(
                ["node", str(js), str(HOSTILE)],
                capture_output=True,
                text=True,
                timeout=30,
            )
        self.assertEqual((p.returncode, p.stdout.strip()), (0, "ok"), p.stderr)


SENTINEL = "ZQX-private-content"


class TestSkillify(DashCase):
    """dash skillify: structure is kept, content never leaves; init --from starts a blank run."""

    def setUp(self):
        super().setUp()
        self.ok("init", "article")
        self.ok("widget", "new", "kanban")
        S = SENTINEL
        ops = [
            {
                "op": "set",
                "id": "stages",
                "json": {
                    "type": "list",
                    "tab": "pipeline",
                    "label": "Stages",
                    "span": 2,
                    "items": [
                        {"text": "Brief", "status": "done", "started": S},
                        "Draft",
                        {"text": "Publish", "status": "blocked"},
                    ],
                    "actions": [
                        {"id": "advance", "label": "Advance", "say": "advance"}
                    ],
                },
            },
            {
                "op": "set",
                "id": "words",
                "json": {"type": "metric", "tab": "pipeline", "value": S, "delta": S},
            },
            {
                "op": "set",
                "id": "draft-md",
                "json": {"type": "note", "tab": "draft", "md": S},
            },
            {
                "op": "set",
                "id": "findings",
                "json": {
                    "type": "table",
                    "tab": "review",
                    "columns": ["Issue"],
                    "rows": [[S]],
                },
            },
            {
                "op": "set",
                "id": "scores",
                "json": {
                    "type": "chart",
                    "tab": "review",
                    "kind": "bar",
                    "series": [{"label": S, "value": 3}],
                },
            },
            {
                "op": "set",
                "id": "review-1",
                "json": {
                    "type": "note",
                    "tab": "review",
                    "label": "Round 1",
                    "md": "x",
                    "ephemeral": True,
                },
            },
            {
                "op": "set",
                "id": "history",
                "json": {
                    "type": "group",
                    "tab": "review",
                    "children": ["review-1"],
                    "collapsed": True,
                },
            },
            {
                "op": "set",
                "id": "board",
                "json": {
                    "type": "kanban",
                    "tab": "leads",
                    "label": "Leads",
                    "columns": {S: [S]},
                },
            },
            {
                "op": "set",
                "id": "client",
                "json": {
                    "type": "note",
                    "tab": "brief",
                    "label": "Client SECRET2",
                    "md": "",
                },
            },
            {"op": "view", "tab": "review", "highlight": ["review-1"]},
        ]
        self.ok("apply", "--json", json.dumps(ops))
        self.skill = self.root / ".aai" / "skills" / "article-pipeline"

    def written_text(self):
        return "".join(p.read_text() for p in self.skill.rglob("*") if p.is_file())

    def template(self):
        return json.loads((self.skill / "assets" / "state.template.json").read_text())

    def test_dry_run_lists_kept_strings_and_writes_nothing(self):
        out = self.ok("skillify", "article", "article-pipeline", "--dry-run")
        self.assertFalse((self.root / ".aai").exists())
        self.assertIn("Advance", out["kept"]["stages"])
        self.assertIn(
            "Client SECRET2", out["kept"]["client"]
        )  # the user must see it to blank it
        self.assertNotIn(SENTINEL, json.dumps(out))
        self.assertIn("review-1", out["dropped"])

    def test_writes_skill_with_blank_template(self):
        self.ok("skillify", "article", "article-pipeline")
        for f in [
            "SKILL.md",
            "instructions.md",
            "assets/process.md",
            "assets/widgets/kanban.js",
            "assets/state.template.json",
        ]:
            self.assertTrue((self.skill / f).is_file(), f)
        self.assertNotIn(SENTINEL, self.written_text())
        t = self.template()
        by = {w["id"]: w for w in t["widgets"]}
        self.assertNotIn("review-1", by)  # ephemeral
        self.assertEqual(by["history"]["children"], [])
        self.assertEqual(
            by["stages"]["items"],
            [
                {"text": "Brief", "status": "active"},
                {"text": "Draft", "status": "todo"},
                {"text": "Publish", "status": "todo"},
            ],
        )
        self.assertEqual(by["stages"]["actions"][0]["say"], "advance")
        self.assertEqual((by["stages"]["span"], by["stages"]["tab"]), (2, "pipeline"))
        self.assertEqual(by["findings"]["columns"], ["Issue"])
        self.assertEqual(
            (by["findings"]["rows"], by["scores"]["series"], by["draft-md"]["md"]),
            ([], [], ""),
        )
        self.assertEqual(by["words"]["value"], "")
        self.assertNotIn("delta", by["words"])
        self.assertEqual(
            set(by["board"]), {"id", "type", "tab", "label"}
        )  # custom fields are content
        self.assertEqual((t["log"], t["view"]), ([], {}))
        self.assertIn("name: article-pipeline", (self.skill / "SKILL.md").read_text())
        self.assertIn("chat-n-build", (self.skill / "instructions.md").read_text())

    def test_drop_and_blank(self):
        self.ok(
            "skillify",
            "article",
            "article-pipeline",
            "--drop",
            "board,words",
            "--blank",
            "client.label,title",
        )
        by = {w["id"]: w for w in self.template()["widgets"]}
        self.assertNotIn("board", by)
        self.assertNotIn("words", by)
        self.assertFalse(
            (self.skill / "assets" / "widgets" / "kanban.js").exists()
        )  # no widget uses it
        self.assertEqual(by["client"]["label"], "")
        self.assertNotIn("SECRET2", self.written_text())
        self.assertEqual(self.template()["title"], "")

    def test_bad_drop_or_blank_exits_2(self):
        self.assertEqual(
            self.run_dash("skillify", "article", "p", "--drop", "nope")[0], 2
        )
        self.assertEqual(
            self.run_dash("skillify", "article", "p", "--blank", "stages")[0], 2
        )
        self.assertEqual(
            self.run_dash("skillify", "article", "p", "--blank", "stages.nope")[0], 2
        )
        self.assertEqual(
            self.run_dash("skillify", "article", "p", "--blank", "stages.id")[0], 2
        )
        self.assertFalse((self.root / ".aai").exists())

    def test_refuses_overwrite_without_force(self):
        self.ok("skillify", "article", "article-pipeline")
        (self.skill / "SKILL.md").write_text("edited by the agent")
        self.assertEqual(self.run_dash("skillify", "article", "article-pipeline")[0], 6)
        self.assertEqual((self.skill / "SKILL.md").read_text(), "edited by the agent")
        self.ok("skillify", "article", "article-pipeline", "--force")
        self.assertIn("name: article-pipeline", (self.skill / "SKILL.md").read_text())

    def test_bad_names_rejected(self):
        for bad in ["../x", "a/b", ".aai", "Upper", ""]:
            self.assertEqual(self.run_dash("skillify", "article", "--", bad)[0], 2, bad)
        self.assertEqual(self.run_dash("skillify", "nope", "p")[0], 3)
        self.assertFalse(
            (self.root / ".aai" / "skills").exists()
            and any((self.root / ".aai" / "skills").iterdir())
        )

    def test_init_from_skill_starts_a_blank_run(self):
        self.ok("skillify", "article", "article-pipeline")
        self.ok("init", "run2", "--from", "article-pipeline")
        d = self.root / "dashboards" / "run2"
        s = self.state("run2")
        self.assertEqual(
            [w["id"] for w in s["widgets"]],
            [w["id"] for w in self.template()["widgets"]],
        )
        self.assertTrue((d / "widgets" / "kanban.js").is_file())
        self.assertEqual(
            (d / "process.md").read_text(),
            (self.skill / "assets" / "process.md").read_text(),
        )
        self.assertIn("article-pipeline", s["log"][-1]["msg"])
        self.assertNotIn(SENTINEL, (d / "state.json").read_text())
        self.ok(
            "patch",
            "stages",
            "-d",
            "run2",
            "--path",
            "items.0.status",
            "--value",
            "done",
        )  # a working dashboard

    def test_init_from_missing_skill_exits_3_and_leaves_nothing(self):
        self.assertEqual(self.run_dash("init", "run2", "--from", "nope")[0], 3)
        self.assertEqual(self.run_dash("init", "run3", "--from", "../x")[0], 2)
        self.assertFalse((self.root / "dashboards" / "run2").exists())


if __name__ == "__main__":
    unittest.main()
