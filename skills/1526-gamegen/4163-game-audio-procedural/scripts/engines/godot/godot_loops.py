#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# ///
"""Import the generated audio into a Godot 4 project, set loop flags/offsets from the manifest and verify them
headlessly through Godot itself.

    uv run tools/audio/godot_loops.py --project game [--manifest art_source/audio/manifest.json] [--godot <bin>]

Every manifest asset must live inside the Godot project directory. Looping assets ("loop": true) get loop=true
and loop_offset (seconds, from loop_offset_samples) in their <file>.ogg.import; all others get loop=false.
Godot then re-imports and verify_audio.gd prints the loop flag, offset and length of each stream, which must
match the manifest. Godot binary: --godot, $GODOT, `godot` on PATH, or the macOS app bundle.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
MAC_APP = "/Applications/Godot.app/Contents/MacOS/Godot"


def find_godot(arg: str | None) -> str:
    for cand in (arg, os.environ.get("GODOT"), shutil.which("godot"), shutil.which("godot4"), MAC_APP):
        if cand and Path(cand).exists():
            return cand
    raise SystemExit("Godot binary not found: pass --godot or set $GODOT")


def run_godot(godot: str, project: Path, *args: str, attempts: int = 3) -> str:
    out = ""
    for i in range(attempts):
        r = subprocess.run([godot, "--headless", "--path", str(project), *args], capture_output=True, text=True,
                           timeout=600)
        out = r.stdout + r.stderr
        if r.returncode == 0:
            return out
        # Another editor/session importing the same project can make a run fail transiently.
        print(f"godot {' '.join(args[:2])} failed (attempt {i + 1}), retrying...", file=sys.stderr)
        time.sleep(3)
    raise SystemExit(out[-3000:])


def offset_seconds(info: dict, sr: int) -> float:
    """Loop offset in seconds. A quarter sample is added so Godot's seconds->frames conversion lands on the
    intended frame whether it truncates or rounds."""
    off = info.get("loop_offset_samples", 0)
    return round((off + 0.25) / sr, 9) if off else 0.0


def set_flag(project: Path, import_file: Path, loop: bool, offset: float) -> bool:
    text = import_file.read_text()
    new = re.sub(r"^loop=.*$", f"loop={'true' if loop else 'false'}", text, flags=re.M)
    new = re.sub(r"^loop_offset=.*$", f"loop_offset={offset:.9g}" if offset else "loop_offset=0", new, flags=re.M)
    if new == text:
        return False
    import_file.write_text(new)
    # A headless --import does not notice edited import params; deleting the cached .md5 of the imported
    # resource forces a re-import with the new flags.
    for dest in re.findall(r'res://(\.godot/imported/[^"]+)', new):
        (project / (Path(dest).with_suffix("").as_posix() + ".md5")).unlink(missing_ok=True)
    return True


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", type=Path, required=True, help="directory containing project.godot")
    ap.add_argument("--manifest", type=Path, default=Path("art_source/audio/manifest.json"))
    ap.add_argument("--godot", default=None)
    args = ap.parse_args()
    project = args.project.resolve()
    godot = find_godot(args.godot)
    manifest = json.loads(args.manifest.read_text())
    sr = manifest.get("sample_rate", 44100)
    assets = {k: v for k, v in manifest["assets"].items() if v["path"].endswith(".ogg")}

    res = {k: "res://" + Path(v["path"]).resolve().relative_to(project).as_posix() for k, v in assets.items()}
    run_godot(godot, project, "--import")
    changed = 0
    for key, info in assets.items():
        imp = Path(info["path"] + ".import")
        if not imp.exists():
            raise SystemExit(f"missing {imp} after import")
        changed += set_flag(project, imp, bool(info.get("loop")), offset_seconds(info, sr))
    if changed:
        run_godot(godot, project, "--import")
    out = run_godot(godot, project, "--script", str(HERE / "verify_audio.gd"), "--", *res.values())
    seen = {}
    for m in re.finditer(r"AUDIO (\S+) loop=(\w+) offset=([\d.]+) length=([\d.]+)", out):
        seen[m.group(1)] = (m.group(2) == "true", float(m.group(3)), float(m.group(4)))
    bad = []
    for key, info in sorted(assets.items()):
        if res[key] not in seen:
            bad.append(f"{key}: not loaded by Godot")
            continue
        loop, offset, length = seen[res[key]]
        want_len, want_off = info["samples"] / sr, offset_seconds(info, sr)
        ok = loop == bool(info.get("loop")) and abs(length - want_len) < 0.002 and abs(offset - want_off) < 1e-5
        print(f"{'ok ' if ok else 'BAD'} {key:26s} loop={str(loop).lower():5s} offset={offset:8.4f}s "
              f"length={length:8.3f}s (built {want_len:.3f}s)")
        if not ok:
            bad.append(key)
    print(f"{changed} import file(s) updated")
    if bad:
        raise SystemExit("verification failed: " + ", ".join(bad))


if __name__ == "__main__":
    main()
