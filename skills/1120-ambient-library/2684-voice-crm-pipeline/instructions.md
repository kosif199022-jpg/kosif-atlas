# Voice CRM Pipeline

## What This Skill Does

This skill closes the loop between thinking and data. CRM hygiene fails not because practitioners don't care, but because the friction of opening an app, finding a contact, and typing always loses to whatever else is happening in the moment. This pipeline removes that friction completely: you say a sentence out loud, and it lands as a structured row in a Google Sheet acting as your live database. The "Hey Siri" trigger fires an AppleScript (or iOS Shortcut), which routes your dictation to a Custom GPT that has been instructed to behave as an interpreter — it parses the free-form spoken update into the exact field structure your sheet expects, then POSTs the structured payload to a Google Apps Script web app deployed against the sheet. Each layer has a single responsibility, and the whole chain can be assembled by a non-engineer in one focused evening.

The deeper principle: voice is not just a faster keyboard. It is a different cognitive modality. By making capture available at the *exact moment* a thought is fresh — walking out of a client call, between meetings, on a walk — the pipeline captures data the keyboard-based workflow would have lost entirely. The Custom GPT is the load-bearing layer: it absorbs the messiness of natural speech so the database layer can stay clean.

**Source:** Don Back, PowerUp AI Mastermind, 2026-03-12 demo session.

---

## When to Use

Use this skill (or build this pipeline) when:

- You finish a client session with a clear thought and know it will be gone in 20 minutes
- You take walks where good ideas about clients, follow-ups, or business arrive unprompted
- You drive between meetings and want to capture commitments without pulling out a phone
- Your CRM is perpetually 70% updated because typing-based hygiene loses to momentum
- You want a post-meeting download workflow that doesn't require opening any app
- You want to dictate "next actions" that automatically land somewhere you'll actually look at them
- You want a low-friction journal, decision log, or daily reflection capture that stays structured
- You want to demonstrate to a client or audience that complex AI integrations are now buildable in one evening by non-engineers

This pipeline is general — the "CRM" framing is just Don's first use case. Substitute any tabular store: client notes, commitments, decisions, expense log, gratitude journal, content ideas, follow-ups.

---

## Prerequisites / Setup

Before building, gather:

- **iOS device with Siri enabled** — the voice trigger entry point
- **Mac with Shortcuts.app and/or Script Editor (AppleScript)** — the local automation bridge that routes voice input. iOS Shortcuts alone can also work end-to-end without a Mac, depending on which path you choose
- **ChatGPT Plus account with Custom GPT access** (or equivalent: a Claude Project, an Assistants API endpoint, a local LLM with a structured-output schema — the role is "natural language interpreter," not "OpenAI specifically")
- **Google account with Google Sheets** — your database
- **Google Apps Script access** (built into Sheets via Extensions → Apps Script) — your execution layer that writes rows
- **Ability to deploy an Apps Script as a web app** with `doPost()` enabled, returning JSON. Anonymous-access deploy is the simplest path; lock it down with a shared secret if security matters

Decide upfront:
- The exact field schema your sheet will hold (e.g., `timestamp`, `contact`, `topic`, `note`, `next_action`, `due_date`, `tags`)
- Whether the Custom GPT will return JSON for the script to parse, or pre-formatted parameters for a GET/POST URL
- Whether the chain runs Mac-side (AppleScript) or fully on iOS (Shortcuts only)

---

## Step-by-Step Build Workflow

### 1. Design the sheet schema

Open a new Google Sheet. Define the exact columns you want every spoken update to populate. Keep it small for v1 — 4 to 7 columns. Don's CRM use case suggests something like:

| timestamp | contact | interaction_type | note | next_action | due_date |

Lock the schema before building anything else. Every downstream layer is a translation *into* this schema, so changing it later means re-touching the GPT prompt and the Apps Script.

### 2. Build the Google Apps Script web endpoint

Inside the sheet: Extensions → Apps Script. Write a `doPost(e)` function that:

- Parses the incoming JSON payload from `e.postData.contents`
- Validates that required fields are present
- Appends a new row to the active sheet using `SpreadsheetApp.getActiveSheet().appendRow([...])`
- Returns a JSON response confirming success or error

Then: Deploy → New deployment → Web app → Execute as "me" → Access "Anyone" (or "Anyone with Google account" if you prefer). Copy the web app URL — this is your endpoint.

Test it from a terminal with `curl -L -X POST` and a sample JSON body. Confirm the row appears in the sheet before moving on. **Do not move forward until this layer is proven.**

> **Gap from session:** Don did not share his exact Apps Script source. Use the standard `doPost` web-app pattern from Google's docs as scaffolding and shape the row-building logic to your schema.

### 3. Build the Custom GPT interpreter

In ChatGPT (or your equivalent): create a new Custom GPT. Its job is exactly one thing — take a free-form spoken sentence and emit a structured payload that matches the sheet schema.

System prompt scaffolding (fill in your specifics):

> You are a CRM update interpreter. The user will speak a free-form note about a client interaction. Your job is to extract the following fields and return them as a single JSON object with no surrounding prose: `contact`, `interaction_type`, `note`, `next_action`, `due_date`. If a field cannot be determined from the input, return an empty string. Resolve relative dates ("next Tuesday", "in two weeks") to ISO format using today's date as the anchor. Do not ask follow-up questions. Do not add commentary. Output only the JSON object.

Optional: give the GPT an Action that POSTs directly to your Apps Script web app. If you do this, the GPT becomes the writer too, and the AppleScript layer only needs to deliver the spoken text. If you skip Actions, the AppleScript reads the GPT's JSON output and POSTs it to the script itself.

> **Gap from session:** Don did not share the exact Custom GPT system prompt. The above is general scaffolding consistent with the architecture he described. Tighten it against your real schema before deploying.

### 4. Build the voice trigger (AppleScript or iOS Shortcut)

**iOS-only path (simpler):** Build a Shortcut that:
1. Uses "Dictate Text" to capture spoken input
2. Sends the text to the Custom GPT (via the ChatGPT app's Shortcuts integration, or via a direct API call to a backend you control)
3. Receives the structured JSON
4. POSTs it to the Apps Script web app URL
5. Speaks a confirmation ("Logged.")

Then assign the Shortcut to a Siri phrase like "Log a client note."

**Mac path (Don's path):** Write an AppleScript that:
1. Triggers on a Siri command via Shortcuts → Run AppleScript action
2. Captures the dictated text
3. Calls the Custom GPT (via API, or by automating a browser session, or via a relay shortcut)
4. Receives the JSON response
5. Sends the JSON to the Apps Script web app URL via `do shell script "curl ..."`
6. Returns a spoken or notification confirmation

> **Gap from session:** Don described the chain but did not paste the AppleScript. The exact glue depends on whether you call OpenAI directly via API or route through the ChatGPT app. The simpler the glue, the easier to maintain — prefer a direct API call over UI automation.

### 5. Test end to end

Speak a deliberately messy sentence: *"Hey Siri, log a client note. I just got off the phone with Sarah about her launch — she's blocked on the email sequence and needs me to send her the template by next Friday."*

Verify:
- The Shortcut/AppleScript fires
- The Custom GPT returns clean JSON (`contact: "Sarah"`, `next_action: "send email sequence template"`, `due_date: "2026-03-20"` etc.)
- A new row appears in the sheet within seconds
- The row's fields match your schema exactly

If anything fails, isolate the layer that failed using the test you ran in step 2 — each layer should be independently testable.

### 6. Iterate the Custom GPT prompt

The first version will mis-extract fields. That is normal. Tune the GPT system prompt against 10–20 real spoken inputs over the first week. The goal: the JSON it returns should never need manual cleanup before reaching the sheet. The GPT prompt is where most of your judgment lives — it encodes what counts as a "contact," what counts as a "next action," and how relative dates resolve.

---

## Expected Output

A new row in your Google Sheet, written within seconds of speaking, looking like:

| timestamp | contact | interaction_type | note | next_action | due_date |
|---|---|---|---|---|---|
| 2026-03-12 14:47 | Sarah | phone call | Blocked on launch email sequence; needs template | Send email sequence template | 2026-03-20 |

No app was opened. No keyboard was touched. The thought went from spoken sentence to structured database row through five fully automated layers, in under 10 seconds.

---

## Variants and Extensions

The session demo was specifically a CRM update workflow, but the same architecture extends naturally:

- **Daily reflection / journal capture** — same chain, different schema (`date`, `mood`, `wins`, `friction`, `tomorrow_focus`)
- **Decision log** — capture decisions as you make them, with rationale, alternatives considered, and revisit date
- **Content idea capture** — speak ideas mid-walk, land them in an ideas sheet with topic, audience, and angle pre-extracted
- **Commitment tracker** — capture every promise you make to others as it leaves your mouth, with party and due date
- **Expense logging** — speak the amount, vendor, and category; the GPT normalizes and the script logs

Architectural extensions worth considering:

- **Replace the Sheet with a real database** (Airtable, Notion via API, Supabase) once the volume justifies it. The voice → GPT → endpoint chain stays the same; only the writing layer changes
- **Add a confirmation loop** for high-stakes captures: the GPT speaks its parsed interpretation back and asks for "confirm" before writing
- **Add a daily summary script** that reads the day's rows and generates an end-of-day digest (pairs naturally with Kasimir's scheduled briefing pattern from the same session)
- **Pipe the captured rows into a downstream skill** — the [[conversation-ip-extractor]] or [[transcript-to-content-pipeline]] can consume the captured notes as raw input

---

## Related Commands and Skills

- [[Insight - Voice-Driven CRM - Closing the Loop Between Thinking and Data]] — the principle behind this toolchain. Start there for the *why*; this skill is the *how*
- [[Insight - Voice AI Works When It Removes Human Fatigue From Repetitive Interactions]] — the broader pattern this fits into
- [[Insight - Build Tiny Tools That Remove Real Friction]] — the design philosophy that makes one-evening builds like this worth doing
- [[Insight - From Solution to Asset - Capture Every Friction-Fix as Reusable IP]] — why writing this pipeline up as a skill (rather than just using it privately) is the higher-leverage move
- [[Insight - Design Tiny Tools for Maximum Composability]] — the architectural principle that keeps the GPT, the script, and the sheet independently testable and replaceable
- **`conversation-ip-extractor`** — downstream consumer; can mine accumulated voice-captured notes for embedded methodology
- **`transcript-to-content-pipeline`** — downstream consumer; can transform a week of voice captures into draft content

---

## Notes on Gaps from the Source Session

Don's demo in the 2026-03-12 mastermind described the architecture and confirmed it worked end-to-end, but did not include:

1. The exact Google Apps Script `doPost` source
2. The Custom GPT system prompt verbatim
3. The AppleScript glue code that connects Siri to the GPT and the GPT to the script

The scaffolding above is a faithful reconstruction of the chain Don described, with general patterns for each layer. When building, treat steps 2–4 as templates to be filled with your own specifics. The architecture is the durable artifact; the exact code at each layer is short enough to (re)write in an hour once the chain is understood.

*Source: Don Back, PowerUp AI Mastermind, 2026-03-12 demo session.*

## Source

- [[wiki/mastermind/sessions/2026-03-12_Mastermind]] (Don Back demo)
