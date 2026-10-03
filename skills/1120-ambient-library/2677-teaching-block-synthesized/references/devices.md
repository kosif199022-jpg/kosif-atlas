# Devices

Reusable markup for teaching blocks. These are **devices, not a sequence** — the session's turning
points decide which appear and in what order. Read `SKILL.md` first; finding the steps is the work.

All HTML here is raw HTML inside markdown. Pandoc passes it through; local markdown viewers won't
render it. The `.md` is source, the rendered HTML is the deliverable.

---

## Verbatim artifacts — default to code blocks

For anything a reader might copy, run, or compare closely — prompts, commands, code, error output —
use a plain fenced code block. It renders everywhere, survives copy-paste, and needs no HTML.

````
```
$ grep -o 'src="[^"]*"' output.html | grep -Ei 'svg|data:image'
→ two data:image/svg+xml;base64 matches
```
````

## Chat-excerpt panel — for conversational exchange

Use when the back-and-forth *itself* is the point (a correction, a reframe, a one-line instruction that
redirected the work) and the piece is destined for HTML. Prefer a code block if the reader might copy it.

```html
<div style="background:#1a1b26;border:1px solid #2f3146;border-radius:10px;
  padding:16px 20px;margin:1.5em 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
  font-size:0.85em;line-height:1.55;color:#c8cad8;">
<div style="color:#7aa2f7;font-size:0.75em;letter-spacing:.08em;
  text-transform:uppercase;margin-bottom:8px;">Their prompt</div>
Verbatim text.
</div>
```

Label + accent by speaker: prompt `#7aa2f7`, reply `#9ece6a`, terminal `#e0af68`.

---

## Diagrams

Label everything. Two or three colors maximum. Legibility over aesthetics. One `<text>` element per
line — SVG text does not wrap.

A workable restrained palette on white: ink `#1c1f1d`, secondary `#555c58`, accent `#2f6f8f`,
highlight `#9c4a2f`, rule `#b9c0bc`.

### Authored diagram with baked-in annotation — the default

Arrows and callouts live **inside** the SVG, sharing the coordinate space of what they point at. Fixed
bounds mean nothing can escape onto the surrounding prose.

```xml
<defs>
  <marker id="arw" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
    <path d="M0,0 L9,4.5 L0,9 Z" fill="#9c4a2f"/>
  </marker>
</defs>
<text x="60" y="300" font-size="13" fill="#9c4a2f">this is the part that mattered</text>
<path d="M 240 296 C 300 288, 340 280, 372 264" stroke="#9c4a2f" stroke-width="2"
  fill="none" marker-end="url(#arw)"/>
```

Place it with a plain figure:

```markdown
![What the diagram shows, including its annotations](diagram-name.svg)
```

A dark canvas plus a fake window-chrome bar (three dots, faint title) makes an authored diagram read as
a captured screen rather than clip art — useful when illustrating something that *is* a UI, misleading
when it isn't.

### HTML overlay — only over screenshots you can't edit

The inner wrapper's `overflow:hidden` is load-bearing. Absolutely-positioned callouts add no height to
their parent, so without it anything near the bottom edge renders on top of the body text below the
figure. Keep callout `top` between 4% and 80% and set `max-width` so a long line can't wrap out of frame.

```html
<figure style="margin:2em 0;max-width:100%;">
  <div style="position:relative;overflow:hidden;border-radius:8px;
    border:1px solid #2f3146;line-height:0;">
    <img src="shots/01-render.png" alt="Describe it" style="width:100%;display:block;">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
      style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;">
      <defs><marker id="ah1" markerWidth="6" markerHeight="6" refX="5" refY="3"
        orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#f43f5e"/></marker></defs>
      <path d="M 78 18 Q 66 22 58 34" stroke="#f43f5e" stroke-width="0.6"
        fill="none" marker-end="url(#ah1)" stroke-linecap="round"/>
    </svg>
    <div style="position:absolute;left:60%;top:8%;max-width:34%;color:#f43f5e;
      font-family:'Bradley Hand','Comic Sans MS','Segoe Print',cursive;
      font-size:1.05em;transform:rotate(-3deg);line-height:1.2;">
      this is what I got wrong
    </div>
  </div>
  <figcaption style="font-size:0.85em;color:#888;margin-top:8px;">Plain-prose caption.</figcaption>
</figure>
```

Two to four annotations per image, one idea each. Point at what changed the understanding, not at
whatever is brightest on screen.

---

## Concept stamp

Blockquote form is fine and portable:

```markdown
> **Concept #3: Copy the rule that produced the example, never the example.**
> *The copyable surface is specific to that one instance; the reason it's there is what travels.*
> *The tell: you can lay your version beside the source and see the same outline.*
```

## Extracted play

```markdown
**Correct the generator, never the output.**

- **The move:** they never asked for an edit to a piece — every correction named the rule that
  produced it.
- **The skill:** knowing a fix applied to an instance must be reapplied forever, while a fix applied
  to the rule is paid once.
- **Building it:** write the correction you'd give if you'd never see this particular output again.
  If it names a specific paragraph or number, go up one level.
```

Card form, when the piece is HTML-destined:

```html
<div style="border:1px solid #d9dbe4;border-left:3px solid #9ece6a;
  border-radius:0 8px 8px 0;padding:14px 20px;margin:1.2em 0;
  background:rgba(158,206,106,0.06);">
<div style="color:#6f9a48;font-size:0.7em;letter-spacing:.12em;
  text-transform:uppercase;font-weight:700;">Extracted play</div>
<div style="font-weight:700;font-size:1.06em;margin:4px 0 8px;">Name the move.</div>
<div style="margin-bottom:5px;"><strong>The move:</strong> what they actually did.</div>
<div style="margin-bottom:5px;"><strong>The skill:</strong> the tacit expertise, named.</div>
<div style="color:#6b6e7d;"><strong>Building it:</strong> how a reader grows the instinct.</div>
</div>
```

---

## How the structure varies by session type

Same devices, genuinely different shapes. Three examples, to stop this hardening into a template:

- **Wrong model (debugging)** — opens by stating the wrong belief flat; each later section is a
  contradiction; the heaviest section is the correction, and the result is short because the piece
  already landed there.
- **Vague want made concrete (building)** — the first attempt is a section in itself, an instrument
  rather than a deliverable; later sections are each one thing that seeing it clarified.
- **Constraint discovered (planning)** — the wall is the heaviest section, sized to what it cost;
  everything after is the reshaped goal, and the "solution" is the shortest section in the piece.
