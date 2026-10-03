# Concept, beat sheet and trailer cue

## Contents

- [Platform targets](#platform-targets)
- [Beat sheet](#beat-sheet)
- [Choosing the BPM](#choosing-the-bpm)
- [The trailer cue](#the-trailer-cue)
- [Bar map contract](#bar-map-contract)

## Platform targets

| Destination                  | Length     | Format                       | Notes                                                                 |
| ---------------------------- | ---------- | ---------------------------- | --------------------------------------------------------------------- |
| X, Bluesky, Mastodon feed    | 30-45 s    | 16:9 1080p60, -14 LUFS       | autoplays muted; hook in 2 s; captions carry the message              |
| YouTube (devlog, channel)    | 30-90 s    | 16:9 1080p60                 | can breathe more; still front-load gameplay                           |
| Shorts, TikTok, Reels        | 15-45 s    | 9:16 1080x1920 native        | UI covers the bottom 20% and right 12%; big player                    |
| README, Discord, itch, X GIF | 4-8 s loop | GIF 640 wide, 20 fps, <15 MB | no text except a small tag; seamless loop                             |
| Store page (Steam, itch)     | 60-120 s   | 16:9, store specs            | different job: features and call to action; out of scope unless asked |

Ask for the destination, the studio name and handle, and the status line when they are not known. For GameGen projects,
title, description, genre and target platforms come from preferences.

## Beat sheet

Write `marketing/trailer/concept.md` from the template before any music or rendering. The user approves it: it is the
cheapest place to change the trailer. A typical 35-45 s progress trailer:

1. **Cold open (1-2 bars).** The most striking gameplay moment the game has, already in motion, ending on a hit on the
   downbeat (flash, hit-stop). No logo first: autoplay viewers decide in about 2 s.
2. **Studio sting (1-2 bars, optional).** Half-time music, the studio mark. Skip it for very short cuts.
3. **Drop: the hook (6-8 bars).** One bar per shot, the core verbs as one-word kinetic captions on downbeats (RUN. JUMP.
   FIGHT.), half-bar cuts in the last bar to accelerate.
4. **Tour (3-4 bars).** One bar per world/biome/mode with a name card in the game's own card style; one slow-motion hero
   moment.
5. **Climax (4-6 bars).** Bosses or the biggest set pieces: intros, then rapid hits at half-bar cuts with a build, a
   hit-stop gap right before the final hit.
6. **Logo and end card (2-3 bars).** Logo slam over blurred key art, tagline, "in development" or release status, studio
   and handle. Hold at least 1.5 bars so it can be read; the poster frame comes from here.

Rules that keep it watchable muted: captions of one to three words, at most one per bar, large and centred inside the
safe zones; every section readable from the picture alone; no text that must be read in under one beat.

## Choosing the BPM

A cut on the grid is only exact when one bar is a whole number of 60 fps frames (`14400 / BPM`), ideally one beat too
(`3600 / BPM`), and a whole number of samples at 48 kHz and 44.1 kHz. Good tempos:

| BPM | Frames/bar | Frames/beat | Bar (s) | Samples/bar 48k | Samples/bar 44.1k | Feel                     |
| --- | ---------- | ----------- | ------- | --------------- | ----------------- | ------------------------ |
| 75  | 192        | 48          | 3.2     | 153600          | 141120            | half-time epic           |
| 90  | 160        | 40          | 2.667   | 128000          | 117600            | hip-hop, chill           |
| 100 | 144        | 36          | 2.4     | 115200          | 105840            | mid-tempo, puzzle, cozy  |
| 120 | 120        | 30          | 2.0     | 96000           | 88200             | pop, platformer          |
| 144 | 100        | 25          | 1.667   | 80000           | 73500             | driving action           |
| 150 | 96         | 24          | 1.6     | 76800           | 70560             | fast action, speed games |
| 180 | 80         | 20          | 1.333   | 64000           | 58800             | DnB-feel (half-time 90)  |

Half-bar cuts need an even frame count per bar (all of the above). Quarter-bar cuts need integer frames per beat (all
except 96 and 160 BPM). Match the game's own music tempo family when possible, so the cue sounds like the game.

## The trailer cue

Compose a dedicated cue rather than editing a game loop: loops have no intro or ending, and their sections do not line
up with the trailer. Use [game-audio-procedural](../../game-audio-procedural/SKILL.md) as the toolkit and guide: the
game's vendored toolkit (`tools/audio`, or `<paths.tools>/audio` in GameGen projects) is imported as a library by
`marketing/audio/trailer_cue.py`, so the cue shares the game's sonic identity (`style.py`), voices and kit.

- Melodic identity: the main theme's hook, transposed if needed. Climax: the boss music's drums and bass palette. Never
  quote someone else's melody.
- Structure follows the beat sheet bar for bar: riser into the cold-open hit, half-time sting, full band on the drop,
  variation for the tour, a breakdown that builds into the climax, a hit-stop gap (near silence for the last beat or
  half-beat before the final hit), then the logo slam and a cadence whose tail fades inside the last bar.
- Every edit hit (cut accent, caption slam, flash, logo slam) has a matching transient: crash, impact, stab, kick.
- Master to about -16 LUFS integrated, peaks under -1 dBFS: the final mix adds game SFX and normalises to -14.
- Fallback when time is short: an edit of the title theme (intro, hook, cadence) cut to whole bars.

`trailer_cue.py` reads `bpm` and `bars` from `timeline.json`, so the edit and the cue cannot drift. Its template body is
a runnable placeholder (drum bed, pad, hit accents); replace `compose()` with the real arrangement. Verify with
`trailer_check.py`: duration, peaks, loudness, every hit's onset within 10 ms, the gap level and the faded tail, plus a
waveform/spectrogram PNG with bar lines. You cannot listen; the user judges the music itself.

## Bar map contract

`marketing/out/audio/trailer.json`, written by the cue and read by `trailer_check.py` and `render.py`:

```json
{
  "file": "trailer.wav",
  "sample_rate": 48000,
  "channels": 2,
  "bpm": 150,
  "bars": 23,
  "bar_length_s": 1.6,
  "total_duration_s": 36.8,
  "looped": false,
  "target_lufs": -16.0,
  "sections": [{ "name": "drop", "bar": 5, "start_s": 6.4 }],
  "bar_starts_s": [{ "bar": 1, "start_s": 0.0 }],
  "hits": [{ "bar": 20, "step": 0, "label": "final hit", "time_s": 30.4 }],
  "hit_stop_gap_s": [30.0, 30.4],
  "tail_fade_s": [36.08, 36.8],
  "measured": { "peak_dbfs": -1.4, "lufs_integrated": -16.1 }
}
```

Bars are 1-based everywhere a human reads them (concept, timeline, bar map); `step` is a 16th within the bar.
`render.py assemble` refuses to run when the cue's `bpm`/`bars` differ from the timeline's.
