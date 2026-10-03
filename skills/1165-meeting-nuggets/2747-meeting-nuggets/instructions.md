# Meeting Nuggets

Transform raw meeting transcripts into newsletter-style reports your community will actually read. Not meeting minutes — these are curated, researched, styled digests that extract the signal from a conversation and add value beyond what was said in the room.

## First-Time Setup: The Interview

The first time this skill is used, you need to learn about the user's community. Ask these questions conversationally (not as a form — adapt based on their answers):

1. **What's the group called?** (e.g., "AI Mastermind for Leaders", "The Product Circle", "Founders Roundtable")
2. **Who are the members?** Get a one-sentence audience description — their roles, what they care about, why they meet. (e.g., "knowledge entrepreneurs learning to become AI-augmented" or "early-stage SaaS founders sharing growth tactics")
3. **What's the meeting cadence?** Weekly, biweekly, monthly? This affects section headers (e.g., "This Week in 30 Seconds" vs. "This Month in 30 Seconds") and the CTA framing.
4. **What tone fits this group?** Offer these as a spectrum:
   - Formal/professional (think: industry report)
   - Smart-casual (think: sharp colleague catching you up over coffee)
   - Casual/irreverent (think: group chat energy, inside jokes welcome)
5. **Where should the recap live?** Markdown file, Notion page, or both? If Notion, is there an existing hub page for the series?
6. **Any recurring segments or branding?** Some groups have specific sections they always want (e.g., "Tool of the Week", a specific sign-off phrase, a mascot or emoji theme).

After the interview, save these parameters as a config block at the top of the first recap so they carry forward. On subsequent runs, check whether a previous recap exists — if so, inherit the configuration and skip the interview.

**Stored config format** (save as a comment block or reference file):
```
Community: [name]
Audience: [description]
Cadence: [weekly/biweekly/monthly]
Tone: [formal/smart-casual/casual]
Output: [markdown/notion/both]
Hub page: [Notion URL or "none"]
Custom segments: [any recurring sections]
Recap title format: [e.g., "[Name] Recap — [Date]"]
```

## What This Skill Produces

A recap report with these components:

1. **Pull quote** — A memorable line from the session that sets the tone
2. **Quick summary** — 4-5 bullet points that let skimmers decide which sections to read (header adapts to cadence: "This Week in 30 Seconds", "This Month in 30 Seconds", etc.)
3. **Topic sections** (3-5 per session) — Each one 500-750 words of substantive, newsletter-style content using the conversation as source material
4. **Value-add callouts** per section — Hot takes, "what this means for you" insights, and/or researched "Go Deeper" resource links (use editorial judgment on which type fits each topic — not all three on every section)
5. **Community Corner** — Highlights of member wins, ideas, and contributions worth spotlighting
6. **"Try This Before Next Session"** — A single, concrete, low-effort action item anyone can do in 15 minutes
7. **Custom segments** — Any recurring sections the user defined during setup
8. **Navigation footer** — Prev/Home/Next links when part of a series

## Inputs

**Required:** A meeting transcript — VTT format, plain text, or pasted directly into the chat.

**Optional but enriching:** A chat transcript from the same session (Zoom chat export, Slack thread, etc.). Chat transcripts often contain links, resources, reactions, and side conversations that didn't make it into the spoken transcript. When available, mine them for resource URLs, member attributions, and ideas that surfaced in text but not on camera.

## How to Write the Recap

### Step 1: Extract Topics

Read the full transcript. Identify 3-5 distinct topic clusters — not by speaker, but by subject. A topic might span multiple speakers and multiple points in the conversation. Look for:

- Tool discoveries or recommendations
- Workflow demonstrations or techniques
- Architecture/design discussions
- Real-world case studies or client stories
- Strategic debates or philosophical discussions
- Member wins or breakthroughs

Consolidate related threads. If three people discussed the same theme at different points, that's one topic, not three. If one person gave a 30-minute demo covering multiple distinct subjects, break it into the sections the audience would naturally care about separately.

### Step 2: Write Each Topic Section

Each section should read like a standalone newsletter article, not a transcript summary. The guiding principles:

**Write like a newsletter, not meeting minutes.** Never write "Alice said X, then Bob said Y." Instead, synthesize the discussion into a cohesive narrative about the topic. The reader should learn something valuable even if they weren't in the room. Use participants' names naturally when attributing ideas, discoveries, or memorable framings — but the structure follows the topic, not the conversation order.

**Use the conversation as source material, not as a script.** The transcript is your raw material. Distill it into 500-750 words of substantive content per topic. You're writing *about* what was discussed, using the specifics and examples from the conversation to make the piece concrete and credible.

**Bold opening sentences for skimmability.** The first paragraph of each new point within a section opens with a bolded sentence that works as a scannable thesis statement. Someone skimming the email should get the arc of the discussion from the bold lines alone. If multiple paragraphs support the same point, only the first paragraph gets the bold treatment — the rest flow naturally underneath.

**Match the audience's sophistication.** Use the audience description from setup to calibrate. Domain experts don't need hand-holding. Newcomers might need a sentence of context. Match the room.

### Voice and Tone

Adapt based on the tone setting from setup. Here's the baseline (smart-casual) with notes on how to shift:

1. **Dense per sentence.** Pack meaning. Trust the reader to keep up. Don't dilute a strong observation with three qualifiers and a softening clause. *(For formal tone: slightly longer sentences with more precise qualifications. For casual: shorter, punchier, more contractions.)*

2. **Lead with the point, not the setup.** No throat-clearing. Don't write "It's worth noting that in today's session, an interesting discussion emerged around..." Write the point. *(Applies to all tones.)*

3. **Conversational but substantive.** The tone should feel like a smart friend explaining something over coffee — but a friend who did the homework. *(For formal: more like a well-written industry brief. For casual: more like a group chat recap with personality.)*

4. **Take positions in hot takes.** The value-add callouts are the place to have an opinion. Don't hedge with "it remains to be seen" or "only time will tell." Stake a claim. *(For formal: frame as "analysis suggests" rather than "here's what this really means." For casual: be more provocative.)*

5. **Use concrete specifics.** Names, numbers, tool names, exact techniques. The transcript is full of specifics — use them. *(Applies to all tones.)*

6. **Treat the reader as a peer.** No condescension, no over-explaining, no "you might be wondering." *(Applies to all tones.)*

### Step 3: Add Value Beyond the Conversation

This is what separates a recap from meeting minutes. For each topic section, use editorial judgment to add one of these (not all — pick the one that fits):

**Hot Take** — A provocative, opinionated "here's what this actually means" paragraph. Should make the reader think "huh, I hadn't considered that." Takes a position. Connects the discussion to a bigger trend, a market implication, or an uncomfortable truth the group danced around. Format as a blockquote callout.

**What This Means for You** — A practical translation for the reader. "You don't need to build the thing we discussed — here's the minimum viable version of this idea applied to your practice." Bridges the gap between "interesting discussion" and "thing I can act on Monday morning." Format as a blockquote callout.

**Go Deeper (resources)** — Researched links, books, tools, or references that extend the conversation. Use web search to find real, current resources — don't make up URLs. Include brief descriptions of what each resource offers. Format as a bulleted list under a bold "Go Deeper:" header.

When a chat transcript is available, pull any links, tool recommendations, or resource URLs shared there into the appropriate "Go Deeper" sections. Attribute them (e.g., "shared by Don in the chat").

### Step 4: Write the Structural Elements

**Pull quote:** Find the single most memorable, tone-setting line from the transcript. It should capture the energy or spirit of the session. Format as a blockquote with attribution at the top of the document.

**Quick summary:** Write 4-5 bullet points — one per topic section — that let someone scanning their inbox decide which sections to read. Each bullet should be one bolded phrase followed by a short dash and a one-line summary.

**Community Corner:** Highlight 2-4 member contributions worth spotlighting — a clever technique someone shared, a client win, an idea that deserved more airtime, a tool recommendation from the chat. Each gets a bolded opening sentence and a short paragraph. This section celebrates the community and gives quieter members visibility.

**"Try This Before Next Session":** One concrete exercise the reader can do in 15 minutes. It should connect directly to something discussed in the session — ideally the most universally applicable technique or insight. Write it as a specific, step-by-step mini-exercise, not a vague encouragement. Adapt the header to match cadence (e.g., "Try This Before Next Month's Session").

### Step 5: Handle Links from Chat Transcript

If a chat transcript is provided, create a **"Links Shared in Chat"** section near the bottom (before the CTA) that collects all URLs, tool names, and resource links shared during the session. Format as a bulleted list with bold tool/resource names, brief descriptions, and clickable links. This section serves as a quick-reference bookmark list for attendees.

### Step 6: Publish to Notion (when requested)

If the user wants the recap posted to Notion:

1. **Check for an existing hub page.** Use the hub URL from config, or search Notion, or ask the user. If none exists, create one with an icon, a brief description of the series, and a tagline like "Read the latest, or start from the beginning."

2. **Create the recap as a subpage** under the hub. Use the full content. Give it a descriptive title using the format from config and an icon.

3. **Add navigation links** at the bottom of each subpage:
   - First page in series: `[Home](hub-url) · [Next Recap →](next-url)`
   - Middle pages: `[← Previous Recap](prev-url) · [Home](hub-url) · [Next Recap →](next-url)`
   - Latest page: `[← Previous Recap](prev-url) · [Home](hub-url)`

4. **Update the hub page** to list the new recap as a linked subpage with a descriptive subtitle summarizing the key topics.

5. **Update the previous recap's navigation** to add the forward link to the new page.

Always save a local markdown copy to the outputs folder as well, regardless of whether Notion publishing happens.

## Output Format

```
# [Community Name] Recap — [Date]
### [Optional subtitle, e.g., "Special Guest: Name"]

> *"Pull quote here."*
> — Attribution

---

### [This Week/Month] in 30 Seconds

- **Topic 1** — one-line summary
- **Topic 2** — one-line summary
- ...

---

## [Topic 1 Title]

**Bolded opening sentence.** Rest of paragraph...

[Content sections with bold lead-ins for each new point]

> **Hot Take: [Title]**
> [or **What This Means for You**]
>
> Callout content...

**Go Deeper:**
- **Resource** — description: [link](url)

---

## [Topic 2 Title]
...

---

## Community Corner

**Member highlight.** Description...

---

## Links Shared in Chat (if chat transcript provided)

- **Tool Name** — description: [link](url)

---

## Try This Before Next [Session/Meeting]

**Specific exercise.** Step-by-step instructions...

---

*Next session: [date/info]*

---
[← Previous](url) · [Home](url) · [Next →](url)
```

## Common Pitfalls

- **Don't write meeting minutes.** If your output reads like "First, Alice discussed X. Then Bob shared Y. Next, Carol asked about Z" — stop and rewrite. The reader shouldn't be able to reconstruct the conversation timeline from your recap.
- **Don't add value-add callouts to every section.** Pick the 2-3 where a hot take or resource list genuinely adds something. Forced insight is worse than no insight.
- **Don't over-research.** One or two researched resources per section is plenty. The goal is "here's where to go deeper," not a literature review.
- **Don't forget the chat transcript.** If the user provides one, mine it thoroughly — links, reactions, ideas, attributions. Chat transcripts often contain the most concrete, linkable resources from the session.
- **Don't use generic bolded openers.** "This was an interesting discussion" is not a bolded lead-in. Each bold sentence should be a specific, scannable claim.
- **Don't skip the interview on first use.** The setup conversation takes 2 minutes and makes every subsequent recap dramatically better. Don't guess at the community's tone and audience — ask.

## Source

- [[wiki/mastermind/sessions/2025-08-14_Mastermind]] (transcript-to-thought-leadership pipeline — related topic)
