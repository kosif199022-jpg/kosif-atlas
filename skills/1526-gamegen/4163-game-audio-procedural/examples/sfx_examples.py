"""EXAMPLE SFX recipes: study material for the toolkit, never shipped as-is.

They show layering, pitch semantics, variants, alternating pairs and a seamless loop (grind_loop), written for
one particular bright synth-platformer palette with hard-coded pitches. A real project designs its own cues
from style.STYLE; build.py rejects renders identical to these. Audition them with render_examples.py.
"""

from __future__ import annotations

import numpy as np

import drums
import fx
import synth
from core import SR, fit_length, mix_into, note_freq, pan, samples, to_stereo
from sfx import _env, _place, _t, sfx


def _chime(freq: float, dur: float = 0.45, bright: float = 1.5) -> np.ndarray:
    """FM bell partial stack: the workhorse of pickups and rewards."""
    n = samples(dur)
    t = _t(n)
    idx = bright * np.exp(-t / 0.05)
    tone = synth.fm(freq, n, 3.0, idx) + 0.3 * synth.sine(freq * 2.0, n) * np.exp(-t / 0.08)
    tone += 0.12 * synth.sine(freq * 4.01, n) * np.exp(-t / 0.03)
    return tone * _env(n, 0.002, dur)


def _whoosh(dur: float, f0: float, f1: float, q: float = 1.5, seed: int = 0, shape=None) -> np.ndarray:
    """Band-passed noise swept exponentially from f0 to f1 (motion, air, swings)."""
    n = samples(dur)
    x = np.linspace(0, 1, n)
    cutoff = f0 * (f1 / f0) ** x
    out = fx.sweep(synth.noise(n, seed), "bp", cutoff, q)
    env = shape if shape is not None else np.sin(np.pi * np.minimum(x * 1.6, 1.0)) * (1 - x) ** 0.5
    return out * env


def _thump(f0: float = 140.0, f1: float = 50.0, decay: float = 0.25, tau: float = 0.03) -> np.ndarray:
    """Pitch-dropping sine: weight and impact under any hit."""
    n = samples(decay * 1.3)
    return synth.sine(synth.pitch_drop(f0, f1, n, tau), n) * _env(n, 0.001, decay)


# ---------------------------------------------------------------- character movement


@sfx("jump", -13, notes="Rising pulse 'bwip' with a light air whoosh.")
def jump():
    n = samples(0.22)
    f = synth.glide(330, 1000, n, 0.12)
    tone = 0.55 * synth.pulse(f, n, 0.25) + 0.5 * synth.sine(f, n)
    tone = fx.sweep(tone, "lp", np.linspace(2500, 7000, n), 0.8)
    return fx.drive(tone, 6.0) * _env(n, 0.002, 0.24) + 0.25 * _whoosh(0.22, 1500, 5000, 1.2, 1)


@sfx("land", -17, notes="Soft landing thump (frequent, quiet).")
def land():
    n = samples(0.13)
    body = synth.sine(synth.pitch_drop(170, 60, n, 0.02), n) * _env(n, 0.001, 0.12)
    dust = fx.lowpass(synth.noise(n, 17), 1800) * _env(n, 0.001, 0.03) * 0.5
    return body + dust


@sfx("footstep", -19, variants=4, notes="Footstep round-robin; pick a random variant per step, never the same twice.")
def footstep(variant: int = 0):
    r = synth.rng(300 + variant)
    n = samples(0.11)
    tap = fx.bandpass(synth.noise(n, 300 + variant), r.uniform(900, 1600), 1.2) * _env(n, 0.0005, 0.035)
    body = synth.sine(synth.pitch_drop(r.uniform(120, 160), 55, n, 0.015), n) * _env(n, 0.001, 0.06)
    return 0.9 * tap + 0.6 * body


@sfx("dash", -11, notes="Air dash: rising FM shimmer, whoosh panning left to right, sub punch. Stereo.")
def dash():
    n = samples(0.5)
    t = _t(n)
    f = synth.glide(500, 2200, n, 0.13)
    shimmer = synth.fm(f, n, 2.0, 1.5 * np.exp(-t / 0.15)) * _env(n, 0.003, 0.45) * 0.5
    whoosh = _whoosh(0.5, 900, 9000, 1.0, 5)
    sub = synth.sine(synth.pitch_drop(120, 55, n, 0.05), n) * _env(n, 0.001, 0.2) * 0.8
    return pan(shimmer + whoosh, np.linspace(-0.7, 0.7, n)) + to_stereo(sub)


@sfx("charge_up", -13, notes="Rev-up whirr (saw + noise, 28 Hz flutter). Re-trigger with rising pitch_scale per charge step.")
def charge_up():
    n = samples(0.38)
    t = _t(n)
    f = synth.glide(190, 560, n, 0.34)
    tone = fx.sweep(synth.saw(f, n) * 0.6 + synth.square(f * 0.5, n) * 0.3, "lp", f * 6, 1.5)
    nz = fx.sweep(synth.noise(n, 3), "bp", f * 5, 2.0) * 0.6
    am = 0.55 + 0.45 * np.sin(2 * np.pi * 28 * t)
    env = np.minimum(t / 0.006, 1) * np.clip((0.38 - t) / 0.06, 0, 1)
    out = (tone + nz) * am * env
    mix_into(out, drums.rim(2200) * 0.4, 0)
    return out


@sfx("launch", -11, notes="Release of a charge: thump + bright falling whoosh + zoom chirp.")
def launch():
    n = samples(0.55)
    t = _t(n)
    chirp = synth.pulse(synth.glide(1300, 260, n, 0.18), n, 0.3) * _env(n, 0.001, 0.22) * 0.35
    whoosh = _whoosh(0.55, 7000, 1200, 1.0, 4, shape=np.exp(-t / 0.18) * np.minimum(t / 0.004, 1))
    out = chirp + 1.2 * fx.highpass(whoosh, 500)
    mix_into(out, 0.9 * _thump(140, 50, 0.25), 0)
    return out


@sfx("skid", -13, notes="Brake scrape: jittery band noise with a slight squeal.")
def skid():
    n = samples(0.38)
    t = _t(n)
    r = synth.rng(15)
    jitter = fx.one_pole_lp(np.repeat(r.uniform(0.4, 1.0, n // 300 + 1), 300)[:n], 120)
    scrape = (fx.bandpass(synth.noise(n, 15), 2400, 2.0) + 0.6 * fx.bandpass(synth.noise(n, 16), 1100, 2.5)) * jitter
    squeal = synth.sine(synth.glide(1900, 1600, n, 0.3), n) * 0.12
    env = np.minimum(t / 0.01, 1) * np.clip((0.38 - t) / 0.12, 0, 1)
    return (scrape + squeal) * env


@sfx("hurt", -11, notes="Growling FM drop with a short noise hit, slightly crushed.")
def hurt():
    n = samples(0.45)
    t = _t(n)
    f = synth.glide(720, 170, n, 0.3)
    growl = synth.fm(f, n, 0.5, 3.0 * np.exp(-t / 0.3)) * 0.6 + synth.square(f, n) * 0.25
    hit = fx.bandpass(synth.noise(n, 6), 2000, 0.8) * _env(n, 0.001, 0.06)
    return fx.bitcrush((growl * _env(n, 0.002, 0.5) + hit) * 0.8, 10)


@sfx("death", -10, notes="Hit, then a long wobbling pitch fall with 8-bit grit.")
def death():
    n = samples(1.15)
    t = _t(n)
    f = synth.glide(950, 70, n, 0.95) * (1 + 0.035 * np.sin(2 * np.pi * 11 * t))
    fall = synth.pulse(f, n, 0.35) * 0.5 + synth.sine(f, n) * 0.4
    fall = fx.sweep(fall, "lp", np.linspace(6000, 600, n), 0.9) * np.clip((1.15 - t) / 0.3, 0, 1)
    hit = fx.lowpass(synth.noise(n, 7), 4000) * _env(n, 0.001, 0.15)
    hit += synth.sine(synth.pitch_drop(160, 50, n, 0.04), n) * _env(n, 0.001, 0.3)
    return fx.bitcrush(fall * 0.9 + hit * 0.8, 8, 22050)


# ---------------------------------------------------------------- pickups and rewards


@sfx("coin", -15, notes="Bright two-note chime, left then right. Alternate with coin_r on consecutive pickups.")
def coin():
    a = _chime(note_freq("E6"), 0.32, 1.4)
    b = _chime(note_freq("B6"), 0.38, 1.2)
    return _place(0.45, [(0.0, a * 0.8, -0.45), (0.055, b, 0.45)])


@sfx("coin_r", -15, notes="Mirror of coin (right then left).")
def coin_r():
    return coin()[:, ::-1]


@sfx("coin_scatter", -11, notes="Losing collectibles: falling sweep plus a scattered cascade of chimes.")
def coin_scatter():
    r = synth.rng(42)
    pent = ["E6", "F#6", "A6", "B6", "C#7", "E7", "F#7"]
    parts = []
    for i in range(16):
        at = 0.02 + 0.65 * (i / 16) ** 1.4 + r.uniform(0, 0.03)
        f = note_freq(pent[r.integers(len(pent))]) * r.uniform(0.99, 1.01)
        parts.append((at, _chime(f, 0.3, 1.2) * 0.9 * (1 - i / 22), r.uniform(-0.9, 0.9)))
    n = samples(0.4)
    parts.append((0.0, synth.triangle(synth.glide(1400, 300, n, 0.35), n) * _env(n, 0.002, 0.4) * 0.45, 0.0))
    return _place(1.1, parts)


@sfx("powerup", -12, notes="Protective/power shimmer: rising chorused FM swell with a low whoom. Stereo.")
def powerup():
    n = samples(0.85)
    t = _t(n)
    f = synth.glide(300, 900, n, 0.35)
    tone = synth.fm(f, n, 2.01, 1.8) * 0.5 + synth.triangle(f * 1.5, n) * 0.25
    env = np.minimum(t / 0.08, 1) * np.exp(-np.maximum(t - 0.25, 0) / 0.18)
    whoom = synth.sine(synth.glide(60, 120, n, 0.3), n) * np.sin(np.pi * np.minimum(t / 0.6, 1)) * 0.6
    return fx.chorus(tone * env, 1.7, 3.0, 10.0, 0.8) + to_stereo(whoom)


@sfx("key_item", -10, notes="Major collectible: add9 bell arpeggio over a shimmering pad, reverb tail.")
def key_item():
    notes = ["A5", "C#6", "E6", "B6", "A6", "E7"]
    parts = [(i * 0.07, _chime(note_freq(nm), 0.9, 1.1), (-0.6 + 0.24 * i)) for i, nm in enumerate(notes)]
    n = samples(1.4)
    t = _t(n)
    pad = sum(synth.supersaw(note_freq(nm), n, 5, 15, i) for i, nm in enumerate(["A4", "E5", "B5", "C#6"]))
    pad = fx.lowpass(pad, 4000) * np.minimum(t / 0.15, 1) * np.exp(-t / 0.5) * 0.18
    buf = _place(1.9, parts + [(0.0, fx.chorus(pad, 0.7, 3, 12, 0.7), 0)])
    return fx.reverb(buf, room=0.85, damp=0.3, wet=0.45, dry=1.0)


@sfx("checkpoint", -12, notes="Ding-ding bell (B5 then E6) with a soft whoosh.")
def checkpoint():
    def bell(nm):
        m = samples(0.9)
        tt = _t(m)
        f = note_freq(nm)
        return (synth.fm(f, m, 3.5, 2.0 * np.exp(-tt / 0.2) + 0.2) + 0.3 * synth.sine(f * 2, m)) * _env(m, 0.001, 0.8)

    buf = _place(1.05, [(0.0, bell("B5") * 0.8, -0.3), (0.13, bell("E6"), 0.3),
                        (0.0, _whoosh(0.5, 800, 4000, 1.0, 12) * 0.3, 0.0)])
    return fx.reverb(buf, room=0.6, wet=0.2)


@sfx("item_break", -11, notes="Container breaks: crack with glass pings, then a bright two-tone ding.")
def item_break():
    r = synth.rng(11)
    n = samples(0.65)
    parts = [(0.0, fx.highpass(synth.noise(n, 11), 1500) * _env(n, 0.001, 0.08), 0.0)]
    for _ in range(6):
        m = samples(0.12)
        parts.append((r.uniform(0.0, 0.08), synth.sine(r.uniform(3500, 7000), m) * _env(m, 0.0005, 0.1) * 0.3,
                      r.uniform(-0.6, 0.6)))
    for at, nm in ((0.07, "A5"), (0.14, "E6")):
        m = samples(0.45)
        ding = 0.6 * synth.pulse(note_freq(nm), m, 0.25) + 0.6 * synth.sine(note_freq(nm), m)
        parts.append((at, fx.lowpass(ding, 5000) * _env(m, 0.002, 0.4) * 0.6, 0.0))
    return _place(0.65, parts)


# ---------------------------------------------------------------- world and combat


@sfx("spring", -12, notes="Boing: fast rise with a decaying 22 Hz wobble.")
def spring():
    n = samples(0.5)
    t = _t(n)
    f = synth.glide(260, 620, n, 0.05) * (1 + 0.28 * np.exp(-t / 0.12) * np.sin(2 * np.pi * 22 * t))
    tone = 0.6 * synth.triangle(f, n) + 0.35 * synth.sine(f * 2, n) + 0.2 * fx.lowpass(synth.pulse(f, n, 0.2), 3000)
    return tone * _env(n, 0.002, 0.5)


@sfx("boost", -11, notes="Speed boost: rising flanged supersaw zoom plus whoosh. Stereo.")
def boost():
    n = samples(0.6)
    f = synth.glide(180, 1500, n, 0.32)
    zoom = fx.sweep(synth.supersaw(f, n, 5, 25, 3) * 0.6, "lp", np.minimum(f * 5, 12000), 1.2) * _env(n, 0.004, 0.6)
    whoosh = _whoosh(0.6, 600, 8000, 1.2, 8) * 0.8
    return fx.chorus(fx.flanger(zoom + whoosh, 1.5, 2.0, 0.5), 1.1, 2.0, 8.0, 0.5)


@sfx("enemy_defeat", -11, notes="Enemy destroyed: chirp-pop, crunchy noise burst, low thump.")
def enemy_defeat():
    n = samples(0.45)
    pop = synth.square(synth.glide(420, 1300, n, 0.025), n) * _env(n, 0.001, 0.06) * 0.5
    crunch = fx.sweep(synth.noise(n, 9), "lp", np.geomspace(7000, 700, n), 1.2) * _env(n, 0.001, 0.45)
    thump = synth.sine(synth.pitch_drop(120, 45, n, 0.04), n) * _env(n, 0.001, 0.3)
    return fx.bitcrush(fx.drive(pop + crunch * 1.1 + thump * 0.7, 6.0), 9)


@sfx("metal_hit", -10, notes="Armoured/boss hit: metal clang (inharmonic partials) on a punchy thump with a noise smack.")
def metal_hit():
    n = samples(0.8)
    t = _t(n)
    ratios = [1.0, 2.32, 3.95, 5.41, 6.88, 8.7]
    clang = sum(synth.sine(180 * r_, n) * np.exp(-t / (0.35 / (1 + i * 0.4))) / (1 + i * 0.3) for i, r_ in enumerate(ratios))
    smack = fx.bandpass(synth.noise(n, 25), 3000, 0.7) * _env(n, 0.001, 0.07)
    out = clang * 0.5 + smack
    mix_into(out, drums.kick(55, 200, 0.25, 0.5, 8.0) * 0.9, 0)
    return fx.chorus(fx.drive(out, 4.0), 0.9, 1.0, 7, 0.3)


@sfx("energy_charge", -12, notes="Telegraph for a big attack: rising saw/square with accelerating tremolo and a noise riser.")
def energy_charge():
    n = samples(1.2)
    t = _t(n)
    f = synth.glide(110, 1400, n, 1.1)
    tone = fx.sweep(synth.saw(f, n) * 0.5 + synth.square(f * 1.005, n) * 0.3, "lp", np.minimum(f * 4, 14000), 2.0)
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(8 + 34 * (t / 1.2) ** 2) / SR)
    rise = drums.riser(1.2, 400, 9000, 26)[:, 0]
    env = np.minimum(t / 0.1, 1) * (0.4 + 0.6 * t / 1.2) * np.clip((1.2 - t) / 0.03, 0, 1)
    return (tone * trem + rise * 0.5) * env


@sfx("laser", -12, notes="Beam/blaster shot: FM zap falling from 2.4 kHz with a buzzy body.")
def laser():
    n = samples(0.35)
    t = _t(n)
    f = synth.glide(2400, 280, n, 0.26)
    zap = synth.fm(f, n, 0.5, 4.0 * np.exp(-t / 0.12)) * 0.6 + synth.square(f * 0.5, n) * 0.2
    return fx.lowpass(zap, 9000) * _env(n, 0.001, 0.35)


@sfx("electric_zap", -12, notes="Electric arc: 60 Hz buzz, gated crackle bursts and a falling zap.")
def electric_zap():
    n = samples(0.5)
    r = synth.rng(27)
    buzz = fx.highpass(synth.saw(60, n) + synth.square(120, n) * 0.5, 300) * 0.5
    gate = fx.one_pole_lp(np.repeat(r.random(n // 220 + 1) > 0.45, 220)[:n].astype(float), 400)
    arcs = fx.bandpass(synth.noise(n, 27), 4500, 0.9) * gate * 1.2
    zap = synth.sine(synth.glide(3200, 700, n, 0.12), n) * _env(n, 0.001, 0.15) * 0.4
    return fx.drive((buzz * (0.6 + 0.4 * gate) + arcs) * _env(n, 0.002, 0.55) + zap, 6.0)


@sfx("explosion", -9, notes="Big boom: sub drop, decorrelated noise body, crackle, drive. Stereo.")
def explosion():
    n = samples(1.6)
    sub = synth.sine(synth.pitch_drop(95, 32, n, 0.15), n) * _env(n, 0.002, 1.1)
    chans = [fx.sweep(synth.noise(n, 22 + c, "pink"), "lp", np.geomspace(6000, 250, n), 0.8) * _env(n, 0.001, 1.3)
             for c in range(2)]
    st = np.stack(chans, axis=1) * 1.4 + to_stereo(sub)
    r = synth.rng(24)
    for _ in range(25):
        m = samples(0.01)
        crk = fx.highpass(synth.noise(m, int(r.integers(1000))), 1800) * np.exp(-np.arange(m) / 80) * r.uniform(0.2, 0.6)
        mix_into(st, pan(crk, r.uniform(-0.8, 0.8)), int(r.uniform(0.02, 0.7) ** 1.5 * SR))
    return fx.drive(st, 6.0)


@sfx("splash", -12, notes="Water entry: falling noise splash, plunk and scattered bubble chirps. Stereo.")
def splash():
    r = synth.rng(21)
    n = samples(0.6)
    body = fx.sweep(synth.noise(n, 21), "lp", np.geomspace(9000, 500, n), 0.9) * _env(n, 0.002, 0.5)
    plunk = synth.sine(synth.glide(380, 160, n, 0.08), n) * _env(n, 0.001, 0.15) * 0.6
    parts = [(0.0, fx.chorus(body, 1.3, 2.5, 7, 0.8), 0.0), (0.0, plunk, 0.0)]
    for _ in range(12):
        m = samples(0.06)
        f0 = r.uniform(350, 900)
        bub = synth.sine(synth.glide(f0, f0 * 2.2, m, 0.05), m) * _env(m, 0.002, 0.05) * 0.25
        parts.append((r.uniform(0.05, 0.6), bub, r.uniform(-0.7, 0.7)))
    return _place(0.85, parts)


@sfx("collapse", -12, notes="Crumbling ledge/rocks: rumble with accelerating cracks and a final thud. Stereo.")
def collapse():
    n = samples(1.0)
    t = _t(n)
    r = synth.rng(28)
    rumble = fx.lowpass(synth.noise(n, 28, "brown"), 300, order=2) * np.sin(np.pi * np.minimum(t, 1)) * 2.0
    parts = [(0.0, rumble, 0.0)]
    for i in range(18):
        m = samples(0.07)
        crk = fx.bandpass(synth.noise(m, 100 + i), r.uniform(700, 3000), 1.5) * _env(m, 0.0005, 0.06) * r.uniform(0.4, 1.0)
        parts.append((0.75 * (1 - (1 - i / 18) ** 1.6) + r.uniform(0, 0.03), crk, r.uniform(-0.7, 0.7)))
    parts.append((0.72, _thump(110, 40, 0.25, 0.04), 0.0))
    return _place(1.05, parts)


@sfx("grind_loop", -15, loop=True, notes="Seamless 1.2 s loop: resonant metal grind, crackle and rumble. Loop in the engine.")
def grind_loop():
    # Seamless SFX loop recipe: (1) every modulation rate is a whole multiple of the loop rate, (2) filters run
    # over three copies and the middle one is kept, so filter state at the end matches the start, (3) random
    # events wrap around the loop boundary with modulo indexing.
    n = samples(1.2)
    loop_hz = SR / n

    def circ(func, x):
        return func(np.concatenate([x, x, x]))[n : 2 * n]

    nz = synth.noise(n, 18)
    metal = sum(circ(lambda y, f=f: fx.bandpass(y, f, 14), nz) * w for f, w in ((1150, 1.0), (2330, 0.8), (3710, 0.6), (5180, 0.4)))
    t = _t(n)
    wob = 0.75 + 0.25 * np.sin(2 * np.pi * loop_hz * 7 * t) * np.sin(2 * np.pi * loop_hz * 3 * t + 1)
    rumble = circ(lambda y: fx.lowpass(y, 220, order=2), synth.noise(n, 19)) * 2.0
    r = synth.rng(20)
    crack = np.zeros(n)
    for s in r.integers(0, n, 40):
        m = samples(0.008)
        crack[(s + np.arange(m)) % n] += r.uniform(-1, 1, m) * np.exp(-np.arange(m) / 60)
    crack = circ(lambda y: fx.highpass(y, 2500), crack) * 0.6
    return metal * wob * 3.0 + rumble * 0.4 + crack


# ---------------------------------------------------------------- UI


@sfx("ui_move", -18, notes="Tiny cursor blip.")
def ui_move():
    n = samples(0.06)
    f = synth.glide(1500, 1250, n, 0.04)
    return (0.6 * synth.sine(f, n) + 0.25 * synth.pulse(f, n, 0.25)) * _env(n, 0.001, 0.06)


@sfx("ui_select", -15, notes="Confirm: bright rising A5 to E6 blips.")
def ui_select():
    parts = []
    for i, nm in enumerate(("A5", "E6")):
        m = samples(0.16)
        tone = 0.5 * synth.pulse(note_freq(nm), m, 0.25) + 0.5 * synth.sine(note_freq(nm), m)
        parts.append((i * 0.06, fx.lowpass(tone, 6000) * _env(m, 0.001, 0.16), 0.0))
    return _place(0.24, parts)[:, 0]


@sfx("ui_back", -16, notes="Back/cancel: soft falling triangle blips.")
def ui_back():
    parts = []
    for i, nm in enumerate(("B5", "E5")):
        m = samples(0.13)
        parts.append((i * 0.055, synth.triangle(note_freq(nm), m) * _env(m, 0.001, 0.13), 0.0))
    return _place(0.2, parts)[:, 0]


@sfx("ui_pause", -16, notes="Pause: short muted dyad pling (F#5 + C#6) with a gentle low-pass.")
def ui_pause():
    n = samples(0.3)
    t = _t(n)
    tone = sum(synth.fm(note_freq(nm), n, 2.0, 1.2 * np.exp(-t / 0.05)) for nm in ("F#5", "C#6")) * 0.5
    return fx.lowpass(tone, 3500) * _env(n, 0.001, 0.28)


@sfx("ui_error", -15, notes="Denied/invalid: two low buzzy square blips.")
def ui_error():
    parts = []
    for i in range(2):
        m = samples(0.09)
        tone = fx.lowpass(synth.square(note_freq("D#4"), m) + 0.5 * synth.square(note_freq("E4"), m), 2500)
        parts.append((i * 0.11, tone * _env(m, 0.001, 0.12) * 0.5, 0.0))
    return _place(0.22, parts)[:, 0]


# ---------------------------------------------------------------- 8-bit console variants


def _chip_env(n: int, decay: float) -> np.ndarray:
    return np.round(_env(n, 0.001, decay) * 15) / 15


@sfx("chip_jump", -13, notes="8-bit jump: 25% pulse with a quick upward pitch sweep, 4-bit volume steps.")
def chip_jump():
    n = samples(0.2)
    f = synth.glide(280, 880, n, 0.1, curve="lin")
    return synth.pulse(f, n, 0.25) * _chip_env(n, 0.2) * 0.6


@sfx("chip_coin", -15, notes="8-bit coin: B5 then E6 on a 50% pulse.")
def chip_coin():
    n = samples(0.4)
    f = np.where(_t(n) < 0.06, note_freq("B5"), note_freq("E6"))
    return synth.pulse(f, n, 0.5) * _chip_env(n, 0.4) * 0.5


@sfx("chip_hit", -12, notes="8-bit hurt/explosion: low-clocked noise burst with a falling square.")
def chip_hit():
    n = samples(0.35)
    noise = fit_length(drums.chip_noise(0.25, 4000.0), n)
    sq = synth.square(synth.glide(400, 90, n, 0.25), n) * _chip_env(n, 0.25) * 0.4
    return noise * 0.6 + sq
