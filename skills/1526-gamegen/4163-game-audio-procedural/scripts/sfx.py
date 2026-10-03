"""Sound effect definitions for this project. Each function returns a raw mono or stereo array; build.py cleans,
levels and encodes them.

Register a cue with @sfx(id, loudness, loop=False, variants=1, notes=""):
  loudness  target max momentary loudness (LUFS, measured dual-mono as heard in game). Frequent/UI sounds sit
            lower (-16..-19), ordinary gameplay -11..-14, big rare events -9..-10. Peaks are limited afterwards.
  loop      seamless loop (build skips trimming/fades and limits circularly); the recipe must be periodic.
  variants  round-robin set: the function receives variant=0..N-1 and is exported as <id>_1 .. <id>_N.
  notes     one line describing the sound and how the game should trigger it (pitch steps, alternation...).

Design each cue for THIS game from style.STYLE and references/sfx-design.md. Do not paste the skill's example
recipes: build.py rejects renders identical to them.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

import fx  # noqa: F401  (used by recipes)
import synth
from core import SR, mix_into, pan, samples
from style import STYLE  # noqa: F401  (every recipe should read from it)


@dataclass
class SfxSpec:
    name: str
    fn: callable
    loudness: float
    loop: bool
    variants: int
    notes: str


REGISTRY: dict[str, SfxSpec] = {}


def sfx(name: str, loudness: float = -12.0, loop: bool = False, variants: int = 1, notes: str = ""):
    def deco(fn):
        REGISTRY[name] = SfxSpec(name, fn, loudness, loop, variants, notes)
        return fn

    return deco


# ---------------------------------------------------------------- building blocks (generic, not timbres)


def _t(n: int) -> np.ndarray:
    return np.arange(n) / SR


def _env(n: int, attack: float, t60: float) -> np.ndarray:
    """Exponential decay that is forced to exactly zero over the last 4 ms (no truncation clicks)."""
    env = synth.exp_decay(n, t60, attack)
    k = min(n, samples(0.004))
    env[n - k :] *= np.linspace(1.0, 0.0, k)
    return env


def _sweep_noise(dur: float, f0: float, f1: float, q: float = 1.5, seed: int = 0, kind: str = "bp",
                 color: str = "white") -> np.ndarray:
    """Noise through a filter swept exponentially from f0 to f1 (unshaped; multiply by an envelope)."""
    n = samples(dur)
    return fx.sweep(synth.noise(n, seed, color), kind, f0 * (f1 / f0) ** np.linspace(0, 1, n), q)


def _place(total: float, parts: list[tuple[float, np.ndarray, float]]) -> np.ndarray:
    """Stereo canvas with (time, signal, pan) parts; stereo parts ignore pan."""
    buf = np.zeros((samples(total), 2))
    for at, sig, p in parts:
        mix_into(buf, sig if sig.ndim == 2 else pan(sig, p), samples(at))
    return buf


# ---------------------------------------------------------------- cues
#
# Shape of a recipe (delete this comment once the first real cue exists):
#
# @sfx("pickup", -15, notes="Reward chime on the home key's 5th then octave; alternate pan per pickup.")
# def pickup():
#     n = samples(0.35)
#     a = <source from STYLE.sources>(STYLE.tone(5, 6), n) * _env(n, 0.002, 0.3)
#     b = ...STYLE.tone(8, 6)...
#     body = fx.lowpass(_place(0.4, [(0.0, a, -0.3), (0.05, b, 0.3)]), STYLE.cutoff(6000))
#     return STYLE.finish(body)
