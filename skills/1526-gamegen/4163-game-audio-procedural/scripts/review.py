#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "soundfile"]
# ///
"""Objective self-review of the encoded audio (what the engine will actually play).

    uv run tools/audio/review.py [--manifest art_source/audio/manifest.json] [--only <id>] [--out <dir>] [--no-pics]

For every asset in the manifest it decodes the file and reports duration, sample peak, clipping count, DC
offset, ffmpeg EBU R128 integrated loudness and true peak, decoded length vs. built length, and for looping
assets the seam jump at the loop point relative to typical sample movement. With ffmpeg available it also
writes waveform and spectrogram PNGs to --out, which an agent can open to inspect envelopes, tails, aliasing
and frequency balance. Exits 1 on clipping or length mismatch.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

FFMPEG = shutil.which("ffmpeg")


def ebur128(path: Path) -> tuple[float, float]:
    if not FFMPEG:
        return float("nan"), float("nan")
    r = subprocess.run([FFMPEG, "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True)
    txt = r.stderr[r.stderr.rfind("Summary:"):]
    i = re.search(r"I:\s+(-?[\d.]+|-inf) LUFS", txt)
    tp = re.search(r"Peak:\s+(-?[\d.]+|-inf) dBFS", txt)
    return (float(i.group(1)) if i else float("nan"), float(tp.group(1)) if tp else float("nan"))


def pictures(path: Path, out_dir: Path, stem: str, wide: bool) -> None:
    if not FFMPEG:
        return
    w = 1600 if wide else 800
    subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", str(path), "-filter_complex",
                    f"showwavespic=s={w}x240:split_channels=1:colors=0x4fc3f7|0xffb74d", "-frames:v", "1",
                    str(out_dir / f"{stem}_wave.png")], check=True)
    subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", str(path), "-lavfi",
                    f"showspectrumpic=s={w}x360:legend=1:scale=log:fscale=log:color=intensity", "-frames:v", "1",
                    str(out_dir / f"{stem}_spec.png")], check=True)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", type=Path, default=Path("art_source/audio/manifest.json"))
    ap.add_argument("--only", action="append", default=[], help="sfx, music, or an asset id (repeatable)")
    ap.add_argument("--out", type=Path, default=Path("artifacts/audio-review"))
    ap.add_argument("--no-pics", action="store_true")
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    assets = json.loads(args.manifest.read_text())["assets"]
    rows = []
    for key, meta in sorted(assets.items()):
        kind, name = key.split("/", 1)
        if args.only and not ({kind, name, meta.get("variant_of")} & set(args.only)):
            continue
        path = Path(meta["path"])
        if not path.exists():
            rows.append({"id": key, "missing": True})
            continue
        x, sr = sf.read(str(path), always_2d=True)
        i_lufs, tp = ebur128(path)
        row = {"id": key, "dur": len(x) / sr, "ch": x.shape[1],
               "peak": 20 * np.log10(np.abs(x).max() + 1e-12), "clip": int((np.abs(x) >= 0.999).sum()),
               "dc": float(np.abs(x.mean(axis=0)).max()), "I": i_lufs, "TP": tp,
               "len_match": meta.get("samples") in (None, len(x))}
        if meta.get("loop"):
            seam = np.abs(x[meta.get("loop_offset_samples", 0)] - x[-1]).max()
            p99 = np.percentile(np.abs(np.diff(x, axis=0)).max(axis=1), 99)
            row["seam"] = seam / max(p99, 1e-9)
        rows.append(row)
        if not args.no_pics:
            pictures(path, args.out, f"{kind}_{name}", kind == "music")
    print(f"{'asset':26s} {'dur':>7s} ch {'peak':>6s} {'TP':>6s} {'I':>6s} clip   dc      seam  len")
    for r in rows:
        if r.get("missing"):
            print(f"{r['id']:26s} MISSING FILE")
            continue
        seam = f"{r['seam']:.2f}" if "seam" in r else "  -"
        print(f"{r['id']:26s} {r['dur']:7.2f} {r['ch']:2d} {r['peak']:6.2f} {r['TP']:6.2f} {r['I']:6.1f} {r['clip']:4d} "
              f"{r['dc']:.5f} {seam:>5s}  {'ok' if r['len_match'] else 'MISMATCH'}")
    (args.out / "review.json").write_text(json.dumps(rows, indent=2) + "\n")
    if any(r.get("missing") or r.get("clip") or not r.get("len_match", True) for r in rows):
        sys.exit(1)


if __name__ == "__main__":
    main()
