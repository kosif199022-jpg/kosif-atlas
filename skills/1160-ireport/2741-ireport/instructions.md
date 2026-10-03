# Interactive Report Generator Skill (`/ireport`)

Generate beautiful, interactive HTML reports using composable primitives inspired by the Kimi Deep Research document style.

## Quick Start
```
/ireport [topic or instructions]
```

---

## Input & Workflow (Hybrid Approach)

This skill accepts **flexible input** - from a simple topic to detailed research notes. Claude will supplement with web research as needed.

### Input Types

| Input | Claude's Action |
|-------|-----------------|
| **Topic only** | Full research: web search, gather sources, synthesize, generate report |
| **Topic + key questions** | Targeted research on specific questions, then generate |
| **Topic + sources/URLs** | Fetch provided sources, supplement with additional research |
| **Raw notes/data** | Minimal research, focus on structuring and formatting |
| **Complete content** | Format only, no research needed |

### Examples

```
/ireport AI agents in enterprise software 2025
```
→ Claude researches the topic, finds recent data, generates full report

```
/ireport Compare React vs Vue vs Svelte for my startup
- focus on: learning curve, performance, ecosystem
- we have 2 junior devs
```
→ Claude researches with user's context in mind, tailors recommendations

```
/ireport Summarize these into a report:
- https://example.com/article1
- https://example.com/article2
[paste additional notes here]
```
→ Claude fetches URLs, combines with notes, supplements gaps with research

```
/ireport Format this research as a report:
[user pastes complete content]
```
→ Claude structures and formats, minimal/no external research

---

## Workflow Steps

### 1. Parse Input
- Identify topic/scope
- Extract any provided content, URLs, or data
- Note specific questions or focus areas

### 2. Research (as needed)
- **Web search** for recent data, statistics, trends
- **Fetch URLs** if user provided sources
- **Fill gaps** in user-provided content
- **Find citations** for claims that need sourcing

### 3. Synthesize
- Organize findings into logical sections
- Identify 2-4 key statistics for hero cards
- Extract key insights for callout boxes
- Structure comparison data for tables

### 4. Generate Report
- Build HTML using composable primitives
- Include proper citations with links
- Save to `./ireport/reports/[kebab-case-name].html`

### 5. Deliver
- Inform user of file location
- Summarize key findings
- Note any areas where more research could help

---

## Report Structure

Every report should include:

1. **TOC Sidebar** - Navigation for all sections
2. **Hero Section** - Title, description, 2-4 stat cards with key metrics
3. **Executive Summary** - Overview with main insight callout
4. **Main Sections** (3-7) - Content organized by topic
5. **Footer** - Report title, summary, topic tags

---

## Design System

### Color Palette
| Color | Tailwind | Use Case |
|-------|----------|----------|
| Primary Teal | `teal-700` | Headings, emphasis, primary stats |
| Accent Cyan | `cyan-700` | Secondary stats, callout borders |
| Secondary Slate | `slate-800` | Code blocks, footer |
| Text | `gray-900` | Body text, headings |
| Muted | `gray-500` | Descriptions, labels |
| Surface | `gray-50` | Page background |
| Border | `gray-200` | Card borders, dividers |

### Typography
- **Display/Headings:** `Georgia, 'Times New Roman', serif` — bold 700, normal style. Only the opening emphasis line of the hero uses `font-style: italic`.
- **Body:** `Inter, sans-serif` — weights 400 (body), 500 (medium), 600 (semibold), 700 (bold)
- **Code:** `Monaco, Menlo, Consolas, 'Courier New', monospace`
- **Note:** The original Kimi template declares `"Tiempos Text"` but never loads the font file. It falls back to Georgia on Mac / Times New Roman on Windows. We use Georgia directly.

---

## Required Dependencies (in `<head>`)

```html
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

Plus custom CSS including:
```css
.font-display { font-family: Georgia, 'Times New Roman', serif; }
```
And styles for `.toc-fixed`, `.main-content`, `.hero-gradient`, `.bento-grid`, `.insight-highlight`, `.stat-card`, `.citation-link` — see `styles.css`.

---

## Output

Reports are saved to:
```
./ireport/reports/[kebab-case-topic].html
```

Open in browser to view the interactive report.

## Source

- [[wiki/mastermind/sessions/2025-08-14_Mastermind]] (general operational skill)
