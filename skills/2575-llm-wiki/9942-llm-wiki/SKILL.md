---
name: llm-wiki
description: >-
  Build and maintain an LLM-maintained wiki — a persistent, interlinked Markdown knowledge base distilled from curated raw sources (Karpathy's LLM Wiki pattern). Three operations: ingest (read a source, write and update pages, log it), query (answer from the wiki with citations, file good answers back), lint (contradictions, stale claims, broken links, orphans). Path-agnostic: the user picks where the wiki lives, the skill remembers it. Works on a fresh directory, a repo's docs/, or an existing memory directory. Use when the user wants to file a document or incident writeup into their knowledge base, asks what their notes say about a topic, wants the wiki checked for contradictions or staleness, mentions an LLM wiki, Memex, or second brain, or runs /llm-wiki.
---

# llm-wiki

Maintain a wiki the LLM owns and the human curates. Three layers, three operations.

| Layer | Who owns it | Rule |
|---|---|---|
| **Raw sources** | human | read-only, **never** edited or moved by this skill |
| **Wiki** | this skill | interlinked Markdown pages + `MEMORY.md`-style index |
| **Schema** | this skill | `WIKI.md` in the wiki root — conventions, written on init |

Human curates sources, directs analysis, asks questions. Skill does the bookkeeping.

## Quick start

```
/llm-wiki ingest <path-to-source>     # file a document into the wiki
/llm-wiki query <question>            # answer from the wiki, with citations
/llm-wiki lint                        # contradictions, stale claims, broken links
```

## Path resolution

Resolve before any read or write:

1. **Check memory** for a `reference` entry naming the wiki root (name/description containing `llm-wiki` or `wiki root`).
2. If found, use it.
3. **If not, ask:** *"Where should the wiki live? (absolute path to a folder — I'll create it if missing.)"* Offer the three common answers: a fresh folder, this repo's `docs/`, or the existing memory directory.
4. Save a `reference` memory entry so future runs don't re-prompt, and add its one-line pointer to `MEMORY.md`.
5. If the folder has no `WIKI.md`, this is a fresh wiki — write the schema (see below) before anything else. Never create silently.

## Page format

One idea per page. Match an existing wiki's conventions if pages are already there; otherwise:

```markdown
---
name: <kebab-case-slug>          # must equal the filename without .md
description: <one line, <1024 chars — used for retrieval>
type: entity | concept | source-summary | analysis
sources: [<source-file-or-url>, ...]
updated: YYYY-MM-DD
---

<body — link related pages with [[slug]]>
```

Links use `[[slug]]` where slug is the **filename** without `.md`. A link to a page that
doesn't exist yet is fine — it marks work to do. Every page gets one index line.

## Operations

### ingest `<source>`

1. Read the source **in full**. Never edit, move, or rewrite it.
2. Report takeaways and say which pages you intend to touch. **Wait for confirmation.**
3. Write a `source-summary` page for the source itself, then create or amend every entity/concept page it affects. One source commonly touches 5–15 pages — that fan-out is the point.
4. When new material contradicts an existing page, **do not silently overwrite**: keep both claims, mark the older one superseded with its date, and say so in the report.
5. Add index lines for new pages. Append one line to `LOG.md`: date, source, pages touched.

### query `<question>`

1. Search page descriptions first, then bodies. Read whole pages, not fragments.
2. Answer with citations to page slugs. Say plainly when the wiki doesn't cover it — never fill the gap from general knowledge without labelling it as outside the wiki.
3. If the answer was worth assembling, offer to file it back as an `analysis` page. That is how the wiki compounds.

### lint

1. Run `scripts/lint.mjs <wiki-root>` for the deterministic checks (broken links, orphans, index drift, frontmatter gaps, oversized descriptions, stale pages).
2. Then do the part a script can't: read the pages and hunt **contradictions** — two pages asserting different values for the same fact, superseded numbers still stated as current, claims whose source has since changed.
3. Report findings ranked by whether they would produce a wrong answer. Propose fixes; apply only on confirmation.

Contradictions are the payload. Link hygiene is housekeeping — report it, don't lead with it.

## Schema file

On init, write `WIKI.md` to the wiki root recording: the page format above, the link
convention, the index file name, and what counts as a raw source for *this* wiki. Read it
on every subsequent run and follow it over the defaults here — the wiki's own conventions win.

## Rules

- Never edit raw sources. Ever.
- Never write without showing the plan first.
- Prefer amending an existing page to creating a near-duplicate; check the index before creating.
- No time-sensitive claims without a date attached.
