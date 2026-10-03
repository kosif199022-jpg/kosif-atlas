# context-mgr

A Claude Code plugin that installs the **multi-agent context manager** into
any project — a `.context/` shared brain, a routing table, CLI bootstraps
for Codex and Gemini, and an optional wrapper for non-Claude CLIs.

After install, any agent or CLI window can pick up work in the project
exactly where the previous one left off, with no loss of continuity.

## What this plugin does

When invoked, the `context-mgr` skill runs an installer that scaffolds the
following into a target directory (default: the current working directory):

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
│   └── settings.json    ← SessionStart/Stop hooks (merge if file exists)
├── agents.yaml          ← routing table — edit for your model lineup
├── AGENTS.md            ← Codex CLI bootstrap
├── GEMINI.md            ← Gemini CLI bootstrap
└── context-run.sh       ← optional wrapper for non-Claude CLIs
```

And appends `.context/lock` to the project's `.gitignore`.

## How to install the plugin

Install it into Claude Code from this repo:

```
/plugin install loudalo/context-mgr
```

(Adjust the owner/repo based on where this lives in your distribution.)

## How to use it after install

In any project, ask Claude:

> *"Install context-mgr here"*
> *"Set up multi-agent context in /path/to/project"*
> *"Add the shared brain to this project"*

The skill triggers, runs the installer, and reports next steps.

## Idempotency and safety

The installer is safe to re-run. By default it never overwrites; it skips
existing files and reports them. Flags:

- `--check` — dry run; report what would happen.
- `--force` — overwrite existing files.
- `--skip-hooks` — leave `.claude/settings.json` alone.

## What's NOT installed by this plugin

The portable **`session`** skill — the runtime that actually executes
check-in / checkpoint / check-out at session boundaries — is user-global,
not project-scoped. It ships as a separate plugin:

```
/plugin install loudalo/session
```

Install both for the full experience: `context-mgr` drops the protocol files
into each project; `session` provides the skill Claude Code uses to drive
them. (The protocol still works without `session` for non-Claude CLIs via
`AGENTS.md`, `GEMINI.md`, and `context-run.sh` — those CLIs read their own
bootstrap files instead of triggering the skill.)

## Source / development

This plugin is the distribution form of the work in the
`multi-agent-context/` project. The plugin bundles a snapshot of the
project's protocol files as templates. To upgrade an existing install, re-run
the skill with `--force` (you'll lose any local edits to the protocol files
but keep your STATE / LOG / DECISIONS).
