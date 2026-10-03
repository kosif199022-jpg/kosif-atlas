extends SceneTree
## Trailer director bootstrap. Runs the real game from outside the project, so the game never depends on
## marketing/. render.py builds the command line:
##   godot --path <game> --write-movie <out.avi> --fixed-fps 60 -s <abs>/marketing/godot/director.gd -- <args>
##
## Keep this file tiny and free of game class_names: a -s script compiles before the autoloads exist, so any
## reference to a class that touches an autoload fails to parse. Once the tree is up, it adds
## shot_director.gd (which may use game classes freely) as a node; that node writes its own output files.
##
## User args (after --), read by shot_director.gd:
##   --timeline=<abs json> --shot=<id>   render one shot of marketing/trailer/timeline.json
##   --scout                             play with the bot and log player state per frame (CSV + events)
##   --meta=<abs json>                   where to write {in_frame, frames, hit_frames, events} (+ .csv when scouting)
##   --portrait                          9:16 framing (render.py sets the 1080x1920 window)
##   --max-frames=<n>                    safety timeout
## Bot-specific args (level, start position, boss mode...) pass through untouched for the game's own bot.

var _director: Node


func _initialize() -> void:
	_boot.call_deferred()


func _boot() -> void:
	_director = load(get_script().resource_path.get_base_dir().path_join("shot_director.gd")).new()
	root.add_child(_director)
