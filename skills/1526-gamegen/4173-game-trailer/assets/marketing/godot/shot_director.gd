extends Node
## Shot director, added by director.gd once the game's autoloads exist (see director.gd for the args).
##
## The core is game-agnostic: in-point triggers, frame counting, overlay timing, slow motion, scout logging and
## meta files. Everything that knows the game lives in the ADAPTER section below (search for "ADAPTER"). Adapter
## hooks may use the game's class_names and autoloads (via get_node("/root/Name")): this script compiles after
## the autoloads are registered. The game itself must not reference marketing/.
##
## Frame contract: the director is added one frame after startup, so `frame` (incremented every physics tick)
## equals the Movie Maker frame index. render.py trims each shot at in_frame - lead. Verify it once per project
## with `render.py probe <shot>` instead of assuming it.

const Overlay := preload("overlay.gd")

# --- ADAPTER: configuration ------------------------------------------------------------------------------

## Autoplayer scene instanced for gameplay shots and scouting. It reads its own command-line args
## (render.py's bot_args() maps each shot's "start" object to them). Empty: override _start_gameplay().
const BOT_SCENE := "res://review/bot.tscn"
## How to find the player node once the bot has built the level.
const PLAYER_GROUP := "player"
const PLAYER_NAME := "Player"
## Bus muted while rendering: the trailer cue replaces the in-game music; SFX stay and are mixed under it.
const MUSIC_BUS := "Music"
## Boss/target health, for {"hit": n} in-points and the scout CSV. A node is a target when it has this signal.
const TARGET_SIGNAL := "hp_changed"
const TARGET_HP_PROPERTY := "hp"
## Node-name patterns hidden every frame: HUD, in-game title/act cards, debug labels.
const HIDE_NODES: Array[String] = ["HUD"]
## Bots often keep the player invulnerable, which blinks the sprite. Force it opaque (see _clean_frame()).
const FORCE_PLAYER_OPAQUE := true
## Camera property overrides for readable trailer framing (applied only when the property exists).
const CAMERA_OVERRIDES := {}  # e.g. {"min_zoom": 0.86} so the player stays large at top speed
const CAMERA_OVERRIDES_PORTRAIT := {}  # e.g. {"max_look": 170.0}: less lookahead in a narrow frame
## Portrait renders zoom the whole canvas so the player is not tiny on a 1080x1920 frame.
const PORTRAIT_SCALE := 1.78

# --- state -----------------------------------------------------------------------------------------------

var args := {}
var shot := {}
var timeline := {}
var overlay: Overlay
var frame := 0
var in_frame := -1
var bar_frames := 96
var bot: Node
var player: Node
var target: Node
var hit_frames: Array[int] = []
var events: Array = []  # [frame, name, progress]
var portrait := false
var scouting := false
var max_frames := 60 * 600
var _last_hp := -1
var _cond_frame := -1
var _csv: FileAccess
var _events_file: FileAccess
var _hidden: Array[CanvasItem] = []


func _ready() -> void:
	# Runs after the game's own nodes each physics tick, so the cleanup in _clean_frame() wins.
	process_physics_priority = 1000
	process_mode = Node.PROCESS_MODE_ALWAYS
	for a in OS.get_cmdline_user_args():
		var kv := a.trim_prefix("--").split("=", true, 1)
		args[kv[0]] = kv[1] if kv.size() > 1 else ""
	portrait = args.has("portrait")
	scouting = args.has("scout")
	max_frames = int(args.get("max-frames", max_frames))
	if args.has("timeline"):
		timeline = JSON.parse_string(FileAccess.get_file_as_string(args["timeline"]))
		var fps := int(timeline.get("fps", 60))
		bar_frames = roundi(fps * 240.0 / float(timeline["bpm"]))
		for s: Dictionary in timeline["shots"]:
			if s["id"] == args.get("shot", ""):
				shot = s
	if not scouting and shot.is_empty():
		push_error("director: unknown shot " + str(args.get("shot")))
		get_tree().quit(1)
		return
	_setup.call_deferred()


func _setup() -> void:
	_prepare_game()
	if portrait:
		# Expand keeps a landscape-designed game filling the tall frame instead of letterboxing it.
		get_tree().root.content_scale_aspect = Window.CONTENT_SCALE_ASPECT_EXPAND
		get_tree().root.content_scale_factor = float(timeline.get("portrait_scale", PORTRAIT_SCALE))
	overlay = Overlay.new()
	overlay.portrait = portrait
	overlay.beat_frames = bar_frames / 4.0
	get_tree().root.add_child(overlay)
	if scouting or shot.get("kind", "play") == "play":
		bot = _start_gameplay()
		var inj := InputInjector.new()
		inj.director = self
		add_child(inj)
	else:
		in_frame = 1  # cards start on the director's first physics frame
		overlay.start_card(shot)
		write_files()


func _physics_process(_delta: float) -> void:
	frame += 1
	if bot != null and player == null:
		player = _find_player()
		if player != null:
			_on_player_found()
	if player != null and is_instance_valid(player):
		_clean_frame()
		_track_target()
		if scouting:
			_log_frame()
		elif in_frame < 0 and _triggered():
			in_frame = frame
			overlay.start_shot(shot)
			write_files()
	if in_frame >= 0 and not scouting:
		var t := frame - in_frame
		overlay.tick(t)
		_apply_time_fx(t)
		if t >= _shot_frames() + 2:
			_finish()
			return
	if frame > max_frames:
		push_error("director: timeout at frame %d" % frame)
		_finish()


func _exit_tree() -> void:
	# Bots may call get_tree().quit() themselves when a level ends; files are also written incrementally.
	write_files()


## Adapter code can call this when something trailer-worthy happens (loop, combo, perfect landing...).
## It is logged while scouting and usable as an in-point: {"event": "<name>", "n": 1}.
func mark(event_name: String) -> void:
	events.append([frame, event_name, _progress() if player else 0.0])
	if scouting:
		if _events_file == null:
			_events_file = FileAccess.open(_meta_base() + "_events.csv", FileAccess.WRITE)
			_events_file.store_line("frame,event,progress")
		_events_file.store_line("%d,%s,%.1f" % events[-1])
		_events_file.flush()


## Runs after the bot set this frame's controls and before the player reads them, so injected presses are
## real inputs through the game's own control path.
class InputInjector extends Node:
	var director: Node

	func _ready() -> void:
		process_physics_priority = -1000
		process_mode = Node.PROCESS_MODE_ALWAYS

	func _physics_process(_delta: float) -> void:
		if director.player == null or not is_instance_valid(director.player):
			return
		var assists: Array = director.shot.get("assist", [])
		if assists.is_empty() or (director.in_frame < 0 and not director.shot.get("assist_preroll", false)):
			return
		director._inject_inputs(assists)


# --- ADAPTER: hooks --------------------------------------------------------------------------------------
# Defaults work for a typical project that has a bot scene and a node named "Player". Replace the bodies
# for anything specific; keep the signatures.


## Before anything runs: save slots, unlocks, settings, buses. Never touch the player's real saves.
func _prepare_game() -> void:
	var bus := AudioServer.get_bus_index(MUSIC_BUS)
	if bus >= 0:
		AudioServer.set_bus_mute(bus, true)
	# Example: a fresh in-memory save so menus and progression gates don't block the bot.
	# var save := get_tree().root.get_node_or_null("/root/Save")
	# if save and save.data.is_empty():
	# 	save.new_game()


## Starts the autoplayer for gameplay shots and scouting. Returns the node that owns the level.
func _start_gameplay() -> Node:
	var node: Node = load(BOT_SCENE).instantiate()
	get_tree().root.add_child(node)
	return node


func _find_player() -> Node:
	var p := get_tree().get_first_node_in_group(PLAYER_GROUP) if PLAYER_GROUP != "" else null
	if p == null:
		p = get_tree().root.find_child(PLAYER_NAME, true, false)
	return p


## Once per run: hide HUD and title cards, set trailer camera framing, connect game signals to mark().
func _on_player_found() -> void:
	_rescan_hidden()
	var cam: Node = get_viewport().get_camera_2d()
	if cam == null:
		cam = get_viewport().get_camera_3d()
	if cam != null:
		var overrides: Dictionary = CAMERA_OVERRIDES.duplicate()
		if portrait:
			overrides.merge(CAMERA_OVERRIDES_PORTRAIT, true)
		for prop: String in overrides:
			if prop in cam:
				cam.set(prop, overrides[prop])
	# Example: player.loop_completed.connect(func(): mark("loop"))


## The value {"x": ...} in-points compare against, and the first scout CSV column. Default: world x.
## For 3D or vertical games return whatever measures progress (distance along a track, height...).
func _progress() -> float:
	return float(player.global_position.x)


## Scout CSV columns after frame and progress. Keep them cheap and numeric: they are mined for highlights
## (0/1 columns become segments, other columns peaks, target_hp drops).
func _state_columns() -> PackedStringArray:
	return PackedStringArray(["y", "speed", "on_floor"])


func _state_row() -> Array:
	var v: Variant = player.get("velocity")
	var speed := 0.0
	if v is Vector2 or v is Vector3:
		speed = v.length()
	var on_floor := 0
	if player.has_method("is_on_floor"):
		on_floor = int(player.is_on_floor())
	return [float(player.global_position.y), speed, on_floor]


## Runs every physics tick after the game's nodes. Keeps the frame clean: opaque player, hidden HUD/cards.
func _clean_frame() -> void:
	if FORCE_PLAYER_OPAQUE:
		for c in player.get_children():
			if c is CanvasItem and (c is AnimatedSprite2D or c is Sprite2D):
				# Add a guard here if the game uses a hurt state the trailer should show.
				c.modulate.a = 1.0
	if frame % 60 == 0:
		_rescan_hidden()
	for n in _hidden:
		if is_instance_valid(n):
			n.visible = false


## Extra inputs for shots with "assist": [...], e.g. a dash whenever a homing target is in reach, which the
## bot itself never presses. Write to the same control state the bot writes to.
func _inject_inputs(_assists: Array) -> void:
	# Example:
	# if "auto_dash" in assists and not player.on_ground and player.find_homing_target() != null:
	# 	player.controls.dash_pressed = true
	pass


## Boss/target health, or -1 when there is no target.
func _target_hp() -> int:
	if target == null or not is_instance_valid(target):
		target = null
		if frame % 15 == 0 and bot != null:
			target = _find_target(get_tree().root)
	if target == null:
		return -1
	return int(target.get(TARGET_HP_PROPERTY))


# --- core ------------------------------------------------------------------------------------------------


func _find_target(n: Node) -> Node:
	for c in n.get_children():
		if c != player and c.has_signal(TARGET_SIGNAL) and c.get(TARGET_HP_PROPERTY) != null:
			return c
		var t := _find_target(c)
		if t:
			return t
	return null


func _rescan_hidden() -> void:
	for pattern in HIDE_NODES:
		for n in get_tree().root.find_children(pattern, "CanvasItem", true, false):
			if n != overlay and not _hidden.has(n):
				_hidden.append(n)
		for n in get_tree().root.find_children(pattern, "CanvasLayer", true, false):
			for c in n.get_children():
				if c is CanvasItem and not _hidden.has(c):
					_hidden.append(c)


func _track_target() -> void:
	var hp := _target_hp()
	if hp >= 0 and _last_hp >= 0 and hp < _last_hp:
		hit_frames.append(frame)
	_last_hp = hp


## Frames recorded after the in-point (the `lead` frames before it come from the pre-roll).
func _shot_frames() -> int:
	return roundi(float(shot.get("bars", 1)) * bar_frames) - int(shot.get("lead", 0))


## In-point: the trigger condition, then `delay` more frames for fine timing against the music.
func _triggered() -> bool:
	var trig: Dictionary = shot.get("in", {})
	if _cond_frame < 0 and _condition(trig):
		_cond_frame = frame
	return _cond_frame >= 0 and frame - _cond_frame >= int(trig.get("delay", 0))


func _condition(trig: Dictionary) -> bool:
	if trig.has("x"):
		return _progress() >= float(trig["x"])
	if trig.has("hit"):
		var n := int(trig["hit"])
		return hit_frames.size() >= n and frame - hit_frames[n - 1] >= int(trig.get("after", 0))
	if trig.has("event"):
		var seen := events.filter(func(e: Array) -> bool: return e[1] == trig["event"])
		return seen.size() >= int(trig.get("n", 1))
	if trig.has("frame"):
		return frame >= int(trig["frame"])
	return true


## Slow motion through Engine.time_scale: only gameplay that uses delta slows down. The overlay is a pure
## function of the frame count, so graphics keep their speed and renders stay deterministic.
func _apply_time_fx(t: int) -> void:
	var scale := 1.0
	for fx: Dictionary in shot.get("fx", []):
		if fx["type"] == "slowmo":
			var a := roundi(float(fx["at"]) * bar_frames / 4.0)
			var b := roundi(float(fx["to"]) * bar_frames / 4.0)
			if t >= a and t < b:
				scale = float(fx.get("scale", 0.35))
	Engine.time_scale = scale


func _meta_base() -> String:
	return String(args.get("meta", OS.get_user_data_dir().path_join("trailer_scout.json"))).get_basename()


## Written as it goes: SceneTree._finalize runs after root children are freed, and bots quit on their own.
func _log_frame() -> void:
	if _csv == null:
		_csv = FileAccess.open(_meta_base() + ".csv", FileAccess.WRITE)
		var cols := PackedStringArray(["frame", "progress"]) + _state_columns() + PackedStringArray(["target_hp"])
		_csv.store_line(",".join(cols))
	var cells := PackedStringArray()
	for v: Variant in [frame, _progress()] + _state_row() + [_last_hp]:
		cells.append(str(snappedf(v, 0.01)) if v is float else str(v))
	_csv.store_line(",".join(cells))
	if frame % 30 == 0:
		_csv.flush()
		write_files()


func _finish() -> void:
	Engine.time_scale = 1.0
	write_files()
	get_tree().quit()


func write_files() -> void:
	if _csv:
		_csv.flush()
	if not args.has("meta"):
		return
	var meta := {"in_frame": in_frame, "frames": frame, "shot": shot.get("id", "scout"), "hit_frames": hit_frames,
		"events": events}
	var m := FileAccess.open(args["meta"], FileAccess.WRITE)
	if m:
		m.store_string(JSON.stringify(meta))
