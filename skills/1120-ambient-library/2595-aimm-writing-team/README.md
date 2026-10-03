# AIMM Writing Team

An autonomous, multi-role AI writing team that plans, researches, drafts, edits, and publishes high-quality thought-leadership articles from a single prompt.

## What Is This?

AIMM (Autonomous Intelligent Multi-role Manager) is a Claude Code skill that simulates a complete editorial team with five specialized roles:

- **🧠 Researcher** - Gathers insights, data, and perspectives
- **🎯 Strategist** - Crafts thesis and narrative structure
- **✍️ Writer** - Drafts the full article with engaging voice
- **✂️ Editor** - Refines clarity, rhythm, and credibility
- **📰 Publisher** - Packages final output with headlines and metadata

Each role includes a reflection engine that learns from every article, continuously improving quality over time.

## Quick Start

### Basic Usage

Simply ask AIMM to create an article:

```
Write a 1,200-word article on AI ethics for entrepreneurs
```

AIMM will automatically:
1. Research the topic
2. Create a strategic outline
3. Draft the article
4. Edit for quality
5. Package it for publication

### Target a Specific Publication

```
Create an 800-word article on psychological safety in remote teams for HR professionals,
written for Harvard Business Review style
```

### Use a Specific Role

Want just one part of the process? Call a specific role:

```
Use Strategist mode: create a narrative outline for a Fast Company article
on sustainable entrepreneurship
```

## Key Features

### 🎯 Attribution First
AIMM will **stop and request source material** if you reference content it hasn't reviewed. This prevents intellectual appropriation and ensures proper credit.

```
Write an article expanding on the RSIP framework from that LinkedIn post
```

AIMM will ask for the source URL before proceeding.

### 🗣️ Natural Voice
AIMM has learned to avoid formulaic "AI-sounding" openings like "Picture this..." or scene-setting vignettes. Instead, it uses:
- Direct conversational openings
- Shared recognition of reader frustrations
- Authentic voice with casual language when appropriate

### 🧠 Learning Memory
AIMM maintains a conceptual memory (`aimm_memory.json`) that tracks:
- Recurring issues across all roles
- Successful fixes and techniques
- Average quality scores
- User style preferences

This memory improves every article it produces.

### 📊 Reflection Reports
After each article, AIMM provides:
- Stage-by-stage quality scores (1-5)
- Top 3 improvements made
- Recurring weaknesses identified
- Updated memory summary

## Critical Workflow Rules

### Attribution & Source Material

**AIMM will stop the workflow if:**
- You reference "original content" that hasn't been reviewed
- Source URLs are provided but not accessed
- Building on others' frameworks without proper credit

**Before drafting, AIMM will:**
1. Request access to referenced source material
2. Identify original authors and their contributions
3. Build research brief around actual source data
4. Plan prominent attribution strategy

**Attribution approach:**
- Credit given in opening paragraphs, not footnotes
- Article positioned as "expanding/applying/analyzing" not claiming originality
- Links back to source material included
- Thought leadership without credit = intellectual appropriation

### Style & Voice Preferences

Based on learned user preferences:
- ✅ Natural conversational openings
- ✅ Direct address and shared recognition
- ✅ Casual language when contextually appropriate
- ✅ "Show not tell" from authentic voice
- ❌ Formulaic vignette scenes
- ❌ "Picture this" or "imagine two people" openings
- ❌ Template-based "AI technique" patterns

## Example Use Cases

### Full Autonomous Pipeline
```
Act as AIMM-Writing-Team to research, strategize, write, edit, and publish
an 800-word article on "psychological safety in remote teams" for HR professionals
```

### Research Only
```
Use Researcher mode: gather insights on the future of work for a tech-savvy audience
```

### Edit an Existing Draft
```
Use Editor mode: refine this draft for clarity and engagement
[paste your draft]
```

### Strategic Planning
```
Use Strategist mode: create a 1,500-word outline on AI regulation for policymakers
```

## How It Works

### Autonomous Mode
1. **Researcher** gathers 3-5 credible insights with novelty/credibility ratings
2. **Strategist** transforms insights into thesis, tension/reframe, and outline
3. **Writer** drafts full article (~±5% of target length)
4. **Editor** refines clarity, rhythm, credibility
5. **Publisher** packages with headline, summary, SEO tags

Each role self-evaluates:
1. **Diagnostic Scoring** - Rate key metrics 1-5
2. **Targeted Revision** - Fix any metric scoring <4
3. **Meta-Reflection** - Record improvements and weaknesses

### Manual Override
Mention a specific role to activate only that function:
- "Use Researcher mode"
- "Act as the Strategist"
- "Use Editor mode"

## Output Structure

### 1️⃣ Final Article
```
# [Compelling Headline]
## [Engaging Subhead]

[Article body with natural voice and clear structure...]

[Attribution and source links when applicable]
```

### 2️⃣ Reflection Report
- Role-by-role scores (clarity, novelty, flow, engagement, credibility)
- Top 3 improvements made during this run
- Recurring weaknesses to address
- Average reflection score

### 3️⃣ Memory Update
Summary of what AIMM learned from this article to improve future work.

## Tips for Best Results

1. **Be specific about audience and publication style**
   - "for LinkedIn readers" vs "for academic journal"
   - "Harvard Business Review tone" vs "TechCrunch style"

2. **Specify word count**
   - AIMM will hit ±5% of your target length

3. **Provide source material when building on existing work**
   - Share URLs, documents, or frameworks
   - AIMM will request them if you mention but don't provide

4. **Use the right role for partial tasks**
   - Don't run full pipeline if you only need research or editing

5. **Review reflection reports**
   - They reveal what worked and what needs improvement
   - Help you understand AIMM's decision-making

## Limitations

- Conceptual memory persistence requires the JSON file to be maintained
- Generated data should be fact-checked for accuracy
- Reflection scores are heuristic and self-calibrating
- Designed for iterative improvement, not one-shot perfection
- Requires Code Execution enabled for actual file persistence

## Memory Schema

AIMM maintains learning data in `aimm_memory.json`:

```json
{
  "last_updated": "YYYY-MM-DDTHH:MM:SSZ",
  "researcher": {
    "recurring_issues": [...],
    "successful_fixes": [...],
    "avg_reflection_score": 4.5,
    "key_learnings": [...]
  },
  "strategist": {...},
  "writer": {...},
  "editor": {...},
  "publisher": {...},
  "orchestrator": {
    "critical_lessons": [...]
  }
}
```

This memory evolves with each article, making AIMM smarter over time.

## Getting Help

If AIMM produces unexpected results:
1. Check if you provided enough context (audience, publication, word count)
2. Review the reflection report for insights
3. Try calling a specific role to isolate the issue
4. Provide feedback to improve future memory

## License & Attribution

This skill is designed to **respect intellectual property** and enforce proper attribution. When building on others' work, AIMM ensures:
- Original authors are identified and credited prominently
- Source material is linked for deeper exploration
- Content is positioned as expansion/application, not claiming originality

---

**Version:** 2.6.0 (January 2024)
**Last Updated:** 2025-01-24
**Status:** Active learning system with conceptual persistence
