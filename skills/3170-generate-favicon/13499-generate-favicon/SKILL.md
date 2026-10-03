---
name: generate-favicon
description: 'Generate a minimal favicon set from SVG: ICO, SVG with dark mode, Apple Touch Icon, PWA icons, manifest'
license: MIT
compatibility: Requires ImageMagick 7+ (magick). svgo via npx is optional.
disable-model-invocation: true
allowed-tools: Bash(magick *) Bash(npx svgo *)
---

# Generate Favicon

Generate a complete favicon set from an SVG source file. Produces 6 files + 1 manifest that cover all modern browsers, PWAs, and legacy support.

## Output Files

| File | Size | Purpose |
|------|------|---------|
| `favicon.ico` | 32x32 | Legacy browsers, RSS readers |
| `icon.svg` | vector | Modern browsers, dark mode support |
| `apple-touch-icon.png` | 180x180 | iPhone/iPad home screen |
| `icon-192.png` | 192x192 | Android home screen (PWA) |
| `icon-512.png` | 512x512 | PWA splash screen |
| `icon-mask.png` | 512x512 (409x409 safe zone) | Android adaptive/maskable icon |
| `manifest.webmanifest` | — | PWA manifest with icon entries |

## Prerequisites

The user must have an SVG icon file. If they don't, help them create or obtain one first.

Required CLI tools (check availability before starting):
- `magick` (ImageMagick 7+) — for ICO and PNG conversion
- `npx svgo` — for SVG optimization (optional but recommended)

If ImageMagick is not installed, suggest: `brew install imagemagick` (macOS) or the platform equivalent.

## Process

### Step 1: Locate SVG Source and Output Directory

Ask the user which SVG file to use as the source icon. Verify:
- File exists and is valid SVG
- Has a `viewBox` attribute (needed for correct scaling)
- Is roughly square (width ≈ height in viewBox)

If the SVG is not square, warn the user before proceeding.

Detect the project's static/public directory by looking for `public/`, `static/`, `src/assets/`, or fall back to the project root. Confirm the output location with `AskUserQuestion`, offering the detected directory first. All generated files go into this directory.

### Step 2: Add Dark Mode to SVG

Read the SVG file. If it doesn't already have a `prefers-color-scheme: dark` media query, ask with `AskUserQuestion` whether they want dark mode support.

If yes:
1. Identify the actual fill/stroke colors used in the SVG (inspect `<path>`, `<circle>`, `<rect>`, etc.)
2. Propose specific dark-mode color swaps based on what's in the file — don't assume hardcoded values
3. Add a `<style>` block inside the `<svg>` element with the swaps:

```xml
<style>
  @media (prefers-color-scheme: dark) {
    .favicon-dark { fill: #PROPOSED_LIGHT_COLOR }
  }
</style>
```

4. Add the class to the relevant elements and ensure their default `fill`/`stroke` is set for light mode

If the SVG already uses CSS variables or classes, adapt to its existing structure rather than adding a parallel system.

Save the result as `icon.svg` in the output directory.

### Step 3: Optimize SVG

Run SVGO before generating PNGs — optimized SVGs produce cleaner rasterizations:

```bash
SVG=icon.svg
npx svgo --multipass "$SVG"
```

### Step 4: Generate All Image Files

ImageMagick rasterizes an SVG at its viewBox size (a `viewBox="0 0 16 16"` icon becomes 16 px) and then upscales, which blurs edges. Set `-density` from the viewBox width so the render is at least 512 px, and `-background none` so the transparent background survives. Both flags must come before the input file.

Run these commands in parallel:

```bash
W=<viewBox width, from Step 1>
DENSITY=$(( (96 * 512 + W - 1) / W ))

# favicon.ico (32x32)
magick -background none -density "$DENSITY" "$SVG" -resize 32x32 favicon.ico

# apple-touch-icon.png (180x180 with 20px padding)
magick -background none -density "$DENSITY" "$SVG" -resize 140x140 -gravity center -background white -extent 180x180 apple-touch-icon.png

# icon-192.png
magick -background none -density "$DENSITY" "$SVG" -resize 192x192 icon-192.png

# icon-512.png
magick -background none -density "$DENSITY" "$SVG" -resize 512x512 icon-512.png

# icon-mask.png (409x409 content in 512x512 canvas)
magick -background none -density "$DENSITY" "$SVG" -resize 409x409 -gravity center -background white -extent 512x512 icon-mask.png
```

Adjust the `-background` color for `apple-touch-icon.png` and `icon-mask.png` to match the user's brand color if they specify one.

### Step 5: Create Web App Manifest

Write `manifest.webmanifest`:

```json
{
  "name": "SITE_NAME",
  "icons": [
    { "src": "/icon-192.png", "type": "image/png", "sizes": "192x192" },
    { "src": "/icon-mask.png", "type": "image/png", "sizes": "512x512", "purpose": "maskable" },
    { "src": "/icon-512.png", "type": "image/png", "sizes": "512x512" }
  ]
}
```

Replace `SITE_NAME` with the actual project/site name. Ask the user if not obvious from context.

### Step 6: Add HTML Tags

Add favicon tags to the project. The approach depends on the framework:

| Framework | Icon files go in | HTML/meta location |
|-----------|------------------|--------------------|
| Next.js (App Router) | `app/` or `public/` | `app/layout.tsx` via metadata API (`icons` export) |
| Astro | `public/` | `src/layouts/*.astro` `<head>` |
| Vite / SPA | `public/` | `index.html` `<head>` |
| Static HTML | project root | `index.html` `<head>` |

For frameworks using raw HTML tags in `<head>`:

```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
```

For Next.js App Router, use the metadata API instead of raw tags — either place icons in `app/` with [convention names](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons.md) or export an `icons` object from `layout.tsx`.

### Step 7: Verify

Confirm all files exist and are non-empty:

```bash
ls -la favicon.ico icon.svg apple-touch-icon.png icon-192.png icon-512.png icon-mask.png manifest.webmanifest
```

Suggest the user validate the maskable icon at https://maskable.app.

## Important Notes

- **Never use `rel="shortcut icon"`** — it was never valid; use `rel="icon"`
- **Place `favicon.ico` at site root** — some tools (RSS readers) request `/favicon.ico` directly
- **Trust browser downscaling** — no need for 20+ size variants
- **Safari pinned tab SVG (`mask-icon`)** — deprecated since Safari 12, not needed
- **Windows tile icons** — not needed for modern Edge/Windows
- Favicon downloads happen in the background and don't affect page load performance
