# ponytail: routing eval. Unlike create-skill's run_eval (first tool call only),
# this scans every tool call over a few turns, so ~/.aai-first routing can be measured.
import json
import subprocess
import sys
import pathlib
from concurrent.futures import ThreadPoolExecutor

SKILL = "publish-article"
root = pathlib.Path.cwd()  # needs a .claude/ dir; run from a scratch dir, not the repo
evals = json.load(open(sys.argv[1]))
desc = open(sys.argv[2]).read().split("description: ", 1)[1].split("\n", 1)[0]
cmd_file = root / ".claude/commands" / f"{SKILL}.md"
cmd_file.parent.mkdir(parents=True, exist_ok=True)
cmd_file.write_text(
    f"---\ndescription: |\n  {desc}\n---\n\n# {SKILL}\n\nThis skill handles: {desc}\n"
)


def run(q):
    p = subprocess.run(
        [
            "claude",
            "-p",
            q,
            "--output-format",
            "stream-json",
            "--verbose",
            "--max-turns",
            "10",
            "--allowedTools",
            "Read",
            "Skill",
            "Glob",
            "Grep",
            "--disallowedTools",
            "Bash",
            "Write",
            "Edit",
        ],
        cwd=root,
        capture_output=True,
        text=True,
        timeout=300,
    )
    hit, old, calls = False, False, []
    for line in p.stdout.splitlines():
        try:
            ev = json.loads(line)
        except json.JSONDecodeError:
            continue
        if ev.get("type") != "assistant":
            continue
        for c in ev["message"].get("content", []):
            if c.get("type") != "tool_use":
                continue
            s = json.dumps(c.get("input", {}))
            calls.append(f"{c['name']}:{s[:70]}")
            if SKILL in s and c["name"] in ("Skill", "Read"):
                hit = True
            if "publish-hub" in s:
                old = True
        if ev["message"].get("content") and any(
            "publish-hub" in (c.get("text") or "") for c in ev["message"]["content"]
        ):
            old = True
    return hit, old, calls


with ThreadPoolExecutor(6) as ex:
    res = list(ex.map(lambda e: run(e["query"]), evals))
passed = 0
for e, (hit, old, calls) in zip(evals, res):
    ok = hit == e["should_trigger"]
    passed += ok
    print(
        f"{'PASS' if ok else 'FAIL'} hit={hit} old_pipeline={old} should={e['should_trigger']} | {e['query'][:55]}"
    )
    if not ok:
        print("   ", " -> ".join(calls[:8]))
print(f"{passed}/{len(evals)}")
cmd_file.unlink()
