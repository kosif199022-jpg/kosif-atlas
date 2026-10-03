---
name: doctor
description: 'Diagnose a repository''s installation of this marketplace without writing anything — every component''s stamp against what is on disk, outstanding devbook migrations, a stale or customized AGENTS.md section, every provider id bound in the effective configuration that resolves to no skill, a missing or out-of-range OpenSpec CLI and an unapproved change nobody has touched in a week, and each installed plugin against the newest published — and name the one skill that fixes each finding. Reads every stamp, which is why it lives here and not in any one component. Use when: something may be out of date, a migration may be outstanding, a stamp may have drifted, after an upgrade, or before trusting a repository nobody remembers configuring. Triggers on: "devbook-config doctor", "doctor", "is the stack healthy", "is my installation current", "outstanding migrations", "stamp drift", "is the AGENTS.md section stale", "a binding names a retired skill", "is the OpenSpec CLI current", "stale proposals".'
---

# devbook-config doctor

Open the reply with `devbook-config@<version>`, `version` read from `../../.claude-plugin/plugin.json`, not recalled.

## Purpose

Say whether this repository's installation is current, and write nothing. Whether the
chapters are valid is `devbook:validate`'s question; this one reads every component's stamp,
which no single component may. Every fix it names belongs to that component's own `update` —
two writers for one stamp is how a reconcile stops being idempotent.

## Steps

1. **Look.** Run `node scripts/report.mjs --root <repository> --json` from this plugin's root.
   No `.devbook/config.json`: say "not initialized, run `devbook-config:init`" and stop. Report
   every plugin whose installed version is behind the newest published, and every `update
   available` row, with `devbook-config:update` as the fix.
2. **Check the migration ledger.** From devbook's `installPath` in that output, run
   `node migrations/<id>/migrate.mjs --check --root <repository>` for every folder, oldest
   first. Exit `1` is hard drift: work the ledger says is done, or a migration it does not yet
   record. Never apply one here. devbook not installed: say the ledger is unchecked, and why.
3. **Check every stamp** against disk, with the stamp rules in devbook's
   `assets/reconcile-protocol.md` under **The stamp** — hash every `materialized` entry and
   the `AGENTS.md` section between each component's markers:

   | Drift | Severity | Fix |
   |---|---|---|
   | A migration the plugin's `contractVersion` requires is missing from the ledger | hard | `devbook:update` |
   | The stamped `contractVersion` is below `MINIMUM_CONTRACT_VERSION` in devbook's `tools/devbook-meta/graph.mjs` | hard | Upgrade through the previous major's last release first, then `devbook:update` |
   | A file a stamp says was materialized is gone | hard | That component's `update` |
   | A devbook folder on disk that `adopted` does not list, or the reverse | hard | `devbook:update` |
   | A component's `AGENTS.md` section, or one of its markers, is missing | hard | That component's `update` |
   | A materialized hash matches an older release | stale | That component's `update`; nothing is broken |
   | An `AGENTS.md` section matches its stamped hash but not what its template renders now | stale | That component's `update` |
   | A materialized hash matches nothing ever shipped | customized | Report it and leave it — often deliberate |
   | An `AGENTS.md` section no longer matches its stamped hash | customized | Report it and leave it; the repository has taken the section over |

4. **Resolve every provider.** Run `node <installPath>/tools/stack-config/check.mjs --print`,
   `installPath` being delivery's, with the repository as the working directory — it resolves
   `.devbook/config.json` from there — and read `config` from its stdout; never merge the
   layers by hand. delivery not installed: say the providers are unchecked, and why. Take every
   provider id under `extensions` — a string, an object's `provider`, a chore entry's `run`, less any
   `--flag` arguments after it — and under `bindings`: each `delivery.roles` value,
   `openspec.grill`, and a `delivery.tracker` provider that
   is not `github`, `jira`, `markdown`, or `backlog`. `delivery.mcp` names servers, not
   providers. `null` is an unbound point, not a finding. Resolve each:
   - `plugin:skill` — `skills/<skill>/SKILL.md` or, for a role, `agents/<skill>.agent.md`
     under that plugin's `installPath`; a bare `plugin` — the plugin is installed;
   - `repo:<skill>` — `.agents/skills/<skill>.md`, `.claude/skills/<skill>/SKILL.md`, or
     `.github/skills/<skill>/SKILL.md` in the repository.

   An id in the **Old** column of devbook's `migrations/015-openspec-verbs/MIGRATION.md` is
   hard: name its successor from the **New** column, and say `devbook:update` runs the
   migration that rewrites it. Any other id that resolves to nothing is a warning naming the
   file and key that bind it — the flow degrades past it, so it never fails the run. A
   plugin the report does not list is outside this catalog: say it is unchecked.
5. **Check the change lane** when `components.openspec` exists. Run `openspec --version`
   from the repository root: absent, or outside `components.openspec.cli`, is a warning —
   a fact about this machine, like a plugin it lacks — and the fix is
   `npm install -g @fission-ai/openspec@latest`, run by the person, never here. Then, for
   each `openspec/changes/<name>/` outside `archive/`, read `status` from `proposal.md`'s
   block: a change still at `proposed` whose folder `git log -1 --format=%cs` dates more than
   seven days back — or, never committed, whose newest file is — is a warning naming the
   change and its age, fixed by `devbook-collaboration:chapter-approve` on the folder.
6. **Report** one table: finding, component, severity, and the skill that fixes it. Fail on
   hard drift; report staleness, customization, and unresolved providers without failing — a
   stale generated file must not block an unrelated pull request.

## Do not

- Do not apply a migration, edit a stamp, rewrite an `AGENTS.md` section, or rebind a
  provider. Each belongs to
  its component's `update`, which records what it did as it does it.
- Do not treat a component this machine has not installed as drift: its stamp is shared, and
  the report's `blocked` scope already says so.
