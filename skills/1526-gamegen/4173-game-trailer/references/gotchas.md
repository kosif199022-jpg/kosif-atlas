# Trailer pipeline gotchas

Hard-won failures from shipping a beat-synced Godot 4 trailer. Read this before the first render and again when a render
looks wrong. Each entry says what breaks, why, and what the templates already do about it.

## Contents

- [Running the director](#running-the-director)
- [Movie Maker frame size and timing](#movie-maker-frame-size-and-timing)
- [Clean, readable frames](#clean-readable-frames)
- [Time effects and determinism](#time-effects-and-determinism)
- [Bots and in-points](#bots-and-in-points)
- [Portrait](#portrait)
- [Color, flashes and safety](#color-flashes-and-safety)
- [Audio](#audio)
- [Tooling](#tooling)

## Running the director

- **Run from outside the project.** `godot --path game -s /abs/marketing/godot/director.gd -- <args>`. The game never
  references `marketing/`, so nothing ships in an export and the trailer code can churn freely.
- **The `-s` script compiles before autoloads exist.** Any reference to a game `class_name` that touches an autoload
  (directly or through its dependencies) fails to parse, and the error looks unrelated. Keep `director.gd` a tiny
  `SceneTree` bootstrap that, deferred, `load()`s the real director node (`shot_director.gd`) and adds it to `root`.
  That node compiles later and may use game classes freely.
- **Autoloads are not identifiers there either.** Fetch them from the tree: `get_tree().root.get_node("/root/Save")`.
- **`_finalize` is too late.** `SceneTree._finalize` runs after root children are freed, and bots often call
  `get_tree().quit()` themselves at the end of a level. Write CSV rows incrementally (flush every ~30 frames), write
  meta when the in-point triggers and when the shot finishes, and also from the node's `_exit_tree`.

## Movie Maker frame size and timing

- **Frame size is fixed at launch** from the project's window size override; resizing the window at runtime does not
  change the recorded size, and `--resolution` is ignored when the project sets a window override. `render.py` writes a
  transient `game/override.cfg` per render phase (`display/window/size/window_width_override`, `window_height_override`,
  `editor/movie_writer/mjpeg_quality=0.95`) and deletes it afterwards. Gitignore it. Override only the window size, not
  `viewport_width/height`: the logical view must stay the game's.
- **Parallel renders share that file.** Run landscape and portrait phases one after the other; parallelism is only
  within a phase. `render.py` refuses to start when an `override.cfg` already exists (stale or concurrent run).
- **Frame index contract.** With the director added deferred (one frame after startup), its physics frame count equals
  the Movie Maker frame index. Do not assume it: `render.py probe <shot>` renders a shot with `fade_in` at 0 and checks
  that the darkest frame equals the recorded `in_frame`. If it is off by one on a Godot version, fix `shot_start()`
  once.
- Movie Maker runs at `--fixed-fps 60` and slower or faster than real time; physics and audio are deterministic per
  frame, wall-clock code (timers based on `Time.get_ticks_msec`) is not. Expect about real-time speed for gameplay.

## Clean, readable frames

- **Hide HUD and in-game title cards** every frame (they re-show themselves); the trailer has its own captions and name
  cards. The director re-scans `HIDE_NODES` patterns every second for newly spawned UI.
- **Invulnerable bots blink.** Bots usually keep the player invulnerable, which runs the hurt-blink on the sprite. Force
  opacity from a node with a high `process_physics_priority` (1000): it runs after the sprite logic each tick. Keep the
  blink when the shot is meant to show getting hit.
- **Inject inputs from a very low priority node** (-1000): it runs after the bot set this frame's controls and before
  the player reads them, so assists (auto air-dash when a homing target exists, attack when an enemy is in range) are
  real inputs through the game's own control path.
- **Camera framing for phones.** Override camera exports from the director (less zoom-out at top speed, less lookahead)
  so the player stays readable on a phone screen. Apply only properties that exist.
- **Movie frame 0** is rendered before the director's first tick, so it can show the HUD. Shots never start there.

## Time effects and determinism

- **Slow motion via `Engine.time_scale`** only slows gameplay that integrates `delta`. Code that counts frames, or uses
  `_physics_process` without delta, keeps full speed. Test a slow-mo shot before building a beat around it.
- **Overlays are a pure function of the shot frame**: no tweens, timers or `AnimationPlayer`. Then slow motion does not
  slow the captions, and every render of a shot is identical, so one shot can be re-rendered alone.
- **Avoid slow motion over in-game screen fades** (boss defeat whiteouts, level transitions): stretched fades wash out
  the whole frame for seconds.
- Reset `Engine.time_scale` before quitting.

## Bots and in-points

- **Pre-roll.** Starting a bot mid-level from rest gives lower speeds than the scout run had at that spot. Start several
  thousand units earlier (`PREROLL`, or the shot's `start.from`) so it arrives at full momentum, and use `in.delay`
  (frames) for fine timing against the music.
- **Same seed, same run.** Shots are reproducible only if the game's randomness is seeded or stable under the bot. When
  a shot's content drifts between renders, find the unseeded RNG before re-timing the edit.
- **A bot can stall or quit before the out-point.** `render.py` fails the shot if the in-point never triggered or the
  run ended early; read the shot's `.log`. `SHOT_TIMEOUT_S` caps a stuck pre-roll.
- **Boss in-points by hit count** (`{"hit": n}`) are robust to boss AI timing; frame-based in-points are not.

## Portrait

- `root.content_scale_factor` zooms the whole canvas for 9:16 (about 1.78 for a game designed at 1280x720 landscape,
  giving a 720x1280 logical view). The director also sets `content_scale_aspect = EXPAND`, otherwise a game with aspect
  `keep` letterboxes or crops the tall frame.
- Reduce camera lookahead: a narrow frame shows less of what is coming, and fast players run off the edge.
- Check every text element in the 9:16 contact sheet: in-game cards anchored right get cropped, long captions must
  shrink (the overlay fits text to 80% of the width), and platform UI covers the bottom 20% and the right 12%.
- Some shots just do not work in portrait (wide boss arenas). Re-frame them, swap the shot for the vertical cut, or
  accept the zoomed view; do not crop the 16:9 render.

## Color, flashes and safety

- **HDR 2D viewports** (`rendering/viewport/hdr_2d`): screenshots from `viewport.get_texture().get_image()` contain
  linear data and look gamma-darkened unless converted to sRGB. Movie Maker frames are color-accurate. Judge colors only
  on Movie Maker frames or ffmpeg extractions of them.
- **Respect the game's flash-safety limits** in overlays: the template caps full-screen flashes at 0.35 opacity with a
  12-frame fade (`FLASH_MAX`, `FLASH_FADE_FRAMES`). Use the game's own constants when it has them, and avoid more than
  three flashes per second.

## Audio

- Mute the in-game **Music** bus while rendering; Movie Maker still records the SFX. The trailer cue is mixed over the
  concatenated shot SFX in post (about -8 dB under the cue; cards silent).
- The cue renders at the toolkit's 44.1 kHz and is resampled to 48 kHz. Choose a BPM where a bar is a whole number of
  frames and of samples at both rates (see [concept-and-music.md](concept-and-music.md)).
- Master the cue to about -16 LUFS, peaks under -1 dBFS, so SFX fit on top before the final -14 LUFS pass.
- AAC encoding adds about 0.5 dB of inter-sample overshoot: loudnorm targets TP -1.5 so the encoded file measures about
  -1 dBTP.

## Tooling

- **Homebrew ffmpeg may lack `drawtext`** (built without freetype). Label contact sheets with Pillow, as `render.py`
  does, instead of ffmpeg text filters.
- MJPEG AVI at quality 0.95 is large (hundreds of MB per minute at 1080p); keep `marketing/out/` gitignored and delete
  old shot renders when disk is tight.
- `ffmpeg -ss` before `-i` seeks to the nearest keyframe; MJPEG is all-intra, so trims by frame are exact.
