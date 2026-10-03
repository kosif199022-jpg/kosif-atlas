# visualization

On-demand visualization router: infers what in the current conversation should be shown visually, then decides the best FORM (a mermaid diagram, a markdown table, a hand-authored SVG/CSS chart, ASCII/Unicode art, or a rich rendered page) and the best MEDIUM (inline terminal, a local HTML file, or a published Artifact) via a decision matrix over content shape, complexity, and a configurable medium preference. Renders good defaults and asks only when the target is genuinely ambiguous and no form was named. A form-and-medium decision layer in front of the craft capabilities. It routes chart craft and artifact-design fundamentals to those capabilities when installed and never restates them.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/melodic-software/claude-code-plugins/tree/c8fa858c9059d3183cfc08f646e4a97f44b33973/plugins/visualization
- Commit: `c8fa858c9059d3183cfc08f646e4a97f44b33973`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
