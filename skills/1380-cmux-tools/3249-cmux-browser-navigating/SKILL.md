---
name: cmux-browser-navigating
description: This skill should be used when the user wants to navigate the cmux browser pane to a URL without taking a screenshot — for example when they say "just navigate", "navigate only", "point the browser at", "don't screenshot", or "navigate to URL without a screenshot". Use cmux-browser-screenshooting instead when a visual capture is also needed.
---

# cmux Browser Navigating

Navigate the cmux browser to a URL without taking a screenshot. Opens a split browser if none exists.

## Step 1 — Discover workspace and browser surface

```bash
WS=$(cmux identify | jq -r '.focused.workspace_ref')
SURF=$(cmux rpc surface.list "{\"workspace_ref\":\"$WS\"}" | jq -r '[.surfaces[] | select(.type == "browser")] | first | .ref // empty')
```

- If `SURF` is non-empty → a browser pane exists.
- If `SURF` is empty → no browser pane open.

## Step 2 — Open or navigate

### No browser exists → open one alongside the terminal

```bash
cmux browser open-split <url>
```

### Browser exists → navigate it and wait for load

```bash
cmux browser $SURF navigate <url>
cmux browser $SURF wait --load-state complete
```

Done — no screenshot.

## Notes

- Prefer `open-split` over `open` to keep the terminal pane visible alongside the browser.
- Surface refs change between sessions — always discover fresh, never hardcode.
- If a screenshot is also needed after navigating, use `cmux-browser-screenshooting` instead.
