---
name: init
description: 'Write the repository-owned procedure skills — run, capture, diagnose, estimate, prototype — into a repository for the first time, each as one editable copy with a managed wrapper per host carrying the fixed goal — run as a Claude Code run-<name> recipe from /run-skill-generator with a Copilot twin, the rest under .agents/skills/ — and stamp them under components.devbook-procedures in .devbook/config.json. Refused where that stamp already exists: run devbook-procedures:update. Use when: adopting devbook-procedures. Triggers on: "devbook-procedures init", "install devbook-procedures", "seed the run skill", "generate the run skill", "seed the capture skill", "seed the diagnose skill", "seed the estimate skill", "seed the prototype skill".'
user-invocable: false
---

# devbook-procedures init

Open the reply with `devbook-procedures@<version>`, `version` read from `../../.claude-plugin/plugin.json`, not recalled.

Five procedures the plugin names but cannot write, installed the way `devbook` installs its
rules: the procedure once, a wrapper per host beside it. The shape, the goal, and what the
wrapper carries are `assets/skill-wrappers.md`; the stamp, the hashes, and what customized
means are `assets/reconcile-protocol.md` in the devbook plugin under **The stamp**. Neither
is repeated here. This plugin writes `components.devbook-procedures` and touches no other
entry.

## What lands

| Into the repository | Carries | Managed |
|---|---|---|
| `.agents/skills/<name>.md` | `assets/skills/<name>.md`, byte-for-byte | until the repository edits it |
| `.claude/skills/<name>/SKILL.md` | the seed's `name` and `description`, its `goal`, then the pointer | yes |
| `.github/skills/<name>/SKILL.md` | the same | yes |

`run` differs, per `assets/skill-wrappers.md` under *`run`, the exception*: its body is
`.claude/skills/run-<name>/SKILL.md` and its only wrapper is `.github/skills/run/SKILL.md`.

With `prototype` adopted, `assets/demo-template.html` lands byte-for-byte at
`.devbook/design/demo-template.html`, managed until the repository edits it — but only where
`components.devbook.adopted` lists `design`. Without it, say the template was skipped because
`design/` is not adopted, and that `prototype` builds the app part alone until it is.

**Refuse when `components.devbook-procedures` exists.** Say "already initialized, run
`devbook-procedures:update`" and stop.

## The run

1. **Resolve.** Ask which of the five to adopt, offering all five, and say that nothing to
   start means no `run` or `diagnose`, and no evidence means no `capture`;
   `estimate` and `prototype` need neither.
2. **Detect.** For each adopted name, hash what is on disk. A file present at a path this
   component has never stamped is somebody's — ask once, per procedure, whether to keep it as
   the repository's own (`managed: false`) or replace it with the seed; a wrapper is replaced
   without asking, since it holds nothing but the goal and the pointer.
   For `run`, a present `.claude/skills/run-*/SKILL.md` is the body, kept as it is. None:
   invoke `run-skill-generator` when the host lists it, else ask the person to type
   `/run-skill-generator` and wait; a host without it gets the `run` seed as `run-<id>`.
3. **Plan.** One table — `create`, `update`, `skip-customized` — and write nothing. Never
   skip this, not even when the plan is empty.
4. **Materialize.** Overwrite only a file whose hash matches a release this plugin shipped. A
   hash matching nothing ever shipped is the repository's: report it, leave it, and never merge
   a newer seed into it.
5. **Stamp.** Write `components.devbook-procedures` — `pluginVersion`, `adopted`, and
   `materialized`, each entry with the release it came from and the hash it had when it landed.
6. **Report** what moved, name every customized file left alone, and leave the commit to the
   user. Say plainly that the procedures are now the repository's to edit, and that the
   goal in each wrapper is not.
