---
name: diagram
description: >
  Create, explain, or validate diagrams as code in PlantUML, D2, or Structurizr DSL. Use
  when the user asks to draw or generate a diagram (sequence, class, activity, state, ER,
  Gantt, mind map, architecture, flowchart, C4 system context / container / deployment),
  add a diagram block to Markdown, asks for PlantUML, D2, or Structurizr syntax, or wants
  a .puml, .d2, .dsl file or diagram block checked or rendered.
argument-hint: "[create|reference|check] [plantuml|d2|structurizr] <diagram request or file>"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch
---

# Diagram

Compose diagrams as code for the user's request. On Claude Code the request is
`$ARGUMENTS`; otherwise it is the user's message.

## 1. Pick the mode

Use an explicit leading `create`, `reference`, or `check`. Otherwise infer it:

| Mode | Intent cues | Writes files |
|---|---|---|
| `create` | draw, create, generate, make, add to Markdown, insert into file | Yes |
| `reference` | syntax, how do I write, example for, reference | No, unless asked |
| `check` | check, validate, lint, is this valid, why does this fail, render | No, unless asked |

## 2. Pick the engine

Take the first rule that applies:

1. The user names an engine (`plantuml`, `d2`, `structurizr`), or an existing source
   decides it: `.puml`/`.plantuml`/`.pu`/`.iuml`/`.wsd` or a ```` ```plantuml ````
   fence → PlantUML; `.d2` or ```` ```d2 ```` → D2; `.dsl` or ```` ```structurizr ```` → Structurizr.
2. The project already keeps diagrams in one engine (look for existing sources or
   fences next to the target) → stay consistent with it, unless that engine lacks the
   requested diagram type (see the table below).
3. Otherwise choose by what is being drawn:

| Request | Engine | Why |
|---|---|---|
| C4 model with several views (landscape, context, container, component, deployment, dynamic) from one model | Structurizr | One model, many consistent views |
| UML: sequence, class, activity, state, use case, object, timing, component/deployment UML | PlantUML | Most complete UML coverage |
| Gantt, mind map, WBS, network (nwdiag), JSON/YAML, wireframe (salt), archimate, EBNF/regex | PlantUML | Only engine with these types |
| Architecture or system overview, flowchart, box-and-arrow, grid layout, polished visual output | D2 | Modern layout and themes |
| ERD / SQL tables | D2 (`sql_table`) or PlantUML (ER) | D2 unless UML notation is asked for |
| A single quick C4 diagram inside Markdown | PlantUML (C4-PlantUML) | No workspace needed |

If two engines fit equally and the choice matters to the user, ask once, then proceed.

## 3. Load references

Always open `references/<engine>/skill-map.md` before writing or explaining syntax, even
for a simple diagram, then only the files it points to for this request. Do not load
another engine's references. If they do not cover a feature, use the official
documentation links in that skill map.

## 4. Run the mode

### `create`

1. Draft the diagram from the loaded references.
2. Apply a theme when the engine has one: D2 theme 3 (Flagship Terrastruct) and
   Structurizr "C4 Blue" unless the user asked for another style.
3. Write a standalone source file, or a fenced block (` ```plantuml `, ` ```d2 `,
   ` ```structurizr `) into an existing Markdown file when the context calls for it.
4. Validate. On failure, fix and validate again until it passes.
5. For D2 and Structurizr, render a PNG so the user can see the result. Render PlantUML
   only when asked.

### `reference`

Answer with concise syntax guidance and a minimal example. Do not write files unless asked.

### `check`

1. Validate the target file or Markdown file. For a pasted snippet, save it to a temporary
   file with the engine's extension first.
2. Report pass/fail per file or block. On failure, explain the cause and show a corrected
   snippet.
3. Do not modify files unless the user asks.

## Scripts

Resolve `scripts/` relative to this `SKILL.md` and run the concrete paths. On Claude Code
the directory is `${CLAUDE_SKILL_DIR}/scripts`.

| Task | Command |
|---|---|
| Validate sources or every diagram fence in Markdown | `scripts/validate.sh <file> [file ...]` |
| Render next to the source | `scripts/render.sh <file> [--format F] [--theme ID] [--layout elk\|dagre] [--sketch]` |
| Validate PlantUML online | `uv run scripts/validate_online.py <file.puml>` |

`validate.sh` picks the engine by extension. For Markdown it checks each
` ```plantuml `/` ```puml `, ` ```d2 `, and ` ```structurizr ` block and reports it by line.

`render.sh` formats: PlantUML `png|svg|pdf|txt`; D2 `png|svg|pdf|pptx` (theme 3 and
layout `elk` by default); Structurizr `png|svg|plantuml|mermaid`. `plantuml` and
`mermaid` convert a Structurizr workspace into those languages.

Tools: PlantUML uses the `plantuml` CLI when installed. Otherwise the scripts download a
pinned PlantUML jar into the user cache on first use, which needs Java. D2 needs `d2`.
Structurizr needs `structurizr`, plus PlantUML for png/svg. When a tool is missing, tell
the user the install command from the script output. Do not install it yourself.

`validate_online.py` sends the diagram source to the public plantuml.com server. Use it
only when local PlantUML cannot run and the user agrees to that.
