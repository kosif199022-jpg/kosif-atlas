---
name: cmux-browser-screenshooting
description: This skill should be used when the user asks to "take a screenshot", "screenshot the browser", "show me the browser", "capture the screen", "screenshot storybook", "open storybook in browser", "navigate to URL", "open URL in cmux", or wants to visually verify what is currently shown in a browser, open a new browser pane, or navigate an existing browser to a specific URL before screenshotting. Always use this skill instead of mcp__chrome-devtools__take_screenshot — cmux is token-efficient.
---

# cmux Browser Screenshooting

Take a screenshot of a browser pane in the current cmux workspace. Can open a new browser, navigate an existing one to a URL, or screenshot whatever is currently shown.

## Step 1 — Discover workspace and browser surface

Run both commands, then parse:

```bash
WS=$(cmux identify | jq -r '.focused.workspace_ref')
SURF=$(cmux rpc surface.list "{\"workspace_ref\":\"$WS\"}" | jq -r '[.surfaces[] | select(.type == "browser")] | first | .ref // empty')
```

- If `SURF` is non-empty → a browser pane exists. Check its URL if needed:
  ```bash
  cmux browser $SURF url
  ```
- If `SURF` is empty → no browser pane open.

## Step 2 — Open or navigate

### No browser exists → open one

```bash
cmux browser open <url>
```

Then re-discover the surface ref (repeat Step 1) since the new surface needs a ref.

Use `open-split` instead of `open` to open alongside the current terminal without replacing it:

```bash
cmux browser open-split <url>
```

### Browser exists but wrong URL → navigate it

```bash
cmux browser $SURF navigate <url>
```

Wait for the page to load before screenshotting:

```bash
cmux browser $SURF wait --load-state complete
```

### Browser exists with correct URL → proceed to screenshot

No action needed.

## Step 3 — Take the screenshot

```bash
cmux browser $SURF screenshot --out /tmp/cmux-shot.png
```

## Step 4 — Display it

Read `/tmp/cmux-shot.png` with the Read tool to render the image inline.

## Full one-liner (screenshot existing browser)

```bash
WS=$(cmux identify | jq -r '.focused.workspace_ref') && \
SURF=$(cmux rpc surface.list "{\"workspace_ref\":\"$WS\"}" | jq -r '[.surfaces[] | select(.type == "browser")] | first | .ref') && \
cmux browser $SURF screenshot --out /tmp/cmux-shot.png
```

## Notes

- Never use `mcp__chrome-devtools__take_screenshot` — it is token-expensive.
- If multiple browser surfaces exist, pick the one whose `title` matches the relevant page (e.g. "Storybook"). Use `jq -r '.surfaces[] | select(.type == "browser") | [.ref, .title] | @tsv'` to list all browser surfaces with titles.
- Surface refs change between sessions — always discover fresh, never hardcode.
- Prefer `open-split` over `open` to keep the terminal pane visible alongside the browser.
