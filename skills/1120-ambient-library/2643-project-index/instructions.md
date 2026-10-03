# Project Index

Turn a directory of project folders into an at-a-glance inventory: a markdown
table and a self-contained, searchable HTML page, one row per top-level folder
with an inferred description and status.

## Gotchas (read first)

- **Do not assume folders are git repos.** The scan records git info when
  present, but plenty of project folders are plain directories, client
  deliveries, zip archives, or document collections. Judge status from whatever
  signals exist: file mtimes, names, README text.
- **Invent the status vocabulary from the content, don't impose one.** Pick 3–6
  short labels that fit what the scan actually found. A folder of git repos
  might warrant Active / Stalled / Dormant; a folder of client work might
  warrant Delivered / In progress / Archived; a mixed folder needs a mix. The
  HTML template builds its filter chips dynamically from whatever labels appear
  — you are free to choose. Keep each label 1–3 words and reuse labels
  consistently so filtering is useful.
- **Never fabricate descriptions.** If metadata is too thin to tell what a
  folder is, say so plainly ("Unclear from available metadata — no README,
  generic name"). A wrong confident description is worse than an honest gap.
- **No recursion.** Only immediate children of the given directories are
  indexed. If the user wants depth, they'll say so — re-run the scan on the
  subdirectory.
- **It never makes things up.** If a folder is too bare to identify, it says so
  plainly instead of inventing a description — and flags it so the user knows
  where to look themselves.
- **The user decides how deep it goes.** Default is one level (immediate
  children). Deeper scans are opt-in per folder or full recursion.

## When to invoke

The user wants an overview, inventory, or status review of the projects/folders
in a directory:

- "Index my `~/GitHub` folder."
- "What have I been working on in `~/Projects`?"
- "Give me a status of everything in my Clients folder."
- "Catalog the folders in `~/Downloads/handoffs`."
- "Index both `~/GitHub` and `~/work/repos` in one pass."
- "Index `~/GitHub`, but for the `clients` folder go one level deeper and list
  each client inside it."
- "Walk all of `~/GitHub` and index every project folder at every level,
  however deep."
- "Index `~/Clients`, and use Delivered / In progress / On hold as the status
  labels."

## Workflow

### 1. Establish inputs

Ask (or infer from the request) which directory or directories to scan.
Multiple directories are fine — each row's Location column records which one it
came from. Confirm the depth: default is one level; expand specific folders or
recurse fully only when the user asks.

### 2. Scan (code)

```bash
bash "${CLAUDE_PLUGIN_ROOT}/library/project-index/scripts/scan.sh" "/path/to/dir1" "/path/to/dir2" > /tmp/projects.jsonl
```

One JSON object per folder: `name, base, is_git, branch, last_commit, dirty,
remote, readme` (first 500 chars), `pkg_desc, mtime, top_files`. Runs in
seconds; needs only bash, git, python3. No recursion; skips `.git`, `.claude`,
`node_modules`.

### 3. Describe and classify (inference)

For each folder, write ONE sentence (under 20 words) describing what it is/does,
and assign a status label, using only the scanned fields. Ground every claim in
the data (README text, package description, last commit message, file names).
Use today's date to judge recency from `last_commit`/`mtime`.

For more than ~40 folders, split the JSONL into chunks and fan out to parallel
subagents (one chunk each, return markdown table rows); merge results in order.
Below that, do it inline.

If a handful of folders are truly opaque, you may read that folder's README or
one obvious top-level file directly — but don't recurse or bulk-read; the scan
fields are the budget.

### 4. Assemble the markdown

Write `PROJECT_INDEX.md` **into the scanned directory** (first directory if
several), with a short header (what was scanned, date, a legend explaining your
chosen status labels) followed by the table:

```
| Project | Location | Status | Description |
|---|---|---|---|
```

The header row and the `|---|` separator are required — the HTML builder only
reads lines matching exactly four pipe-delimited cells. Status filtering keys
off the first comma-separated token of the Status cell, so keep labels short
and consistent.

### 5. Build the HTML (code)

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/library/project-index/scripts/build_html.py" "/path/to/dir1/PROJECT_INDEX.md" \
  --title "Project Index" \
  --subtitle "N folders scanned across <dirs> on <date>. Status inferred from available metadata."
```

Output lands next to the .md as `PROJECT_INDEX.html` — fully self-contained (no
network), opens in any browser, dark-mode aware. Filter chips and badge colors
are generated from whatever status labels the data contains. Flags:
`-o/--output`, `--title`, `--subtitle`. Exit codes: `0` success · `1` no table
rows parsed · `2` bad arguments / unreadable file.

Open it for the user (`open PROJECT_INDEX.html` on macOS) or send them the
file. If an Artifact/publish tool is available in the session, offer to publish
it there too — but the local file is the primary deliverable so it works for
everyone.

### 6. Report

Tell the user: where both files are, the status breakdown (counts per label),
and which folders were too thin to describe — those are the candidates for a
deeper manual pass.

## Sibling files

- `${CLAUDE_PLUGIN_ROOT}/library/project-index/scripts/scan.sh` — folder scan → JSONL
- `${CLAUDE_PLUGIN_ROOT}/library/project-index/scripts/build_html.py` — markdown table → HTML
- `${CLAUDE_PLUGIN_ROOT}/library/project-index/assets/template.html` — self-contained page shell (`__TITLE__`/`__SUBTITLE__`/`__DATA_JSON__`/`__STATIC_ROWS__`)
