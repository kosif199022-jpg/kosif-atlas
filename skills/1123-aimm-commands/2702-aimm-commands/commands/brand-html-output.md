---
name: Brand-Consistent HTML Output
type: command
description: Two-stage workflow for producing branded, visually differentiated AI-generated documents — draft in Markdown for content quality, render in HTML with your brand CSS for visual consistency.
source: Dirk Ohlmeier (Markdown→HTML workflow) + Lou (brand CSS extension) — 2026-05-07 Mastermind
trigger: /aimm:brand-html-output
location: wiki/mastermind/commands/
source-sessions:
  - 2026-05-07_Mastermind
---

# Brand-Consistent HTML Output

## Purpose

Produces AI-generated documents (presentations, dashboards, reports, one-pagers) that look like *you* rather than like Claude's defaults. Most practitioners accept Claude's stock HTML palette (purpley-blue or black-and-gold). The result is a homogeneous feed — every document visually identical to thousands of other Claude users' outputs. This workflow eliminates that.

Three stages, each with a specific purpose:
1. **Draft in Markdown** — content quality and editability
2. **Convert to HTML** — visual quality and presentation-readiness
3. **Apply brand CSS** — visual differentiation and consistency

Derived from Dirk Ohlmeier's Markdown→HTML observation (May 7, 2026) and Lou's extension: feeding brand CSS forces output to match your existing visual identity.

## When to Use

- Any public-facing document generated with Claude (presentations, client-facing reports, dashboards, one-pagers)
- When publishing AI-generated content to LinkedIn, a newsletter, or your website
- When you want your AI-generated outputs to be indistinguishable from natively branded content

## The Three-Stage Workflow

### Stage 1: Draft in Markdown

Use this prompt to get strong content quickly:

```
Draft this as a Markdown document. Structure: [your structure here]. Content: [your topic/brief]. 
Write for [target audience]. Keep it editable — I'll revise before final output.
Do not style. Plain Markdown only.
```

Edit the Markdown until the content is right. Fix arguments, structure, examples. Content decisions in Markdown are fast — you're working with text, not rendering.

### Stage 2: Convert to HTML

Once the content is final, use this prompt:

```
Take this Markdown and produce a beautiful, publication-ready HTML document.
Single file. Responsive. Modern typography. Professional visual hierarchy.
Include inline CSS. No external dependencies.

[Paste your Markdown here]
```

This produces a visually polished document. At this stage it will be in Claude's default palette.

### Stage 3: Apply Brand CSS

Now layer in your brand identity:

**Option A — Provide hex codes and font stack directly:**

```
Restyle this HTML with my brand colors and typography.
Primary color: [#hex]
Secondary color: [#hex]
Accent: [#hex]
Body font: [Font Name, fallback]
Heading font: [Font Name, fallback]
Visual style: [e.g., "clean and minimal", "bold and direct", "warm and approachable"]

Preserve all content and structure. Only change the styling.

[Paste your HTML here]
```

**Option B — Extract brand CSS from your website:**

```
Read the CSS from my website at [yourwebsite.com]. 
Extract: primary colors, secondary colors, fonts, border-radius preferences, button styles, heading hierarchy.
Then restyle this HTML document to match my website's visual identity exactly.

[Paste your HTML here]
```

**Option C — Use Claude's Design feature (web app only):**

Create a branded template once in Claude's Design mode on claude.ai. Save it. Then in Claude Code:

```
Apply the template named "[Your Template Name]" from my Claude Design templates to this HTML document. 
Preserve all content. Match the template's visual style exactly.

[Paste your HTML here]
```

## Brand Context File (Recommended)

Create a file called `brand-context.md` in your vault with your standing brand specifications. Reference it in any output-generation prompt rather than typing your colors every time:

```markdown
# Brand Context

Primary color: #[hex]
Secondary color: #[hex]
Accent color: #[hex]
Body font: [Font, sans-serif]
Heading font: [Font, serif/sans-serif]
Visual adjectives: [e.g., clean, bold, minimal / warm, approachable, professional]
Avoid: [e.g., dark backgrounds, serif body text, rounded corners]
```

Usage: "Read my brand context file at [path] and apply it to this document."

## Usage Notes

- Bally Binning confirmed this workflow produces output "indistinguishable from native content" after consistent use
- The biggest leverage point is the brand context file — once created, every future output is one sentence away from full brand consistency
- The Markdown draft stage is not optional for long-form content — it's where the thinking happens; skipping it produces polished but shallow outputs
- For internal documents, skip Stage 3 — the visual overhead is only worth it when the output is public-facing

## Source

Derived from Dirk Ohlmeier and Lou's discussion of HTML output quality and brand differentiation, May 7, 2026 AIMM Mastermind.

→ [[2026-05-07_Mastermind]]
→ [[Insight - Brand-Consistent AI Output — Differentiate in a Homogeneous Feed]]
→ [[Insight - AI as Ghostwriter, You as Editor-in-Chief]]
