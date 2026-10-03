# pixel-art

Creates pixel art with no external tools: static sprites, animation cycles laid out as sprite sheets for the target engine (RPG Maker MZ, Godot, PICO-8, plain strips) with Aseprite-shaped frame data and GIF previews, terrain tilesets and parallax, UI skins and bitmap fonts, effect sheets, and animated scenes and cutscenes as one self-contained HTML file. The model authors palette-locked specs or procedural generators, including scripts/kit.py, a humanoid kit of proportion presets, hair and head shapes, clothing layers, material ramps, shading, a selective outline, and direction handling. A bundled Python standard-library renderer writes PNG, GIF and frame data, and a render-review loop iterates on what it sees. Craft rules and engine layouts are sourced reference files. An optional Aseprite adapter shares that artifact contract and falls back to the native renderer when the tool is absent.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/melodic-software/claude-code-plugins/tree/c8fa858c9059d3183cfc08f646e4a97f44b33973/plugins/pixel-art
- Commit: `c8fa858c9059d3183cfc08f646e4a97f44b33973`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 22). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
