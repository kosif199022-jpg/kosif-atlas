"""Example stage loop: 140 BPM, E minor, driving synth-pop action. 20 bars; the 4-bar intro plays once and the
loop restarts at bar 4. Form: intro (4) | A (8) | B (8, lift + harmony) -> back to A. Original material.

EXAMPLE, never shipped as-is. It shows the working order for a new track (palette in compose(), harmony first,
then bass groove, drums, lead, and finally the layers that make each section differ). Write the project's
tracks with their own melodies, harmony, voices and kit; build.py rejects renders identical to this one.
"""

from __future__ import annotations

import instruments as I
from music import common as C
from sequencer import Song

NATURAL_MINOR = [0, 2, 3, 5, 7, 8, 10]

MEL_A = """
E5:2 G5:2 B5:3 A5 G5:2 F#5:2 E5:2 D5:2 | E5:6 . . G5:2 B5:2 C6:2 B5:2 |
A5:3 G5:3 E5:2 C5:4 D5:2 E5:2 | F#5:4 E5:2 F#5:2 A5:4 D#5:4 |
E5:2 G5:2 B5:3 A5 G5:2 B5:2 D6:2 E6:2 | D6:4 C6:2 B5:2 G5:4 E5:4 |
C6:3 B5:3 A5:2 G5:2 A5:2 B5:2 C6:2 | B5:12 . . . . |
"""
CHORDS_A = "Em9 | Cmaj7 | Am7 | B7sus4 B7 | Em9 | Cmaj7 | Am7 | B7sus4 B7 |"

MEL_B = """
G5:4 E5:2 G5:2 B5:4 C6:4 | A5:6 F#5:2 A5:2 D6:2 C6:2 A5:2 |
B5:4 D6:4 F#6:4 E6:2 D6:2 | E6:8 D6:2 B5:2 G5:4 |
C6:4 A5:2 C6:2 E6:4 D6:2 C6:2 | D6:6 C6:2 A5:4 F#5:4 |
G5:3 A5:3 B5:2 C6:3 D6:3 E6:2 | D#6:8 B5:4 F#5:4 |
"""
CHORDS_B = "Cmaj7 | D | Bm7 | Em7 | Am7 | D | Cmaj7 | B7sus4 B7 |"

GROOVE = "1:2 . 8 . 1 5 . 1:2 . b7 8! . 5 <"
DRUMS_INTRO = {"kick": "X.......X.......", "hat": "x.x.x.x.x.x.x.x."}
DRUMS_A = {"kick": "X.......X..x....", "snare": "....X.......X...", "hat": "x.x.x.x.x.x.x.x.", "ohat": "..............x."}
DRUMS_B = {"kick": "X.....x.X..x....", "snare": "....X..o....X..o", "hat": "xoxoxoxoxoxoxoxo", "clap": "....x.......x..."}
FILL = {"kick": "X.......X.......", "snare": "....X.......XoXX", "hat": "x.x.x.x.x.x....."}


def compose() -> Song:
    s = Song("example_stage", 140, 20, swing=0.0, seed=140, loop_start=4)
    k = C.kit(kick_tone=50.0)
    C.drum_tracks(s)
    s.track("bass", I.DeepBass(), level=-15.5, duck=0.3)
    s.track("lead", I.PulseLead(), level=-16.0, reverb=0.15, delay=0.15)
    s.track("harm", I.PulseLead(bright=0.55, vib_depth=10.0), level=-23.0, pan=-0.35, reverb=0.2)
    s.track("keys", I.EPiano(), level=-22.0, reverb=0.12, duck=0.15, pan=0.15)
    s.track("pad", I.Pad(), level=-25.0, reverb=0.25, duck=0.45, width=1.4)
    s.track("arp", I.Pluck(), level=-26.0, reverb=0.18, delay=0.12, duck=0.25)

    intro, a, b = (s.section(n, x) for n, x in [("intro", 0), ("A", 4), ("B", 12)])
    s.chords(intro, "Em9 | Cmaj7 | Am7 | B7sus4 B7 |")
    s.chords(a, CHORDS_A)
    s.chords(b, CHORDS_B)

    # intro: filtered groove that opens up, riser into A
    C.beat(s, intro, 4, k, DRUMS_INTRO, vel=0.9)
    s.groove("bass", intro, 4, GROOVE, octave=1, low=33)
    s.sustain_chords("pad", intro, 4, center=62, vel=0.55)
    s.filter_sweep("bass", "lp", [(0, 300), (intro + 3.9, 6000), (a, 18000)])
    C.riser(s, a, 2, 0.7, seed=1)

    # A: main melody
    C.crash(s, a)
    C.beat(s, a, 8, k, DRUMS_A, fill=FILL)
    s.groove("bass", a, 8, GROOVE, octave=1, low=33)
    s.notes("lead", a, MEL_A, vel=0.85)
    s.comp("keys", a, 8, ". . x . . x . x . . . x . x . .", center=66, vel=0.6, gate=0.7)

    # B: lift with harmony, arpeggio and pad; ends on B7 so the loop back to A resolves
    C.crash(s, b)
    C.beat(s, b, 8, k, DRUMS_B, fill=FILL)
    s.groove("bass", b, 8, GROOVE, octave=1, low=33)
    s.notes("lead", b, MEL_B, vel=0.9)
    s.harmonize("harm", b, MEL_B, "E", -2, vel=0.7, mode=NATURAL_MINOR)
    s.arp("arp", b, 8, rate=1, mode="updown", octaves=2, center=72, vel=0.5, accents="Xxox")
    s.sustain_chords("pad", b, 8, center=62, vel=0.55)
    C.riser(s, b + 8, 1, 0.6, seed=2)
    return s


track = C.Track(compose, "Example stage loop, E minor action; intro plays once, loop restarts at bar 4.",
                reverb_params={"room": 0.75, "damp": 0.45})
