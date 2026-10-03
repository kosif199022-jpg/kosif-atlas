extends SceneTree
## Headless check used by godot_loops.py: loads each res:// audio path passed after `--` through Godot's
## importer output and prints "AUDIO <path> loop=<bool> offset=<s> length=<s>".


func _init() -> void:
	for path in OS.get_cmdline_user_args():
		var stream := load(path) as AudioStreamOggVorbis
		if stream == null:
			print("AUDIO %s FAILED" % path)
			continue
		print("AUDIO %s loop=%s offset=%.6f length=%.4f" % [path, stream.loop, stream.loop_offset, stream.get_length()])
	quit()
