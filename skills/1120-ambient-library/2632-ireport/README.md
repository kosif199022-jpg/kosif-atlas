# iReport

Generate polished, interactive HTML research reports from a single prompt. Powered by Claude, styled after the Kimi Deep Research document format.

## How It Works

Give Claude a topic. It researches, synthesizes, and outputs a self-contained HTML report with a fixed sidebar, stat cards, data tables, citation links, and more.

```
ireport: "your topic or instructions here"
```

Reports are saved to `./ireport/reports/` and can be opened directly in any browser.

---

## User Guide

### Getting Started

The simplest way to generate a report:

```
ireport: "the future of renewable energy storage"
```

Claude will search the web for recent sources, extract key findings and statistics, then produce a fully formatted HTML report.

### Input Modes

You can provide varying levels of detail. Claude adapts its workflow accordingly.

**Topic only** -- Claude does full research
```
ireport: "AI agents in enterprise software 2025"
```

**Topic + focus areas** -- Claude targets specific questions
```
ireport: "Compare React vs Vue vs Svelte for my startup"
- focus on: learning curve, performance, ecosystem
- we have 2 junior devs
```

**Topic + source URLs** -- Claude fetches your sources, fills gaps
```
ireport: "Summarize these into a report:"
- https://example.com/article1
- https://example.com/article2
Additional context or notes here.
```

**Raw notes or data** -- Claude structures and formats, minimal research
```
ireport: "Format this research as a report:"
[paste your content]
```

**Complete content** -- Claude formats only, no external research
```
ireport: "Format only:"
[paste fully written content]
```

### What You Get

Every report includes:

| Component | Description |
|-----------|-------------|
| **Sidebar TOC** | Fixed navigation linking to all sections |
| **Hero section** | Title with emphasis line, description, topic tags, 2-4 stat cards |
| **Executive summary** | Overview paragraph with a key insight callout |
| **Main sections** | 3-7 content sections with cards, tables, code blocks, callouts |
| **Action items** | Checklist section (when applicable) |
| **Citations** | Linked sources throughout the report |
| **Footer** | Report title, summary, topic tags |

### Output Location

```
./ireport/reports/[kebab-case-topic].html
```

Open the file in a browser to view the interactive report. No build step or server required.

---

## Design System

Reports use a consistent visual language drawn from the Kimi Deep Research format.

### Typography

- **Headings** -- Georgia serif, bold 700. Only the hero emphasis line is italic.
- **Body** -- Inter sans-serif (400, 500, 600, 700)
- **Code** -- Monaco / Menlo / Consolas monospace

### Color Palette

| Role | Color | Usage |
|------|-------|-------|
| Primary | Teal 700 | Headings, emphasis, primary stats |
| Accent | Cyan 700 | Secondary stats, callout borders |
| Secondary | Slate 800 | Code blocks, footer |
| Text | Gray 900 | Body copy, headings |
| Muted | Gray 500 | Labels, descriptions |
| Surface | Gray 50 | Page background, alternating sections |

### Component Library

The following building blocks are available for reports:

- **Stat cards** -- Key metrics with icon, value, and label
- **Info cards** -- Bordered cards with title, icon, description, and bullet lists
- **Insight highlights** -- Teal-bordered callouts for key findings
- **Warning callouts** -- Red-bordered alerts for critical information
- **Code blocks** -- Dark background with green monospace text
- **Data tables** -- Bordered rows with header styling
- **Example boxes** -- Good/bad comparison blocks
- **Status badges** -- Colored pills (green/yellow/red)
- **Citation links** -- Dotted-underline links to sources
- **Checklists** -- Interactive checkbox action items

See `components.html` for the full HTML reference of every component, and `SKILL.md` for copy-paste snippets.

---

## File Structure

```
ireport/
  README.md          # This file -- user guide and overview
  SKILL.md           # Skill definition with composable HTML primitives
  styles.css         # Shared stylesheet (Georgia fonts, layout, components)
  template.html      # Base HTML template with placeholder variables
  components.html    # Visual component reference library
  reports/           # Generated reports (HTML files)
```

---

## Tips

- **Be specific** -- "AI optimization for e-commerce product pages" will produce a more focused report than "AI optimization"
- **Add constraints** -- Mention your audience, industry, or team size to get tailored recommendations
- **Provide sources** -- If you already have articles or data, include URLs so Claude can incorporate them directly
- **Request sections** -- You can ask for specific sections like "include a comparison table" or "add an action checklist"
- **Iterate** -- Ask Claude to regenerate specific sections, add data, or adjust the tone after the initial report

---

## Requirements

Reports are self-contained HTML files that load these CDN dependencies:

- [Tailwind CSS](https://tailwindcss.com) (via CDN)
- [Font Awesome 6](https://fontawesome.com) (via CDN)
- [Inter font](https://fonts.google.com/specimen/Inter) (via Google Fonts)

No local install needed. Just open the HTML file in a browser.
