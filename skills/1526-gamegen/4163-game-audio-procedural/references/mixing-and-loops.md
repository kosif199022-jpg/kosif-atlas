# Mixing, mastering, loops and verification

## Loudness model

- `core.lufs_integrated` / `lufs_momentary_max` implement ITU-R BS.1770-4 (K-weighting, 400 ms blocks, absolute -70 and
  relative -10 LU gates). Mono is measured as dual mono, which is how it plays in a stereo game.
- SFX are normalised by **max momentary** loudness (how loud the sound feels at its peak), music by **integrated**
  loudness.
- `limit()` is an offline look-ahead limiter (running-minimum gain, two box-filter smoothing passes), so it never
  overshoots the ceiling. `circular=True` treats the signal as a loop.
- Music mastering (`mixer.master`): 28 Hz high-pass, -1.5 dB high shelf at 10 kHz, then up to 4 iterations of normalise
  → limit until within 0.15 LU of target.

Targets: music -14 LUFS integrated (calm -16 to -18), SFX tiers in `sfx-design.md`, sample ceiling -1.5 dBFS so decoded
Vorbis true peak stays around -1 dBTP.

## Seamless music loops (mixer.render)

1. The song is rendered on a timeline of loop length + tail (reverb, delay, release).
2. **Tail wrap-around**: the tail past the loop end is summed onto the loop start, so what rings across the seam is
   heard at the start exactly as in a continuous performance.
3. Sidechain ducking uses circular triggers; master filters and the limiter run circularly over the loop body.
4. **Intro + loop** (`loop_start > 0`): the intro (bars before `loop_start`) and the body are rendered separately. The
   body is circular; the intro is processed linearly with 2 s of the body appended so look-ahead sees what follows, and
   its last 40 ms crossfade into the body's ending (which is continuous with the body start by construction). The file
   plays [0, end) once, then loops [loop_offset, end).
5. Events scheduled past the end (echo tracks, pickups) wrap modulo the song length.

The loop must still make musical sense: the last bar should lead back into the loop-start bar (turnaround, dominant
chord, fill or riser).

## Build output fields (manifest)

`duration_s`, `samples`, `channels`, `peak_dbfs`, `lufs_integrated`, `lufs_momentary_max`, `dc_offset`, `render_sha1`,
and for loops `loop_offset_samples`, `loop_offset_s`, `seam_jump`, `p99_step`, `seam_ratio`, `sections`, `bpm`, `bars`.
Variants carry `variant_of`; `--split-intro` adds `split.intro/loop` paths.

## Verification checklist

| Check                    | Pass                                                                                                                          | Where                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Clipping                 | 0 samples ≥ 0.999 after decode                                                                                                | `review.py` clip column                             |
| True peak                | ≤ -0.5 dBTP (aim ~-1)                                                                                                         | `review.py` TP (ffmpeg)                             |
| Loudness                 | within ±1 LU of target (SFX: Mmax; music: I)                                                                                  | `build.py` output                                   |
| DC offset                | < 0.001                                                                                                                       | both                                                |
| Loop seam                | `seam_ratio` < 1.5 (good loops < 0.5)                                                                                         | both                                                |
| Decoded length           | equals built `samples`                                                                                                        | `review.py` len column, engine verify               |
| Engine loop flags/offset | match manifest                                                                                                                | `engines/godot/godot_loops.py` or engine equivalent |
| Spectrogram              | no unintended energy above ~16 kHz (aliasing shows as mirrored lines), expected sweeps/sections visible, tails decay to black | `review.py` PNGs                                    |
| Waveform                 | envelopes, transients, section dynamics as intended; no hard cut at the end of one-shots                                      | `review.py` PNGs                                    |

ffmpeg reports `I: -70 LUFS` for sounds shorter than the 400 ms gate; that is expected for short SFX.

## Format notes

- OGG Vorbis q0.6 (default): small and transparent for synth material; loops sample-accurately in Godot, Unity, Web
  Audio and most engines.
- WAV (`--wav`): masters, or engines and platforms that want PCM for very short frequent SFX (lower decode cost).
- MP3: avoid for loops (encoder delay and padding). If a web target needs AAC/M4A for an old Safari, encode with ffmpeg
  from the WAV masters and verify the loop points in that format.
- Mono is fine (and half the size) for centred SFX; keep stereo for panned/decorrelated SFX and all music.
