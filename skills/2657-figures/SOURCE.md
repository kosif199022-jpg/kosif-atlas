# figures

Publication-quality figures plugin. Eight skills + one QA agent. figure-bible: scaffolds and validates the per-project theme.json (palette, typography, text limits, Codex model settings) that every other skill reads. ai-full-figure: gpt-image-2 through the Codex CLI (or the OpenAI Images API) renders single panels or whole multi-panel figures with large verbatim titles and panel letters, panels generated in parallel with reference-image consistency, composed at journal width; a text ladder routes dense labels to the SVG overlay and numerals to plot or vector skills. transparent-icons: flat scientific icons with native alpha through the same shared backend, with an explicit Atlas Cloud path. scientific-figure: svgutils composer with pre-export font-size validation and Inkscape/cairosvg export. svg-primitives: mm-precise SVG builder with auto-fit text, edge-snapped arrows, and layer ordering; svg-figure: hand-authoring conventions and editor handoff. plot-styling: library decision tree with SciencePlots recipes. figure-qa agent: type-dispatching QA with OCR of expected strings, palette compliance against the theme, geometry and font checks, a VLM rubric, and a JSON verdict that drives the generate, QA, fix loop.

- License: **BSD-3-Clause** (no license file shipped; see the source repository)
- Source: https://github.com/neuromechanist/research-skills/tree/f0219bde233abb44d8a0c5d73f41ea27073e1493/plugins/figures
- Commit: `f0219bde233abb44d8a0c5d73f41ea27073e1493`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 50). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
