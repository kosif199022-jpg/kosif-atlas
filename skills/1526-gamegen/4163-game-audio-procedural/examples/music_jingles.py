"""One-shot jingles: victory (~3.5 s, C major fanfare) and fail (~4.5 s, A minor descent). Original material."""

from __future__ import annotations

import instruments as I
from music import common as C
from sequencer import Song


def _victory() -> Song:
    s = Song("victory", 150, 2, loop=False, seed=7)
    k = C.kit()
    C.drum_tracks(s, {"tom": -19.0, "crash": -24.0})
    s.track("lead", I.SuperLead(), level=-15.5, reverb=0.25, width=1.2)
    s.track("brass", I.Brass(), level=-19.0, reverb=0.25)
    s.track("bass", I.FunkBass(), level=-17.0)
    s.chords(0, "C:8 F:8 | G:8 C:8 |")
    s.notes("lead", 0, "C5 E5 G5 C6:3 . G5 C6:2 E6:6 | D6:2 F6:2 E6:2 D6:2 C6:8", vel=0.9)
    s.comp("brass", 0, 2, "X:4 . . . . x:4 . . . .", center=64, vel=0.8, gate=0.9, drop_root=False)
    s.groove("bass", 0, 2, "1:2 . 8 1:2 . 5 . 1:2 . 8 1:2 5", octave=1, low=33)
    C.beat(s, 0, 1, k, {"kick": "X.......X.......", "snare": "....X.......X...", "hat": "x.x.x.x.x.x.x.x."})
    C.tom_fill(s, 1, "....HhMmLlFF....")
    C.crash(s, 0, 0.7)
    C.crash(s, 1, 0.9, step=8)
    return s


def _fail() -> Song:
    s = Song("fail", 90, 2, loop=False, seed=9)
    C.drum_tracks(s, {"tom": -21.0})
    s.track("lead", I.PulseLead(bright=0.6, vib_depth=25.0, vib_rate=4.5), level=-16.0, reverb=0.3)
    s.track("pad", I.Pad(cutoff=1400.0), level=-22.0, reverb=0.35)
    s.track("bass", I.DriveBass(), level=-18.0)
    s.chords(0, "Am:8 F:8 | Dm:4 E7:4 Am:8 |")
    s.notes("lead", 0, "E5:4 D5:4 C5:4 B4:4 | A4:4 G#4:4 A4:8")
    s.sustain_chords("pad", 0, 2, center=57, vel=0.5)
    s.notes("bass", 0, "A1:8 F1:8 | D2:4 E2:4 A1:8", vel=0.8)
    C.tom_fill(s, 1, "........l...f...")
    return s


victory = C.Jingle(_victory, 3.5, "Victory/level-clear fanfare, C major.")
fail = C.Jingle(_fail, 4.5, "Fail/game-over lament, A minor, ends on a low A.")
