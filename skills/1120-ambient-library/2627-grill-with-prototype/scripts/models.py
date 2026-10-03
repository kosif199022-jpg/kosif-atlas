#!/usr/bin/env python3
"""Model provider registry: detect installed agent CLIs (subscription seats),
store API keys for providers that need them, resolve roles to providers, and
push the Models page to the dashboard.

  models.py detect [--push]          probe CLIs, update runtime/models.json, optionally render Models page
  models.py list                     print registry
  models.py set-key <id> <key>       store an API key (file is chmod 600); never echo it
  models.py set-default <id>
  models.py resolve <role>           print the provider id a role maps to (with fallback + reason)
  models.py page                     push the Models page widgets to the dashboard
"""
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(APP_ROOT / "bridge"))
import bridge  # noqa: E402

MODELS = bridge.RT / "models.json"

# Known CLIs that run on their own subscription. `headless` is how to run one prompt
# non-interactively and get text on stdout; the prompt is appended right after it, so a
# flag that takes the prompt as its value (gemini -p) must come last. `agentic` is what
# an unattended run needs to use tools (tools/try_app.py puts it before `headless`).
# Verified against: claude 2.1.284, codex-cli 0.159.0, gemini 0.61.0. Versions drift;
# edit here, and saved registries pick the change up on next load.
KNOWN = [
    {"id": "claude", "kind": "cli", "label": "Claude Code", "cmd": "claude",
     "headless": ["-p", "--output-format", "text"], "prompt_via": "arg", "auth": "subscription",
     "agentic": ["--allowedTools", "Bash,Read,Write,Edit,Glob,Grep", "--permission-mode", "acceptEdits"]},
    {"id": "codex", "kind": "cli", "label": "OpenAI Codex CLI", "cmd": "codex",
     "headless": ["exec", "--skip-git-repo-check"], "prompt_via": "arg", "auth": "subscription",
     # --full-auto was removed; unattended exec = write inside cwd, never ask
     "agentic": ["--sandbox", "workspace-write", "-c", "approval_policy=\"never\""]},
    {"id": "gemini", "kind": "cli", "label": "Gemini CLI", "cmd": "gemini",
     "headless": ["-p"], "prompt_via": "arg", "auth": "subscription",
     # without --skip-trust an untrusted folder silently downgrades --yolo to "default"
     "agentic": ["--yolo", "--skip-trust"]},
    {"id": "opencode", "kind": "cli", "label": "OpenCode", "cmd": "opencode",
     "headless": ["run"], "prompt_via": "arg", "auth": "subscription", "agentic": []},  # unverified
    {"id": "kimi", "kind": "api", "label": "Kimi (Moonshot API)", "base_url": "https://api.moonshot.ai/v1",
     "model": "kimi-k2-0711-preview", "auth": "api_key", "key_env": "MOONSHOT_API_KEY"},
    {"id": "openai-api", "kind": "api", "label": "OpenAI API", "base_url": "https://api.openai.com/v1",
     "model": "gpt-4.1", "auth": "api_key", "key_env": "OPENAI_API_KEY"},
    {"id": "anthropic-api", "kind": "api", "label": "Anthropic API", "base_url": "https://api.anthropic.com",
     "model": "claude-sonnet-5-5", "auth": "api_key", "key_env": "ANTHROPIC_API_KEY", "flavor": "anthropic"},
]

HARNESS = {"id": "harness", "kind": "harness", "label": "This conversation's model", "auth": "subscription", "status": "ok"}


def load():
    reg = bridge.read_json(MODELS)
    if not reg:
        reg = {"providers": [dict(HARNESS)] + [dict(k, status="unknown") for k in KNOWN], "default": "harness"}
        save(reg)
        return reg
    # How to invoke a known CLI is code, not user data: refresh it so flag fixes reach
    # registries saved by older versions. Status, keys and anything user-set stay.
    known = {k["id"]: k for k in KNOWN}
    ids = {p.get("id") for p in reg.get("providers", [])}
    for p in reg.get("providers", []):
        k = known.get(p.get("id"))
        if k and k["kind"] == "cli":
            for f in ("cmd", "headless", "prompt_via", "agentic"):
                if f in k:
                    p[f] = k[f]
    for k in KNOWN:
        if k["id"] not in ids:
            reg["providers"].append(dict(k, status="unknown"))
    return reg


def save(reg):
    bridge.write_json(MODELS, reg)
    try:
        os.chmod(MODELS, 0o600)
    except OSError:
        pass


def _ver(cmd):
    try:
        r = subprocess.run([cmd, "--version"], capture_output=True, text=True, timeout=15)
        return (r.stdout or r.stderr).strip().splitlines()[0][:60] if (r.stdout or r.stderr).strip() else ""
    except (OSError, subprocess.TimeoutExpired):
        return ""


def _authed(pid, cmd):
    """Is this CLI logged in? No inference: each CLI's own status command or config.
    Unknown CLIs count as logged in (we can't tell, and a failed run says so)."""
    def ok(args):
        try:
            return subprocess.run([cmd, *args], capture_output=True, text=True, timeout=20, stdin=subprocess.DEVNULL)
        except (OSError, subprocess.TimeoutExpired):
            return None
    if pid == "codex":
        r = ok(["login", "status"])
        return bool(r) and r.returncode == 0
    if pid == "claude":
        r = ok(["auth", "status"])
        if not r or r.returncode != 0:
            return False
        try:
            return bool(json.loads(r.stdout).get("loggedIn"))
        except ValueError:
            return True
    if pid == "gemini":
        if any(os.environ.get(v) for v in ("GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENAI_USE_VERTEXAI", "GOOGLE_GENAI_USE_GCA")):
            return True
        home = Path.home() / ".gemini"
        if (home / "oauth_creds.json").exists():
            return True
        try:
            st = json.loads((home / "settings.json").read_text())
            return bool(st.get("security", {}).get("auth", {}).get("selectedType") or st.get("selectedAuthType"))
        except (OSError, ValueError):
            return False
    return True


def detect(reg):
    for p in reg["providers"]:
        if p["kind"] == "harness":
            p["status"] = "ok"
        elif p["kind"] == "cli":
            path = shutil.which(p["cmd"])
            p["path"] = path
            p["version"] = _ver(p["cmd"]) if path else ""
            p["status"] = ("ok" if _authed(p["id"], p["cmd"]) else "no_auth") if path else "missing"
        elif p["kind"] == "api":
            has = bool(p.get("api_key") or os.environ.get(p.get("key_env", "")))
            p["status"] = "ok" if has else "no_key"
    return reg


def by_id(reg, pid):
    return next((p for p in reg["providers"] if p["id"] == pid), None)


def resolve(role):
    """Role → provider with fallback to harness. Returns (provider, note or None)."""
    reg = load()
    manifest = bridge.read_manifest()
    roles = manifest.get("models", {}).get("roles", {})
    wanted = roles.get(role) or reg.get("default") or "harness"
    p = by_id(reg, wanted)
    if p and p.get("status") == "ok":
        return p, None
    reason = "not configured" if not p else p.get("status", "unavailable")
    return by_id(reg, "harness"), f"role '{role}' wants '{wanted}' ({reason}); falling back to harness"


def page(reg):
    tone = {"ok": "ok", "missing": "warn", "no_key": "warn", "no_auth": "warn", "unknown": "neutral"}
    rows = []
    for p in reg["providers"]:
        how = {"harness": "this seat", "cli": "subscription via CLI", "api": "API key"}[p["kind"]]
        note = (f"installed, not logged in: run `{p.get('cmd')}` once to sign in" if p["status"] == "no_auth" else None) or p.get("version") or ("set a key below" if p["status"] == "no_key" else p.get("path", "") or "")
        star = " (default)" if p["id"] == reg.get("default") else ""
        rows.append([p["label"] + star, how, p["status"], note])
    manifest = bridge.read_manifest()
    roles = manifest.get("models", {}).get("roles", {})
    api_ids = [p["id"] for p in reg["providers"] if p["kind"] == "api"]
    widgets = [
        {"id": "providers", "type": "table", "title": "Available models",
         "columns": ["Provider", "Billing", "Status", "Detail"], "rows": rows},
        {"id": "roles", "type": "kv", "title": "Role assignments",
         "items": [{"k": r, "v": v} for r, v in roles.items()] or [{"k": "default", "v": reg.get("default")}]},
        {"id": "set-default", "type": "form", "title": "Default model",
         "fields": [{"name": "provider", "type": "select", "label": "Use by default",
                     "options": [{"value": p["id"], "label": p["label"]} for p in reg["providers"] if p["status"] == "ok"],
                     "value": reg.get("default")}],
         "submit": "models.set_default", "submit_label": "Set default"},
        {"id": "add-key", "type": "form", "title": "Add an API key",
         "fields": [{"name": "provider", "type": "select", "label": "Provider",
                     "options": [{"value": i, "label": by_id(reg, i)["label"]} for i in api_ids]},
                    {"name": "key", "type": "password", "label": "API key", "placeholder": "sk-…"}],
         "submit": "models.set_key", "submit_label": "Save key"},
        {"id": "redetect", "type": "buttons", "buttons": [{"name": "models.detect", "label": "Re-detect models"}]},
    ]
    bridge.set_path("pages.models", {"title": "Models", "widgets": widgets})
    _ = tone


def main(argv=None):
    a = argv if argv is not None else sys.argv[1:]
    if not a:
        print(__doc__); return 2
    cmd, rest = a[0], a[1:]
    reg = load()
    if cmd == "detect":
        detect(reg); save(reg)
        if "--push" in rest:
            page(reg)
        print(json.dumps({p["id"]: p["status"] for p in reg["providers"]}, indent=2))
    elif cmd == "list":
        safe = json.loads(json.dumps(reg))
        for p in safe["providers"]:
            if p.get("api_key"):
                p["api_key"] = "••••"
        print(json.dumps(safe, indent=2))
    elif cmd == "set-key":
        pid, key = rest[0], rest[1]
        p = by_id(reg, pid)
        if not p or p["kind"] != "api":
            print(json.dumps({"error": f"'{pid}' is not an API provider"})); return 1
        p["api_key"] = key; p["status"] = "ok"; save(reg)
        print(json.dumps({"ok": True, "provider": pid}))
    elif cmd == "set-default":
        pid = rest[0]
        if not by_id(reg, pid):
            print(json.dumps({"error": f"unknown provider '{pid}'"})); return 1
        reg["default"] = pid; save(reg); print(json.dumps({"ok": True, "default": pid}))
    elif cmd == "resolve":
        p, note = resolve(rest[0])
        print(json.dumps({"role": rest[0], "provider": p["id"], "kind": p["kind"], "note": note}))
    elif cmd == "page":
        page(reg); print(json.dumps({"ok": True}))
    else:
        print(__doc__); return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
