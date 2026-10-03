---
name: browser-qa
description: Check a web page or the pages this branch changed in a real browser at mobile, tablet, and desktop widths, and report what is off
license: MIT
compatibility: Requires Claude Code with the Claude in Chrome extension or the Chrome DevTools MCP server
disable-model-invocation: true
argument-hint: '[url or path, optionally followed by "fix"]'
allowed-tools: Bash(curl -sI:*)
---

# Browser QA

Look at the page the way a user would, at three widths, and report what a screenshot shows that
the code review did not. Fix only when asked.

## Step 1: What to look at

$ARGUMENTS names a URL or a path. Empty means: map the files this branch changed (uncommitted
plus commits since the default branch) to the routes that render them, and check those. No web
files changed: say so and stop.

A trailing `fix` in the arguments switches on Step 4.

## Step 2: A running server

`curl -sI` the base URL. Nothing answers: find the dev command in package.json scripts, Procfile,
bin/dev, or the README, start it in the background, and wait until the URL answers. Report the
command you used. Do not start a second server when one is already listening on the port.

## Step 3: Look

Load the browser tools once, in one `ToolSearch` call, whichever set is installed: Claude in
Chrome (`mcp__claude-in-chrome__*`) or Chrome DevTools MCP (`mcp__chrome-devtools__*` when added
with `claude mcp add`, `mcp__plugin_chrome-devtools-mcp_chrome-devtools__*` when installed as the
plugin). A host without `ToolSearch`: use whatever browser MCP server it exposes; none configured
means say so and stop. Open a new tab; do not reuse the user's tabs.

For every page, at 375, 768, and 1280 px wide:

1. Set the width (`resize_window` or `resize_page`; with Chrome DevTools MCP prefer `emulate` with
   `viewport: "375x812x2,mobile,touch"` for the 375 width so tap targets behave as on a phone),
   navigate, wait for the page to settle, take a screenshot, and actually read it.
2. Check: horizontal overflow or a second scrollbar, text that overlaps or clips, images that
   stretch or fail to load, tap targets that touch each other on the 375 width, a navigation that
   does not collapse, contrast that is obviously unreadable, and any element the change added that
   is missing or in the wrong place.
3. Read the console and the network log for errors and failed requests since navigation. A 404 on
   an asset the page needs is a finding; third-party analytics noise is not.
4. If the change added an interaction (button, form, toggle, link), use it once and screenshot the
   result.

Prefer the page text and accessibility tree over screenshots for reading content; use screenshots
for layout.

## Step 4: Fix, only when asked

For each finding with a clear cause in this repository's code: fix it, reload, and re-check the
same width. Do not fix findings that come from a dependency or from content, report them.

## Step 5: Report

One table, page by width, one cell per finding or `ok`. Below it, each finding on one line:
width, what is wrong, the screenshot that shows it, and the file that causes it when you know.
Nothing found: say so in one line and show the three screenshots of the main page.

Close the tabs you opened. Leave the server running if you started it, and say so.

## Notes

- Never trigger a browser dialog (`alert`, `confirm`, `prompt`, `beforeunload`). It blocks the
  extension. Avoid destructive buttons unless the user names them.
- A page behind a login: ask for the credentials or a seeded account once, do not guess.
- Stop and ask after two failed browser calls in a row rather than retrying the same action.
