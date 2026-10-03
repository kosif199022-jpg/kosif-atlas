#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "scipy", "soundfile"]
# ///
"""Trailer cue, composed to the edit: not looped, one bar map shared with marketing/trailer/timeline.json.

    uv run marketing/audio/trailer_cue.py        # -> marketing/out/audio/trailer.wav + trailer.json (bar map)
    uv run marketing/audio/trailer_check.py      # verify hits, loudness, gap, tail

Uses the game's vendored procedural audio toolkit (game-audio-procedural) as a library. BPM and bar count come
from timeline.json, so the cue and the edit cannot drift. Rendered at the toolkit's 44.1 kHz, then resampled to
48 kHz; pick a BPM where one bar is a whole number of 60 fps frames and of samples at both rates.
Mastered to about -16 LUFS with peaks under -1 dBFS, leaving room for game SFX before the final -14 LUFS pass.

THIS IS A SKELETON. It renders a working drum bed, pad and hit accents so the pipeline runs end to end. Replace
compose() with a real arrangement following the beat sheet in trailer/concept.md and game-audio-procedural's
music guidance: the game's own sonic identity (style.py), its main theme's hook as the melodic identity, the
boss music's palette for the boss section. Every edit hit in HITS must exist in the music (crash, impact, stab).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

MKT = Path(__file__).resolve().parents[1]
ROOT = MKT.parent
TOOLKIT = ROOT / "tools" / "audio"  # the game's vendored game-audio-procedural toolkit
sys.path.insert(0, str(TOOLKIT))

import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402
from scipy.signal import resample_poly  # noqa: E402

import drums  # noqa: E402
import instruments as I  # noqa: E402
from core import SR, lufs_integrated, peak_db, samples  # noqa: E402
from mixer import render  # noqa: E402
from music import common as C  # noqa: E402
from sequencer import Song  # noqa: E402

TIMELINE = json.loads((MKT / "trailer" / "timeline.json").read_text())
OUT_DIR = MKT / "out" / "audio"
OUT_SR = 48000
BPM = TIMELINE["bpm"]
BARS = TIMELINE["bars"]
BAR_S = 4 * 60.0 / BPM
TOTAL_S = BARS * BAR_S
TARGET_LUFS = -16.0

# Bar map, 1-based bars as in concept.md and timeline.json. Keep it in sync with the beat sheet.
SECTIONS = {"cold_open": 1, "studio": 3, "drop": 5, "tour": 13, "bosses": 16, "climax": 20}
# Edit hits: (bar, 16th step, label). The cut or caption on that bar lands on this sound.
HITS = [(2, 0, "cold open impact"), (5, 0, "drop"), (7, 0, "accent"), (9, 0, "accent"), (11, 0, "accent"),
        (13, 0, "tour"), (16, 0, "bosses"), (20, 0, "final hit"), (22, 0, "logo slam")]
# Optional hit-stop: a near-silent gap right before the final hit, as (start, end) in 1-based bar positions.
GAP: tuple[float, float] | None = (19.75, 20.0)
TAIL_FADE_BARS = 0.45  # cosine fade at the very end


def b(bar: float) -> float:
    """1-based trailer bar -> 0-based song bar."""
    return bar - 1


# Placeholder drum feel per section (sections not listed use "drive"). Sections start on whole bars.
SECTION_FEEL = {"studio": "half", "bosses": "break"}
PATTERNS = {
    "drive": {"kick": "X.....x.X.....x.", "snare": "....X.......X...", "hat": "xoxoxoxoxoxoxoxo"},
    "half": {"kick": "X.........x.....", "clap": "........x.......", "hat": "..x...x...x...x."},
    "break": {"kick": "X.........X.....", "snare": "..o.X.....o.X.o.", "hat": "xoxoxoxoxoxoxoxo"},
}


def compose() -> Song:
    s = Song("trailer", BPM, BARS, loop=False, seed=11)
    C.drum_tracks(s)
    s.track("pad", I.Pad(), level=-24.0, reverb=0.25, duck=0.4)
    s.track("bass", I.SubSine(), level=-17.0, duck=0.3)
    k = C.kit()

    # Harmony: a placeholder progression over the whole cue. Write the game's own.
    s.chords(0, " | ".join(["Am", "F", "C", "G"] * (BARS // 4 + 1)))
    s.sustain_chords("pad", 0, BARS, center=60, vel=0.55)
    s.groove("bass", 0, BARS, "1:4 1:4 1:4 1:4", octave=1, low=33)

    names = list(SECTIONS)
    bounds = [SECTIONS[n] for n in names] + [BARS + 1]
    for i, name in enumerate(names):
        s.section(name, int(b(bounds[i])))
        nbars = int(bounds[i + 1] - bounds[i])
        if nbars > 0:
            C.beat(s, int(b(bounds[i])), nbars, k, PATTERNS[SECTION_FEEL.get(name, "drive")])
        if i + 1 < len(names) and nbars >= 2:
            C.riser(s, b(bounds[i + 1]), 1, vel=0.7, seed=i)  # lift into the next section

    for bar, step, _label in HITS:
        s.hit("crash", b(bar), step, drums.crash(variant=int(bar) % 4), 0.9)
        s.hit("impact", b(bar), step, drums.impact(decay=1.4, seed=int(bar)), 0.8)
        s.hit("kick", b(bar), step, k["kick"](0), 1.0)
    return s


def finish(x: np.ndarray, song: Song) -> np.ndarray:
    """Trim to the edit length, carve the hit-stop gap, fade the tail."""
    n = samples(TOTAL_S)
    x = x[:n].copy()
    g = np.ones(n)
    if GAP:
        g0, g1 = song.pos(b(GAP[0])), song.pos(b(GAP[1]))
        down, up = samples(0.012), samples(0.002)
        g[g0 : g0 + down] = np.linspace(1.0, 0.003, down)
        g[g0 + down : g1 - up] = 0.003
        g[g1 - up : g1] = np.linspace(0.003, 1.0, up)
    fade_start = n - samples(TAIL_FADE_BARS * BAR_S)
    g[fade_start:] *= np.cos(np.linspace(0.0, np.pi / 2, n - fade_start)) ** 2
    return x * g[:, None]


def main() -> None:
    song = compose()
    x = render(song, tail=0.5, target_lufs=TARGET_LUFS, ceiling_db=-1.6, reverb_params={"room": 0.8, "damp": 0.42})
    x = finish(x, song)
    y = resample_poly(x, 160, 147, axis=0) if SR == 44100 else resample_poly(x, OUT_SR, SR, axis=0)
    pk = peak_db(y)
    if pk > -1.1:  # resampling can lift inter-sample peaks slightly
        y *= 10 ** ((-1.1 - pk) / 20)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    wav = OUT_DIR / "trailer.wav"
    sf.write(str(wav), np.clip(y, -1, 1), OUT_SR, subtype="PCM_24")

    t_bar = lambda bar, step=0.0: round(b(bar) * BAR_S + step * BAR_S / 16, 4)  # noqa: E731
    meta = {
        "file": wav.name,
        "sample_rate": OUT_SR,
        "channels": 2,
        "bpm": BPM,
        "bars": BARS,
        "bar_length_s": BAR_S,
        "total_duration_s": round(len(y) / OUT_SR, 6),
        "looped": False,
        "target_lufs": TARGET_LUFS,
        "sections": [{"name": n, "bar": bar, "start_s": t_bar(bar)} for n, bar in SECTIONS.items()],
        "bar_starts_s": [{"bar": i, "start_s": t_bar(i)} for i in range(1, BARS + 1)],
        "hits": [{"bar": bar, "step": step, "label": label, "time_s": t_bar(bar, step)} for bar, step, label in HITS],
        "hit_stop_gap_s": [t_bar(GAP[0]), t_bar(GAP[1])] if GAP else None,
        "tail_fade_s": [round(TOTAL_S - TAIL_FADE_BARS * BAR_S, 4), TOTAL_S],
        "measured": {"peak_dbfs": round(peak_db(y), 2), "lufs_integrated": round(lufs_integrated(x), 2)},
    }
    (OUT_DIR / "trailer.json").write_text(json.dumps(meta, indent=2) + "\n")
    print(f"wrote {wav} ({meta['total_duration_s']} s, {BPM} BPM x {BARS} bars, peak {meta['measured']['peak_dbfs']}"
          f" dBFS, {meta['measured']['lufs_integrated']} LUFS)")


if __name__ == "__main__":
    main()
