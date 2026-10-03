---
name: setup
description: Initialize the spectrack plugin in a repository by generating and writing .spectrack/config.yml, including GitHub, Jira Data Center or Server, filesystem issues, GitHub repository wiki, and Jira site profiling for relationship mappings, fields, Epic configuration, and labels.
disable-model-invocation: true
---

# Workflow Setup

Use this skill to bootstrap the workflow plugin for a project. The only config
file this skill may create or recommend is repository-root `.spectrack/config.yml`;
never create or recommend legacy `workflow.config.yml`.

## Entry Points

Resolve the workflow launcher relative to this `SKILL.md` as
`../../scripts/spectrack`, then run `setup.py` through it. In installed
workflow sessions, the `spectrack` launcher is already on `PATH`.

Useful commands:

```bash
spectrack setup.py probe-git-remote --project <project-root>
spectrack setup.py ensure-github-labels --project <project-root> [--repo <owner/repo>] [--host <host>]
spectrack setup.py profile-from-docs <profile-docs...>
spectrack setup.py capabilities --issue-provider <provider> --knowledge-provider <provider>
spectrack setup.py jira-relationship-inspect --jira-site <url> --issue <KEY>
spectrack setup.py jira-relationship-inspect --jira-site <url> --jira-project <PROJECT> --issue <ISSUE-123>
spectrack setup.py jira-relationship-inspect --jira-site <url> --field-query <field-name-or-id>
spectrack setup.py jira-state-transition-inspect --jira-site <url> --issue <KEY-A> --issue <KEY-B>
spectrack setup.py jira-relationship-mappings --issue-link blocked_by=Blocks:inward --field child=parent:target:key
spectrack setup.py build-config --project <project-root> --issue-provider <provider> --knowledge-provider <provider> <options...>
spectrack setup.py build-config --issue-provider jira --knowledge-provider <provider> --jira-snapshot-hidden-comment-marker '!git-event' <options...>
spectrack setup.py build-config --issue-provider jira --knowledge-provider <provider> --jira-epic-field-name <id> --jira-epic-field-link <id> --jira-epic-field-status <id> [--jira-epic-issue-type <NAME>] <options...>
spectrack setup.py build-config --issue-provider jira --knowledge-provider <provider> --jira-state-transition <verb>=<transition> [--jira-state-transition <verb>=<transition> ...] <options...>
spectrack setup.py build-config --project <project-root> --issue-provider <provider> --knowledge-provider <provider> --disable-mustread <options...>
spectrack setup.py write --project <project-root> --config <reviewed-yaml-file>
spectrack config.py --project <project-root> --require
```

## Setup Flow

1. Resolve the repository root. Prefer `git rev-parse --show-toplevel`; if the
   project is not a Git repository, use the user's explicit target directory.
2. If `.spectrack/config.yml` already exists, summarize its issue provider,
   knowledge provider, commit reference style, and whether `mustread` is
   required. Do not overwrite it unless
   the user explicitly requests overwrite; pass `--force` only after that
   confirmation.
3. Collect the issue provider: `github`, `jira`, or `filesystem`. Ask the user
   when it was not already named explicitly by the user or a provider profile;
   do not infer it from a Git remote or assume GitHub.
4. Collect the knowledge provider: `github`. Ask the user when it was
   not already named explicitly by the user or a provider profile. For
   the `github` knowledge provider, also collect the knowledge folder
   path (`--github-wiki-path`) from the user. There is no default; ask
   the user which repo-relative folder should hold knowledge pages (for
   example `wiki/<project>`, `docs/workflow`, or `knowledge/`) and pass
   the confirmed value through `--github-wiki-path`. Do not assume,
   suggest, or fall back to `wiki/spectrack` or any other path the user
   has not named. Then ask whether PRD-component pages should live in a
   dedicated subdirectory inside that knowledge folder. If yes, collect
   the subdirectory name (for example `prd`) and pass it through
   `--github-wiki-prd-path`; the value must be relative to
   `--github-wiki-path` and must not contain `..`. When the user wants
   PRD pages at the knowledge folder root, omit
   `--github-wiki-prd-path`.
5. If the issue provider is `jira`, run the Jira site profiling flow before
   `capabilities` or `build-config`. Collect representative sample issue keys,
   inspect relationship surfaces, ask the user to confirm exact mappings, and
   generate mapping YAML with `jira-relationship-mappings`. If the sample
   issues or confirmed mappings are unavailable, stop setup as incomplete; do
   not offer to defer Jira relationship setup until later.
6. For Jira issue providers, ask whether the user plans to drive workflow
   state transitions through `--state` or the dynamic
   `issue state <KEY> <verb>` verb. If yes, run the State Transition Profiling step
   inside Jira Site Profiling, accept the `auto_verbs` defaults derived by
   `jira-state-transition-inspect`, collect any verb overrides, and pass
   the confirmed mapping to `build-config` via
   `--jira-state-transition <verb>=<transition>` (repeatable). Skip when
   the user does not intend to drive transitions through the workflow.
7. For Jira issue providers, ask whether local Jira snapshots should hide
   automation comments by body marker. If the user gives markers such as
   `!git-event`, pass each one with
   `--jira-snapshot-hidden-comment-marker`.
   Also ask independently whether LLM-authored Jira `task` drafts and Jira
   comment drafts should be reviewed by project custom agents before
   publishing. Collect each exact host-resolvable agent name and pass it as
   `--jira-task-review-agent` or `--jira-comment-review-agent` respectively.
8. Ask whether artifact drafting should require `spectrack mustread` to be run
   first. By default, mustread is required and ensures contract information is
   loaded before drafting issues or creating artifacts. When disabled with
   `--disable-mustread`, users can draft artifacts without running mustread,
   though contract references may be less complete. When the user chooses to
   disable mustread, pass `--disable-mustread` to `build-config`.
9. Collect the commit reference style.
10. For GitHub issue providers, after the `owner/repo` slug is settled and
   before `build-config`, run `ensure-github-labels` to create any missing
   canonical issue-type labels (`task`, `bug`, `spike`, `epic`, `review`,
   `usecase`, `research`) in the repository. Existing labels are skipped, not
   overwritten. Show the user the created/skipped result, then pass the
   returned merged `labels` set into `build-config` via `--github-labels-json`
   (the command emits a JSON `labels` array) so the written config records the
   full label set under `providers.issues.settings.labels`. Skip this step for
   `jira` and `filesystem` issue providers.
11. Run `capabilities` for the selected providers and show limitations before
   confirmation.
12. Run `build-config`, show the generated YAML and warnings to the user, and
   ask for explicit confirmation before writing.
13. After confirmation, write with `write --config <reviewed-yaml-file>`. The
   write step also installs SpecTrack Codex agent roles. Tell Codex users to
   restart Codex before using newly installed roles. Then verify with
   `config.py --require`.
14. `write` also records the configured knowledge folder under a
   `## SpecTrack Knowledge` section in `<project-root>/AGENTS.md`
   (auto-created when missing) and creates `<project-root>/CLAUDE.md`
   as a `@AGENTS.md` shim if absent. The generated section records the
   repository-relative knowledge path, not the local absolute path.
   Skipped when the github knowledge provider has no `path` configured.

## Provider Rules

- GitHub issue setup should use an explicit `owner/repo` slug. If the user has
  not provided one, run `probe-git-remote` and ask before using the detected
  slug. When the issue repository is not on `github.com`, use
  `--github-issue-host`; use `--github-host` only as a shared fallback when the
  issue and knowledge repositories are on the same GitHub host.
- GitHub issue setup pre-creates the canonical issue-type labels via
  `ensure-github-labels` (skip-existing, never overwrite) and records the merged
  repository label set into `providers.issues.settings.labels`. This runs only
  for the `github` issue provider and requires an authenticated `gh`. The
  recorded labels are viewable at runtime with `spectrack issue labels`. It is
  a separate step from `build-config`/`write`, which stay usable offline.
- Always pass explicit `--issue-provider` and `--knowledge-provider` values to
  `build-config` or `write` when building config from options. Missing provider
  flags mean setup is incomplete; ask for the provider choice before continuing.
- GitHub knowledge setup represents a repository-relative directory.
  `--github-wiki-path` has no default and must be supplied by the user.
  Always ask the user which folder should hold the knowledge pages
  (for example `wiki/<project>`, `docs/workflow`, `knowledge/`) and pass
  the confirmed value exactly through `--github-wiki-path`. Do not
  assume, suggest, or fall back to `wiki/spectrack` or any other path
  the user has not named. If the knowledge/wiki repository host differs
  from the issue repository host, use `--github-wiki-host`.
  `--github-wiki-prd-path` is optional and locates PRD-component pages
  inside the knowledge folder. The value must be relative to
  `--github-wiki-path` and must not contain `..`. When omitted, PRD
  pages sit at the knowledge folder root.
- Jira setup supports Data Center / Server and Cloud. An `*.atlassian.net`
  site is detected as Cloud on REST v3; omit `--jira-deployment` and
  `--jira-api-version` unless the user names them. Cloud calls need the
  account email (see Jira Site Profiling) and an API token
  (`JIRA_API_TOKEN`, or the macOS Keychain); if inspection fails with a
  credential error, ask the user to provide them rather than retrying.
- Jira issue setup requires explicit `providers.issues.relationship_mappings`
  before final config generation. Collect sample issue keys, inspect the Jira
  site, and ask the user to confirm exact mappings. If site data or confirmed
  mappings are unavailable, pause setup as incomplete; do not build or write a
  Jira issue config and do not suggest configuring relationships later. Do not
  infer Jira link type, direction, remote-link surface, parent field,
  `write_to`, or value semantics from prose.
- For Jira relationship setup, use `jira-relationship-inspect` only to show
  observed link types, fields, and sample issue relationship data. Then ask the
  user to confirm the exact mappings and generate the mapping YAML with
  `jira-relationship-mappings`. Feed the confirmed YAML into `build-config`
  with `--jira-relationship-mappings-file` or
  `--jira-relationship-mappings-json`.
- When Jira setup needs site-specific field names, hierarchy semantics,
  issue-type rules, label policy, or body-renderer behavior, run the Jira site
  profiling flow in this skill before building the final config.
- Jira comment hiding is opt-in. Use
  `providers.issues.snapshot.hidden_comment_markers` only when the user or
  provider profile supplies exact body markers. The markers hide matching
  comments from local snapshots; they do not delete provider comments.
- Jira labels are opt-in. Do not copy local labels into Jira unless the user or
  provider profile explicitly asks for label writes.
- Jira Epic configuration (`providers.issues.epic_fields.{name,link,status}`
  and `artifact_issue_types.epic`) is opt-in and site-dependent. When the user
  plans Epic creation or Epic Link writes, source the values from
  `jira-relationship-inspect` (run with `--jira-project` so createmeta is
  available) and pass confirmed ids to `build-config` via
  `--jira-epic-field-name|link|status` and `--jira-epic-issue-type`. Do not
  assume values; if the site lacks Jira Software or returns non-default field
  schema, ask the user for explicit ids.
- Jira state transitions (`providers.issues.state_transitions.<verb>`) are
  opt-in and workflow-dependent, and the verb space is free-form except
  for the reserved CLI verbs (`assign` / `unassign` / `set-type`). When
  the user plans to drive transitions through `--state <verb>` on
  `issue update` / `issue comment`, or through
  `issue state <KEY> <verb>`, source the transition names from
  `jira-state-transition-inspect` (run against sample issues that sit on
  each side of the workflow so transitions in both directions are visible).
  The inspect output includes an `auto_verbs` map derived from each
  observed transition name (lowercase + non-alphanumeric → hyphen), with
  collisions against reserved verbs or duplicate slugs skipped + warned.
  Confirm the verb-to-transition mapping with the user, accepting the
  derived verbs by default and overriding only when the slug is awkward
  or was skipped, then pass each confirmed pair to `build-config` via
  `--jira-state-transition <verb>=<transition>` (repeatable). Do not
  assume transition names; the Jira API only returns transitions
  reachable from the issue's current state.
- Provider profile documents may seed defaults only when they explicitly discuss
  workflow providers. Ignore unrelated Git remote or commit-history documents.

## Jira Site Profiling

This flow is required whenever the issue provider is `jira`. Also use it when
Jira setup needs custom fields, issue type rules, label policy, or sub-task
behavior. Keep a hard boundary between observed Jira data and
confirmed workflow config: inspect the site, show the evidence, ask for
confirmation, then use only the exact confirmed values in setup.

1. Resolve the Jira site, deployment, API version, and project key from the
   user, provider profile, or `.spectrack/config.yml`. When the site is Jira
   Cloud, ask the user for their Atlassian account email and pass it as
   `--jira-email` to every inspect command and to `build-config`, which
   records it as `providers.issues.email`. Mention that `JIRA_EMAIL`
   overrides it, so teammates sharing a committed config can use their own.
2. Collect sample issue keys for each relationship surface the user cares about:
   an issue with dependencies or related links, a parent issue with sub-tasks, a
   sub-task, and any site-specific hierarchy example.
3. Run `jira-relationship-inspect` for link types, native `parent/subtasks`,
   and requested field queries. When `--jira-project` is supplied, the same
   call returns an `epic` block: Epic Name / Link / Status customfield ids
   discovered by Greenhopper schema or name heuristic, candidate Epic issue
   types from createmeta, per-issue-type Epic Link availability, and warnings.
4. When the user plans Epic creation or Epic Link writes on the site, extract
   `epic.fields.{name,link,status}.id`, `epic.issue_types`, and any
   `epic.warnings` from the inspect output and confirm with the user. When
   `epic.issue_types` returns zero or two-or-more candidates, ask the user for
   the exact Epic issue-type name. If `epic.fields` are missing or
   `epic.warnings` indicate a non-default schema, ask for explicit field ids
   before continuing. Skip this step when the site lacks Jira Software or the
   user has no Epic intent.
5. When the user plans to drive workflow state transitions, collect sample
   issue keys reachable on each side of the workflow (typical: one issue
   in an early state and one in a terminal state) and run
   `jira-state-transition-inspect --jira-site <url> --issue <KEY-A> --issue
   <KEY-B>`. Show the observed transition names per sample issue, the
   `observed_transition_names` union, the `auto_verbs` mapping
   (lowercase + non-alphanumeric → hyphen of each transition name), and
   any `warnings` (transitions whose derived verb collided with a reserved
   CLI verb or with another transition's slug are listed there). Ask the
   user to confirm each verb-to-transition pair, accepting the
   `auto_verbs` default when the slug is fine or overriding to a custom
   verb when the default was skipped or is awkward. The Jira API only
   returns transitions reachable from each issue's current state, so
   sampling both sides is typically required. Pass the confirmed mapping
   to `build-config` via `--jira-state-transition <verb>=<transition>`
   (repeatable). Skip this step when the user does not intend to drive
   transitions through the workflow.
6. If issue creation behavior matters, inspect issue type metadata and ask
   before running any create/update test. Sub-task creation is a mutation.
7. Determine label policy from the user or provider profile. Labels are opt-in;
   never copy local labels into Jira by default.
8. Determine whether automation comments should be hidden from generated Jira
   snapshots, and record only exact user-confirmed markers.
9. Summarize observed link types, hierarchy surfaces, custom fields, confirmed
   Epic field ids and Epic issue-type, confirmed state-transition mapping,
   label policy, snapshot-hidden comment markers, confirmed relationship
   mapping YAML, and open questions before
   generating the final config.

Rules:

- Do not hardcode organization values in skills or setup defaults.
- Do not infer `link_type`, `direction`, `surface`, field id, `write_to`, or
  value kind from prose.
- Do not map a custom field to a workflow relationship until the user confirms
  the relationship name and direction.
- Keep portfolio, team, parent-link, or other hierarchy fields site-specific.
  Report what Jira returned; do not assign global semantics.
- Treat `parent` and `child` as Jira native parent/subtask or explicitly
  confirmed hierarchy mappings only.
- Do not assume Epic field ids or Epic issue-type names. Use only values
  confirmed against the `epic` block in `jira-relationship-inspect` output and
  explicit user confirmation. Pass confirmed ids to `build-config` via
  `--jira-epic-field-name|link|status` (and `--jira-epic-issue-type` when the
  Epic issue-type name differs from the default `Epic`).
  `relationship_mappings.epic` is auto-injected by `build-config` when
  `epic_fields.link` is supplied; do not write it manually in
  `--jira-relationship-mappings-file` or `--jira-relationship-mappings-json`.
- Do not create, update, delete, or link Jira issues without explicit user
  approval for that mutation.

## Jira Relationship Mapping Shape

Use `--jira-relationship-mappings-json` or
`--jira-relationship-mappings-file`. Each mapping must include explicit
`surface`.

The compact mapping helper accepts exact relationship specs:

```bash
spectrack setup.py jira-relationship-mappings \
  --issue-link blocked_by=Blocks:inward \
  --issue-link blocking=Blocks:outward \
  --remote-link "related=relates to" \
  --remote-application-type studykit.spectrack \
  --remote-application-name Workflow \
  --field child=parent:target:key \
```

```yaml
blocked_by:
  surface: issue_link
  link_type: Blocks
  direction: inward
blocking:
  surface: issue_link
  link_type: Blocks
  direction: outward
related:
  surface: remote_link
  relationship_label: relates to
  application_type: studykit.spectrack
  application_name: Workflow
```
