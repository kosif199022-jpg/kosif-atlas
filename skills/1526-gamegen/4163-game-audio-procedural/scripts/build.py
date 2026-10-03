#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "scipy", "soundfile"]
# ///
"""Build every sound effect and music track from source, deterministically.

Usage (from the repository root; paths below are relative to the current directory):

    uv run tools/audio/build.py                          # everything
    uv run tools/audio/build.py --only sfx               # all SFX
    uv run tools/audio/build.py --only music             # all music
    uv run tools/audio/build.py --only jump --only example_stage
    uv run tools/audio/build.py --list
    uv run tools/audio/build.py --split-intro            # also write <id>_intro.ogg + <id>_loop.ogg
    uv run tools/audio/build.py --wav build/audio_wav    # also write float WAV masters

Outputs OGG Vorbis (44.1 kHz) to <out>/sfx/<id>.ogg and <out>/music/<id>.ogg and records loudness, peak,
duration and loop metadata in the manifest. Unchanged renders are not re-encoded (stable files, no churn).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
try:
    GENERATOR = (HERE / "build.py").relative_to(Path.cwd().resolve()).as_posix()
except ValueError:
    GENERATOR = "build.py"
sys.path.insert(0, str(HERE))

import numpy as np  # noqa: E402

import music  # noqa: E402
from core import (SR, fade, limit, lufs_integrated, lufs_momentary_max, normalize_loudness, peak_db,  # noqa: E402
                  remove_dc, trim_silence, write_ogg, write_wav)
from sfx import REGISTRY  # noqa: E402

# ---------------------------------------------------------------- project config (edit per project)
OUT_DIR = Path("game/assets/audio")  # sfx/ and music/ are created inside
MANIFEST = Path("art_source/audio/manifest.json")
ARTIST = "procedural (tools/audio)"
OGG_QUALITY = 0.6  # Vorbis quality 0..1; 0.6 is transparent for synth material at small sizes
SFX_CEILING_DB = -1.5  # sample ceiling; leaves room for Vorbis overshoot so decoded true peak stays near -1 dBTP
# ----------------------------------------------------------------

# Render hashes of the skill's example cues. A project asset with the same hash is an unmodified copy of an
# example, which would make this game sound like every other game built with the toolkit. Best-effort: hashes
# can differ across numpy/scipy builds, so a miss proves nothing.
EXAMPLE_HASHES = HERE / "example_hashes.json"


def _stats(x: np.ndarray) -> dict:
    return {
        "duration_s": round(len(x) / SR, 3),
        "samples": len(x),
        "channels": 1 if x.ndim == 1 else 2,
        "peak_dbfs": round(peak_db(x), 2),
        "lufs_integrated": round(lufs_integrated(x), 2),
        "lufs_momentary_max": round(lufs_momentary_max(x), 2),
        "dc_offset": float(f"{float(np.mean(x)):.6f}"),
    }


def loop_seam(x: np.ndarray, offset: int = 0) -> dict:
    """Jump at the loop point (last sample -> sample at the loop offset) compared with typical
    sample-to-sample movement (1.0 = indistinguishable; keep it below ~1.5)."""
    st = x if x.ndim == 2 else x[:, None]
    seam = np.abs(st[offset] - st[-1]).max()
    typical = np.percentile(np.abs(np.diff(st, axis=0)).max(axis=1), 99)
    return {"seam_jump": float(f"{seam:.5f}"), "p99_step": float(f"{typical:.5f}"),
            "seam_ratio": round(float(seam / max(typical, 1e-9)), 3)}


_PREVIOUS: dict = {}


def _write(out: Path, key: str, x: np.ndarray, title: str) -> str:
    """Encode unless the rendered audio is bit-identical to the last build (the Ogg container gets a random
    stream serial on every encode, so re-encoding unchanged audio would churn files and engine imports)."""
    digest = hashlib.sha1(np.clip(x, -1, 1).astype(np.float32).tobytes()).hexdigest()
    if not (out.exists() and _PREVIOUS.get(key, {}).get("render_sha1") == digest):
        write_ogg(out, x, quality=OGG_QUALITY, title=title, artist=ARTIST)
    return digest


def _finish_sfx(raw: np.ndarray, loudness: float, loop: bool) -> np.ndarray:
    x = np.asarray(raw, dtype=np.float64)
    if loop:
        x = x - x.mean(axis=0)
    else:
        x = remove_dc(x)
        x = trim_silence(x, peak_db(x) - 60.0, 0.01)
        x = fade(x, 0.0005, min(0.015, len(x) / SR / 4))
    x = normalize_loudness(x, loudness, lufs_momentary_max)
    return limit(x, SFX_CEILING_DB, smooth_ms=1.5, hold_ms=10.0, circular=loop)


def build_sfx(spec, out_dir: Path, wav_dir: Path | None) -> dict[str, dict]:
    name = spec.name
    renders = [(name, spec.fn())] if spec.variants <= 1 else \
        [(f"{name}_{i + 1}", spec.fn(variant=i)) for i in range(spec.variants)]
    infos = {}
    for asset_id, raw in renders:
        x = _finish_sfx(raw, spec.loudness, spec.loop)
        out = out_dir / "sfx" / f"{asset_id}.ogg"
        digest = _write(out, f"sfx/{asset_id}", x, asset_id)
        if wav_dir:
            write_wav(wav_dir / f"sfx_{asset_id}.wav", x)
        info = {"kind": "sfx", "path": out.as_posix(), "loop": spec.loop, "target_lufs_momentary": spec.loudness,
                "notes": spec.notes, **_stats(x), "render_sha1": digest}
        if spec.variants > 1:
            info["variant_of"] = name
        if spec.loop:
            info.update(loop_seam(x))
        infos[f"sfx/{asset_id}"] = info
    return infos


def build_music(name: str, track, out_dir: Path, wav_dir: Path | None, split_intro: bool) -> dict[str, dict]:
    x, meta = track.build()
    if not meta.get("loop"):
        x = trim_silence(x, -70.0, 0.05)
        x = fade(x, 0.0, 0.05)
    out = out_dir / "music" / f"{name}.ogg"
    digest = _write(out, f"music/{name}", x, name)
    if wav_dir:
        write_wav(wav_dir / f"music_{name}.wav", x)
    info = {"kind": "music", "path": out.as_posix(), **meta, **_stats(x), "render_sha1": digest}
    off = meta.get("loop_offset_samples", 0)
    if meta.get("loop"):
        info.update(loop_seam(x, off))
    if split_intro and meta.get("loop") and off:
        # For engines without loop offsets: play <id>_intro once, then schedule <id>_loop sample-accurately.
        info["split"] = {}
        for part, seg in (("intro", x[:off]), ("loop", x[off:])):
            p = out_dir / "music" / f"{name}_{part}.ogg"
            _write(p, f"music/{name}_{part}", seg, f"{name} ({part})")
            info["split"][part] = {"path": p.as_posix(), "samples": len(seg)}
    return {f"music/{name}": info}


def _source(obj) -> str:
    """'<module file>#<function>' of a recipe or compose function, for provenance records."""
    fn = getattr(obj, "compose", obj)
    return f"{fn.__module__.replace('.', '/')}.py#{fn.__name__}"


def update_project_manifest(path: Path, built: dict[str, dict], detail: Path) -> None:
    """Upsert one compact record per built asset into a GameGen-style project manifest ({"assets": [...]}).
    Fields owned by others (review state, task, owner, notes) are preserved; the full measurements stay in the
    audio manifest referenced by `detail`."""
    project = json.loads(path.read_text()) if path.exists() else {"schema_version": 1, "assets": []}
    records = {r.get("id"): r for r in project.setdefault("assets", [])}
    for key, info in built.items():
        out = Path(info["path"])
        record = {
            "id": f"audio/{key}", "kind": "audio", "provider": "local", "tool": GENERATOR,
            "credits": 0, "source": info.get("source"), "detail": detail.as_posix(),
            "files": [{"path": out.as_posix(), "sha256": hashlib.sha256(out.read_bytes()).hexdigest()}],
            "duration_s": info["duration_s"], "channels": info["channels"], "loop": bool(info.get("loop")),
        }
        if info.get("loop_offset_s"):
            record["loop_offset_s"] = info["loop_offset_s"]
        if info.get("variant_of"):
            record["variant_of"] = info["variant_of"]
        existing = records.get(record["id"])
        if existing is None:
            record["review"] = "draft"
            project["assets"].append(record)
            records[record["id"]] = record
        else:
            existing.update(record)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(project, indent=2) + "\n")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", action="append", default=[], help="sfx, music, or an asset id (repeatable)")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--out", type=Path, default=OUT_DIR)
    ap.add_argument("--manifest", type=Path, default=MANIFEST)
    ap.add_argument("--wav", type=Path, default=None, help="also write float WAV masters to this directory")
    ap.add_argument("--split-intro", action="store_true", help="also export intro/loop halves of looping music")
    ap.add_argument("--project-manifest", type=Path, default=None,
                    help="also upsert compact per-asset records into this project asset manifest (GameGen paths.manifest)")
    ap.add_argument("--allow-example-copies", action="store_true",
                    help="do not fail when an asset is an unmodified copy of a skill example (throwaway prototypes only)")
    args = ap.parse_args()

    if not REGISTRY and not music.TRACKS:
        sys.exit("nothing registered yet: add cues to sfx.py and tracks to music/__init__.py (see the skill's "
                 "references and examples)")

    if args.list:
        print("sfx:  ", " ".join(REGISTRY))
        print("music:", " ".join(music.TRACKS))
        return

    sel = set(args.only)
    unknown = sel - {"sfx", "music"} - set(REGISTRY) - set(music.TRACKS)
    if unknown:
        sys.exit(f"unknown ids: {', '.join(sorted(unknown))}")
    jobs = [("sfx", n) for n in REGISTRY if not sel or "sfx" in sel or n in sel]
    jobs += [("music", n) for n in music.TRACKS if not sel or "music" in sel or n in sel]

    manifest = json.loads(args.manifest.read_text()) if args.manifest.exists() else {"assets": {}}
    manifest.setdefault("assets", {})
    _PREVIOUS.update(manifest["assets"])
    examples = set(json.loads(EXAMPLE_HASHES.read_text()).values()) if EXAMPLE_HASHES.exists() else set()
    copies = []
    built = {}
    for kind, name in jobs:
        t0 = time.time()
        if kind == "sfx":
            infos = build_sfx(REGISTRY[name], args.out, args.wav)
            source = _source(REGISTRY[name].fn)
        else:
            infos = build_music(name, music.TRACKS[name], args.out, args.wav, args.split_intro)
            source = _source(music.TRACKS[name])
        for key, info in infos.items():
            info["source"] = source
            if info["render_sha1"] in examples:
                copies.append(key)
            manifest["assets"][key] = info
            built[key] = info
            extra = f" seam={info['seam_ratio']}" if "seam_ratio" in info else ""
            print(f"{key:24s} {info['duration_s']:7.2f}s  peak {info['peak_dbfs']:6.2f} dBFS  "
                  f"I {info['lufs_integrated']:6.1f}  Mmax {info['lufs_momentary_max']:6.1f} LUFS{extra}  "
                  f"({time.time() - t0:.1f}s)")
    manifest["generator"] = GENERATOR
    manifest["sample_rate"] = SR
    manifest["assets"] = dict(sorted(manifest["assets"].items()))
    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    args.manifest.write_text(json.dumps(manifest, indent=2) + "\n")
    if args.project_manifest:
        update_project_manifest(args.project_manifest, built, args.manifest)
    if copies:
        msg = (f"{len(copies)} asset(s) are unmodified copies of the skill's examples: {', '.join(copies)}. "
               "Design them from style.STYLE for this game instead.")
        if not args.allow_example_copies:
            sys.exit("ERROR: " + msg)
        print("WARNING: " + msg, file=sys.stderr)


if __name__ == "__main__":
    main()
