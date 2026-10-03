#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "scipy", "soundfile"]
# ///
"""Render the skill's example SFX and music to a scratch directory, to audition the toolkit or study a technique.

    uv run examples/render_examples.py [--out build/audio-examples] [--only <id>] [--write-hashes]

--write-hashes refreshes scripts/example_hashes.json (the copy guard build.py checks); run it whenever an example
or the DSP library changes, from the skill's own directory, never from a game project.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCRIPTS = HERE.parent / "scripts"
sys.path[:0] = [str(SCRIPTS), str(HERE)]

import build  # noqa: E402
import music_ambient  # noqa: E402
import music_chip  # noqa: E402
import music_jingles  # noqa: E402
import music_stage  # noqa: E402
import sfx  # noqa: E402
import sfx_examples  # noqa: E402,F401  (registers the example cues into sfx.REGISTRY)

TRACKS = {
    "example_stage": music_stage.track,
    "example_chip": music_chip.track,
    "example_ambient": music_ambient.track,
    "example_victory": music_jingles.victory,
    "example_fail": music_jingles.fail,
}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, default=Path("build/audio-examples"))
    ap.add_argument("--only", action="append", default=[])
    ap.add_argument("--write-hashes", action="store_true")
    args = ap.parse_args()
    assets = {}
    for name, spec in sfx.REGISTRY.items():
        if not args.only or name in args.only:
            assets.update(build.build_sfx(spec, args.out, None))
    for name, track in TRACKS.items():
        if not args.only or name in args.only:
            assets.update(build.build_music(name, track, args.out, None, False))
    for key, info in sorted(assets.items()):
        print(f"{key:28s} {info['duration_s']:7.2f}s  Mmax {info['lufs_momentary_max']:6.1f} LUFS")
    (args.out / "manifest.json").write_text(json.dumps({"assets": assets, "sample_rate": build.SR}, indent=2) + "\n")
    if args.write_hashes:
        if args.only:
            sys.exit("--write-hashes needs a full render (no --only)")
        hashes = {key: info["render_sha1"] for key, info in sorted(assets.items())}
        build.EXAMPLE_HASHES.write_text(json.dumps(hashes, indent=2) + "\n")
        print(f"wrote {len(hashes)} hashes to {build.EXAMPLE_HASHES}")


if __name__ == "__main__":
    main()
