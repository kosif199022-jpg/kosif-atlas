# Conversation Consolidation System

## What This Skill Does

Claude conversation history is intellectual capital that quietly rots. You work through a stock thesis on Tuesday, a positioning problem on Thursday, a coaching framework on Saturday — and three weeks later you cannot find any of it. Worse: if any of that thinking happened inside a Claude Project, it is *completely invisible* to top-level Claude memory and search. Claude cannot search inside its own Projects. That is the gap this skill closes. The Conversation Consolidation System exports your full Claude history, runs an AI pass to group conversations by topic, collapses related conversations into single Obsidian documents, and syncs everything into an Obsidian vault via the Obsidian MCP — turning your scattered chat history into a persistent external brain that Claude can read and write to. Two scheduled scripts (an 8 PM day-in-review and an 8 AM morning briefing) keep the vault maintained automatically, so the system compounds without daily effort.

---

## When to Use This Skill

Use this skill when:

- You frequently catch yourself thinking "I already worked this out with Claude — where is it?"
- You use Claude Projects heavily and have realized that the content inside them is unreachable from top-level chat
- You want a single searchable home for everything you have ever figured out with AI — across chat, Cowork, and Projects
- You are setting up a personal knowledge management (PKM) layer for the first time and want it AI-native from day one
- You already use Obsidian and want Claude to read from and write to it as a shared memory
- You want a daily rhythm — end-of-day capture and start-of-day briefing — without journaling by hand
- You are tired of re-deriving the same insights because retrieval is harder than re-thinking

---

## Prerequisites / Setup

**Tooling required:**

1. **Claude conversation export access** — Claude's settings allow you to download your full conversation history as JSON (or text). For Projects, content must be exported manually because project contents are isolated from top-level export. Plan a recurring manual pass for any active Projects.
2. **Obsidian** — local-first markdown PKM tool. Free for personal use. Create a dedicated vault for this system (e.g., `~/Obsidian/ExternalBrain`) so it does not collide with existing notes.
3. **Obsidian MCP server** — an MCP (Model Context Protocol) server that exposes the Obsidian vault to Claude as a read/write surface. This is the bridge that lets Claude both consume the vault as memory and write new consolidated documents back into it. Several community implementations exist; install one and point it at your dedicated vault path.
4. **A scheduler** — cron on macOS/Linux, or Task Scheduler on Windows. Used for the 8 PM and 8 AM scripts. Alternatively, use any agent scheduler (e.g., `mcp__scheduled-tasks` or the `schedule` skill) if you prefer not to manage cron directly.
5. **A grouping/extraction prompt** — a saved prompt (or skill) that takes raw conversations as input and emits topic-grouped, collapsed summaries. A starter version is provided in Step 2 below.

**Optional but recommended:**

- A second Claude session or Claude Code instance with file system access, used as the "consolidator" — kept separate from your main thinking sessions so the consolidation work does not pollute your live context.
- A backup of the dedicated Obsidian vault under git, so the external brain has version history.

---

## Step-by-Step Workflow

### Step 1 — Export All Claude Conversation History

From Claude's settings, download your full conversation history as JSON or text. Save it to a working directory (e.g., `~/ExternalBrain/inbox/claude-export-YYYY-MM-DD/`). For any active Claude Projects, open each Project and manually copy out the conversations you want included — this is the workaround for the Project isolation gap, and it must be done by hand because Projects do not appear in the top-level export.

The first run is the largest. After that, run weekly so the inbox stays small and the topic grouping pass stays fast.

### Step 2 — AI Pass: Group Conversations by Topic

Open a fresh Claude session (separate from your live thinking sessions) and feed it the export. Run a topic-grouping prompt. A working starter:

> *"Read these conversations. Group them by topic — not by date. For each topic group, list the conversation titles or first lines that belong to it. Do not summarize yet. Just produce the grouping."*

Review the grouping. Adjust topic boundaries that feel wrong — too broad ("AI") or too narrow ("AI prompt I tried Tuesday"). The right granularity is the granularity at which you would want to *retrieve* later: usually the level of a project, a recurring theme, or a domain (e.g., "stock investment thesis", "PowerUp positioning work", "GEARS architecture").

### Step 3 — Collapse Related Conversations Into Single Documents

For each topic group, run a second pass:

> *"For this topic group, combine the key insights, decisions, conclusions, and open questions from all conversations in the group into a single document. Preserve specific examples and any concrete commitments. Discard small talk and dead ends. Title the document clearly. Use markdown with H2 sections."*

The collapse is the heart of the system. As Kasimir put it: instead of having five chats about stock investment, you end up with one. Five becomes one. Retrieval drops from ten minutes to ten seconds.

### Step 4 — Sync to Obsidian via the Obsidian MCP

Save each collapsed document into the dedicated Obsidian vault through the Obsidian MCP server. Use a flat or lightly-foldered structure — Obsidian's strength is search and backlinks, not hierarchy. Suggested layout:

```
ExternalBrain/
  topics/                <- one .md file per collapsed topic
  daily/                 <- daily review and morning briefing outputs
  projects-export/       <- raw exported content from Claude Projects
  inbox/                 <- unprocessed exports awaiting the next pass
```

Once a document is in the vault, the Obsidian MCP makes it readable and writable from any Claude session that has the MCP enabled. From this point, Claude can search across your entire consolidated history in a single call, instead of you scrolling through chat history.

---

### Scheduled Scripts

Two recurring jobs maintain the vault automatically. Both run as scheduled prompts pointed at the Obsidian MCP.

**8 PM — Day-in-Review**

A prompt that reads any conversations from the day, extracts decisions / new insights / open threads, and writes them to `daily/YYYY-MM-DD-review.md`.

Example cron entry:

```
0 20 * * * /usr/local/bin/claude-run "$HOME/ExternalBrain/scripts/day-in-review.prompt"
```

Sample prompt body:

> *"Read today's Claude conversations and today's vault changes. Produce a day-in-review with three sections: (1) What I decided, (2) What I learned, (3) What is still open. Save to `daily/{{date}}-review.md` in the Obsidian vault via MCP."*

**8 AM — Morning Briefing**

A prompt that reads yesterday's review plus the most recently updated topic documents, and writes a short briefing on what to focus on today.

Example cron entry:

```
0 8 * * * /usr/local/bin/claude-run "$HOME/ExternalBrain/scripts/morning-briefing.prompt"
```

Sample prompt body:

> *"Read yesterday's day-in-review and the three most recently updated topic documents in the vault. Produce a morning briefing: (1) What changed yesterday, (2) The single most important thing to focus on today, (3) Any open thread that risks going cold. Save to `daily/{{date}}-briefing.md` and surface it on screen."*

The two scripts close the loop: capture at day's end, orient at day's start, with the vault as the shared substrate.

---

## Expected Output

Once the pipeline has run end-to-end at least once, you will have:

- A dedicated Obsidian vault containing a **flat set of topic documents** — one per substantive theme in your AI work to date (typical first-run yield: 20–80 documents from a year of heavy Claude use).
- A `daily/` folder that begins accumulating reviews and briefings from the moment the scheduled scripts go live.
- The ability to ask Claude (via the Obsidian MCP) questions like *"What did I conclude about the stock thesis last month?"* and get an answer in seconds, drawn from the consolidated document rather than from a graveyard of chats.
- A repeatable weekly rhythm: export → group → collapse → sync, which after the first run takes 20–30 minutes per week.

The qualitative shift Kasimir reported: retrieval time drops from ten minutes to ten seconds, and the felt experience is that nothing you figure out with Claude is being lost anymore.

---

## Variants and Extensions

**Project-isolation extraction pass (Kasimir's workaround for the core gap):** Because Claude cannot search inside Projects, periodically open each active Project and run an extraction prompt that pulls out the key insights, decisions, and frameworks. Save the output to `projects-export/<project-name>.md` in the vault. This is the manual seam that keeps the external brain comprehensive. There is no fully automated solution today — the Project isolation is the gap, and the workaround is deliberate manual export on a cadence (weekly or monthly per active Project).

**Tana instead of Obsidian:** Kasimir personally uses Tana (structured PKM with supertags and native local MCP support) rather than Obsidian. The pipeline is identical — only the sync target changes. If you prefer structured fields over free-form markdown, swap the Obsidian MCP for Tana's local MCP and adjust the document format to use supertags.

**Roam Research as the sync target:** Roam's API supports MCP bridging and the bidirectional-link model is well-suited to topic documents that should backlink to each other. Trade-off: Roam is cloud-hosted, not local-first.

**Dirk Ohlmeier's cross-validation:** During Kasimir's demo (2026-03-12), Dirk noted in chat that Kasimir was describing his approach as well — independent convergence on the same pattern from two members building external-brain systems. When two practitioners arrive at the same workflow without coordination, that is a signal the underlying structure is correct, not idiosyncratic.

**Lighter-weight first version:** If the full pipeline feels heavy, start with just Step 1 + Step 3 (export and collapse) into a plain folder of markdown files — skip the MCP and the scheduled scripts on day one. Add the MCP once you have something worth searching. Add the scheduled scripts once the manual rhythm has proven valuable. Build for deletion: every layer of the system should justify itself before the next is added.

---

## Related Insights and Skills

- [[Insight - Your AI Conversation History Is a Knowledge Asset Worth Mining]] — the why behind this skill; treats accumulated chat history as intellectual capital
- [[Insight - Persistent AI Memory via MCP - Building a Cross-Session Intelligence Layer]] — the architectural pattern this skill implements (MCP-mediated persistent memory)
- [[Insight - Mine Your Transcripts for Latent Gold With a Structured Extraction Prompt]] — the extraction-prompt mechanic used in Steps 2 and 3
- [[Insight - Your Knowledge Is the Database, AI Is the Interface]] — the foundational model: the vault is the database, Claude is the query layer
- [[Insight - Knowing What You Know About Me - The Personalization Prompt]] — complementary self-knowledge prompt that benefits from a populated external brain
- [[Insight - From Solution to Asset - Capture Every Friction-Fix as Reusable IP]] — the upstream habit that feeds this system with material worth consolidating
- [[Insight - Turn Every Problem-Solve Into a Publishable Asset]] — what becomes possible once retrieval works: republishing past thinking as IP
- [[conversation-ip-extractor]] — the natural next step: once a topic document exists, run the IP extractor on it to surface a named framework
- [[voice-profile-trainer]] — pairs with this skill when consolidated documents are republished as content

---

## Gaps and Open Questions

The following items were underspecified in Kasimir's demo and should be tightened by anyone implementing this skill:

- **Specific Obsidian MCP implementation:** Kasimir referenced "Obsidian via MCP" but did not name a specific server. Multiple community implementations exist; the choice affects setup commands and feature support. Implementer should pick one and document the install path.
- **Exact prompts for the 8 PM and 8 AM scripts:** Kasimir described the *function* of the two scripts but did not share his actual prompts. The samples above are reconstructed from the described behavior, not transcribed from his system.
- **Project export mechanics:** Claude Projects do not appear in the top-level export. Kasimir's "periodic extraction prompt" workaround was described in principle but not demonstrated. Cadence and prompt are left to the implementer.
- **Conflict resolution on re-runs:** When the weekly consolidation pass produces an updated version of a topic document that already exists in the vault, the merge behavior is not specified. Default: treat the new version as authoritative and keep the old one as a versioned backup.
- **Tana variant details:** Kasimir uses Tana, not Obsidian, in his own setup. The session described the Obsidian-via-MCP version as the demonstrated workflow but did not show his Tana implementation end-to-end.

---

*Source: Kasimir Hedstrom, PowerUp Coaching mastermind session 2026-03-12. Cross-validated by Dirk Ohlmeier, who noted in chat that Kasimir was describing his own independently-developed approach.*

## Source

- [[wiki/mastermind/sessions/2026-03-12_Mastermind]] (Kasimir Hedstrom demo)
