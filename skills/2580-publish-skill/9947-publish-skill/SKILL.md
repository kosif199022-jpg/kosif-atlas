---
name: publish-skill
description: "Publish one of the user's own skills from ~/.claude/skills to the mqmalagris/agent-skills GitHub repo — copies the skill under skills/<name>/, mints its .claude-plugin/plugin.json, upserts the marketplace.json entry, bumps its version, and opens a PR against main (CI-gated). Use when the user says 'publish this skill', 'push <skill> to my repo', 'add <skill> to agent-skills', 'ship this skill', or wants a locally-authored skill added to their public skill collection. NOT for third-party skills (those go in THIRD_PARTY.md, not vendored) or for editing skill content."
---

# publish-skill

Publishes a locally-authored skill (`~/.claude/skills/<name>/`) to **mqmalagris/agent-skills** (a dual-format Claude-marketplace + `bunx skills` repo). The script does all mechanical work idempotently; you supply the two editorial bits it can't guess: **category** and **keywords**.

Do not use this for third-party skills — those belong in the repo's `THIRD_PARTY.md`, not vendored. Skills written *for* an employer or a client stay out entirely: authoring one does not make it yours to publish, and the tool it drives is usually internal anyway.

## Steps

1. **Confirm it's the user's own skill.** If it's a fork/adaptation, note the upstream so the description can attribute it (the repo credits adapted skills). Bail if it's third-party.
2. **Decide category + keywords, and the version bump.** Read the skill's `SKILL.md`. Category matches the repo's groups: `engineering-workflow`, `security`, `development`, `reporting`, `career`, `product`, `meta`, `marketing`. Keywords: 3-6 kebab tags. Description is derived from the SKILL.md frontmatter unless you pass `--description`. Pick the SemVer bump for an existing skill (default PATCH; use `--bump minor` for a new capability, `--bump major` for a breaking change) per [[reference-agent-skills-repo]] / the repo's `VERSIONING.md`.
3. **Run the script** (kebab-case skill name = its dir name):
   ```bash
   python3 ~/.claude/skills/publish-skill/scripts/publish_skill.py <skill-name> \
     --category <category> --keywords tag-a,tag-b,tag-c
   ```
   It refreshes a repo cache, copies the skill, mints `plugin.json`, upserts `marketplace.json`, **bumps the skill's version** (PATCH on update), **logs a `CHANGELOG.md` `[Unreleased]` line**, validates all JSON, commits on a `publish/<name>-v<version>` branch, and **opens a PR against `main`** (CI `validate` gates it). Merge overrides: `--auto-merge` (merge when CI passes), `--merge` (merge now, squash+admin), `--push-main` (legacy: push straight to `main`, no PR). Other: `--bump minor|major`, `--version X.Y.Z`, `--no-bump`, `--changelog "text"`, `--description "..."`, `--no-push`, `--dry-run`, `--skip-evals`. If the skill ships an `evals/` suite, the script runs it on your own Claude login before committing (`scripts/eval-run.sh <name> --record`) and commits the result to `evals-history/<name>.jsonl`, the eval trend; a suite below threshold aborts the publish.
4. **Update the README table.** The script prints a suggested row and the target `skills/` path. Add that row to the right group section in the repo's `README.md` (goes in the same PR branch, or a follow-up PR). Skip only if the user says the README doesn't matter.
5. **Report** the PR URL + new version, and (post-merge) the install commands: `bunx skills add mqmalagris/agent-skills -s <name>` and `/plugin install <name>@agent-skills`.
6. **Cutting a release (optional, when done publishing).** Per-skill publishes accumulate under CHANGELOG `[Unreleased]`. To snapshot the collection, run the repo's release cutter (it validates, bumps the collection version, rolls the changelog, tags `vX.Y.Z`, and creates a GitHub Release):
   ```bash
   python3 ~/.cache/agent-skills-publish/scripts/release.py --bump minor   # or --version X.Y.Z
   ```

## Notes

- Re-running for the same skill **updates** it (no duplicate marketplace entry), preserves its category/keywords/description, and bumps the version — safe for republishing after edits.
- Repo conventions and the full layout are in memory `[[reference-agent-skills-repo]]`. The script hardcodes the repo URL, author (Matheus Malagris), and MIT license to match.
- Requires `gh`/git auth for the push (already configured for this user).
