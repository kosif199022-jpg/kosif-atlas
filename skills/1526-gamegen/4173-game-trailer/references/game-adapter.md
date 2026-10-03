# Game adapter, scouting and highlights

## Contents

- [What the game must provide](#what-the-game-must-provide)
- [Adapter hooks in shot_director.gd](#adapter-hooks-in-shot_directorgd)
- [render.py configuration](#renderpy-configuration)
- [Scouting](#scouting)
- [Mining highlights](#mining-highlights)

## What the game must provide

The director drives the game's own autoplayer; it never fakes physics or moves the player itself. Before any trailer
work, check that the game has (or can cheaply get, through godot-gameplay and game-qa) these pieces:

| Need                     | Contract                                                                                                                                                                                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot / autoplayer scene   | Instancing it loads a level and plays it with real inputs through the player's control path. Reads its own command-line args: which level/mode, an optional start position (`--from=<x>`), an optional boss/challenge mode. May quit the tree when the run ends. |
| Start position           | The bot can begin at an arbitrary progress point (respawn/teleport to a safe spot before x) so a shot needs no full-level replay.                                                                                                                                |
| Readable player state    | A player node findable by group or name, with position and cheap readable fields (velocity, grounded, mode, combo, grinding...).                                                                                                                                 |
| Target health (optional) | Bosses or key enemies expose an hp property and a change signal, for `{"hit": n}` in-points.                                                                                                                                                                     |
| Events (optional)        | Signals for trailer-worthy moments (loop, combo, perfect landing, pickup streak) that the adapter connects to `mark()`.                                                                                                                                          |
| Deterministic runs       | Seeded randomness, so a shot re-renders the same way.                                                                                                                                                                                                            |
| Music bus                | In-game music on its own bus (usually `Music`), SFX elsewhere.                                                                                                                                                                                                   |

game-qa's playthrough bots usually satisfy most of this already: QA bots (reachability/traversal bots, boss fighters)
are exactly what the trailer needs. If the game has no bot, write the smallest one that plays the shots you need (hold
right and jump at obstacles is often enough for a side-scroller; a scripted input timeline works for set pieces). Keep
bots in the game's review/test folders, not in `marketing/`; they are QA tools the trailer reuses.

Do not change gameplay for the trailer. Presentation-only hooks the director can set from outside (camera exports, HUD
visibility) are fine; a gameplay change needed for a shot is a game task, recorded and reviewed as such.

## Adapter hooks in shot_director.gd

The template's core handles triggers, timing, overlays and logs. The `ADAPTER` section binds it to one game. Defaults
work for a project with a bot scene, a node in group `player` (or named `Player`) and a `Music` bus.

| Hook / constant                                       | Default                                                | Change it when                                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `BOT_SCENE`, `_start_gameplay()`                      | instance the scene, add to root                        | the bot needs properties set instead of args                                                    |
| `_prepare_game()`                                     | mute `MUSIC_BUS`                                       | menus, saves or unlocks gate the bot (use a fresh in-memory save; never the player's real save) |
| `PLAYER_GROUP`, `PLAYER_NAME`, `_find_player()`       | group, then name search                                | the player lives under another name or is spawned late                                          |
| `_on_player_found()`                                  | hide `HIDE_NODES`, apply `CAMERA_OVERRIDES(_PORTRAIT)` | connecting game signals to `mark("<event>")`                                                    |
| `_progress()`                                         | `player.global_position.x`                             | 3D, vertical or track-based games                                                               |
| `_state_columns()`, `_state_row()`                    | y, speed, on_floor                                     | add the game's highlight signals: mode, combo, grind, airborne time, homing                     |
| `_clean_frame()`                                      | opaque player sprites, hidden UI                       | the game's sprite path differs; a hurt state should show                                        |
| `_inject_inputs(assists)`                             | nothing                                                | shots need assists the bot never does (auto dash/attack)                                        |
| `TARGET_SIGNAL`, `TARGET_HP_PROPERTY`, `_target_hp()` | first node with `hp_changed` and `hp`                  | bosses use other names or groups                                                                |
| `PORTRAIT_SCALE`                                      | 1.78                                                   | the game's logical size is not 1280x720                                                         |

Adapter code may use game class names and autoloads (`get_tree().root.get_node("/root/Name")`); only `director.gd` must
stay free of them. Keep the hooks small: they are the only game-specific code in the director.

## render.py configuration

The config block at the top of `render.py`:

- `GAME`: the folder with `project.godot` (`paths.game` in GameGen projects). `NAME`: output file prefix.
- `EXTRA_ENV`: env vars the game reads at startup (profiles, art variants).
- `SCOUT_RUNS`: `name -> bot args`, one per level, boss or mode worth mining.
- `bot_args(shot)`: maps a shot's `start` object to bot args. Default: `{"level": 2, "boss": true}` becomes
  `--level=2 --boss`, and `{"x": ...}` in-points add `--from=<x - PREROLL>`. Rewrite it when the bot's args differ.
- `PREROLL`, `SFX_DB`, `LOUDNESS`, GIF settings, `SHOT_TIMEOUT_S`, frame sizes.

## Scouting

`render.py scout` plays every `SCOUT_RUNS` entry once at 960x540 under Movie Maker (MJPEG q0.8, three in parallel) and
writes to `marketing/out/scout/`:

- `<run>.avi`: the footage. Scouting at low res is cheap; it is for finding moments, not for using them.
- `<run>.csv`: one row per frame: `frame, progress, <state columns>, target_hp`.
- `<run>_events.csv`: every `mark()` with frame and progress.
- `<run>.json`: meta (frames, hit frames, events).
- `<run>_sheet.jpg`: contact sheet, one frame every 30, labelled with frame and progress (Pillow labels).

Look at the sheets: they show what the bot actually does, which is the only footage you can use. A level the bot plays
badly cannot carry a shot; pick another or improve the bot as a separate task.

## Mining highlights

`render.py highlights [runs...]` reads each scout CSV and prints candidate moments (also saved as
`<run>_highlights.json`):

- 0/1 columns (grinding, airborne, homing, loop mode) become segments, longest first.
- `target_hp` drops are listed in order with the matching `{"hit": n}` in-point.
- Other numeric columns (speed, combo, height) give their top peaks at least 2 s apart.
- Events are listed with frame and progress.

Choose moments that read in one bar on a phone: big motion, clear cause and effect, the player near the centre. Then
write a timeline shot: `"in": {"x": <progress a little before the moment>}` with `start` for the run, and fine tune with
`delay`. Prefer `{"hit": n}` and `{"event": ...}` in-points when the moment is defined by gameplay rather than by place.
Record chosen candidates in the concept's shot table.
