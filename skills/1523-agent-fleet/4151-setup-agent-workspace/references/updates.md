# Versioned updates and source ownership

The plugin owns the template under `assets/template`. Each project tracks a pinned copy of its schema, scripts, tests,
generic `AGENT-WORKSPACE.md`, and `.agents/agent-workspace/install-manifest.json`. The manifest records release,
compatibility, skill mode, runtime build identity, and SHA256 baselines for managed files and instruction blocks. It is
a reviewed ownership record, not a signature or permission grant; commit it with setup/update changes. Preserve it when
customizing tooling so future updates can identify divergence.

```sh
node /path/to/setup-agent-workspace/scripts/update.mjs --target /path/to/project --check
node /path/to/setup-agent-workspace/scripts/update.mjs --target /path/to/project --dry-run
node /path/to/setup-agent-workspace/scripts/update.mjs --target /path/to/project --apply
```

Check exits 0 when current, 2 when a safe update is pending, and 1 on conflicts or prerequisite failures. Preview is the
default. Every updater mode requires affected sessions/runs/claims to be closed; use the installed
`check-installation.mjs` for local read-only drift checks during active work. Preview/check validate the project
configuration against the incoming schema using pinned cached `ajv-cli@5.0.0`; `--offline` requires a complete npm
cache. No project dependencies are installed. Unsupported schema/runtime compatibility is rejected, with no automatic
migration or downgrade policy invention.

The updater compares baseline, current bytes, and incoming release. Unmodified managed files can be replaced or removed;
new files can be added only at approved tooling/operating-skill paths. Locally changed or deleted managed files
conflict. A file deliberately integrated to the exact incoming content is already reconciled. Only delimited blocks in
AGENTS.md, CLAUDE.md and .gitignore are replaced; surrounding human text is preserved. Root configuration, project
checks/roster, Backlog, durable runtime/history, source code, Git index/config/hooks/HEAD and unrelated skills are never
replaced from the template. Changes to repository layout require deliberate config editing before preview.

Apply refuses changes to staged managed paths; unrelated staged bytes remain untouched. It rechecks preview bytes under
`runtime/locks/write.lock`, the same lock used by every coordination CLI mutation. Any active session/run/claim prevents
apply. The generated runtime build identity is embedded in the entrypoint and covers its code and every helper;
mutations compare the loaded identity with the installed manifest under the lock. An old process must retry after an
upgrade, including one suspended before its first manifest read. Helpers publish first, the entrypoint next, and the
manifest last, so a new entrypoint cannot import a mixture of old and new helpers.

Before writing, setup/update saves `runtime/maintenance.json` with the intended release, build, and manifest hash.
Success removes it; interrupted applies retain it and block CLI mutations even after the writer lock is released.
Inspect the error and rerun the exact same release, skill mode, and adoption baseline after resolving the underlying
problem. Already applied incoming bytes/deletions are accepted on retry, including legacy adoption. Never remove the
marker to enable a partly updated runtime. A different target release cannot take over an incomplete transaction. Never
delete a live lock or infer abandonment solely from its age. There is no force-overwrite or destructive rollback option.
First adoption from a runtime without these guards still requires explicitly quiescing all old CLI processes, including
commands paused before registration.

## Local or external operating skills

`init.mjs --skills local` is the standalone default: copy two operating skills and share them with Claude through
`.claude/skills -> ../.agents/skills`. `--skills external` copies no operating skills/provider symlink; install
`unattended-work` and `visual-evidence-review` from the plugin or user skill directories in every host first. Projects
resolve them by name rather than a plugin cache path.

`update.mjs --skills external --dry-run` previews removal of only unmodified, previously managed skill files. Custom
skills and provider links are preserved. Empty skill folders can remain harmlessly; removal is file-scoped. Switching
back to local restores managed skills and creates/validates the shared relative Claude link. Local edits conflict in
either direction. The installer itself is never copied into generated projects. Updating globally installed
skills/package code leaves existing projects pinned until this update command runs.

Operating skills support workspace schema 1/runtime schema 1. Before using a global skill against a project, inspect its
manifest compatibility; unsupported values require an explicit tooling/skill migration. Legacy projects without a
manifest require a verified baseline and an adoption preview before version-dependent workflow changes.

## Adopt an existing installation

```sh
node /path/to/setup-agent-workspace/scripts/update.mjs --target /path/to/project \
  --adopt --baseline-template /path/to/verified/legacy/assets/template --dry-run
# Close all sessions before preview; after inspection, use the same arguments with --apply.
```

Without an explicit baseline, adoption accepts only exact current-template bytes. An explicit legacy template must be
inspected/provenant; no live state or source configuration belongs in it. Every baseline
script/schema/test/operating-skill file must exist and match in the project. The generic guide may be absent in an older
hand-built project; it is added along with safe instruction blocks. Divergence refuses all writes. Adoption never
blesses arbitrary current files by hashing them as a new baseline. Retain the baseline and original skill until
validation succeeds.

## Maintain a release

Edit runtime/schema/tests in the template; edit operating skills in their canonical sibling directories. Do not edit
consumer copies independently. Run:

```sh
node scripts/bundle.mjs --write --version 0.1.2
node scripts/bundle.mjs --check
node --test tests/init.test.mjs tests/update.test.mjs
```

Bundle write synchronizes sibling skills, generates the embedded runtime build identity, and records deterministic
hashes in `release.json`. It normalizes only the embedded identity while hashing runtime source, avoiding a
self-reference. Check detects stale skill copies, an outdated embedded build identity, and unrecorded template edits
without writing. A separately copied complete setup skill can check and install its self-contained bundle without
sibling paths; regeneration requires canonical siblings. Run relevant runtime tests and a copied-skill lifecycle trial
when synchronization/coordination changes. Then use the updater on consumer projects and review their diffs under their
normal commit policy.

Release 0.1.1 adds append-only run check refresh and durable released-claim receipts without changing workspace/runtime
schema versions. Updating preserves existing history but cannot recreate claims discarded by older releases. A legacy
handoff needs the original untruncated claim and snapshot CLI outputs; follow the generated guide's receipt recovery
procedure. Existing dirty implementation must never be made eligible by rewriting baselines or deleting provenance.

Release 0.1.2 adds a completed-assisted-task commit handoff for a later explicit human commit request. It records exact
approved hashes alongside the truthful dirty baseline, requires an on-request profile, and retains all
verification/review/index guards. It does not authorize unattended adoption of inherited changes. Workspace/runtime
compatibility remains version 1.

Release 0.1.3 also accepts explicitly requested checkpoints of unfinished tasks through that exact-byte handoff. It
preserves their status and requires a paused release followed by a fresh ordinary claim before implementation continues.
Checkpoint commits retain configured checks, visual evidence and review; they do not complete acceptance criteria or
automatically finalize unfinished task records. Existing completed-task handoffs keep their original behavior, including
archived claims without the added status field. Workspace/runtime compatibility remains version 1.

Release 0.1.4 supports a single explicit checkpoint claim across configured repositories using repeated `--repo`
options. Exact files are authorized per repository, while source and comparison evidence share claim ownership. A
comparison already committed in the workspace can be reused as an immutable evidence reference for a child-repository
checkpoint. Changed bytes, staged indexes, read-only boundaries, repository identities/HEADs, configured checks and
independent reviews remain guarded; actual commits and snapshots stay repository-specific. Original single-repository
approvals remain readable without a schema migration. Workspace/runtime compatibility remains version 1.
