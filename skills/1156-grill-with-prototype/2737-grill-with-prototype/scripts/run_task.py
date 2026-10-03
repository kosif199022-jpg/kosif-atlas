#!/usr/bin/env python3
"""Spawn one background task and track it in runtime/state/tasks/<id>.json.

  run_task.py --role <role> --prompt-file <path> [--files a b …] [--wait] [--title …]
  run_task.py --provider <id> --prompt-file <path> …        (bypass role mapping)
  run_task.py --cmd "<shell command>" [--wait] [--title …]  (plain script/agent)

Resolves role → provider via models.py (with harness fallback + notification),
runs the provider's CLI headless on its own subscription (or llm.py for API
providers), streams a log line on start/finish, and writes the task file
progressively. Returns immediately (prints the task id) unless --wait.
"""
import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(APP_ROOT / "bridge"))
sys.path.insert(0, str(APP_ROOT / "scripts"))
import bridge  # noqa: E402
import models  # noqa: E402

TASKS = bridge.TASKS


def task_path(tid):
    return TASKS / f"{tid}.json"


def update(tid, **fields):
    t = bridge.read_json(task_path(tid)) or {"id": tid}
    t.update(fields)
    bridge.write_json(task_path(tid), t)
    return t


INLINE_LIMIT = 200_000  # characters across all attached files


def attach(files):
    """Put attached files' contents in the prompt. A headless CLI may not be allowed to
    read files (and an API provider can't), so paths alone leave the task blind. Files past
    the size budget are listed by path only, and the prompt says so."""
    parts, used, skipped = [], 0, []
    for f in files:
        try:
            text = Path(f).read_text(encoding="utf-8", errors="replace")
        except OSError as e:
            skipped.append(f"{f} (unreadable: {e.strerror})"); continue
        if used + len(text) > INLINE_LIMIT:
            skipped.append(f"{f} (too large to inline)"); continue
        used += len(text)
        parts.append(f"=== {f} ===\n{text}\n=== end {f} ===")
    out = "\n\nAttached files:\n\n" + "\n\n".join(parts) if parts else ""
    if skipped:
        out += "\n\nNot inlined (read them yourself if you can):\n" + "\n".join(f"- {s}" for s in skipped)
    return out


def build_command(provider, prompt_file, files):
    prompt = Path(prompt_file).read_text()
    if files:
        prompt += attach(files)
    if provider["kind"] == "api":
        if files:  # llm.py reads a file; give it the prompt with attachments inlined
            import tempfile
            with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8") as tf:
                tf.write(prompt); prompt_file = tf.name
        return [sys.executable, str(APP_ROOT / "scripts" / "llm.py"), "--provider", provider["id"], "--prompt-file", prompt_file], None
    if provider["kind"] == "cli":
        cmd = [provider["cmd"], *provider.get("headless", [])]
        if provider.get("prompt_via", "arg") == "arg":
            return cmd + [prompt], None
        return cmd, prompt  # via stdin
    raise SystemExit("harness cannot be spawned as a background task; pick a concrete provider")


def _runner(tid, cmd, stdin_text, cwd):
    """Child process: run the command, capture output, update the task file."""
    update(tid, status="running", started=bridge.now_iso(), pid=os.getpid())
    bridge.log(f"task {tid} started", source=f"task:{tid}")
    try:
        r = subprocess.run(cmd, input=stdin_text, capture_output=True, text=True, cwd=cwd, timeout=3600)
        out = (r.stdout or "").strip()
        err = (r.stderr or "").strip()
        if r.returncode == 0:
            update(tid, status="done", finished=bridge.now_iso(), output=out, error=err[-2000:] or None)
            bridge.log(f"task {tid} done", source=f"task:{tid}")
        else:
            update(tid, status="failed", finished=bridge.now_iso(), output=out, error=(err or f"exit {r.returncode}")[-4000:])
            bridge.log(f"task {tid} failed: {(err or '')[:200]}", level="error", source=f"task:{tid}")
    except subprocess.TimeoutExpired:
        update(tid, status="failed", finished=bridge.now_iso(), error="timed out after 3600s")
        bridge.log(f"task {tid} timed out", level="error", source=f"task:{tid}")
    except OSError as e:
        update(tid, status="failed", finished=bridge.now_iso(), error=str(e))
        bridge.log(f"task {tid} could not start: {e}", level="error", source=f"task:{tid}")


def spawn(tid, cmd, stdin_text, cwd):
    """Detach a runner so the skill's tool call returns immediately."""
    payload = json.dumps({"tid": tid, "cmd": cmd, "stdin": stdin_text, "cwd": cwd})
    kw = {"stdin": subprocess.DEVNULL, "stdout": subprocess.DEVNULL, "stderr": subprocess.DEVNULL}
    if os.name == "nt":
        kw["creationflags"] = 0x00000008 | 0x00000200
    else:
        kw["start_new_session"] = True
    subprocess.Popen([sys.executable, __file__, "--_run", payload], **kw)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--role"); ap.add_argument("--provider"); ap.add_argument("--cmd")
    ap.add_argument("--prompt-file"); ap.add_argument("--files", nargs="*", default=[])
    ap.add_argument("--title"); ap.add_argument("--wait", action="store_true")
    ap.add_argument("--cwd", default=os.getcwd())
    ap.add_argument("--_run", help=argparse.SUPPRESS)
    a = ap.parse_args()

    if a._run:
        p = json.loads(a._run)
        _runner(p["tid"], p["cmd"], p["stdin"], p["cwd"])
        return 0

    bridge.ensure_runtime()
    tid = "t_" + bridge.ulid()
    note = None
    if a.cmd:
        cmd, stdin_text, provider_id, role = ["sh", "-c", a.cmd] if os.name != "nt" else ["cmd", "/c", a.cmd], None, "shell", None
    else:
        if not a.prompt_file:
            ap.error("--prompt-file is required unless --cmd is used")
        if a.provider:
            provider = models.by_id(models.load(), a.provider)
            if not provider:
                ap.error(f"unknown provider {a.provider}")
        else:
            provider, note = models.resolve(a.role or "default")
        if provider["kind"] == "harness":
            msg = f"{note + '; ' if note else ''}harness cannot run in the background. Either install/configure the provider for role '{a.role}' or do this work inline."
            print(json.dumps({"error": msg, "note": note}))
            return 2
        cmd, stdin_text = build_command(provider, a.prompt_file, a.files)
        provider_id, role = provider["id"], a.role
        if note:
            bridge.log(note, level="warn")

    update(tid, status="queued", app=bridge.app_name(), role=role, cmd=a.cmd, provider=provider_id, title=a.title,
           prompt_file=a.prompt_file, started=None, finished=None, output=None, error=None)
    spawn(tid, cmd, stdin_text, a.cwd)
    if a.wait:
        while True:
            t = bridge.read_json(task_path(tid))
            if t and t.get("status") in ("done", "failed"):
                print(json.dumps(t, indent=2)); return 0 if t["status"] == "done" else 1
            time.sleep(0.5)
    print(json.dumps({"id": tid, "provider": provider_id, "note": note}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
