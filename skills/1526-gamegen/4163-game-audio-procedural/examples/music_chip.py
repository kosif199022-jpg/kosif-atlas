"""Example 8-bit loop: 150 BPM, C major, NES-style (two pulses, triangle bass, noise drums). 8 bars, whole-file
loop. The fake echo (the lead repeated 3 steps later, quieter, on a thinner duty) is the classic console trick
for space without reverb. Original material."""

from __future__ import annotations

import instruments as I
from music import common as C
from sequencer import Song

LEAD = """
E5:2 G5:2 C6:2 G5:2 E5:2 G5:2 C6:4 | A5:2 C6:2 E6:4 D6:2 C6:2 A5:4 |
F5:2 A5:2 C6:2 F6:2 E6:2 C6:2 A5:4 | G5:4 B5:4 D6:6 . . |
E6:2 D6:2 C6:2 G5:2 E5:2 G5:2 C6:4 | C6:2 B5:2 A5:2 E5:2 A5:2 C6:2 E6:4 |
F6:4 E6:2 D6:2 D6:4 B5:2 G5:2 | C6:8 G5:4 E5:4 |
"""
DRUMS = {"kick": "X.......X.x.....", "snare": "....X.......X...", "hat": "x.x.x.x.x.x.x.xx"}


def compose() -> Song:
    s = Song("example_chip", 150, 8, seed=8)
    k = C.chip_kit()
    C.drum_tracks(s, {"kick": -18.0, "snare": -20.0, "hat": -27.0}, dry=True)
    s.track("lead", I.ChipPulse(duty=0.25, vib_depth=12.0), level=-16.0)
    s.track("echo", I.ChipPulse(duty=0.125), level=-24.0, pan=0.3)
    s.track("bass", I.ChipTriangle(), level=-16.0)
    s.track("arp", I.ChipPulse(duty=0.5, decay=0.08, sustain=0.2), level=-25.0, pan=-0.3)
    s.chords(0, "C | Am | F | G | C | Am | F G | C |")
    s.notes("lead", 0, LEAD, vel=0.9)
    s.notes("echo", 3 / 16, LEAD, vel=0.6)  # 3 steps late; wraps around the loop end
    s.groove("bass", 0, 8, "1:2 8:2 1:2 8:2 1:2 8:2 5:2 8:2", octave=2, gate=0.8)
    s.arp("arp", 0, 8, rate=1, mode="up", octaves=1, center=72, vel=0.5, gate=0.5)
    C.beat(s, 0, 8, k, DRUMS, humanize=0.0)
    return s


track = C.Track(compose, "Example chiptune loop, C major, whole-file loop.", tail=1.0)
