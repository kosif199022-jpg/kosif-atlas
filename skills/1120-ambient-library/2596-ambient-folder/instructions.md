# ambient-folder

Makes a folder ambiently intelligent and maintains it over time: the
**incept → stamp → install → personalize → learn → update** lifecycle of the
`.aai`/`.ailib` scaffold.

Self-contained by design — it writes the scaffold directly rather than copying a
template, so it behaves the same installed standalone, vendored into a folder's
`.ailib/`, or bundled in the `ambient` plugin.

**One operation per request.** Pick from the table, execute it, report. Don't
chain operations the user didn't ask for.

| User wants | Operation |
|---|---|
| A folder for a purpose they haven't articulated yet | **Incept** — interview, then stamp |
| A folder whose purpose they can already state in a sentence | **Stamp** |
| A canonical capability added to a folder | **Install** |
| To customize a capability a folder already has | **Personalize** |
| A recurring pattern turned into a standing rule | **Learn** |
| Vendored capabilities refreshed from canonical | **Update** |

## The model (governs every operation)

A folder becomes ambient by carrying `.aai/`. Its visible contents don't change;
`.aai/` overlays behavior onto them.

```
<folder>/
├── .aai/                  # OWNED — no operation here ever overwrites it
│   ├── instructions.md    #   required: what the folder does with a request
│   ├── identity.md        #   who it is: voice, disposition, ground rules
│   ├── context.md         #   routing map of contents — find without reading
│   ├── memory/            #   runtime state across runs (optional)
│   ├── references/        #   rules internalized as constraints (optional)
│   └── skills/            #   per-capability: values, overrides, forks (optional)
└── .ailib/                # VENDORED — pristine canonical copies, re-syncable
    ├── manifest.yaml      #   what's installed: name, source, version
    └── <capability>/
```

- **`.aai/` is owned.** Updates never touch it.
- **`.ailib/` is vendored.** Install and update may delete and re-sync it freely.
- **`.aai/` shadows `.ailib/`.** When both define `<cap>`, the `.aai/` copy wins.

### Resolving a capability by name

A capability is referred to by **name**, never by a fixed location — a path
baked into one skill breaks the moment that skill is vendored somewhere else.
To resolve `<cap>`, take the first of these that exists:

1. `<folder>/.aai/skills/<cap>/` — the folder's own or forked version, if it
   holds an `instructions.md`. Without one it is that project's *data* for
   `<cap>` (`project.yaml`, `environment.yaml`, `overrides.md`), not a fork —
   keep resolving.
2. `<folder>/.ailib/<cap>/` — vendored canonical
3. `${CLAUDE_PLUGIN_ROOT}/library/<cap>/` — the canonical library, if reachable

If none exists, say which capability is missing and what would supply it. Don't
silently improvise the missing stage.

This is why vendoring a capability that depends on others still works when the
library is reachable, and why vendoring its dependencies (below) is what makes
the folder work when it isn't.

Only `instructions.md` is required. Create optional elements when the behavior
needs them — an empty `memory/` is clutter every future reader must rule out.
`.ailib/` is created by the first install, never by a stamp.

## Incept — interview, then stamp

For a folder whose purpose still needs drawing out. Skip straight to Stamp if
the user already stated it.

### 1. Confirm the target

Resolve to an absolute path and confirm. If it already has
`.aai/instructions.md`, stop and report — never overwrite an existing profile.
If the folder doesn't exist, create it after the interview, not before.

### 2. Interview

One structured round, then at most one follow-up. Adapt phrasing; skip anything
already answered:

1. **Purpose** — when an agent lands here with a request, what should happen?
   What does the folder *do*?
2. **Inputs and outputs** — what material does the work consume, and what
   artifacts land where when it's done?
3. **Disposition** — quiet until matched, or proactive? Ask before acting, or
   act and report? Any invariant it must never break?
4. **Contents** — what already lives (or will live) in the folder?
5. **Inheritance** — recurring work here a proven capability should handle
   (writing, research, review, publishing)?

Refusal gate: if after one follow-up the purpose is still a vague noun ("stuff
for clients"), stop and name what's missing. A folder stamped without a real
behavior contract is worse than none — its instructions won't route and its
identity is filler.

### 3. Stamp from the answers, then offer inheritance

Run **Stamp** below with the interview answers, then **Match** and **Install**.

## Stamp — write the scaffold

Confirm the target as in Incept step 1, then write each file. No placeholder
prose survives; everything traces to something the user said.

**`identity.md`** — name, one-sentence purpose, disposition, and the user's
stated invariants as ground rules.

**`instructions.md`** — a contract, in this order:
- *When this applies* — one paragraph written as user intent (this is the
  routing trigger, not a description of internals).
- *Inputs* — a table of file / kind / load-when. Kinds: `reference`
  (internalize as constraints), `vendored` (resolve `.aai/skills/<cap>` first —
  shadowing), `working` (process as input). Keep reference and working material
  separate; mixing them in one load is the most common failure.
- *Process* — the steps. Deterministic steps become scripts; leave inference
  only where judgment or generation is genuinely required.
- *Outputs* — what lands where. Every output a plain file a human can edit.
- *Rules* — gotchas first, then ground rules.

**`context.md`** — a routing map: one line per item, path / what it is / read
when. `ls` the target and describe what's **actually** there; never invent
layout. A not-yet-populated folder gets the planned layout, marked as planned.
Never inline content — point to it.

Reference siblings relative to the folder root, never by absolute path — the
folder must survive being copied or moved.

## Match — find canonical capabilities

If the library is reachable (bundled as `${CLAUDE_PLUGIN_ROOT}/library/`, or a
clone the user names), read **only** `catalog.yaml` and match the folder's
purpose against descriptions — never read skill bodies to decide relevance.
Propose at most 3 with one line each on why.

Zero matches is a fine outcome. If no library is reachable, skip silently — a
folder is local-first and the library is an upgrade path, never a prerequisite.

## Install — vendor a capability and its dependencies

The mechanical steps below are implemented in `install.sh` next to this file
(`bash install.sh <cap> [target]`, `--check` to plan). Prefer running it; the
prose is the contract it follows. A capability that ships `templates/aai/` is a
**distro**: the script also stamps `.aai/` from those templates on first
install (never on re-run), lists its `DEPENDS` as the closure, and runs its
`install.d/post.sh`.

1. Resolve the capability in the library: `<library>/<cap>/`.
2. Copy it pristine into `<target>/.ailib/<cap>/` — the **whole directory**.
   Scripts, `references/`, `templates/`, and assets are part of the capability
   and travel with it; a capability missing its own siblings is broken.
3. **Vendor the dependency closure.** Grep the copied body for references to
   other capabilities — `library/<other>/` is the reference form — and vendor
   each one the same way, recursively, until no new names appear. Most
   capabilities pull in nothing; a pipeline like `writing-team` pulls in its
   stages.
4. Record every vendored capability in `<target>/.ailib/manifest.yaml` with
   name, source, and version. Mark ones pulled in as dependencies with what
   required them, so a later removal knows they weren't asked for directly.

Never edit inside `.ailib/` — edits there are lost on the next update, by
design. No confirmation means no `.ailib/` at all.

**When the closure is optional:** if the canonical library will stay reachable
from this folder, step 3 is redundant — resolution falls through to it. Vendor
the closure when the folder must work standalone: it's going somewhere the
library isn't, it's being handed to someone else, or it needs to be pinned
against library changes. Say which you're doing and why, in one line.

## Personalize — adjust a capability the folder has

Three tiers. Take the first that covers it; only the last gives up updates.

1. **Values.** A capability that ships a `contract.yaml` takes its per-project
   values from `<target>/.aai/skills/<cap>/project.yaml` and inherited ones
   from the nearest `environment.yaml` at or above the project — which, with
   nothing vendored above it, is `~/.aai/skills/<cap>/environment.yaml`. Its own
   `scripts/resolve.py` asks once and writes both; never hand-place them.
2. **Extra rules.** One or two standing instructions go in
   `<target>/.aai/skills/<cap>/overrides.md`, applied after the capability body.
3. **Fork.** Copy `<target>/.ailib/<cap>/` → `<target>/.aai/skills/<cap>/` and
   edit the copy. The folder resolves `<cap>` to the fork and the pristine
   canonical stays in `.ailib/` for comparison — but the fork stops receiving
   upstream changes, so reach for it last.

## Learn — promote memory into a reference

`.aai/memory/` is runtime state (handoffs, progress, observations across runs)
that no update touches. When a pattern recurs — the same correction three runs
running — promote it deliberately into `.aai/references/<rule>.md` as a rule the
behavior internalizes as a constraint. Memory is where the folder notices;
references are where it has learned.

## Update — re-sync vendored capabilities

Re-run `install.sh <cap> <target>` — from the library, or from the folder's own
`.ailib/ambient-folder/install.sh` when the library is not reachable.

For each entry in `<target>/.ailib/manifest.yaml`, re-copy the pristine
capability from the library and refresh its version. Re-run the closure check
from Install step 3 — a refreshed capability may have gained a dependency the
folder doesn't have yet. `.aai/` — forks, references, and memory — is
untouched. That is the entire point of the ownership boundary: a personalized
fork keeps overriding the refreshed `.ailib/` copy via shadowing.

## Anchor — make the folder discoverable

After any operation that creates `.aai/`: a cold agent finds it only through an
anchor. `install.sh` always anchors `CLAUDE.md` and `AGENTS.md`, and also
anchors any other adapter instruction file the folder *already* has — `GEMINI.md`,
`QWEN.md`, `CONVENTIONS.md`, `.cursorrules`, `.windsurfrules`, `.clinerules`,
`.github/copilot-instructions.md`. It never creates those, because the installer
does not get to decide which agents you run. Doing this by hand: write an anchor
stating the folder is ambient and the agent should read `.aai/instructions.md`
and follow it, into every adapter file the folder uses. If the file exists,
append — never replace existing project instructions.

## Rules

- Confirm the target path before writing. Never stamp or install into the
  library repo itself by accident.
- On Incept, the interview is the product: no invented purpose, disposition, or
  layout.
- Report in plain language — which files, which folder. On Incept, read the
  purpose back in one sentence; if it sounds wrong to the user, the scaffold is
  wrong.
- Recursion is graduated. A subfolder becomes ambient only when it has behavior
  of its own, not because it exists.
