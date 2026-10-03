#!/usr/bin/env python3
"""Direct API call for providers of kind=api. Stdlib only (urllib). Used by
run_task.py when a role resolves to an API provider; the skill itself never
calls this for its own reasoning — that runs on the harness seat.

  llm.py --provider <id> --prompt-file <path> [--system <text>] [--max-tokens N]
"""
import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(APP_ROOT / "scripts"))
import models  # noqa: E402


def call(provider, prompt, system=None, max_tokens=4096):
    key = provider.get("api_key") or __import__("os").environ.get(provider.get("key_env", ""), "")
    if not key:
        raise SystemExit(f"no API key for {provider['id']}; run models.py set-key {provider['id']} <key>")
    if provider.get("flavor") == "anthropic":
        url = provider["base_url"].rstrip("/") + "/v1/messages"
        body = {"model": provider["model"], "max_tokens": max_tokens, "messages": [{"role": "user", "content": prompt}]}
        if system:
            body["system"] = system
        headers = {"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"}
        extract = lambda r: "".join(b.get("text", "") for b in r.get("content", []))
    else:  # OpenAI-compatible chat completions
        url = provider["base_url"].rstrip("/") + "/chat/completions"
        msgs = ([{"role": "system", "content": system}] if system else []) + [{"role": "user", "content": prompt}]
        body = {"model": provider["model"], "messages": msgs, "max_tokens": max_tokens}
        headers = {"authorization": f"Bearer {key}", "content-type": "application/json"}
        extract = lambda r: r["choices"][0]["message"]["content"]
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=600) as resp:
            return extract(json.load(resp))
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{provider['id']} HTTP {e.code}: {e.read().decode(errors='replace')[:500]}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--provider", required=True)
    ap.add_argument("--prompt-file", required=True)
    ap.add_argument("--system")
    ap.add_argument("--max-tokens", type=int, default=4096)
    a = ap.parse_args()
    reg = models.load()
    p = models.by_id(reg, a.provider)
    if not p or p["kind"] != "api":
        raise SystemExit(f"'{a.provider}' is not an API provider")
    sys.stdout.write(call(p, Path(a.prompt_file).read_text(), a.system, a.max_tokens))


if __name__ == "__main__":
    main()
