# Meeting Nuggets

Turn your community's meeting transcripts into newsletter-style recaps people actually read — not meeting minutes nobody opens.

## What It Does

You drop in a meeting transcript. Meeting Nuggets extracts the topics, writes each one up as a substantive 500-750 word newsletter section, adds value beyond what was said (researched resources, hot takes, practical takeaways), styles it for email delivery, and optionally publishes to Notion with series navigation.

The output reads like a curated digest from a sharp colleague who was in the room, did some homework after, and is catching you up over coffee. Not "Alice said X, then Bob said Y."

## Who It's For

Any recurring group meeting where the conversations are worth more than they get credit for: masterminds, cohorts, community calls, advisory boards, team retrospectives, book clubs with ambition. If your group generates ideas worth capturing and your members would benefit from a polished recap between sessions, this skill fits.

## Quick Start

1. **Install the skill** — add `meeting-nuggets.skill` to your Claude skills
2. **Share a transcript** — paste it, upload a VTT file, or point Claude at one
3. **Answer the setup questions** — first time only, Claude asks about your community name, audience, tone, and where to publish. Takes about 2 minutes. Config is saved and reused on future runs.
4. **Review and send** — Claude produces the full recap as markdown. Edit if you like, then distribute.

That's it. On subsequent sessions, skip step 3 — Claude remembers your settings.

## What You'll Need

**Required:** A transcript from your meeting. Any of these formats work:

- Zoom VTT transcript (the `.vtt.txt` file Zoom generates)
- Plain text transcript from any transcription service (Otter, Granola, Rev, etc.)
- Raw text pasted directly into the chat
- Any format where speakers are identified and the conversation is readable

**Optional but recommended:** The chat transcript from the same session (Zoom's chat export, a Slack thread, etc.). Chat logs contain links, tool recommendations, and side conversations that enrich the recap significantly. Claude pulls URLs, attributions, and ideas from the chat and weaves them into the appropriate sections.

**Optional:** A Notion workspace (via MCP connection) if you want recaps published as a navigable series with prev/home/next links. Works fine without Notion — you'll get a markdown file either way.

## First-Time Setup

On first use, Claude asks six questions to calibrate the output:

| Question | Why it matters | Example |
|----------|---------------|---------|
| **Group name** | Appears in titles and headers | "The Product Circle" |
| **Who are the members** | Calibrates depth, jargon, and what counts as "obvious" | "Early-stage SaaS founders sharing growth tactics" |
| **Meeting cadence** | Adapts headers ("This Week" vs "This Month") and CTA framing | Weekly, biweekly, monthly |
| **Tone** | Sets the voice on a spectrum from industry report to group-chat energy | Formal, smart-casual, or casual |
| **Where to publish** | Markdown file, Notion, or both | "Both — we have a Notion hub" |
| **Custom segments** | Any recurring sections your group expects | "Tool of the Week", a specific sign-off, etc. |

Your answers are saved as a config block. Future transcripts skip the interview and go straight to output.

## What the Output Looks Like

Every recap includes:

- **Pull quote** at the top — a memorable line from the session that sets the tone
- **30-second summary** — scannable bullet points, one per topic, so readers can decide what to dive into
- **3-5 topic sections** — each written as a standalone newsletter piece (500-750 words), not a transcript walkthrough
- **Bolded opening sentences** on each new point — designed for skimming in an email client
- **Value-add callouts** — hot takes, "what this means for you" practical translations, or researched resource links. Not on every section — only where they genuinely add something.
- **Community Corner** — member highlights, wins, clever techniques, and ideas that deserve more airtime
- **Links from Chat** — every URL and tool recommendation shared in the chat log, collected into one reference section
- **"Try This Before Next Session"** — one concrete, 15-minute exercise tied to the discussion
- **Navigation footer** (Notion) — prev/home/next links connecting the series

## Customizing for Your Community

### Tone Examples

**Formal** — reads like a well-produced industry brief. Precise language, longer sentences with careful qualifications, positions framed as "analysis suggests." Good for executive advisory groups, board recaps, or professional associations.

**Smart-casual** (default) — reads like a sharp colleague explaining what happened. Dense per sentence, leads with the point, conversational but substantive. Good for masterminds, cohorts, and communities of practice.

**Casual** — reads like an energized group chat recap. Shorter sentences, more contractions, more personality. Provocative hot takes. Good for creative communities, startup groups, or any meeting where the vibe matters as much as the content.

### Custom Segments

If your group has recurring elements, tell Claude during setup. Examples:

- **"Tool of the Week"** — spotlight one tool someone mentioned, with a link and a one-paragraph take
- **"Question for Next Time"** — an unresolved question from the session to seed the next meeting
- **"Member Spotlight"** — a rotating deep-dive on one member's work or wins
- **"Reading List"** — books or articles referenced during the session
- A specific **sign-off phrase** or community motto

These get added to the template and appear in every recap automatically.

### Notion Publishing

If you want a navigable archive of recaps:

1. Connect Notion via MCP
2. On first run, Claude creates a hub page (e.g., "Product Circle Report Hub") with a description and icon
3. Each recap becomes a subpage with prev/home/next navigation links at the bottom
4. The hub page is updated with a linked list of all recaps and descriptive subtitles

The navigation pattern means readers can move through the series without going back to the hub each time — like chapters in a book.

## Tips for Better Recaps

**Give it the chat transcript.** Seriously. The chat log is where the links, quick reactions, and tool names live. Without it, those resources are lost. With it, Claude pulls them into "Go Deeper" sections and a dedicated "Links Shared in Chat" reference list.

**Don't edit the transcript before sharing.** Messy is fine — Claude is looking for substance, not formatting. Speaker labels, timestamps, filler words, tangents — it handles all of it. The only exception: if your transcript contains sensitive information you don't want in a recap, remove that before sharing.

**Review the first recap carefully.** The first output sets the pattern. If the tone is off, the topics are wrong, or a section doesn't fit your community, say so — Claude adjusts for all future runs.

**The "Try This" section is the stickiest part.** Members remember the exercise more than the summaries. Make sure it's specific and doable. If the one Claude picks doesn't feel right, ask for an alternative tied to a different topic from the session.
