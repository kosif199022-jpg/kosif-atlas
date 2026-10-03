#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "scipy", "soundfile", "matplotlib"]
# ///
"""Verify the rendered trailer cue against its bar map and write a review PNG.

    uv run marketing/audio/trailer_check.py [--png marketing/out/audio/trailer_cue.png]

Checks: format and duration (bars x bar length), sample peak and 4x-oversampled true peak, BS.1770 integrated
loudness near the cue's target (ffmpeg ebur128 cross-check when available), an onset within +-10 ms of every
listed hit, the hit-stop gap level and the faded tail. Exits non-zero when a check fails. You cannot listen:
these numbers and the PNG are the objective part; the user judges the music.
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
from scipy.signal import butter, resample_poly, sosfilt

MKT = Path(__file__).resolve().parents[1]
OUT = MKT / "out" / "audio"
TOL_MS = 10.0


def onset_near(hf: np.ndarray, sr: int, t: float, search: float = 0.04) -> float:
    """Time of the strongest energy rise within +-search s of t on the >2 kHz band (crash, snare and impact
    transients; the full band is dominated by sub/kick cycles longer than the tolerance). Rise = energy in the
    next 2 ms over the mean energy of the previous 10 ms, at 0.25 ms resolution."""
    hop, nxt, prv = int(sr * 0.00025), int(sr * 0.002), int(sr * 0.010)
    a = max(prv, int((t - search) * sr))
    seg = hf[a - prv : int((t + search) * sr) + nxt] ** 2
    csum = np.concatenate([[0.0], np.cumsum(seg)])
    pos = np.arange(prv, len(seg) - nxt, hop)
    after = (csum[pos + nxt] - csum[pos]) / nxt + 1e-14
    before = (csum[pos] - csum[pos - prv]) / prv + 1e-14
    i = int(np.argmax(np.log10(after / before)))
    return (a - prv + pos[i]) / sr


def rms_db(x: np.ndarray) -> float:
    return 10 * np.log10(np.mean(x**2) + 1e-20)


def lufs(x: np.ndarray, sr: int) -> float:
    """BS.1770 integrated loudness (K-weighting, 400 ms blocks, absolute and relative gates)."""
    from scipy.signal import lfilter

    # K-weighting coefficients for 48 kHz (ITU-R BS.1770-4).
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    if sr != 48000:
        x = resample_poly(x, 48000, sr, axis=0)
    y = lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)
    blk, hop = 19200, 4800
    z = np.array([np.mean(y[i : i + blk] ** 2, axis=0).sum() for i in range(0, len(y) - blk + 1, hop)])
    lk = -0.691 + 10 * np.log10(z + 1e-20)
    z = z[lk > -70]
    rel = -0.691 + 10 * np.log10(z.mean() + 1e-20) - 10
    z = z[-0.691 + 10 * np.log10(z + 1e-20) > rel]
    return -0.691 + 10 * np.log10(z.mean() + 1e-20)


def ffmpeg_r128(path: Path) -> dict:
    if not shutil.which("ffmpeg"):
        return {}
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true",
                        "-f", "null", "-"], capture_output=True, text=True)
    tail = r.stderr[r.stderr.rfind("Summary:") :]
    out = {}
    for key, pat in (("I_lufs", r"I:\s+(-?[\d.]+) LUFS"), ("true_peak_dbfs", r"Peak:\s+(-?[\d.]+) dBFS")):
        m = re.search(pat, tail)
        if m:
            out[key] = float(m.group(1))
    return out


def plot(x: np.ndarray, sr: int, meta: dict, png: Path) -> None:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    mono = x.mean(axis=1)
    t = np.arange(len(mono)) / sr
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(22, 9), sharex=True, gridspec_kw={"height_ratios": [1, 1.4]})
    ax1.plot(t[::8], x[::8, 0], lw=0.3, color="#2b6cb0")
    ax1.plot(t[::8], -np.abs(x[::8, 1]), lw=0.3, color="#c53030", alpha=0.6)
    ax1.set_ylim(-1, 1)
    ax2.specgram(mono, NFFT=2048, Fs=sr, noverlap=1536, cmap="magma", vmin=-130, vmax=-20)
    ax2.set_ylim(20, 16000)
    ax2.set_yscale("symlog", linthresh=200)
    for bar in meta["bar_starts_s"]:
        for ax in (ax1, ax2):
            ax.axvline(bar["start_s"], color="#999", lw=0.6, ls=":")
        ax1.text(bar["start_s"] + 0.04, 0.9, str(bar["bar"]), fontsize=8, color="#555")
    for s in meta["sections"]:
        ax1.text(s["start_s"] + 0.04, -0.95, s["name"], fontsize=8, color="#222")
    for h in meta["hits"]:
        for ax in (ax1, ax2):
            ax.axvline(h["time_s"], color="#38a169", lw=1.0, alpha=0.8)
    if meta.get("hit_stop_gap_s"):
        ax1.axvspan(*meta["hit_stop_gap_s"], color="#f6ad55", alpha=0.3)
    ax1.set_xlim(0, meta["total_duration_s"])
    ax1.set_title(f"trailer cue {meta['bpm']} BPM, bar = {meta['bar_length_s']} s; green = edit hits, orange = gap")
    fig.tight_layout()
    png.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(png, dpi=90)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--png", default=str(OUT / "trailer_cue.png"))
    args = ap.parse_args()
    meta = json.loads((OUT / "trailer.json").read_text())
    wav = OUT / meta["file"]
    x, sr = sf.read(str(wav), always_2d=True)
    mono = x.mean(axis=1)
    hf = sosfilt(butter(4, 2000, "hp", fs=sr, output="sos"), mono)
    fails = []

    dur, want = len(x) / sr, meta["bars"] * meta["bar_length_s"]
    print(f"format: {sr} Hz, {x.shape[1]} ch, {dur:.4f} s (edit {want:.4f} s)")
    if sr != 48000 or x.shape[1] != 2 or abs(dur - want) > 1.0 / sr:
        fails.append("format/duration")

    peak = 20 * np.log10(np.abs(x).max())
    tp = 20 * np.log10(np.abs(resample_poly(x, 4, 1, axis=0)).max())
    loud = lufs(x, sr)
    target = meta.get("target_lufs", -16.0)
    print(f"peak: {peak:.2f} dBFS sample, {tp:.2f} dBFS true (4x); loudness {loud:.2f} LUFS (target {target}); "
          f"ffmpeg: {ffmpeg_r128(wav)}")
    if peak > -1.0:
        fails.append("peak")
    if abs(loud - target) > 1.0:
        fails.append("loudness")

    print(f"hits (onset vs expected, tolerance +-{TOL_MS:.0f} ms):")
    for h in meta["hits"]:
        on = onset_near(hf, sr, h["time_s"])
        d = (on - h["time_s"]) * 1000
        ok = abs(d) <= TOL_MS
        print(f"  bar {h['bar']:>5} step {h['step']:>4}  {h['time_s']:7.3f} s  onset {on:7.4f} s  {d:+6.2f} ms  "
              f"{'ok' if ok else 'FAIL'}  {h['label']}")
        if not ok:
            fails.append(f"hit bar {h['bar']}")

    if meta.get("hit_stop_gap_s"):
        g0, g1 = meta["hit_stop_gap_s"]
        gap = rms_db(mono[int((g0 + 0.015) * sr) : int((g1 - 0.003) * sr)])
        print(f"hit-stop gap {g0:.2f}-{g1:.2f} s: {gap:.1f} dBFS RMS")
        if gap > -40:
            fails.append("gap")
    end = 20 * np.log10(np.abs(x[-int(0.01 * sr) :]).max() + 1e-12)
    print(f"tail: last 10 ms peak {end:.1f} dBFS")
    if end > -40:
        fails.append("tail")

    plot(x, sr, meta, Path(args.png))
    print(f"png: {args.png}")
    print("FAILED: " + ", ".join(fails) if fails else "all checks passed")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
