
# context-mgr — install the multi-agent context manager

This skill scaffolds the `.context/` protocol — shared brain, routing table,
CLI bootstrap files, and the optional wrapper — into a target project so
multiple agents, models, and CLI windows can hand off work without loss of
continuity.

## What gets installed

Into the target directory:

```
<target>/
├── .context/
│   ├── CHARTER.md       ← static protocol
│   ├── STATE.md         ← live board (starter)
│   ├── LOG.md           ← handoff journal (starter)
│   ├── DECISIONS.md     ← decision records (starter)
│   ├── README.md
│   └── archive/         ← rolled-off LOG entries
├── .claude/
│   └── settings.json    ← SessionStart/Stop hooks (merged if file exists)
├── agents.yaml          ← routing table — edit for your model lineup
├── AGENTS.md            ← Codex CLI bootstrap
├── GEMINI.md            ← Gemini CLI bootstrap
└── context-run.sh       ← optional wrapper for non-Claude CLIs
```

Plus an addition to `<target>/.gitignore`:

```
.context/lock
```

## How to run it

The installer is a shell script: `${CLAUDE_PLUGIN_ROOT}/library/context-mgr/install.sh`.

It takes one optional argument — the target directory (default: current working
directory):

```bash
bash "${CLAUDE_PLUGIN_ROOT}/library/context-mgr/install.sh"           # install here
bash "${CLAUDE_PLUGIN_ROOT}/library/context-mgr/install.sh" /path/to/project
```

## Workflow when invoked

1. **Confirm target.** If the user named a path, use it. Else default to the
   current working directory. Show the resolved path back to the user.

2. **Check for conflicts.** Run the installer with `--check` first:
   ```bash
   bash "${CLAUDE_PLUGIN_ROOT}/library/context-mgr/install.sh" --check <target>
   ```
   This lists any files that already exist at destination paths. If anything
   conflicts, surface it to the user before deciding whether to overwrite,
   skip, or abort.

3. **Install.** Run the installer for real:
   ```bash
   bash "${CLAUDE_PLUGIN_ROOT}/library/context-mgr/install.sh" <target>
   ```
   Add `--force` if the user confirmed overwrite. Add `--skip-hooks` if the
   target already has a populated `.claude/settings.json` you don't want to
   merge into.

4. **Verify.** Confirm the install with:
   ```bash
   ls <target>/.context <target>/agents.yaml <target>/AGENTS.md <target>/GEMINI.md <target>/context-run.sh
   ```

5. **Tell the user next steps.** In 3–4 lines:
   - Edit `agents.yaml` to match their model lineup.
   - Define the project's active objective in `STATE.md`.
   - Start any session by saying "what should I work on?" — the `session`
     skill (a sibling in this library) takes over from there.

## Idempotency

The installer is safe to re-run. By default it never overwrites; it skips
existing files and reports them. Pass `--force` to overwrite. Pass `--check`
to see what would happen without doing it.

## When NOT to install

- If `.context/` already exists and is populated with real project history,
  do not run with `--force` — you'd lose LOG and DECISIONS entries. Use
  `--check` to see what's there, then ask the user.
- If the target isn't a git repo, suggest `git init` first. The protocol
  relies on git for attribution and history. The installer will warn but
  proceed if the user confirms.

## After install

The `session` skill (`library/session/` in this library) is what actually
runs the check-in/check-out ritual at session boundaries. This skill only
installs the **project-level** files.
