"""Example ambient loop for menus, puzzles or exploration: 70 BPM, D dorian, no drums. 8 bars, whole-file loop.
Long reverb tails wrap around the loop end (mixer tail wrap-around), so the seam is inaudible. Original material."""

from __future__ import annotations

import instruments as I
from music import common as C
from sequencer import Song

BELL = """
A5:6 F5:2 E5:8 | D5:6 F5:2 A5:8 | C6:8 A5:4 G5:4 | E5:12 . . . . |
A5:6 C6:2 D6:8 | F6:4 E6:4 D6:8 | C6:6 A5:2 G5:4 E5:4 | D5:16 |
"""
BASS = "D2:16 | Bb1:16 | F2:16 | C2:16 | D2:16 | Bb1:16 | F2:16 | C2:16"


def compose() -> Song:
    s = Song("example_ambient", 70, 8, seed=70)
    s.track("pad", I.Pad(attack=0.8, cutoff=1600.0), level=-20.0, reverb=0.4, width=1.5)
    s.track("bell", I.Bell(decay=1.6), level=-21.0, reverb=0.45, delay=0.3, pan=0.15)
    s.track("arp", I.Pluck(decay=0.3, bright=1800.0), level=-27.0, reverb=0.35, delay=0.35, pan=-0.25)
    s.track("sub", I.SubSine(), level=-22.0)
    s.chords(0, "Dm9 | Bbmaj7 | Fmaj7 | C6 | Dm9 | Bbmaj7 | Fmaj7 | C6 |")
    s.sustain_chords("pad", 0, 8, center=60, vel=0.6, legato=1.0)
    s.notes("bell", 0, BELL, vel=0.7)
    s.arp("arp", 0, 8, rate=2, mode="pingpong", octaves=2, center=69, vel=0.45, accents="Xoxo", pan_spread=0.5)
    s.notes("sub", 0, BASS, vel=0.8, gate=0.98)
    return s


track = C.Track(compose, "Example ambient loop, D dorian, no drums, whole-file loop.", tail=8.0, target_lufs=-18.0,
                reverb_params={"room": 0.92, "damp": 0.35})
