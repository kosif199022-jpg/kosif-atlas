# <Game title>: gameplay trailer concept

Purpose: <who sees it, where, why>. Example: show development progress to the gamedev community on X and Bluesky (also
Mastodon, Reddit, itch devlog). Not a store trailer: no call to action beyond the studio and "in development".

## Deliverables

| Output                    | Spec                                                                                | Use                          |
| ------------------------- | ----------------------------------------------------------------------------------- | ---------------------------- |
| `<name>_trailer_16x9.mp4` | 1920x1080, 60 fps, H.264 High yuv420p, CRF 17, AAC 192k 48 kHz, -14 LUFS, faststart | X, YouTube, Bluesky          |
| `<name>_trailer_9x16.mp4` | 1080x1920, same encode, native portrait render (not a crop)                         | Shorts, TikTok, Reels        |
| `<name>_loop.gif`         | about 6 s seamless loop, 640 wide, 20 fps, palette-optimised, under 15 MB           | README, Discord, itch, X GIF |
| `<name>_poster_*.png`     | one frame of the logo card per format                                               | thumbnail, post image        |

## Principles

- **Hook in the first 2 seconds.** Timelines autoplay muted and people scroll fast. Open on the most striking gameplay
  moment, not on a logo.
- **Readable muted.** Every beat is understood without sound: short kinetic captions in the game's own fonts, large,
  centred, inside the safe zones.
- **Cut on the music.** The cue's bar grid is exact, so every cut and caption lands on a beat.
- **Real gameplay only.** The game's own bots play it with real inputs. Engine time scale only for slow motion.
- **<Length> s.** <Why: e.g. about 40 s is short enough to finish on a timeline and long enough for N worlds and
  bosses.>

## Music

<BPM> BPM (1 bar = <frames> frames at 60 fps), <bars> bars = <seconds> s, <key>. Built with the game's procedural audio
toolkit (`marketing/audio/trailer_cue.py`). Melodic identity: <the main theme's hook>. Climax palette: <boss music
drums/bass>. A dedicated cue beats an edit of a game loop: loops have no intro or ending and their sections do not line
up with the trailer's structure.

Game SFX are recorded per shot with the in-game music bus muted and mixed under the cue (about -8 dB).

## Beat sheet (bars @ <BPM> BPM)

| Bars     | Time | Section                                                  | Picture                                | Caption / card                            |
| -------- | ---- | -------------------------------------------------------- | -------------------------------------- | ----------------------------------------- |
| 1-2      |      | Cold open (riser, hit on the downbeat of bar 2)          | <peak gameplay moment>                 | none                                      |
| 3-4      |      | Studio sting (half-time)                                 | studio mark                            | <STUDIO> presents                         |
| 5-12     |      | Drop: the hook, 1 bar per shot, half-bar cuts at the end | <core verbs: run, jump, fight...>      | one-word slams on downbeats               |
| ...      |      | World tour                                               | 1 bar per world with a name card       | world names                               |
| ...      |      | Bosses / climax build                                    | boss intros, rapid hits, half-bar cuts | <N BOSSES>                                |
| last 2-3 |      | Logo slam and end card (hold >= 1.5 bars)                | logo over blurred key art              | tagline, "in development", studio, handle |

## Vertical cut (9:16)

The same timeline, re-rendered natively at 1080x1920. The director zooms the gameplay canvas (`portrait_scale`) so the
player stays large, with less camera lookahead. Keep text out of the bottom 20% and the right 12% (platform UI). Shots
that do not work in portrait: <list, and the fallback>.

## GIF

Bars <a-b> of <shot>, no captions, cross-faded seam.

## Shot candidates (from scouting)

| Moment | Run | Frame | Progress | In-point | Notes |
| ------ | --- | ----- | -------- | -------- | ----- |
|        |     |       |          |          |       |
