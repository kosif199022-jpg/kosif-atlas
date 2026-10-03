# Timeline (EDL) schema

`marketing/trailer/timeline.json` is the edit decision list and the only file to touch when re-editing. The bundled
example (`assets/marketing/trailer/timeline.json`) is a complete 23-bar, 150 BPM trailer to adapt.

## Top level

| Key              | Type   | Meaning                                                                                 |
| ---------------- | ------ | --------------------------------------------------------------------------------------- |
| `bpm`            | number | cue tempo; `fps * 240 / bpm` must be an integer (frames per bar)                        |
| `fps`            | int    | 60                                                                                      |
| `bars`           | number | trailer length in bars; shots must tile bars `1 .. bars` exactly                        |
| `poster_time`    | number | seconds into the final video for the poster frames (inside the logo card, before fades) |
| `portrait_scale` | number | `content_scale_factor` for the 9:16 render (default 1.78)                               |
| `gif`            | object | `{"shot": id, "width": 640, "fps": 20}`; the shot is usually `trailer: false`           |
| `shots`          | array  | shots, any order (sorted by `bar` for assembly)                                         |

## Shot

| Key              | Type   | Meaning                                                                                                |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| `id`             | string | unique; file names in `out/shots/<fmt>/`                                                               |
| `bar`            | number | 1-based start bar; fractions allowed (`12.5`) when they land on whole frames                           |
| `bars`           | number | length in bars (`0.5`, `0.75`, `1`, `2.5`...)                                                          |
| `kind`           | string | `play` (default: the bot plays) or `card` (overlay only)                                               |
| `start`          | object | play shots: mapped to bot args by `render.py bot_args()` (`{"level": 2, "boss": true, "from": 12000}`) |
| `in`             | object | in-point trigger, see below                                                                            |
| `lead`           | int    | frames kept before the in-point (shows the wind-up before a hit)                                       |
| `fx`             | array  | overlay and time effects, timed in beats from the in-point                                             |
| `assist`         | array  | strings passed to the adapter's `_inject_inputs()` from the in-point on                                |
| `assist_preroll` | bool   | also inject during the pre-roll                                                                        |
| `sfx_db`         | number | game SFX gain under the cue for this shot (default -8; cards -90)                                      |
| `trailer`        | bool   | `false`: rendered (GIF source, alternates) but not cut in                                              |
| `card`           | string | card shots: `studio` or `logo`                                                                         |
| `slam`           | number | logo card: beats of blurred backdrop before the logo slams in                                          |

The rendered length of a shot is `bars * frames_per_bar`, taken from movie frame `in_frame - lead`. Cards start on the
director's first frame.

## In-point triggers

Exactly one condition, plus optional timing:

| Form                         | Fires when                                                                |
| ---------------------------- | ------------------------------------------------------------------------- |
| `{"x": 18300}`               | `_progress()` reaches the value (player x by default)                     |
| `{"frame": 160}`             | the director's frame count reaches it (bosses intros, scripted scenes)    |
| `{"hit": 3, "after": 6}`     | the 3rd target hp drop happened at least `after` frames ago               |
| `{"event": "combo", "n": 2}` | the 2nd `mark("combo")`                                                   |
| `+ "delay": 30`              | wait this many frames after the condition (fine timing against the music) |

With `x` in-points, `bot_args()` starts the bot `PREROLL` units earlier unless `start.from` is set.

## Effects (`fx`)

Times are in beats from the in-point (4 beats = 1 bar). Overlay graphics are a pure function of the frame.

| `type`     | Keys                                                         | Notes                                                   |
| ---------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| `caption`  | `text`, `at`, `len` (3.5), `y` (0.5), `size`, `color`, `bar` | kinetic slam with slanted bar; shrinks to fit 80% width |
| `label`    | `title`, `sub`, `at`, `len` (3.75), `y`                      | name card sliding in from the left (worlds, bosses)     |
| `flash`    | `at`, `strength` (0..1)                                      | capped by `FLASH_MAX`                                   |
| `fade_in`  | `at`, `len`                                                  | from INK                                                |
| `fade_out` | `at`, `len`                                                  | to INK; end the logo card with one                      |
| `slowmo`   | `at`, `to`, `scale` (0.35)                                   | `Engine.time_scale` between the two beats               |

Add a new effect by adding a `match` branch in `overlay.gd` `_draw_all()` (graphics) or in `shot_director.gd`
`_apply_time_fx()` (time). Keep both pure functions of the shot frame.

## Rules the tools enforce

- Trailer shots tile the grid with no gap or overlap and add up to `bars` (`assemble` fails otherwise).
- Every shot length lands on whole frames.
- The cue's bar map has the same `bpm` and `bars`.
- A shot fails when its in-point never triggers or the run ends before its out-point.
