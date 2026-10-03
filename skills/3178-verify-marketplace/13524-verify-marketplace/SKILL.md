---
name: verify-marketplace
description: 'Verify a plugin marketplace repo against the current Claude Code and Codex docs fetched live: catalog, manifests, layout, README, versions'
license: MIT
compatibility: >
  Requires curl and network access to code.claude.com and developers.openai.com.
  Uses the claude and codex CLIs when present, never requires them. Read-only
  until the user approves a fix. No install and no dependencies.
allowed-tools: Bash Read Grep Glob Edit
disable-model-invocation: true
argument-hint: "[repo path, marketplace.json, or owner/repo]"
---

# Verify Marketplace

Marketplace rules change faster than any repo that copies them: reserved names
appear, path rules tighten, Codex adds a manifest format. So this skill stores
none of them. Every rule applied here is fetched from the upstream docs on each
run, and every finding quotes the fetched line it came from.

Four axes:

- **A. Catalog**: each `marketplace.json` conforms and agrees with the plugins on disk.
- **B. Plugins**: each plugin manifest and layout conforms for the hosts it targets.
- **C. Repository**: README, license, CI, and cross-file consistency.
- **D. Currency**: the fields, commands, and URLs the repo relies on still exist upstream.

SKILL.md bodies are out of scope. That is `verify-skill`, and Step 5 hands off
to it.

## Step 1: Resolve the target

| Trigger | Scope |
|---|---|
| A repo path, or no argument and the cwd holds a catalog | That repo |
| A path to a `marketplace.json` | The marketplace root is the directory that holds `.claude-plugin/` or `.agents/` |
| `owner/repo` | `git clone --depth 1` into a temp dir, verify, delete the clone |
| No argument, no catalog, and a plugin manifest in the cwd | That plugin: Axes B to D, and Axis A reports the catalog it needs before anyone can install it |
| No argument, no catalog, and no plugin manifest in the cwd | Ask which repo, with `AskUserQuestion` |

Inventory the repo by Glob, all in one turn:

| File | Meaning |
|---|---|
| `.claude-plugin/marketplace.json` | Claude Code catalog. Codex also reads it, as a compatible catalog |
| `.agents/plugins/marketplace.json` | Codex native catalog |
| `<plugin>/.claude-plugin/plugin.json` | Claude Code manifest. Codex also accepts it |
| `<plugin>/.codex-plugin/plugin.json` | Codex compatibility manifest |
| `<plugin>/plugin.json` naming an agent-plugins.org `$schema` | Portable Agent Plugins manifest |

Both hosts are always checked. A repo with only `.claude-plugin/` files is
still a Codex marketplace, because Codex reads those files as a compatible
catalog. Confirm that reading rule against the fetched Codex doc before
applying it. Rules the Codex doc states for its native catalog are Consider
findings on a compatible one, and the fix they point at is a native
`.agents/plugins/marketplace.json`: adding Codex fields to the shared catalog
fails `claude plugin validate --strict` as an unknown field.

The plugin set is the union of every `source` the catalogs name and every
directory under the roots those sources sit in. The union is what catches an
orphan directory with no entry.

Record the repo's last change date with `git log -1 --format=%cs`. Step 2
needs it. Uncommitted changes count as newer than any commit, and a plugin
with no history has no version drift to check.

## Step 2: Fetch the current guidance

Always fetch these four, in **one turn with parallel calls**, each into a temp
file:

```bash
curl -sSL -o "$T/cc-marketplaces.md" https://code.claude.com/docs/en/plugin-marketplaces.md
curl -sSL -o "$T/cc-reference.md"    https://code.claude.com/docs/en/plugins-reference.md
curl -sSL -o "$T/codex-build.md"     https://developers.openai.com/plugins/build/plugins.md
curl -sSL -o "$T/codex-errors.md"    https://developers.openai.com/plugins/deploy/submission-errors.md
```

The two Claude Code pages are well over 100 KB each. Never read them whole.
Locate the sections with one anchored grep per file over the headings in this
table, such as
`grep -n -E '^#+ (Required fields|Optional fields|Plugin entries)' "$T/cc-marketplaces.md"`,
then read each section from its line to the next heading's line:

| File | Sections to grep for |
|---|---|
| `cc-marketplaces.md` | Required fields, Optional fields, Plugin entries, Plugin sources, Relative paths, Strict mode, Version resolution, Rename or remove a plugin, Marketplace validation errors, Troubleshooting |
| `cc-reference.md` | Plugin manifest schema, Component path fields, Path behavior rules, Path traversal limitations, Version management, Standard plugin layout, File locations reference, plugin validate |
| `codex-build.md` | Plugin structure, Manifest fields, Marketplace metadata, How local marketplaces work, Path rules |
| `codex-errors.md` | Plugin manifest errors, Skill errors, Listing and interface errors, Package warnings |

Then fetch by condition, again in one parallel batch:

| Condition | Also fetch |
|---|---|
| Any entry or manifest has `dependencies` | `https://code.claude.com/docs/en/plugin-dependencies.md` |
| Any entry has `relevance` | `https://code.claude.com/docs/en/plugin-relevance.md` |
| Any plugin ships `evals/` or sets `experimental.evals` | `https://code.claude.com/docs/en/plugin-evals.md` |
| Any plugin ships hooks, agents, commands, MCP, or LSP config | `https://code.claude.com/docs/en/plugins.md` and `https://developers.openai.com/plugins/guides/submit-claude-plugin.md`, which lists what Codex ignores |
| The user asks about ChatGPT workspace import | `https://learn.chatgpt.com/docs/enterprise/plugin-management.md` |
| The repo is more than a month older than today | `https://code.claude.com/docs/en/whats-new/index.md` |

From `whats-new/index.md`, take the weeks dated after the repo's last change,
read the one-line summaries, and open only the weeks that mention plugins or
marketplaces. Cap it at eight pages and say so in the report header when the
cap applied.

`https://learn.chatgpt.com/docs/build-plugins.md` is a stub that points at
developers.openai.com. Do not fetch it in place of the builder docs.

If a fetch fails, say so in the report header and mark every check that
depended on it as **Not checked**. Never fall back to remembered rules: a
remembered rule is the failure this skill exists to prevent.

## Step 3: Mechanized evidence

Run these when the CLI is on `PATH`. When it is not, one header line says it
was skipped.

```bash
claude plugin validate --strict --json <marketplace root>   # catalog, every local plugin.json, entry-vs-manifest version
claude plugin validate --strict --json <plugin dir>          # one per plugin, one batch: opens skills, agents, commands, hooks
```

A plugin whose `source` is the marketplace root (`"./"`) has no plugin run of
its own: the validator treats that directory as the marketplace and opens no
component file. Validate its component directories instead, such as
`claude plugin validate --strict --json ./skills`, with the path rule from
the fetched "Validate a plugin or a directory without a manifest" section.

Take the exit code meanings and the JSON shape from the fetched reference and
quote them. `contents` lists only the files that had a problem, so an empty
array on a plugin run means every skill file was opened and was clean. The
validator ships with the CLI, so it can lag or lead the docs:
treat its output as evidence, and confirm each rule it reports against a
fetched line before it becomes a finding. `claude plugin details <name>` adds a
component inventory and token cost for an installed plugin, useful for a
Consider finding on a heavy plugin, never required.

Codex has no offline validator. `codex plugin marketplace add <path>` writes
to `~/.codex/config.toml`, so offer it as an opt-in check and never run it
unasked: `add`, then `codex plugin list -m <name> --json` to see which entries
Codex parsed, then `codex plugin marketplace remove <name>`.

## Step 4: Axis A, catalog

For each catalog present, find the governing line in the fetched text first,
then check:

- JSON parses. The required top-level fields for that host are present and
  non-empty. Take the list from the fetched page for each host.
- The marketplace `name` passes every name rule the fetched page lists:
  case and character rules, the reserved-name list, the package-manager
  names, and the Claude Desktop rules. Quote the list, do not recite it.
- A marketplace `description` is present, at the location the fetched page
  calls current rather than the one it keeps for backward compatibility.
- Every `plugins[].source`. Relative paths carry the required prefix, no `..`,
  no backslash, and resolve to a directory on disk. A bare name appears only
  with the field that permits it. A remote source carries the required fields
  for its type. A Codex `source` uses one of the object forms the Codex doc
  lists.
- Orphans and danglers: every plugin directory under the referenced roots has
  an entry, and every entry resolves. A dangling entry is Blocking.
- Names are unique. Each entry `name` equals the manifest `name`, and each
  entry `description` and `version` agree with the manifest. A `version` set
  in both places is Should fix: the fetched doc says which one wins and that
  it wins silently.
- `renames`. List the entry names the catalog has ever carried
  (`git log -p --format= -- <catalog> | grep '^-.*"name"'`) and compare with
  the current ones. A name that disappeared without a `renames` entry is
  Should fix. When the map exists, each chain ends at `null` or a listed
  name, and old entries are still there.
- `strict: false` entries do not sit next to a `plugin.json` that declares
  components.
- Entries in a native Codex catalog carry the fields the Codex doc marks as
  always required, and `policy` values come from its lists. Neither host
  lists allowed entry `category` values, so only consistency across entries
  is a finding there.
- When both catalogs exist: same plugin set, same versions, same
  descriptions. Drift is one finding with a table, not one finding per cell.

## Step 5: Axis B, plugins

Fewer than four plugins: check them inline. Otherwise dispatch one subagent
per plugin in one message, each returning its findings in the Step 8 format
with quotes, and merge. Per plugin:

- The manifest parses. `name` follows the character rule and equals the
  directory name. `version` is semver. `description`, `author.name`,
  `license`, `homepage`, and `repository` are present when the plugin ships
  to other people. A missing manifest `$schema` is Consider, with the URL the
  fetched reference gives.
- Component paths start with the required prefix, stay inside the plugin,
  and use forward slashes. Which fields add to the default scan and which
  replace it comes from the fetched reference.
- Layout: only the manifest sits inside the manifest directory. A skills
  plugin has `skills/<x>/SKILL.md`, and that SKILL.md has a frontmatter
  `name` equal to its directory. Frontmatter identity and the length limits
  below are the only skill rules applied here; the body belongs to
  `verify-skill`. No `CLAUDE.md` at the plugin root, no
  top-level `bin/`, and `commands/` reported as the legacy form when the
  fetched reference says so.
- Codex: the manifest is one of the forms the Codex doc accepts. Skills are
  immediate children of `skills/`, none hidden, none symlinked. Name and
  description length limits come from the fetched error list. A component
  Codex ignores is Should fix when it carries the plugin's essential
  behaviour, and Consider otherwise. When a `.codex-plugin` manifest exists,
  its `interface` fields and `category` value are checked against the
  fetched lists.
- Version drift: when the last commit that changed the manifest `version`
  (`git log -1 --format=%ct -G'"version"' -- <manifest>`: `-G` matches a
  changed value, `-S` only a changed count) is older than the
  newest commit under the plugin (`git log -1 --format=%ct -- <plugin>`),
  edits shipped without a bump. Should fix, quoting the fetched line that
  says users get updates only on a bump. Skip this for a plugin whose docs
  say it loads in place.

Close the axis with one line: "N skills not content-verified. Run
`/verify-skill` on each." When `verify-skill` is installed, Glob the same roots
it lists for itself and offer to dispatch it, one subagent per skill.

## Step 6: Axis C, repository

- README: the install commands are present and copy-paste correct. The
  `@marketplace` suffix equals the catalog `name`, every plugin `name` appears
  in an install line and once in the skills table, and the table descriptions
  match the manifests. A Codex install line appears when the repo claims
  Codex support.
- `LICENSE` at the root, and every manifest `license` agrees with it. When at
  least one plugin carries a `sources.json`, every plugin copied from another
  repository does. A skill that only cites an article is authored, not copied.
- A CI workflow runs the validator with `--strict` on every target Step 3
  ran, including a root plugin's component directories. Consider when absent
  or partial, quoting the fetched line that recommends it.
- `CHANGELOG.md` when versions are explicit. Consider, with the quote.
- Content the install path copies but should not ship: `.claude/*.local.md`,
  plan files, scratch, LFS-tracked files.
- `.claude/settings.json` `extraKnownMarketplaces`, when present, names the
  same marketplace as the catalog.

## Step 7: Axis D, currency

- **Dead links.** Collect every URL in the catalogs, the manifests, and the
  README, then batch one check. Feed the list on stdin: a URL with `&` or `?`
  in it breaks an unquoted `for` loop.

  ```bash
  while IFS= read -r u; do printf "%-70s " "$u"; \
    curl -sS -o /dev/null -w "%{http_code}\n" -L --max-time 20 "$u"; done <<'EOF'
  https://example.com/one
  https://example.com/two?a=1&b=2
  EOF
  ```

  Report each non-2xx with its code. A 404 on a `$schema`, a `homepage`, or an
  install source is Should fix. For a dead `$schema`, take the replacement URL
  from the fetched docs; when they give none for that file, look it up in the
  SchemaStore catalog with
  `curl -sSL https://www.schemastore.org/api/json/catalog.json | grep -io '"url": *"[^"]*<name>[^"]*"'`,
  and when that has none either the fix is to drop the field.
- **Stale commands.** Every CLI command the README quotes exists in the
  fetched docs with those flags.
- **Unknown fields.** A field in a manifest or entry that the fetched schema
  does not list, including one left over from another tool's manifest.
- **Missing fields the docs now recommend.** Consider unless the fetched doc
  says required.

## Step 8: Report

| Level | Meaning |
|---|---|
| **Blocking** | The marketplace fails to load, an entry fails to install, or the README tells the reader to run something that no longer works |
| **Should fix** | It installs, but is less reliable than it should be, or omits something it should carry |
| **Consider** | A judgment call. The author may have had a reason |

Report skeleton:

````markdown
# Marketplace verification: <repo>

Verified against docs fetched <date>:
- https://code.claude.com/docs/en/plugin-marketplaces.md
- https://code.claude.com/docs/en/plugins-reference.md
- https://developers.openai.com/plugins/build/plugins.md
- https://developers.openai.com/plugins/deploy/submission-errors.md
- <any conditional source>

Hosts: Claude Code (native) · Codex (via .claude-plugin/ compatibility | native)
Validator: claude plugin validate exit N | skipped, not on PATH

Blocking: N · Should fix: N · Consider: N
<Not checked: which checks, and which fetch failed>

## Blocking

### <one-line summary>
**Axis**: A catalog | B plugins | C repository | D currency
**Location**: `path/to/file:LINE`
**Problem**: what is wrong
**Evidence**: the fetched doc line, the validator message, the HTTP code, or
the two disagreeing lines inside the repo. Quoted
**Fix**:
```diff
- old
+ new
```

## Checks that passed

One line per check, with the number or the rule it met.
````

Repeat the findings section per severity, and omit a severity that has no
findings. Always keep **Checks that passed**: without it the reader cannot tell
a check that passed from one that never ran. When nothing at all is found, that
section plus one line is the whole report.

## Step 9: Offer to apply the fixes

Present the changes and wait for explicit confirmation. Do not apply anything
before that, and do not apply the **Consider** findings at all unless the user
names them. Group the offer by severity so the user can take the Blocking
findings alone.

A fix that edits a plugin bumps that plugin's `version` in the same change,
and the offer says so.

After applying, re-run Steps 3 to 7 on the changed files, reusing the docs
already fetched. Expect an empty report. If a fix introduced a new finding, say
so rather than closing out.

## Notes

- **A clean repo produces no findings.** Verifying a healthy marketplace and
  returning a list of near-findings is the main failure mode of this skill. A
  finding needs the quote that makes it a finding, and Step 8 names the four
  things that count as one. No quote, no finding: drop it, and let **Checks
  that passed** carry the work you did.
- **Steps 4 to 7 are a checklist of where to look, not of what to report.** A
  category with nothing under it is a normal outcome, not a failed run.
- **The fetched docs win any conflict.** The validator, other skills, and
  example repos all disagree with the docs somewhere. Apply what the fetched
  docs say and quote it.
- **Style is not a finding.** Report what the fetched guidance calls wrong.
  A repo that is organized differently from your preference is not defective.
- **Verifying this skill.** Run this skill on the repo that ships it, and run
  `verify-skill` on this file.
