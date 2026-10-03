# Engine integration

The manifest (`art_source/audio/manifest.json` by default) is the contract between the generator and the engine: paths,
`loop`, `loop_offset_samples` / `loop_offset_s`, `samples`, `variant_of`, `sections`, `bpm`, and notes on how to trigger
each cue. Engine adapters read it rather than hard-coding loop data.

## Runtime architecture (any engine)

- **Buses**: Master → Music, SFX, UI (optionally Ambience, Voice). Player settings map 0..1 sliders to bus dB with
  `linear_to_db(max(v, 0.0001))`.
- **Music**: two players for crossfades (0.5–1 s); do not restart if the requested track is already playing; jingles
  either duck the music or pause it and resume.
- **SFX**: a fixed voice pool (12–24 players) with round-robin allocation; cache loaded streams; optional per-cue
  cooldown or max-instances for very frequent sounds; spatial players only where position matters.
- **Variation**: random variant (not the previous one) for `variant_of` groups; alternate mirrored pairs; ±3–5 % pitch
  jitter for non-tonal cues; pitch ladders for combos and charges.
- **Accessibility**: separate volume sliders, mono-downmix option if stereo cues carry information, never make sound the
  only signal for a critical event.

## Godot 4 (adapter included)

```bash
uv run tools/audio/engines/godot/godot_loops.py --project game
```

It imports, writes `loop=true` and `loop_offset=<s>` (plus a quarter-sample guard) into each `.ogg.import`, forces a
re-import by deleting the cached `.md5`, then loads every stream headlessly through `verify_audio.gd` and fails if a
flag, offset or length differs from the manifest. Godot binary: `--godot`, `$GODOT`, `godot` on PATH or the macOS app
bundle. Assets must live inside the project directory.

Runtime sketch (autoload):

```gdscript
var _music_a := AudioStreamPlayer.new(); var _music_b := AudioStreamPlayer.new()
func play_music(id: String, fade := 0.6) -> void:  # crossfade between _music_a/_music_b with tweens
func play_sfx(id: String, pitch := 1.0, volume_db := 0.0, bus := "SFX") -> void:  # round-robin pool
```

WAV in Godot loops via the import option `edit/loop_mode` and `edit/loop_begin` (in frames) instead.

## Unity

`AudioClip` has no loop offset. Use `build.py --split-intro`: play `<id>_intro` with `AudioSource.PlayScheduled(t)` and
schedule `<id>_loop` (with `loop = true`) at `t + intro.samples / (double)intro.frequency` on a second source. Import as
Vorbis, "Compressed In Memory" or "Streaming" for music, "Decompress On Load" for short SFX. Whole-file loops just need
`loop = true`.

## Web (Web Audio API, Phaser, Howler)

- Web Audio: decode the full file and use `AudioBufferSourceNode.loop = true`, `loopStart = loop_offset_s`,
  `loopEnd = buffer.duration`. Sample-accurate, no split needed. Do not loop through `<audio loop>` elements (gaps, no
  offset).
- Phaser and Howler: use the Web Audio backend. For intro+loop either use sprites (`intro` and `loop` regions with loop
  on the second) or the split files.
- Check the target browsers' OGG Vorbis support. If a fallback is required, encode M4A/AAC from the WAV masters and
  verify the loop points in that format; avoid MP3 for loops.

## Unreal

Import WAV masters (Unreal re-encodes). For whole-file loops set `Looping` on the SoundWave. For intro+loop use the
split files in a MetaSound (intro Wave Player → on finished → looping Wave Player) or a Wave Player node's loop start;
verify with a short capture.

## Custom engines (SDL, miniaudio, FMOD, Wwise)

Read `loop_offset_samples` from the manifest and set the loop region in frames. Middleware (FMOD/Wwise) can take the
split files as two sequential instruments, or loop regions with the offset.

## Verification in the engine

1. Lengths and loop flags/offsets match the manifest (adapter script or an editor/test check).
2. Trigger every cue in a real session (debug menu or test scene that plays each id). Watch logs for missing ids, and
   capture a short clip with sound if the tooling allows.
3. Let a loop run past its end at least once; confirm no gap or click at the seam and at the intro→loop transition (user
   listening check).
4. Check levels together: music under gameplay SFX, UI audible but not dominant, danger cues clear.
