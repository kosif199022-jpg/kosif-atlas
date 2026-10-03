# Capture by technology

## Web fallback when ui-screenshots is unavailable

Reuse the project's installed Playwright runner, authentication fixtures, startup command, and browser version. Do not
add a new application or assume a package manager. Discover the actual local/preview URL and readiness signal. Keep
saved authentication state local. A browser screenshot of its rendered page usually avoids OS desktop-capture
permission; capturing the browser window through macOS is a different operation.

Adapt this into a reusable project capture spec rather than scattering one-off commands. Pass the same target route and
state for both phases, using distinct baseline/current servers when needed. Put output under
`.local/visual-evidence/<task-id>/`, outside any test-results directory that the next run clears.

```ts
import { expect, test } from "@playwright/test"

test.use({
  viewport: { width: 1280, height: 820 },
  deviceScaleFactor: 1,
  colorScheme: "light",
  locale: "en-US",
})

test("capture review state", async ({ page }) => {
  const url = process.env.UI_CAPTURE_URL
  const output = process.env.UI_CAPTURE_OUTPUT
  if (!url || !output) throw new Error("Set UI_CAPTURE_URL and UI_CAPTURE_OUTPUT")
  await page.goto(url)
  await expect(page.getByRole("main")).toBeVisible() // Use the actual ready signal.
  await page.evaluate(() => document.fonts.ready)
  // Apply this surface's deterministic data, interactions, focus, and scroll state.
  await page.screenshot({ path: output, animations: "disabled" })
})
```

Use established capture settings in preference to these example defaults. Confirm that images and required content
finished loading; test that the capture is the intended page, not an authentication redirect or skeleton. Do not disable
the very animation being reviewed; choose a reproducible key frame and document motion checks separately. Compare the
same viewport/crop. Full-page captures whose heights differ must be recaptured at common geometry rather than resized.

## Native macOS

Prefer the application's existing screenshot/test API when it renders the real view under review. Otherwise use a
supported window-capture tool with permission to capture the intended app. Capture a specific window to exclude
notifications, other apps, and private desktop content; record the app build, window content size, display scale, and
state. Tools must report a usable real capture; a returned black image does not establish success.

For OS-level capture access, the user controls **System Settings → Privacy & Security → Screen & System Audio
Recording** for the app running the capture (which may be the agent host or terminal). Follow the OS prompt and restart
the capturing application if requested. The task requires screenshots, not audio: do not request microphone access or
record audio unnecessarily.
[Apple screen recording guidance](https://support.apple.com/guide/mac-help/control-access-screen-system-audio-recording-mchld6aa7d23/mac).

Driving native input through accessibility automation can independently require **Privacy & Security → Accessibility**.
Screen access does not imply input-control permission, and input access does not imply screen access. Ask only for the
permission the failed operation actually needs. Do not alter TCC databases, reset permissions, install permission
profiles, or use private capture bypasses. When permission needs user action, record the exact blocked capture,
requesting app, and settings path; an unattended run defers the task and continues eligible work.
[Apple privacy settings](https://support.apple.com/guide/mac-help/change-privacy-security-settings-mchl211c911f/mac).

## Godot and other games

Use an existing project capture harness that saves the rendered viewport after a completed frame, or a
permission-approved window capture. Choose reproducible save/fixture state, seed, camera, viewport resolution, UI scale,
and animation frame. Match those settings across both builds. Do not introduce game-engine or architecture changes
solely to get screenshots without considering the task's scope.

Inspect whether the image shows the actual game and intended state. Headless compilation, imports, unit tests, scene
source, and editor thumbnails do not prove the displayed game UI. If a test renderer cannot represent the affected
surface, use the real running game. Report missing display/render access as a blocker; do not fabricate a baseline or
use a generated illustration as evidence.
