---
name: semver
description: >-
  Decide the correct Semantic Version bump for a change (major/minor/patch) by analyzing the diff against the project's public surface and running the ecosystem's breaking-change detector, then apply it (bump the manifest + changelog). Stack-agnostic, detects Rust/Cargo, npm/pnpm/yarn, Go modules, Elixir/Hex, Python, or a plugin.json/VERSION file from whatever manifest is present. Use when deciding a version bump, judging whether a change is breaking, choosing what version to release, reviewing an API or public-surface change for compatibility, or before tagging a release. Triggers on SemVer, semantic versioning, major/minor/patch, breaking change, "what version", "bump version", or /semver.
---

# semver

Answer the question people get wrong: **is this change breaking, and therefore what is the next version?** The spec is trivial; the judgment is not. This skill decides the bump from evidence, then applies it. It is repo-agnostic: it works on any project that has versioning.

## The rule (and the 0.x asterisk)

Given the last released version and the change since it:

| Bump | Meaning | Trigger |
|---|---|---|
| **MAJOR** | Breaking | anything a working consumer depends on could stop working (checklist below) |
| **MINOR** | Feature | backward-compatible addition (new API / flag / optional field) |
| **PATCH** | Fix | behavior-preserving change (bugfix, docs, perf, internal refactor) |

**Pre-1.0 (`0.y.z`)**: no compatibility guarantees. By convention, bump MINOR for a breaking change and PATCH for everything else until you commit to 1.0. State which convention the project follows before recommending.

## Workflow

1. **Resolve the change.** Diff since the last release tag: `git describe --tags --abbrev=0` then `git diff <tag>...HEAD`; fall back to the branch base if untagged. The unit is "what changed since the version consumers currently have."
2. **Detect the ecosystem** from the manifest present (table below). It dictates both the public surface and the breaking-change tool.
3. **Run the breaking-change detector** for that ecosystem (commands in [REFERENCE.md](REFERENCE.md)). Read its output as evidence; do not eyeball. Degrade to a manual judgment (and say so) if no detector is installed.
4. **Classify** each changed public item against the checklist. The highest-severity change wins the bump.
5. **Apply.** Compute the new version, bump the manifest with the ecosystem's native command, add a [Keep a Changelog](https://keepachangelog.com) entry, and tag `vX.Y.Z` if the project tags releases.

## Is it breaking? (public surface, by consumer)

Assert only on what a consumer can observe. A change is breaking if their working usage could stop compiling or behaving:

| Surface | Breaking (MAJOR) | Additive (MINOR) |
|---|---|---|
| Library / API | removed or renamed exported symbol; changed signature, type, or return/error contract; new required parameter; narrowed input acceptance | new exported symbol; new optional parameter; widened acceptance |
| CLI | removed/renamed flag or command; changed default that changes behavior; changed output consumers parse | new flag/command; new opt-in output |
| HTTP / RPC | removed/renamed field or endpoint; changed status/error semantics; stricter validation | new endpoint; new optional field |
| Wire / serialization / schema | layout change old data or peers cannot read | backward- and forward-compatible field addition |
| Config | removed/renamed key; changed default behavior | new optional key with a safe default |

Internal-only changes (private symbols, tests, docs, refactors with identical public behavior) are **PATCH**. Unsure if something is public? Check whether it is exported, documented, or reachable by a consumer; if not, it is internal.

## Ecosystem detection

| Manifest present | Ecosystem | Detector (see REFERENCE.md) |
|---|---|---|
| `Cargo.toml` | Rust | `cargo semver-checks` |
| `package.json` | npm / pnpm / yarn | `attw` + `api-extractor` / `api-diff` |
| `go.mod` | Go | `gorelease` / `apidiff` (+ the v2+ import-path rule) |
| `mix.exs` | Elixir | manual public-surface review |
| `pyproject.toml` / `setup.py` | Python | `griffe check` |
| `.claude-plugin/plugin.json` | agent-skills | hand off to `publish-skill --bump` / `release.py` |
| `VERSION` / other | generic | manual, via the checklist |

## Output

State the bump (MAJOR / MINOR / PATCH), the exact new version, and the 1-3 changes that drove it (surface + why breaking). If nothing public changed, say PATCH and why. Then apply, or hand off to the project's release tooling.

## Anti-patterns

- Do not recite the spec; decide the bump for *this* diff, with evidence.
- Do not guess "breaking" from a hunch when a detector exists for the ecosystem.
- Do not bump MAJOR for an internal refactor, or PATCH a changed public signature.
- Do not forget the 0.x convention: pre-1.0 breaking is a MINOR by custom, not a MAJOR.
- Do not reinvent version-file editing; use the native command (`npm version`, `cargo set-version`, `poetry version`, or `publish-skill`).
