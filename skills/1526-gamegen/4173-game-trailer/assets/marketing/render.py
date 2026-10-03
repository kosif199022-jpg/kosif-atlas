#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow"]
# ///
"""Render the game's trailer from real gameplay: scout footage, shots, assembly, vertical cut, GIF, posters, review.

  uv run marketing/render.py scout [names...]            bot playthroughs at low res: state CSV, events, contact sheets
  uv run marketing/render.py highlights [names...]       mine scout CSVs for candidate moments and in-points
  uv run marketing/render.py shots [ids...] [--portrait] [-j 3]   render timeline shots with Godot Movie Maker
  uv run marketing/render.py assemble [--portrait]       cut shots to the bar grid, mix cue + SFX, loudnorm, encode
  uv run marketing/render.py gif | poster
  uv run marketing/render.py review [--portrait]         half-bar contact sheet, cut-to-beat and loudness report
  uv run marketing/render.py probe <shot> [--portrait]   verify that director frames equal Movie Maker frames
  uv run marketing/render.py all                         shots + assemble (16:9, then 9:16) + gif + poster + review

Needs ffmpeg and Godot 4 (GODOT=/path/to/godot overrides the lookup). The game never references marketing/:
Godot runs marketing/godot/director.gd from outside the project, and the frame size comes from a transient
override.cfg in the game folder (gitignore it) that this script writes and removes around each render phase.
The cue comes from `uv run marketing/audio/trailer_cue.py` (out/audio/trailer.wav + trailer.json bar map).
"""

from __future__ import annotations

import argparse
import concurrent.futures as cf
import csv
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from contextlib import contextmanager
from pathlib import Path

# --- project config ------------------------------------------------------------------------------------------

MKT = Path(__file__).resolve().parent
ROOT = MKT.parent
GAME = ROOT / "game"  # folder that contains project.godot
NAME = "game"  # output prefix: out/<NAME>_trailer_16x9.mp4, out/<NAME>_loop.gif ...
EXTRA_ENV: dict[str, str] = {}  # env vars the game reads at startup (profiles, art variants...)
LANDSCAPE = (1920, 1080)
PORTRAIT = (1080, 1920)
SCOUT_SIZE = (960, 540)
PREROLL = 8000  # world units before an {"x": ...} in-point where the bot starts, so it arrives at full speed
SFX_DB = -8.0  # game SFX under the cue (per shot "sfx_db" overrides; cards are silent)
LOUDNESS = "I=-14:TP=-1.5:LRA=11"  # -14 LUFS like social platforms; TP -1.5 leaves room for AAC overshoot (~-1 dBTP after encode)
GIF_WIDTH, GIF_FPS, GIF_FADE, GIF_MAX_MB = 640, 20, 0.4, 15.0
SHOT_TIMEOUT_S = 150  # a stuck bot ends a shot render after this much game time
# Scout runs: name -> bot args. One per level/boss/mode worth mining. Args are the game bot's own.
SCOUT_RUNS: dict[str, list[str]] = {
    "level_1": ["--level=0"],
    # "level_1_boss": ["--level=0", "--boss"],
}


def bot_args(shot: dict) -> list[str]:
    """Map a shot's "start" object to the game bot's command-line args: {"level": 2, "boss": true} becomes
    --level=2 --boss. Shots with an {"x": ...} in-point get --from=<x - PREROLL> unless "start" sets "from"."""
    start = dict(shot.get("start", {}))
    if "x" in shot.get("in", {}) and "from" not in start:
        start["from"] = max(0, shot["in"]["x"] - PREROLL)
    return [f"--{k}" if v is True else f"--{k}={v}" for k, v in start.items() if v is not False]


# --- paths -----------------------------------------------------------------------------------------------------

OUT = MKT / "out"
TIMELINE = MKT / "trailer" / "timeline.json"
DIRECTOR = MKT / "godot" / "director.gd"
CUE = OUT / "audio" / "trailer.wav"
CUE_MAP = OUT / "audio" / "trailer.json"


def find_godot() -> str:
    for c in (os.environ.get("GODOT"), shutil.which("godot"), shutil.which("godot4"),
              "/Applications/Godot.app/Contents/MacOS/Godot"):
        if c and Path(c).exists():
            return c
    sys.exit("Godot not found: set GODOT=/path/to/godot")


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, check=True, **kw)


def load_timeline() -> dict:
    tl = json.loads(TIMELINE.read_text())
    tl.setdefault("fps", 60)
    bar = tl["fps"] * 240 / tl["bpm"]
    if abs(bar - round(bar)) > 1e-9:
        sys.exit(f"{tl['bpm']} BPM is {bar} frames per bar at {tl['fps']} fps: pick a BPM with an integer bar")
    tl["bar_frames"] = round(bar)
    return tl


def frames_of(tl: dict, bars: float) -> int:
    n = bars * tl["bar_frames"]
    if abs(n - round(n)) > 1e-6:
        sys.exit(f"{bars} bars is {n} frames: use fractions that land on whole frames")
    return round(n)


@contextmanager
def window(w: int, h: int, quality: float = 0.95):
    """Movie Maker records at the window size fixed at launch, and a project window override pins it
    (--resolution is ignored then). A transient override.cfg sets the render size and MJPEG quality."""
    cfg = GAME / "override.cfg"
    if cfg.exists():
        sys.exit(f"{cfg} exists: another render is running, or a stale one was left behind (remove it)")
    # Only the window override: the viewport (logical) size stays, so the stretch mode scales the same view.
    cfg.write_text(f"[display]\n\nwindow/size/window_width_override={w}\nwindow/size/window_height_override={h}\n\n"
                   f"[editor]\n\nmovie_writer/mjpeg_quality={quality}\n")
    try:
        yield
    finally:
        cfg.unlink(missing_ok=True)


def godot(movie: Path, user_args: list[str], log: Path) -> None:
    """One Movie Maker run at a fixed 60 fps. The game window opens; focus does not matter."""
    cmd = [find_godot(), "--path", str(GAME), "--write-movie", str(movie), "--fixed-fps", "60",
           "--audio-driver", "Dummy", "-s", str(DIRECTOR), "--", *user_args]
    with open(log, "w") as f:
        subprocess.run(cmd, env=dict(os.environ, **EXTRA_ENV), stdout=f, stderr=subprocess.STDOUT, check=False)
    if not movie.exists():
        sys.exit(f"render failed: {movie.name}, see {log}")


# --- scout -----------------------------------------------------------------------------------------------------


def scout(names: list[str], jobs: int) -> None:
    d = OUT / "scout"
    d.mkdir(parents=True, exist_ok=True)
    runs = {n: a for n, a in SCOUT_RUNS.items() if not names or n in names}
    with window(*SCOUT_SIZE, quality=0.8):
        def one(name: str) -> str:
            args = ["--scout", f"--meta={d / name}.json", f"--max-frames={60 * 600}", *runs[name]]
            godot(d / f"{name}.avi", args, d / f"{name}.log")
            sheet(d / f"{name}.avi", d / f"{name}_sheet.jpg", labels=csv_labels(d / f"{name}.csv"))
            return name
        with cf.ThreadPoolExecutor(jobs) as ex:
            for name in ex.map(one, runs):
                print("scouted", name, "->", d / f"{name}_sheet.jpg")


def csv_labels(path: Path) -> dict[int, str]:
    if not path.exists():
        return {}
    with open(path) as f:
        return {int(r["frame"]): f"x {float(r['progress']):.0f}" for r in csv.DictReader(f)}


def sheet(movie: Path, out: Path, every: int = 30, cols: int = 8, labels: dict[int, str] | None = None,
          at: list[tuple[int, str]] | None = None) -> None:
    """Contact sheet: one frame every `every` frames (or the given (frame, label) list), each labelled.
    Labels are drawn with Pillow because many ffmpeg builds lack drawtext (no freetype)."""
    from PIL import Image, ImageDraw
    picks = at or None
    with tempfile.TemporaryDirectory() as td:
        if picks:
            expr = "+".join(f"eq(n\\,{f})" for f, _ in picks)
        else:
            expr = f"not(mod(n\\,{every}))"
        run(["ffmpeg", "-v", "error", "-y", "-i", str(movie), "-vf", f"select='{expr}',scale=320:-1",
             "-fps_mode", "vfr", "-q:v", "4", f"{td}/%05d.jpg"])
        files = sorted(Path(td).glob("*.jpg"))
        if not files:
            return
        texts = [lbl for _, lbl in picks] if picks else [
            f"f{i * every}" + (f"  {labels[i * every]}" if labels and i * every in labels else "")
            for i in range(len(files))]
        w, h = Image.open(files[0]).size
        im = Image.new("RGB", (cols * w, -(-len(files) // cols) * h))
        draw = ImageDraw.Draw(im)
        for i, (f, text) in enumerate(zip(files, texts)):
            x, y = (i % cols) * w, (i // cols) * h
            im.paste(Image.open(f), (x, y))
            draw.rectangle((x, y, x + 8 + 6 * len(text), y + 16), fill=(0, 0, 0))
            draw.text((x + 3, y + 2), text, fill=(255, 255, 255))
        im.save(out, quality=82)


# --- highlights ------------------------------------------------------------------------------------------------


def highlights(names: list[str], top: int = 6, gap: int = 120) -> None:
    """Candidate moments per scout run: 0/1 columns become segments (longest first), target_hp drops are
    listed in order, other numeric columns give their top peaks at least `gap` frames apart. Each line has the
    frame, time and progress to read the scout sheet and to write an in-point."""
    d = OUT / "scout"
    for path in sorted(d.glob("*.csv")):
        name = path.stem
        if name.endswith("_events") or (names and name not in names):
            continue
        rows = list(csv.DictReader(open(path)))
        if not rows:
            continue
        found: dict[str, list[str]] = {}
        num = lambda r, c: float(r[c]) if r[c] not in ("", "nan") else 0.0  # noqa: E731
        for col in rows[0].keys():
            if col in ("frame", "progress"):
                continue
            vals = [num(r, col) for r in rows]
            if min(vals) == max(vals):
                continue  # constant: nothing to find
            if col == "target_hp":
                found[col] = [f"f{rows[i]['frame']} ({int(rows[i]['frame']) / 60:.1f}s) hp {vals[i - 1]:.0f}->{v:.0f}"
                              f" progress {num(rows[i], 'progress'):.0f}  -> in {{\"hit\": {k + 1}}}"
                              for k, (i, v) in enumerate((i, v) for i, v in enumerate(vals) if i and 0 <= v < vals[i - 1])]
            elif set(vals) <= {0.0, 1.0}:
                segs, start = [], None
                for i, v in enumerate(vals + [0.0]):
                    if v and start is None:
                        start = i
                    elif not v and start is not None:
                        segs.append((i - start, start))
                        start = None
                segs.sort(reverse=True)
                found[col] = [f"f{rows[s]['frame']} ({int(rows[s]['frame']) / 60:.1f}s) for {n} frames,"
                              f" progress {num(rows[s], 'progress'):.0f}" for n, s in segs[:top]]
            else:
                order = sorted(range(len(vals)), key=lambda i: -vals[i])
                picked: list[int] = []
                for i in order:
                    if all(abs(i - j) >= gap for j in picked):
                        picked.append(i)
                    if len(picked) == top:
                        break
                found[col] = [f"f{rows[i]['frame']} ({int(rows[i]['frame']) / 60:.1f}s) {col} {vals[i]:.0f},"
                              f" progress {num(rows[i], 'progress'):.0f}" for i in sorted(picked)]
        ev = d / f"{name}_events.csv"
        if ev.exists():
            found["events"] = [f"f{r['frame']} {r['event']} progress {r['progress']}" for r in csv.DictReader(open(ev))]
        print(f"== {name}")
        for col, items in found.items():
            if items:
                print(f"  {col}:")
                for it in items:
                    print("    " + it)
        (d / f"{name}_highlights.json").write_text(json.dumps(found, indent=2) + "\n")


# --- shots -----------------------------------------------------------------------------------------------------


def render_shots(ids: list[str], portrait: bool, jobs: int) -> None:
    tl = load_timeline()
    fmt = "9x16" if portrait else "16x9"
    d = OUT / "shots" / fmt
    d.mkdir(parents=True, exist_ok=True)
    shots = [s for s in tl["shots"] if not ids or s["id"] in ids]
    if ids and len(shots) != len(set(ids)):
        sys.exit(f"unknown shot ids: {set(ids) - {s['id'] for s in shots}}")
    with window(*(PORTRAIT if portrait else LANDSCAPE)):
        def one(s: dict) -> tuple[str, int]:
            args = [f"--timeline={TIMELINE}", f"--shot={s['id']}", f"--meta={d / s['id']}.json",
                    f"--max-frames={60 * SHOT_TIMEOUT_S}"]
            if s.get("kind", "play") == "play":
                args += bot_args(s)
            if portrait:
                args.append("--portrait")
            (d / f"{s['id']}.json").unlink(missing_ok=True)
            godot(d / f"{s['id']}.avi", args, d / f"{s['id']}.log")
            meta = json.loads((d / f"{s['id']}.json").read_text())
            if meta["in_frame"] < 0:
                sys.exit(f"shot {s['id']}: in-point never triggered, see {d / s['id']}.log")
            if meta["frames"] < meta["in_frame"] + frames_of(tl, s["bars"]) - int(s.get("lead", 0)):
                sys.exit(f"shot {s['id']}: run ended before the out-point (bot quit or timeout)")
            return s["id"], meta["in_frame"]
        with cf.ThreadPoolExecutor(jobs) as ex:
            for sid, inf in ex.map(one, shots):
                print(f"shot {sid} ({fmt}) in_frame={inf}")


# --- assembly --------------------------------------------------------------------------------------------------


def trailer_shots(tl: dict) -> list[dict]:
    return sorted((s for s in tl["shots"] if s.get("trailer", True)), key=lambda s: s["bar"])


def shot_start(d: Path, s: dict) -> int:
    """First movie frame of a shot: its in-point minus its `lead` (verified with `probe`)."""
    meta = json.loads((d / f"{s['id']}.json").read_text())
    return meta["in_frame"] - int(s.get("lead", 0))


def check_cue(tl: dict) -> None:
    if not CUE.exists() or not CUE_MAP.exists():
        sys.exit("missing cue: uv run marketing/audio/trailer_cue.py")
    m = json.loads(CUE_MAP.read_text())
    if m["bpm"] != tl["bpm"] or m["bars"] != tl["bars"]:
        sys.exit(f"cue is {m['bpm']} BPM x {m['bars']} bars, timeline is {tl['bpm']} x {tl['bars']}")


def assemble(portrait: bool) -> Path:
    tl = load_timeline()
    check_cue(tl)
    fmt = "9x16" if portrait else "16x9"
    d = OUT / "shots" / fmt
    inputs, chains, vl, al = [], [], [], []
    expected = 0
    for k, s in enumerate(trailer_shots(tl)):
        if frames_of(tl, s["bar"] - 1) != expected:
            sys.exit(f"gap or overlap before shot {s['id']} (bar {s['bar']}): shots must tile the bar grid")
        start, n = shot_start(d, s), frames_of(tl, s["bars"])
        inputs += ["-i", str(d / f"{s['id']}.avi")]
        chains.append(f"[{k}:v]trim=start_frame={start}:end_frame={start + n},setpts=PTS-STARTPTS,"
                      f"format=yuv420p[v{k}]")
        gain = s.get("sfx_db", SFX_DB if s.get("kind", "play") == "play" else -90)
        chains.append(f"[{k}:a]aresample=48000,atrim=start={start / 60}:end={(start + n) / 60},"
                      f"asetpts=PTS-STARTPTS,volume={gain}dB[a{k}]")
        vl.append(f"[v{k}]")
        al.append(f"[a{k}]")
        expected += n
    if expected != frames_of(tl, tl["bars"]):
        sys.exit(f"shots cover {expected / tl['bar_frames']} bars, timeline has {tl['bars']}")
    m = len(vl)
    chains.append("".join(vl) + f"concat=n={m}:v=1:a=0[vout]")
    chains.append("".join(al) + f"concat=n={m}:v=0:a=1[sfx]")
    chains.append(f"[{m}:a]aresample=48000[music]")
    chains.append("[music][sfx]amix=inputs=2:duration=first:normalize=0[mix]")
    mixed = OUT / f"_mix_{fmt}.mkv"
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-i", str(CUE), "-filter_complex", ";".join(chains),
         "-map", "[vout]", "-map", "[mix]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "8",
         "-c:a", "pcm_s24le", str(mixed)])
    out = OUT / f"{NAME}_trailer_{fmt}.mp4"
    encode(mixed, out)
    mixed.unlink()
    print("wrote", out)
    return out


def loudnorm_filter(src: Path) -> str:
    """Two-pass EBU R128 normalisation (linear mode keeps the mix dynamics)."""
    p = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(src), "-af", f"loudnorm={LOUDNESS}:print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True)
    m = json.loads(re.findall(r"\{[^{}]*\}", p.stderr)[-1])
    return (f"loudnorm={LOUDNESS}:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
            f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}"
            ":linear=true")


def encode(src: Path, out: Path) -> None:
    run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", loudnorm_filter(src) + ",aresample=48000",
         "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-preset", "slow", "-crf", "17",
         "-r", "60", "-g", "60", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart",
         str(out)])


def gif() -> None:
    """Seamless loop from the timeline's gif shot (16:9 render, no captions): the last GIF_FADE seconds
    cross-fade into the first ones, so the seam is soft even when the end and start frames differ."""
    tl = load_timeline()
    s = next(x for x in tl["shots"] if x["id"] == tl["gif"]["shot"])
    d = OUT / "shots" / "16x9"
    start = shot_start(d, s) / 60
    dur = frames_of(tl, s["bars"]) / 60
    out = OUT / f"{NAME}_loop.gif"
    width = tl["gif"].get("width", GIF_WIDTH)
    fps = tl["gif"].get("fps", GIF_FPS)
    f = GIF_FADE
    with tempfile.TemporaryDirectory() as td:
        clip, pal = Path(td) / "clip.mp4", Path(td) / "pal.png"
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{start:.4f}", "-t", f"{dur:.4f}", "-i", str(d / f"{s['id']}.avi"),
             "-filter_complex",
             f"[0:v]fps={fps},scale={width}:-2:flags=lanczos,split[a][b];[a]trim=start={f},setpts=PTS-STARTPTS[main];"
             f"[b]trim=end={f},setpts=PTS-STARTPTS[head];"
             f"[main][head]xfade=transition=fade:duration={f}:offset={dur - 2 * f}[v]",
             "-map", "[v]", "-an", "-c:v", "libx264", "-crf", "12", str(clip)])
        run(["ffmpeg", "-v", "error", "-y", "-i", str(clip), "-vf", "palettegen=stats_mode=diff:max_colors=192", str(pal)])
        run(["ffmpeg", "-v", "error", "-y", "-i", str(clip), "-i", str(pal),
             "-lavfi", "paletteuse=dither=sierra2_4a:diff_mode=rectangle", "-loop", "0", str(out)])
    mb = out.stat().st_size / 1e6
    print("wrote", out, f"{mb:.1f} MB" + ("  OVER BUDGET: lower width/fps/colors or shorten" if mb > GIF_MAX_MB else ""))


def poster() -> None:
    tl = load_timeline()
    t = tl.get("poster_time", tl["bars"] * tl["bar_frames"] / 60 - 1.0)
    for fmt in ("16x9", "9x16"):
        src = OUT / f"{NAME}_trailer_{fmt}.mp4"
        if src.exists():
            out = OUT / f"{NAME}_poster_{fmt}.png"
            run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", str(src), "-frames:v", "1", str(out)])
            print("wrote", out)


# --- review ----------------------------------------------------------------------------------------------------


def probe_video(path: Path) -> dict:
    p = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries",
             "stream=width,height,r_frame_rate,nb_read_packets", "-of", "json", str(path)],
            capture_output=True, text=True)
    return json.loads(p.stdout)["streams"][0]


def review(portrait: bool) -> None:
    """Evidence for the user's final watch: format, frame count, one frame per half-bar, detected cuts vs the
    shot grid, and loudness. Cuts inside a shot (camera snaps, flashes) show as off-grid: judge them on the
    sheet. Shot boundaries without a detected cut are fine when both shots look alike."""
    tl = load_timeline()
    fmt = "9x16" if portrait else "16x9"
    src = OUT / f"{NAME}_trailer_{fmt}.mp4"
    rd = OUT / "review"
    rd.mkdir(parents=True, exist_ok=True)
    lines = []
    v = probe_video(src)
    want = frames_of(tl, tl["bars"])
    lines.append(f"{src.name}: {v['width']}x{v['height']} @ {v['r_frame_rate']}, {v['nb_read_packets']} frames "
                 f"(expected {want})" + ("" if int(v["nb_read_packets"]) == want else "  MISMATCH"))
    half = tl["bar_frames"] // 2
    shots = trailer_shots(tl)
    picks = []
    for f in range(0, want, half):
        sid = next(s["id"] for s in reversed(shots) if frames_of(tl, s["bar"] - 1) <= f)
        picks.append((min(f + 6, want - 1), f"bar {1 + f / tl['bar_frames']:.1f} {sid}"))
    sheet(src, rd / f"half_bars_{fmt}.jpg", cols=8, at=picks)
    p = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(src), "-vf", "select='gt(scene,0.3)',showinfo",
                        "-f", "null", "-"], capture_output=True, text=True)
    cuts = [round(float(t) * 60) for t in re.findall(r"pts_time:([\d.]+)", p.stderr)]
    grid = [frames_of(tl, s["bar"] - 1) for s in shots][1:]
    off = [c for c in cuts if min(abs(c - g) for g in grid) > 1]
    lines.append(f"cuts detected: {len(cuts)}, shot boundaries: {len(grid)}, off-grid cuts (frame): {off or 'none'}")
    missing = [g for g in grid if not any(abs(c - g) <= 1 for c in cuts)]
    lines.append(f"boundaries without a detected cut (similar shots?): {missing or 'none'}")
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(src), "-af", "ebur128=peak=true",
                        "-f", "null", "-"], capture_output=True, text=True)
    tail = p.stderr[p.stderr.rfind("Summary:"):]
    i = float(re.search(r"I:\s+(-?[\d.]+) LUFS", tail).group(1))
    tp = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", tail).group(1))
    lra = float(re.search(r"LRA:\s+(-?[\d.]+) LU", tail).group(1))
    lines.append(f"loudness: {i} LUFS integrated, {tp} dBTP true peak, LRA {lra} LU"
                 + ("" if abs(i + 14) <= 1 and tp <= -0.8 else "  OUT OF TARGET"))
    g = OUT / f"{NAME}_loop.gif"
    if g.exists():
        mb = g.stat().st_size / 1e6
        lines.append(f"gif: {mb:.1f} MB" + ("" if mb <= GIF_MAX_MB else "  OVER BUDGET"))
    report = "\n".join(lines)
    (rd / f"report_{fmt}.txt").write_text(report + "\n")
    print(report)
    print("sheet:", rd / f"half_bars_{fmt}.jpg")


def probe(shot_id: str, portrait: bool) -> None:
    """Frame-contract check: render a shot whose fx start with {"type": "fade_in", "at": 0} (full INK at the
    in-point). The darkest frame near the in-point must be the recorded in_frame."""
    tl = load_timeline()
    d = OUT / "shots" / ("9x16" if portrait else "16x9")
    s = next(x for x in tl["shots"] if x["id"] == shot_id)
    inf = json.loads((d / f"{shot_id}.json").read_text())["in_frame"]
    p = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(d / f"{shot_id}.avi"), "-vf",
                        f"trim=end_frame={inf + 30},signalstats,metadata=print:key=lavfi.signalstats.YAVG",
                        "-f", "null", "-"], capture_output=True, text=True)
    luma = [float(x) for x in re.findall(r"YAVG=([\d.]+)", p.stderr)]
    lo = max(0, inf - 30)
    darkest = min(range(lo, len(luma)), key=lambda i: luma[i])
    print(f"{shot_id}: in_frame {inf}, darkest frame {darkest}; luma around the in-point:")
    for i in range(max(0, inf - 3), min(len(luma), inf + 4)):
        print(f"  frame {i}: {luma[i]:.1f}" + ("  <- in_frame" if i == inf else ""))
    if not any(f.get("type") == "fade_in" and f.get("at", 0) == 0 for f in s.get("fx", [])):
        print("note: this shot has no fade_in at 0, so the darkest frame is not meaningful")
    print("OK" if darkest == inf else "MISMATCH: adjust shot_start() by the difference")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cmd", choices=["scout", "highlights", "shots", "assemble", "gif", "poster", "review", "probe",
                                    "all"])
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--portrait", action="store_true")
    ap.add_argument("-j", type=int, default=3, help="parallel Godot renders")
    a = ap.parse_args()
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg not found")
    if a.cmd == "scout":
        scout(a.ids, a.j)
    elif a.cmd == "highlights":
        highlights(a.ids)
    elif a.cmd == "shots":
        render_shots(a.ids, a.portrait, a.j)
    elif a.cmd == "assemble":
        assemble(a.portrait)
    elif a.cmd == "gif":
        gif()
    elif a.cmd == "poster":
        poster()
    elif a.cmd == "review":
        review(a.portrait)
    elif a.cmd == "probe":
        probe(a.ids[0], a.portrait)
    else:
        # Phases run one after the other: parallel renders of one phase share the same override.cfg.
        for portrait in (False, True):
            render_shots([], portrait, a.j)
            assemble(portrait)
        gif()
        poster()
        for portrait in (False, True):
            review(portrait)


if __name__ == "__main__":
    main()
