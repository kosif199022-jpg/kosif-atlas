# Recording and delivering UI motion

Read this for animation, scroll or sticky behaviour, drag-and-drop, or flows whose intermediate states matter. Choose
the recorder and output format based on the available tools and delivery destination.

## Record the relevant behaviour

Reuse the application setup, authentication, data, and framing selected for screenshots. Start near the action, show
enough initial and final state to make it understandable, and keep the clip focused. For a before/after comparison,
repeat the same interaction with comparable timing and capture settings.

Use the browser or screen recorder available in the environment. Check whether it includes a cursor, audio, or
surrounding desktop content. Keep the action understandable through the UI's own focus and hover states or supported
recorder annotations. Include audio only if it is relevant to the request.

For projects using Playwright Test, enable recording for successful capture runs and set an explicit video size so the
output is not unexpectedly scaled down:

```ts
test.use({
  viewport: { width: 1280, height: 820 },
  video: { mode: "on", size: { width: 1280, height: 820 } },
})
```

Add this to the capture spec using the project's `test` import. Perform the actual interaction and assert the resulting
state. Wait for observable state changes; a short deliberate hold is appropriate when viewers need time to see the start
or end of a transition.

Playwright saves recordings when the browser context closes. Await closure for manually created contexts, and copy
completed recordings into the capture directory's `artifacts/` subdirectory under `.local/ui-screenshots/<capture-id>/`
before another run clears test results. Retain the originals alongside any converted clips for inspection. Treat video
dimensions separately from screenshot scale. See the
[Playwright video documentation](https://playwright.dev/docs/videos) for configuration supported by the installed
version.

## Choose the deliverable

| Destination capability             | Deliverable                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| Native video attachment or player  | A supported video file, verified in that player                                          |
| Inline animated images only        | A compact GIF when timing is still readable, optionally linked to a higher-quality video |
| Local files or download links      | The original recording or a compatible converted video                                   |
| No usable video or conversion tool | Labelled stills of key states, with a recording linked if available                      |

Verify the destination's supported formats, size limits, access controls, and actual preview. A raw file URL is not
necessarily an embeddable player. Do not infer MIME types or playback support from the file extension alone. For GitHub,
consult its
[attachment documentation](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files)
and the available browser or CLI upload capabilities rather than assuming a particular upload method.

## Convert only when needed

Check whether an available converter supports the desired format. A recorder's bundled binary may have limited codecs;
do not assume system ffmpeg is required or that every ffmpeg build has the same encoders.

With ffmpeg and an H.264 encoder available, this example creates an MP4 from a WebM recording. Run conversion inside the
capture's `.local/` directory or use explicit paths within it. Replace the filenames with the actual paths and keep the
original recording:

```bash
ffmpeg -i ui-flow.webm -vf "scale=1280:-2" -c:v libx264 -pix_fmt yuv420p \
  -crf 26 -preset veryfast -movflags +faststart -an ui-flow.mp4
```

Choose a width that keeps UI text readable without unnecessarily upscaling the source. This example omits audio;
preserve it when the interaction requires it. For an animated image, create a palette and use matching frame-rate and
scale settings in both passes:

```bash
ffmpeg -i ui-flow.webm -vf "fps=12,scale=960:-1:flags=lanczos,palettegen" ui-flow-palette.png
ffmpeg -i ui-flow.webm -i ui-flow-palette.png \
  -lavfi "fps=12,scale=960:-1:flags=lanczos[x];[x][1:v]paletteuse" ui-flow.gif
```

Inspect the result for readable text, correct timing, and file size. Use a GIF only when its reduced fidelity still
communicates the behaviour. Without suitable conversion tools, retain a playable source recording or capture labelled
stills at meaningful steps. Stills show state changes but do not establish animation smoothness or timing; disclose that
limitation when it matters.
