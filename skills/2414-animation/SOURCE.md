# animation

Hand-drawn-style 2D animation as code, rendered in headless Chromium through a deterministic ink brush engine. The rotoscope skill copies a reference clip drawing by drawing: it traces each drawing to vector paths, renders them through the brush engine, measures every drawing against its source (XOR against a codec-noise floor, SSIM, paper color), fits per-shot brush overrides kept in a tool-neutral override file, reviews 1:1 crops, and logs learnings that a retro step promotes into defaults. A shipped regression reproduces the shfred0 study drawing for drawing. The learn-style skill measures a traced clip into a style pack (palette, style knobs, and bands for edge softness, stroke widths, roughness, gray inside the ink, boil and holds) and checks any new film against it; it ships the woodcut-ink pack. The produce skill turns a brief and those packs into boards the user approves, then a shot list, rendered frames, a delivered file, and a review against the pack; shots.json is the only cut list. The setup skill checks the prerequisites (ffmpeg with libx264, Node, playwright-core with Chromium, the pinned numpy and opencv) and prints one remedy per missing one.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/melodic-software/claude-code-plugins/tree/c8fa858c9059d3183cfc08f646e4a97f44b33973/plugins/animation
- Commit: `c8fa858c9059d3183cfc08f646e4a97f44b33973`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 29). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
