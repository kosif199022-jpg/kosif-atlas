---
name: powerpoint-neutralizing
description: >
  Use this skill when the user asks to "neutralize a pptx", "neutralize a presentation",
  "standardize a PowerPoint", "normalize slide styling", or wants to apply uniform
  background color, fonts, text color, and remove text shadows from a .pptx file.
allowed-tools: Bash
invocation: user
argument-hint: "<input.pptx>"
version: 0.1.0
---

# PowerPoint Neutralizer

Applies uniform visual styling to a `.pptx` file:

- All slide backgrounds → `#cccccc` (solid fill)
- Title placeholders → Helvetica 18 pt
- All other text → Helvetica 14 pt
- All text color → `#000000`
- Text shadows → removed

All defaults are module-level constants in the bundled script and can be overridden via CLI flags.

## Workflow

### 1. Identify the input file

Get the path to the `.pptx` file from the user argument or prompt if missing.

### 2. Run the bundled script

The script is bundled at `scripts/neutralize_pptx.py`. Run it from anywhere using the skill's resolved path:

```bash
# python-pptx available in active environment
python3 .claude/skills/powerpoint-neutralizing/scripts/neutralize_pptx.py <input.pptx>

# No active venv — use uv run
uv run --with python-pptx python3 .claude/skills/powerpoint-neutralizing/scripts/neutralize_pptx.py <input.pptx>
```

Detect which to use:
```bash
python3 -c "import pptx" 2>/dev/null && echo "direct" || echo "uv"
```

Output is written to `<input>-neutralized.pptx` in the same directory as the input file.

### 3. Override defaults (optional)

If the user specifies different colors, fonts, or sizes, pass them as flags:

| Flag | Default | Description |
|------|---------|-------------|
| `--bg-color HEX` | `#cccccc` | Slide background color |
| `--font-color HEX` | `#000000` | All text color |
| `--title-font NAME` | `Helvetica` | Title font family |
| `--title-size N` | `18` | Title font size (pt) |
| `--body-font NAME` | `Helvetica` | Body font family |
| `--body-size N` | `14` | Body font size (pt) |
| `-o PATH` | auto | Custom output path |

Example with overrides:

```bash
uv run --with python-pptx python3 .claude/skills/powerpoint-neutralizing/scripts/neutralize_pptx.py \
  input.pptx \
  --bg-color "#f0f0f0" \
  --font-color "#333333" \
  --title-size 20 \
  -o output.pptx
```

### 4. Report result

Tell the user the full path of the output file.
