# Polyglot Language Coach

**Author:** Donald Kihenja ([@HarmoniaUniversum](https://github.com/HarmoniaUniversum))

A [Claude Code](https://claude.ai/claude-code) skill that acts as a compassionate, enthusiastic language coach — without derailing whatever you were already working on.

## What it does

Whenever you write a sentence or more in a non-English language mid-conversation, the coach:

1. **Identifies the language** and acknowledges it warmly
2. **Checks for ambiguity** before correcting (accents, tense, pronoun-less sentences) — asks rather than guessing wrong
3. **Shows the corrected version** alongside your original
4. **Teaches one thing** — the single most useful grammar or vocabulary point from your sentence, explained in plain terms
5. **Bridges back** to whatever you were doing before
6. **Logs the learning** silently to your Obsidian vault for later review

## Languages supported

Spanish, French, Italian, German, Japanese, Mandarin, Portuguese, Korean, Arabic — and any other language you write in.

## Trigger conditions

Triggers when you write **one or more full sentences** in a non-English language, or code-switch mid-message in a way that reads like practice (not quoting, not translation requests, not isolated loanwords).

## Obsidian logging

Each coaching moment is appended to a daily log file at:

```
{OBSIDIAN_VAULT_PATH}/Language Learning/YYYY-MM-DD.md
```

Entries include the original, corrected version, mini-lesson, concept wikilinks, and hierarchical tags (e.g. `#spanish/grammar/ser-vs-estar`).

## Installation

1. Copy `SKILL.md` into your Claude Code skills directory:
   ```
   ~/.claude/skills/polyglot-language-coach/SKILL.md
   ```
2. Open `SKILL.md` and set `OBSIDIAN_VAULT_PATH` to your vault's absolute path.
3. That's it — the skill activates automatically during any Claude Code conversation.

## Configuration

Inside `SKILL.md`:

```yaml
OBSIDIAN_VAULT_PATH: /path/to/your/obsidian/vault
LOG_SUBFOLDER: Language Learning
```

## Example

**You write:** *"Hoy yo fui al mercado y compré muchos frutas."*

**Coach responds:**
> Quick Spanish moment! Two small tweaks:
>
> "Hoy yo fui al mercado y compré muchos frutas." → **"Hoy fui al mercado y compré muchas frutas."**
>
> Spanish drops subject pronouns (*yo*) because the verb ending already tells you who did it. And *fruta* is feminine — *muchas frutas*, not *muchos*.
>
> *(silently logs to Obsidian)*
>
> Back to your task — want me to keep going?

## Design principles

- **Non-blocking** — the coaching interlude is a parenthetical, never a stop
- **Ambiguity-first** — asks before correcting when interpretation is genuinely unclear; never logs until the correct version is confirmed
- **One lesson per turn** — picks the single highest-leverage teaching point, not a grammar dump
- **Honest praise only** — celebrates real progress, never manufactures it

## License

MIT
