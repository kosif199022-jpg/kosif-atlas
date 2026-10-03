# semver — per-ecosystem detectors

Run the detector for the manifest present, read its output as evidence, then decide the bump with the SKILL.md checklist. Install commands assume the tool is missing; degrade to a manual judgment (and say so) if it cannot be installed.

## Rust — `Cargo.toml`

```bash
cargo install cargo-semver-checks --locked   # once
cargo semver-checks check-release            # vs the last published crates.io version
```
Reports the *required* bump for a library crate's public API (removed items, changed signatures, etc.). Authoritative for libs. Apply with `cargo set-version --bump major|minor|patch` (from `cargo-edit`) or edit `version` in `Cargo.toml`, then tag `vX.Y.Z`.

Caveat: a binary-only crate has no public API surface — judge by CLI/behavior instead.

## npm / TypeScript — `package.json`

```bash
npx @arethetypeswrong/cli --pack     # type-resolution / export-shape breakages
npx @microsoft/api-extractor run     # or api-extractor to diff the public .d.ts surface
```
For a library, a type-level change (removed export, changed signature, narrowed type) is breaking even if runtime is unchanged. Apply with `npm version major|minor|patch` (edits `package.json` and creates the tag).

Caveat: a private app (`"private": true`, not published) does not need SemVer — skip.

## Go — `go.mod`

```bash
go install golang.org/x/exp/cmd/gorelease@latest
gorelease -base=<last-tag>           # recommends the next version/tag
# or: go install golang.org/x/tools/cmd/apidiff@latest  (lower-level API diff)
```
Go encodes MAJOR in the **import path** for v2+ (`module example.com/foo/v2`). A breaking change is not just a new tag — it is a new module major version (new path + directory convention). `gorelease` enforces this. Tag `vX.Y.Z`.

## Elixir — `mix.exs`

No first-class API-diff tool. Judge the public surface manually: public = documented functions/modules that are not `@doc false` / not `@moduledoc false`. `mix hex.publish` surfaces some warnings. Edit `version:` in `project/0`, then tag.

## Python — `pyproject.toml` / `setup.py`

```bash
pipx install griffe
griffe check <package> --against <last-tag>   # reports public API breakages
```
Apply with `poetry version major|minor|patch`, `hatch version <part>`, or edit `[project] version`, then tag.

## agent-skills — `.claude-plugin/plugin.json`

Do not hand-bump. Per-skill bump + changelog: `publish-skill --bump patch|minor|major`. Collection release: `scripts/release.py --bump ...`. See the repo's `VERSIONING.md`.

## Generic — `VERSION` file or none of the above

No detector. Classify manually against the SKILL.md public-surface checklist, state that it was a manual judgment, and name the tool that would confirm if one existed. Bump the version file and tag.

## Pre-release & build metadata

- Pre-releases: `1.2.0-rc.1`, `1.2.0-beta.2` — lower precedence than the final `1.2.0`. Use for release candidates before a risky MAJOR.
- Build metadata: `1.2.0+build.5` — ignored for precedence; do not use it to convey meaning.
- Precedence: `1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-beta < 1.0.0-rc.1 < 1.0.0`.
