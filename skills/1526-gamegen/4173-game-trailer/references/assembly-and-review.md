# Assembly, deliverables and review

## Contents

- [Rendering shots](#rendering-shots)
- [Assembly](#assembly)
- [Vertical cut](#vertical-cut)
- [GIF](#gif)
- [Posters](#posters)
- [Review](#review)

## Rendering shots

`render.py shots [ids...] [--portrait] [-j 3]` runs one Godot Movie Maker process per shot:

```
godot --path game --write-movie out/shots/16x9/<id>.avi --fixed-fps 60 --audio-driver Dummy \
  -s /abs/marketing/godot/director.gd -- --timeline=<abs> --shot=<id> --meta=<abs json> [bot args] [--portrait]
```

MJPEG q0.95 video plus PCM audio, at the size from the transient `override.cfg`. Each shot writes `<id>.json`
(`in_frame`, `frames`, `hit_frames`, `events`) and `<id>.log`. Renders are deterministic, so re-render only the shots
whose timeline entry changed. Three in parallel suits a laptop; raise `-j` only with GPU headroom.

## Assembly

`render.py assemble [--portrait]`:

1. Check the timeline tiles the bar grid and matches the cue's bar map.
2. For each trailer shot: `trim=start_frame=<in_frame - lead>:end_frame=+<bars * frames_per_bar>`, `setpts`,
   `format=yuv420p`; the same window of its audio, resampled to 48 kHz and set to `sfx_db`.
3. `concat` video and SFX; `amix` the cue (first input, sets the duration) with the SFX, `normalize=0`.
4. Intermediate at CRF 8 + PCM 24-bit, then the final encode with two-pass loudnorm:
   - pass 1 measures `loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json`;
   - pass 2 applies the measured values with `linear=true`.
5. Final: `libx264 -profile:v high -pix_fmt yuv420p -preset slow -crf 17 -r 60 -g 60`, `aac 192k 48 kHz`,
   `-movflags +faststart` (playback starts before the whole file downloads).

All graphics are already baked in by Godot, so assembly is cuts only: no ffmpeg text, no transitions. Transitions belong
in the overlay (fades, flashes), where they are frame-exact and appear in both formats.

## Vertical cut

The 9:16 cut is the same timeline rendered natively at 1080x1920 (`--portrait`): the director zooms the canvas
(`portrait_scale`), sets `content_scale_aspect = EXPAND`, applies `CAMERA_OVERRIDES_PORTRAIT`, and the overlay lays
itself out in a 720x1280 design space. Check text placement against the platform UI zones in the review sheet. A crop of
the 16:9 render loses the player at speed and halves resolution; render natively.

## GIF

`render.py gif` takes the `gif.shot` window from the 16:9 render, scales to `width` at `fps`, cross-fades the last 0.4 s
into the first 0.4 s (`xfade`) so the loop seam is soft, then `palettegen=stats_mode=diff:max_colors=192` and
`paletteuse=dither=sierra2_4a:diff_mode=rectangle`, `-loop 0`. Keep it under 15 MB (X and Discord limits): lower the
width to 480, fps to 15, colors to 128, or shorten the shot, in that order. Pick a shot whose motion is continuous
(running through a section, a combo chain); a cut inside a GIF reads as a glitch.

## Posters

`render.py poster` grabs `poster_time` from each final video. Pick a frame inside the logo card after the end-card lines
have appeared and before `fade_out`. Offer a gameplay still as an alternative post image when the user wants one;
extract it from the shot AVI at full quality, not from the encoded MP4.

## Review

`render.py review [--portrait]` writes `out/review/report_<fmt>.txt` and `half_bars_<fmt>.jpg`:

- **Format:** resolution, 60 fps, frame count equals `bars * frames_per_bar`.
- **Half-bar contact sheet:** one frame 6 frames after every half-bar, labelled with bar and shot id. Read it for black
  or broken frames, HUD leaks, blinking player, cropped text, wrong shot order, washed-out slow motion.
- **Cut-to-beat:** scene-change detection (`select='gt(scene,0.3)'`) against the shot boundaries. Off-grid cuts are
  either in-shot camera jumps (fine if intended) or a wrong `in_frame`. Boundaries without a detected cut usually join
  two similar shots; check them on the sheet.
- **Loudness:** `ebur128=peak=true` integrated loudness within 1 LU of -14 and true peak at or below about -1 dBTP.
- **GIF size** under budget.

Also run `render.py probe <shot>` once per project (and after a Godot upgrade) on a shot with `fade_in` at 0, and
`trailer_check.py` whenever the cue changes.

What the tools cannot judge: whether the trailer is exciting, whether the music fits, whether shots read at phone size
and speed. Send the user the contact sheets, the report and the file paths, and ask them to watch both cuts with sound
on and off. Their notes become timeline edits; re-render only the changed shots, then assemble and review again.
