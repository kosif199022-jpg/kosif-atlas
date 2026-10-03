# Recipe: Claude Code token stats on a dashboard

Optional. Use when the user asks how many tokens the run is using ("put token usage on the
dashboard"). Claude Code only: it reads the session transcript under `~/.claude/projects/`.

Save as `dashboards/<name>/tokens.py` (per-dashboard, not part of the platform):

```python
#!/usr/bin/env python3
"""Sum token usage for a Claude Code session; JSON to stdout.
Usage: dash get stages -d <name> | python3 tokens.py [transcript.jsonl]
Default transcript: the newest .jsonl for the cwd's project. by_stage needs list items with
a `started` UTC ISO timestamp; each call counts toward the latest stage started before it."""
import json, re, sys
from pathlib import Path

KINDS = ("input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens", "output_tokens")

def totals(us):
    t = {k: sum(u.get(k, 0) for u in us) for k in KINDS}
    return t | {"tokens_in": t["input_tokens"] + t["cache_read_input_tokens"] + t["cache_creation_input_tokens"],
                "tokens_out": t["output_tokens"], "calls": len(us)}

path = Path(sys.argv[1]) if len(sys.argv) > 1 else max(
    (Path.home() / ".claude/projects" / re.sub(r"[^A-Za-z0-9]", "-", str(Path.cwd()))).glob("*.jsonl"),
    key=lambda p: p.stat().st_mtime)
calls = {}  # a message is logged once per content block; keep the last record per id
for line in path.open():
    try:
        d = json.loads(line)
    except ValueError:
        continue
    m = d.get("message")
    if isinstance(m, dict) and m.get("usage") and m.get("id"):
        calls[m["id"]] = (d.get("timestamp", ""), m["usage"])
out = totals([u for _, u in calls.values()])
raw = "" if sys.stdin.isatty() else sys.stdin.read()  # no pipe: totals only
items = json.loads(raw).get("items", []) if raw.strip() else []
stages = sorted((i["started"], i["text"]) for i in items if isinstance(i, dict) and i.get("started"))
if stages:
    buckets = {"Setup": []} | {n: [] for _, n in stages}
    for ts, u in calls.values():  # UTC ISO timestamps compare correctly as strings
        buckets[next((n for s, n in reversed(stages) if s <= ts), "Setup")].append(u)
    out["by_stage"] = {n: totals(us) for n, us in buckets.items() if us}
print(json.dumps(out))
```

Show it: `tokens-in` / `tokens-out` metrics and a `tokens-stages` bar chart
(`series: [{label: stage, value: tokens_out}]`) on the pipeline tab, refreshed in one
`dash apply` when a stage finishes. Stamp `started` (UTC ISO) on a stage's list item when it
becomes active, or `by_stage` stays empty. Cache reads dominate `tokens_in`; say so if the
user is surprised by the number.
