# Harness notes: showing the dashboard and auto-wake

Read this when firing up a dashboard in a harness for the first time in a project.

## Claude Code (CLI, desktop Code tab, IDE)

**Show it.** Add this entry to the project's `.claude/launch.json` (create the file with
`{"version": "0.0.1", "configurations": [...]}` if missing). Use the skill's absolute path to
`dash.py`, since `${CLAUDE_PLUGIN_ROOT}` isn't expanded there:

```json
{ "name": "chat-n-build", "runtimeExecutable": "python3",
  "runtimeArgs": ["<skill dir>/scripts/dash.py", "serve", "--foreground", "--port", "8765"],
  "port": 8765 }
```

Then `preview_start` with name `chat-n-build`. The pane opens on the launcher; navigate
it to `http://localhost:8765/d/<name>/`.

- In Claude Code, use `preview_start` **instead of** `dash serve`, not both. `serve --foreground`
  exits at once if a server for this project is already running (it just reports it). If
  `dash status` already shows a URL, open that with `preview_start` `{url}` instead.
- Port 8765 taken by something else → `serve` exits 4. Pick another port in both
  `runtimeArgs` and `port`.
- `.claude/launch.json` is often committed. The entry holds an absolute, machine-specific path;
  tell the user before committing it.

**Auto-wake.** At the end of a turn that leaves buttons on screen, if no `dash wait` is
already running, run `dash wait --timeout 1800` with the Bash tool's `run_in_background: true`.
When a click arrives it prints the event and exits, and the harness starts a new turn with
that output: run `dash events` → `begin` → work → `ack`, then re-arm. Exit 5 = timed out.
Only one waiter at a time; a second one wastes a turn. Clicks made after the session closes
stay queued for the next one.

## Claude Desktop chat, Codex, and other shells

- `dash serve --open` starts the server and opens the launcher in the default browser.
  With no browser access, give the user the URL from `dash serve` / `dash status`.
- No wake mechanism: clicks queue until the user's next message. Say once per session:
  "Buttons queue; say 'go' after clicking." Handle the queue at the start of every turn.

## Any harness

- The server binds 127.0.0.1 only and checks the Host header, so open it as
  `127.0.0.1:<port>` or `localhost:<port>`; other names get 403.
- `dash stop` shuts it down via its token. A server started by `preview_start` also stops when
  the preview does.
