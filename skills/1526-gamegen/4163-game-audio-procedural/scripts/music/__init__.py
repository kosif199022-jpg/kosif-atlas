"""Music registry. Map each id (file name: <music dir>/<id>.ogg) to an object with build() -> (stereo array,
metadata dict), usually common.Track(compose, notes, ...) for loops or common.Jingle(...) for one-shots.

Compose every track for this game (references/music-composition.md). Do not register the skill's example tracks:
build.py rejects renders identical to them.
"""

TRACKS: dict = {}
