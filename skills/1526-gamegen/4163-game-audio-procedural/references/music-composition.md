# Music composition with the sequencer

## Song model

```python
s = Song("stage_1", bpm=150, bars=56, swing=0.1, seed=150, loop_start=4)  # loop=True by default
```

- Grid: 4/4, 16 steps per bar (`beats_per_bar`, `steps_per_beat` are configurable; use 3 beats for waltzes,
  `steps_per_beat=3` for triplet/shuffle feels).
- `swing` delays odd 16th steps by that fraction of a step (0.1 light, 0.2–0.3 heavy shuffle).
- `loop_start` (bar): the bars before it play once (intro), then the engine loops from there. Events past the end wrap
  around in loops, so pickups and echoes may cross the seam.
- Tracks: `s.track(name, Voice(**overrides), level=<stem LUFS>, gain_db, pan, reverb, delay, duck, width)`. `duck` =
  sidechain depth driven by tracks with `sidechain_source=True` (the kick).
- Positions: `bar` may be fractional (`bar + 3/16` = 3 steps later).

## Step notation

One token per step (a 16th by default); `|` is only visual.

```
C5        note, 1 step           C5:3    note, 3 steps        .  .:4   rest
-  -:2    extend previous note
modifiers: ! accent   ? ghost (half velocity)   ~ glide from previous   ^ staccato   * dead/muted
```

Chord-relative tokens (for `groove`, follow the chord map): `1 3 5 7 8 9` degrees (3/5/7 follow the chord quality),
`b7 #4 b3` alterations of the major-scale degree, `x` dead root, `<` / `>` chromatic approach to the next chord root
from below or above, trailing `'` octave up, `,` octave down.

Drum strings: one char per step: `X` accent, `x` normal, `O` medium, `o` ghost, `.` rest.

Always count steps per bar (16 in 4/4). A wrong count silently shifts every later note.

## Writers

| Call                                                                                        | Use                                                                    |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `s.chords(bar, "Dmaj9 \| Bm7 \| Gmaj7 \| A7sus4 A7 \|")`                                    | harmony; chords split a bar evenly or `Name:steps`; slash chords `C/E` |
| `s.notes(track, bar, text, vel, transpose, gate, step_scale)`                               | melodies, counterlines, bass lines in absolute pitch                   |
| `s.groove(track, bar, nbars, text, octave, low)`                                            | chord-following bass/riff patterns that repeat                         |
| `s.comp(track, bar, nbars, rhythm, center, drop_root, spread, strum)`                       | chord stabs (keys, guitar, brass)                                      |
| `s.sustain_chords(track, bar, nbars, center)`                                               | one held voicing per chord (pads, choirs)                              |
| `s.arp(track, bar, nbars, rate, mode, octaves, center, accents, pan_spread)`                | arpeggios: up, down, updown, pingpong, random                          |
| `s.harmonize(track, bar, text, scale_root, degrees=-2, mode)`                               | diatonic parallel harmony (third below), avoids minor-9th rubs         |
| `s.drums(bar, nbars, {track: (pattern, factory)}, vel, humanize)` / `C.beat(..., fill=...)` | drum patterns, last-bar fills                                          |
| `s.hit(track, bar, step, sample, vel)`                                                      | one-off samples (crashes, impacts, risers)                             |
| `s.filter_sweep(track, 'lp'/'hp', [(bar, Hz), ...])`, `s.gain_ramp(track, [(bar, dB)])`     | automation for builds, breakdowns, intros                              |
| `C.crash`, `C.impact`, `C.riser`, `C.snare_roll`, `C.tom_fill`                              | arrangement punctuation (`music/common.py`)                            |

Render with `C.Track(compose, notes, tail, target_lufs, reverb_params)` for loops or `C.Jingle(compose, length, notes)`
for one-shots, and register them in `music/__init__.py`.

## Forms per game context

| Context                            | Length    | Form                                                                           | Notes                                                |
| ---------------------------------- | --------- | ------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Level / stage loop                 | 60–120 s  | intro (2–4, plays once) → A → A2 → B → C (chorus) → bridge → C2 → turnaround   | turnaround leads back to A at `loop_start`           |
| Boss                               | 45–90 s   | short intro hit → relentless A/B alternation, breakdown + build, no long rests | minor, faster, heavier drums, stabs                  |
| Title / menu                       | 40–80 s   | hook-forward, intro that sells the game in 8 bars                              | strongest melody of the game                         |
| Ambient / puzzle / exploration     | 30–90 s   | slow-changing loop, no strong downbeat accents                                 | low density, long reverb, -16 to -18 LUFS            |
| Jingle (clear, 1-up, fail, unlock) | 2–6 s     | 1–3 bars, cadence, ring-out faded                                              | match the key of the surrounding music when possible |
| Intro / cutscene / credits         | as needed | through-composed, `loop=False`                                                 | section changes aligned to story beats               |

Use 8-bar sections and change something audible at every section: drum pattern, bass rhythm, a new layer, register
shift, filter opening, density. Mark them with `s.section(name, bar)`. They go into the manifest and help engine-side
transitions.

## Genre palettes

| Genre                       | BPM     | Swing     | Drums                                    | Bass                                            | Leads and harmony                                                               |
| --------------------------- | ------- | --------- | ---------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| Synth-funk / 90s platformer | 140–160 | 0.08–0.12 | busy hats, ghost snares, claps           | `FunkBass` with octaves, dead notes, approaches | `PulseLead`, `EPiano` comping, `GuitarMute` 16ths, `Brass` stabs; maj7/9 chords |
| Drum and bass / speed       | 165–180 | 0         | kick-snare breaks, ride, rolls           | `ReeseBass` with sub                            | `SuperLead`, `Stab`, `Pad`; minor, dark                                         |
| Driving rock-synth / boss   | 160–180 | 0         | 8th kicks, crash every 4 bars, tom fills | `DriveBass` 8ths                                | `Stab`, `Brass`, `Choir` for epic; minor, chromatic moves                       |
| Chiptune / 8-bit            | 120–180 | 0         | `chip_kit()`, dry                        | `ChipTriangle`                                  | two `ChipPulse` (25 % lead, 12.5 % echo/arp); no reverb, fake echo              |
| Synth-pop / heroic          | 120–135 | 0         | four-on-the-floor or backbeat            | `DeepBass` / `FunkBass`                         | `SuperLead`, `Pad`, `Bell`; I–V–vi–IV family                                    |
| Ambient / exploration       | 60–90   | 0         | none or very soft shaker/rim             | `SubSine` whole notes                           | `Pad` slow attack, `Bell`, slow `Pluck` arps with delay; dorian/lydian          |
| Dark / horror               | 50–80   | 0         | sparse impacts, downlifters              | drones (`SubSine`, `ReeseBass` low cutoff)      | `Choir`, detuned `Pad`, dissonant clusters; minor, tritones                     |

The palette table is a starting map, not a recipe. The toolkit's presets and kit are shared by every game that uses it,
so a soundtrack built only from them shares one "house sound" across projects. Per project:

- At least one custom voice per role family (lead, bass, pad/keys): a `Voice` subclass or a heavy re-parameterisation
  (oscillator mix, filter character, envelope, drive, detune, vibrato) that matches the sonic identity in the audio
  direction.
- A project kit: retune and redesign kick/snare/hats (`C.kit(...)` parameters or new hit functions); set swing, humanize
  and ghost-note habits that suit the genre.
- Re-balance stem levels, sends, ducking and the reverb space for the project; the numbers below are defaults.
- A recurring motif or leitmotif shared by title, stage and jingles, and the home key shared with `STYLE`.
- Do not register the example tracks or reuse their melodies; `build.py` rejects unmodified copies.

New instruments: subclass `Voice` in `instruments.py` and implement `_render(freq, dur, vel, glide_from, art)` returning
mono or stereo samples covering dur + release. Combine `synth` oscillators, envelopes and `fx` filters; keep it
deterministic.

## Harmony by mood (Roman numerals in major unless stated)

- Heroic, bright: I–V–vi–IV, I–IV–V–IV, IV–V–iii–vi, bVI–bVII–I cadence (triumphant).
- Funky, sunny: Imaj9–vi7–IVmaj7–V7sus4 V7, ii7–V7 vamps, dominant 7#9 stabs.
- Melancholic: vi–IV–I–V, i–bVI–bIII–bVII (minor), iv minor borrowed in major.
- Tense, driving (minor): i–bVI–bVII–i, i–iv–V7 (harmonic minor), chromatic bass descents, pedal tones.
- Mysterious: dorian i–IV, lydian I–II, whole-tone or tritone moves, sus2/sus4 without resolution.
- Victory cadence: bVI–bVII–I. Fail cadence: iv–V7–i or a descending line to a low tonic.

Melody craft: build a 1–2 bar motif, repeat it with variation (sequence, inversion, rhythmic displacement), put chord
tones on strong beats, approach notes on weak steps, and give the phrase a peak note once per 4–8 bars. Write leads in
octave 5 (C5–C6 range), basses at octave 1–2 with `low=33` (A1) as a floor, pads centred around MIDI 60–66.

## Stem levels (target integrated LUFS per stem before master normalisation)

Kick -16.5, snare -19, bass -15.5, lead -16, second lead/harmony -22/-23, keys -22, brass -23, pad -25, arp -26, bells
-24, guitar -25, hats -27, clap -25, crash -27. Master: -14 LUFS integrated, -1.5 dBFS ceiling (music); ambient -16 to
-18. Ducking: bass 0.3, pads 0.45, arps/keys 0.15–0.25.

## Iteration loop

1. Write harmony + groove + drums for one section, render with `--only <id>`, check the spectrogram.
2. Add the lead, then the layers that differentiate sections.
3. Check `seam_ratio` (loops), loudness and peak in the build output; open the waveform to see section dynamics.
4. Ask the user to listen. Adjust tempo, melody and density from their feedback, not from guesses about how it sounds.
