# The right mental model for the problem you're stuck on, not a pile of frameworks

**Cognitive Stack: Code edition.**

The power-user edition. Takes a problem you're stuck on, works out what *kind* of
thinking it needs, retrieves the right models from the full 2,375-model library,
runs them as a recipe, and produces a five-part answer — ending with a next move
that acts on your **real files** or builds you a **reusable skill**.

The five parts are **written to disk as five separate markdown files** (Natural
Answer, Cognitive Signature, Recipe Trace, Recipe Answer, and the optional Your Next
Move), each turn-numbered so repeat runs never overwrite earlier ones. Rather than
dumping everything into the terminal, the inline reply stays short: a confirmation,
the file paths just written, and the Recipe Answer shown in full so you see the
payoff without opening anything.

For the zero-setup version that runs anywhere (including claude.ai), use the
**Chat edition** in the sibling `…-chat/` folder. If you're unsure which to use,
use that one.

## Running it

Point Claude Code at this folder and ask a real question about something you're
stuck on. Claude reads `SKILL.md` and runs the router.

- **Python is an accelerator, not a requirement.** Claude can run the whole skill
  by reading the bundled files. If Python is available, it uses the scripts to
  filter the library faster.
- **Self-contained.** Everything needed to run is inside this folder. Copy it
  anywhere on disk and it works — no parent folder, no install, no external data.

## What's inside

| Path | What it is |
|---|---|
| `SKILL.md` | The router and the five-artifact answer spec (each artifact written as its own file). Start here. |
| `references/` | The library catalogues, recipes, lenses, cognitive-signature spec, decorrelation engine, retrieval guide. Read lazily — only the slice needed. |
| `references/data/` | The three bundled CSVs the runtime reads (the full corpus + the two paradigm tables). This is what makes the skill portable. |
| `scripts/decorrelate.py` | The one **runtime** script: the paradigm rival-check. Resolves its data from `references/data/` (no external paths). |
| `scripts/dev/` | **Build-time tools only — you never need to run these.** They were used to construct the catalogues and derive the Chat edition. See `scripts/dev/README.md`. |

## Not needed to run, safe to delete before sharing

`scripts/dev/` is build tooling. A downloader never runs it, and it reads source
files that don't ship with the skill. Keep it for reproducibility, or remove it for
a leaner distribution — the skill runs identically without it.
