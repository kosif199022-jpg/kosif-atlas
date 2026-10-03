---
name: cmux-file-previewing
description: This skill should be used when the user asks to "preview this file", "open file in cmux", "show file in preview pane", "preview these files", or "open [filename] in the preview pane", or wants to open one or more files as viewer tabs in a dedicated cmux pane. Reuses the same pane across calls by caching the pane ref — repeated previews accumulate as tabs in one pane instead of scattering across the workspace.
---

# cmux File Previewing

Open one or more files as viewer tabs in a dedicated cmux pane. Reuses the same pane across calls by caching the pane ref — repeated previews accumulate as tabs in one pane instead of scattering across the workspace.

## Step 1 — Run the bundled script

The skill ships `scripts/open_file_preview.sh`. The base directory is printed in the skill header when the skill loads. Run:

```bash
bash <skill-base-dir>/scripts/open_file_preview.sh <file> [<file2> ...]
```

Paths can be relative or absolute — the script resolves them internally. Pass all files in a single call when previewing multiple files; each becomes a new tab in the same pane.

If the base directory is not printed in the skill header, locate the script by searching the plugin cache:

```bash
find ~/.claude/plugins/cache -name "open_file_preview.sh" 2>/dev/null | head -1
```

## What the script does

1. Reads the cached pane ref from `scripts/.pane_ref` (next to the script).
2. Validates the cached ref is still live: `cmux list-panes | grep -qF <ref>`.
3. **Pane valid** — opens each file in that pane: `cmux open --pane <ref> <file> --focus true`.
4. **Pane invalid/missing** — creates a new pane (`cmux new-pane --direction right --focus false`), extracts the ref from the output, writes it to `scripts/.pane_ref`, then opens the file(s) there.

## Inline steps (without the script)

When the script is unavailable, replicate the logic manually. Use `~/.cmux-file-preview-pane-ref` as the state file — it is usable without knowing the skill base directory:

```bash
STATE="$HOME/.cmux-file-preview-pane-ref"
PANE=""

# Read and validate cache
if [ -f "$STATE" ]; then
  CACHED="$(cat "$STATE")"
  if cmux list-panes | grep -qF "$CACHED"; then
    PANE="$CACHED"
  fi
fi

# Create pane if needed
if [ -z "$PANE" ]; then
  OUT="$(cmux new-pane --direction right --focus false)"
  PANE="$(printf '%s' "$OUT" | grep -oE 'pane:[0-9]+')"
  printf '%s' "$PANE" > "$STATE"
fi

# Open each file (resolve to absolute path first)
ABS="$(cd "$(dirname <file>)" && pwd)/$(basename <file>)"
cmux open --pane "$PANE" "$ABS" --focus true
```

## Notes

- **State file** — The script uses `scripts/.pane_ref` next to itself; the inline path uses `~/.cmux-file-preview-pane-ref`. Both persist across agent turns. Self-healing: a stale ref (pane closed manually or after a cmux restart) is detected on the next call and a fresh pane is created automatically.
- **Pane refs** — Pane refs do not survive cmux restarts; the stale-ref detection handles this transparently. Never hardcode a pane ref.
- **Session caveat** — Pane refs don't survive cmux restarts; the stale-ref path handles this transparently.
- **Focus** — The new pane is created without stealing focus (`--focus false`); each opened file receives focus as it opens (`--focus true`).
- **Multiple files** — Pass all files in one script call. The pane ref is determined once; subsequent files open into the same pane as additional tabs.
- **Viewer tabs vs terminal** — Unlike `cmux-webp-previewing` (which uses terminal surfaces + `cmux send`), this skill uses `cmux open` which creates native viewer tabs. The `--type` flag is not needed; cmux infers the viewer type from the file extension. The `cmux open` flag contract: `open <path-or-url>... [--pane <id|ref|index>] [--focus <true|false>]` (confirmed from `cmux --help`).
