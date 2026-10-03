---
name: import-skill
description: >
  Import skills from GitHub repositories into the local toolkit. Supports copying a single skill
  from a GitHub directory URL or merging multiple skills into one. Also accepts pasted skill content.
disable-model-invocation: true
allowed-tools: Bash(curl:*) Bash(mkdir:*) Bash(python3:*) Bash(claude plugin validate:*)
license: MIT
compatibility: Designed for Claude Code. Requires curl, python3, and network access to github.com
---

# Import Skill

Import skills from GitHub directory URLs or pasted content. Supports single-skill copy (preserves full directory structure) and multi-skill merge (intelligently combines into one).

Only public GitHub repositories are supported.

## Speed Guidelines

This workflow involves multiple GitHub API calls and file writes. Minimize turns by following these rules:

- **Batch independent API calls** into single turns with parallel Bash calls
- **Use `curl`** for all GitHub content fetches — WebFetch summarizes HTML instead of returning raw content, making it unsuitable for fetching source files
- **Combine download + write** with `curl -s URL > path` instead of fetch-then-write-separately

## Process

### Step 1: Parse Source

Accept one of:

1. **One GitHub directory URL** — single skill copy
2. **Multiple GitHub directory URLs** — multi-skill merge
3. **Pasted content** — user pastes SKILL.md content (and optionally other files) directly

Accepted URL formats: `https://github.com/{owner}/{repo}/tree/{branch}/{path}` (the skill directory), or `https://github.com/{owner}/{repo}/blob/{branch}/{path}/SKILL.md` (take its parent directory as `path`, which is empty when `SKILL.md` sits at the repo root).

Parse to extract `owner`, `repo`, `branch`, and `path`. If the format doesn't match, ask for clarification.

For pasted content, skip to Step 4.

### Step 2: Parallel Discovery

**Launch ALL of these in a single turn using parallel tool calls:**

```bash
# 1. Commit SHA
curl -s "https://api.github.com/repos/{owner}/{repo}/commits?sha={branch}&per_page=1" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['sha'])"

# 2. Directory listing
curl -s "https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}"

# 3. License check
curl -s "https://api.github.com/repos/{owner}/{repo}/license" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('license',{}).get('spdx_id','unknown'))"

# 4. Existing skills
ls plugins/*/skills/*/SKILL.md

# 5. SKILL.md frontmatter (name and license)
curl -sL "https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}/SKILL.md" | head -20
```

If the directory listing contains subdirectories (`"type": "dir"`), list their contents too — add parallel curl calls for each subdirectory in the **same turn** or the next turn.

**Error handling:**
- 404 → invalid URL or directory doesn't exist, report and stop
- 403 / rate limit → inform the user, suggest waiting or retrying later

### Step 3: Validate License & Confirm Name

**License validation** — this repo is MIT-licensed, so imported code must be under a compatible license:

Compatible: `MIT`, `ISC`, `BSD-2-Clause`, `BSD-3-Clause`, `Apache-2.0`, `0BSD`, `Unlicense`, `CC0-1.0`, `WTFPL`, `Zlib`, `BSL-1.0`

A `license:` field in the SKILL.md frontmatter (Step 2, call 5) governs that file and overrides the repo result. On `NOASSERTION`, read the repo `LICENSE` text before stopping: a dual license can put skill files under a different term than the code.

| Result | Action |
|--------|--------|
| SPDX ID is in the compatible list | Proceed. Record the license. |
| `NOASSERTION` or `null` / missing | **Stop.** No detectable license means all rights reserved. Offer to skip this source. |
| Anything else (GPL, LGPL, AGPL, MPL, etc.) | **Stop.** Explain the license is incompatible with MIT. Offer to skip. |

If the user explicitly overrides (e.g., "I have permission from the author"), proceed but record `"license_override": true` and the user's reason in `sources.json`.

**Name resolution**: always ask the user for the skill name via AskUserQuestion. Offer the `name:` from the SKILL.md frontmatter (Step 2, call 5) as the recommended option. Validate: lowercase kebab-case, no conflict with existing skills, not empty.

### Step 4: Download & Write Files

**Create the directory structure, then download ALL files directly to disk in a single turn using parallel Bash calls:**

```bash
# First: create directories
mkdir -p plugins/{name}/skills/{name}/references plugins/{name}/.claude-plugin  # include any subdirectories found in Step 2

# Then: parallel downloads (one Bash call per file)
curl -s "https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{full-path-to-file}" > plugins/{name}/skills/{name}/{relative-path}
```

Use `download_url` values from the directory listing (these point to `raw.githubusercontent.com`) for each file. Each curl download should be a separate parallel Bash tool call so they execute concurrently.

**After writing:** if the skill name differs from the original, update the `name:` field in SKILL.md frontmatter using the Edit tool.

**For merge (multiple sources):**

1. Download all files from all sources first
2. Read the fetched SKILL.md files
3. Synthesize a merged SKILL.md combining capabilities — merged description, unified process steps, deduplicated where they overlap
4. Copy all supporting files (`references/`, `scripts/`, `assets/`) from all sources
5. On filename conflicts: suggest a descriptive alternative name, ask user to confirm

### Step 5: Finalize

Each skill is its own installable plugin. Finalizing writes `sources.json` (provenance), `.claude-plugin/plugin.json` (plugin manifest), an entry in both catalogs (`.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json`), a `README.md` table row, and a `CHANGELOG.md` line. Together these cover the "skill added" items of the `AGENTS.md` checklist.

**Do ALL of these in a single turn using parallel tool calls:**

1. **Write `plugins/{name}/skills/{name}/sources.json`** (Write tool):

```json
{
  "created_at": "YYYY-MM-DDTHH:mm:ss.000Z",
  "type": "copy",
  "sources": [
    {
      "url": "https://github.com/{owner}/{repo}/tree/{branch}/{path}",
      "repository": "{owner}/{repo}",
      "path": "{path}",
      "branch": "{branch}",
      "sha": "{full-commit-sha}",
      "original_name": "{original-name}",
      "fetched_at": "YYYY-MM-DDTHH:mm:ss.000Z"
    }
  ],
  "license": "{spdx-id}",
  "copyright": "Copyright (c) {owner}",
  "license_override": false,
  "license_override_reason": null
}
```

- `type`: `"copy"` for single source, `"merge"` for multiple, `"paste"` for pasted content
- `sha`: full commit SHA at fetch time — used to check for upstream updates later

2. **Write `plugins/{name}/.claude-plugin/plugin.json`** (Write tool) using the per-skill manifest template:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-plugin-manifest.json",
  "name": "{name}",
  "description": "{one-line description taken from SKILL.md frontmatter}",
  "version": "1.0.0",
  "author": {
    "name": "Leonid Svyatov",
    "email": "leonid@svyatov.com",
    "url": "https://www.svyatov.com"
  },
  "homepage": "https://github.com/svyatov/agent-toolkit",
  "repository": "https://github.com/svyatov/agent-toolkit",
  "license": "MIT"
}
```

- No `skills` field — Claude Code auto-discovers `plugins/{name}/skills/{name}/SKILL.md` via default discovery. The invocation name comes from the `name:` in `SKILL.md` frontmatter.
- New plugins start at `1.0.0`. Version bumps happen per-skill in that skill's own `plugin.json`.

3. **Append new plugin entry to `.claude-plugin/marketplace.json`** (Read tool, then Edit tool) — add an object to the top-level `plugins` array:

```json
{
  "name": "{name}",
  "source": "./plugins/{name}",
  "description": "{one-line description — same as plugin.json}",
  "category": "{group}",
  "tags": ["{relevant}", "{tags}"]
}
```

Schema requires the `./` prefix on relative sources, so use the full path `./plugins/{name}` (marketplace does not use `pluginRoot`). Pick 3–5 discovery tags that match the skill's domain. `category` is one of the README groups: `delivery` (git, releases, dependencies, shipping), `code-design` (refactoring, architecture, planning), `web` (frontend, sites), `skill-tooling` (skills and marketplaces), `writing` (prose). Add the README table row under the matching `###` heading in `README.md`.

3b. **Append the same plugin to `.agents/plugins/marketplace.json`** at the same position it has in the Claude catalog:

```json
{
  "name": "{name}",
  "source": { "source": "local", "path": "./plugins/{name}" },
  "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
  "category": "{group}"
}
```

Under `## Unreleased` in `CHANGELOG.md`, add `### {name}` followed by `- 1.0.0: new skill imported from [{owner}/{repo}](https://github.com/{owner}/{repo}) ({spdx-id}). <what it does>`.

4. **Validate** once the writes land: `claude plugin validate --strict . && claude plugin validate --strict plugins/{name}`. CI runs both.

Present a summary: skill name, source(s), files created, license, plugin manifest path, marketplace entry added.

### Step 6: Post-Import Review

Review the imported skill and suggest improvements — simplifications, better structure, clearer instructions, content redundant with what Claude already does by default. If the `skill-creator` skill is installed, invoke it for this analysis; otherwise review the SKILL.md directly.

**Important:** Present all suggested changes to the user and wait for explicit confirmation before applying anything. Do not auto-apply improvements.

## Edge Cases

- **No SKILL.md in fetched directory** — warn. Ask whether to treat all files as references and create a minimal SKILL.md, or abort.
- **Large files (>1MB)** — warn and ask whether to include.
- **Binary files** — detect by extension, warn, and ask whether to include.
- **Nested subdirectories** — recurse: list contents via API, then download all files in parallel.
- **Files outside the skill directory**: when SKILL.md refers to plugin-level files (`hooks/`, `.mcp.json`, `.claude-plugin/plugin.json`), list the repo root in the Step 2 turn. Ask whether to copy them to `plugins/{name}/`, and record them as extra `sources` paths in `sources.json`.
