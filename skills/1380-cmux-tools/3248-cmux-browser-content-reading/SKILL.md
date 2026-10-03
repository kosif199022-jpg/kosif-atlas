---
name: cmux-browser-content-reading
description: This skill should be used when the user asks to "read the browser content", "read the cmux browser page", "what does the browser show", "what does the GitHub browser show", "what's on this page", "get the page text", "extract text from the browser", "summarize the page", "read the open tab", or wants to read/extract text from an already-open browser surface in cmux without navigating anywhere.
---

# cmux Browser Content Reading

Read text content from an already-open browser surface in cmux without navigating to a new URL.

## Step 1 — Discover workspace and browser surfaces

```bash
WS=$(cmux identify | jq -r '.focused.workspace_ref')
```

List all browser surfaces with their titles to decide which one to target:

```bash
cmux rpc surface.list "{\"workspace_ref\":\"$WS\"}" | jq -r '.surfaces[] | select(.type == "browser") | [.ref, .title] | @tsv'
```

### If the user named a specific tab

Match by title keyword (case-insensitive):

```bash
SURF=$(cmux rpc surface.list "{\"workspace_ref\":\"$WS\"}" | \
  jq -r '[.surfaces[] | select(.type == "browser" and (.title | test("KEYWORD"; "i")))] | first | .ref // empty')
```

Replace `KEYWORD` with the relevant word from the request (e.g. `"Seobility"`, `"GitHub"`, `"localhost"`).

### If no specific tab was mentioned

Fall back to the first available browser surface:

```bash
SURF=$(cmux rpc surface.list "{\"workspace_ref\":\"$WS\"}" | \
  jq -r '[.surfaces[] | select(.type == "browser")] | first | .ref // empty')
```

If `SURF` is empty, no browser pane is open — inform the user and stop.

## Step 2 — Check the current URL (optional)

Confirm the right surface is selected before reading:

```bash
cmux browser $SURF url
```

## Step 3 — Read the text content

`get text` requires an explicit `--selector` argument; there is no plain "dump the page" shortcut.

### Full page body

```bash
cmux browser $SURF get text --selector body
```

### Narrow to a specific element

When the page is long, target the relevant section to keep the output small:

```bash
# A results table
cmux browser $SURF get text --selector "table"

# Main content area
cmux browser $SURF get text --selector "main"
cmux browser $SURF get text --selector "#main-content"
cmux browser $SURF get text --selector ".content"

# A specific heading's section
cmux browser $SURF get text --selector "article"
```

Prefer a narrower selector over `body` when the request targets a specific part of the page (e.g. "the results table", "the sidebar", "the error message").

## Notes

- Surface refs change between sessions — always discover fresh, never hardcode.
- The `--selector` flag is mandatory for `get text`; omitting it will error.
- If multiple browser surfaces match a title keyword, `jq first` picks the first match — list all surfaces first if the result looks wrong.
- For visual confirmation, use `cmux-browser-screenshooting` instead of or in addition to this skill.
- To navigate before reading, use `cmux-browser-navigating` first, then invoke this skill.
