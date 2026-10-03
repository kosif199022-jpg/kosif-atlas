# gears-broadcast v2.0

## What this skill does

1. Collect subject + markdown body — use them if already given, otherwise draft with the user
2. Convert markdown → HTML and inject into the GEARS template
3. Create the Resend broadcast directly from raw HTML/text (no dashboard-editor round trip)
4. Preview in chat — wait for confirmation
5. Send only after explicit approval

## Why this exists

The default Resend MCP broadcast flow is `create-broadcast` → `get-tiptap-json-content` →
`compose-broadcast` (dashboard visual-editor round trip) → `send-broadcast`. For a short
email to licensees, the visual-editor step is pure overhead. This skill skips straight to
raw HTML/text and cuts it to two Resend calls.

---

## Known values (don't re-look-up)

- Segment `gears_owners` → ID `012ce100-aa6e-4ff5-be55-f169baa381bc`. If `create-broadcast`
  rejects this ID, re-resolve with `list-segments` and update this file — the ID is stable
  but not guaranteed forever.
- Default sender: `Coach Lou <support@coachlou.com>` unless the user names a different one.
- Sign-off convention: `'Til the next time!` / `Lou` / tagline `Service. Impact. Joy. Prosperity.`

<!-- Customize: swap the segment ID and sender above if reusing this skill for a
     different product/audience. -->

---

## Step 1 — Get subject + body

- If the invocation already includes a subject and body, use them as-is — don't re-ask.
- Otherwise ask for:
  - **Subject line**
  - **Body** (markdown — supports `**bold**`, `*italic*`, bullets with `- `, headers with
    `##`, links `[text](url)`, horizontal rule `---`)
  - **Preview text**, if not obvious from the first line of the body
- Don't assume a particular shape (release note, announcement, etc.) — draft whatever the
  user actually needs.

---

## Step 2 — Convert markdown body → HTML

- Blank line between paragraphs → wrap each in `<p style="margin:0 0 20px 0;">...</p>`
- `**text**` → `<strong>text</strong>`
- `*text*` → `<em>text</em>`
- Lines starting `- ` → collect into `<ul style="padding-left:20px; margin:0 0 20px 0;">`
  with each item as `<li style="margin-bottom:8px;">...</li>`
- `## heading` → `<p style="margin:0 0 8px 0;"><strong>heading</strong></p>`
- `[text](url)` → `<a href="url" style="color:#2c4d6e;">text</a>`
- `---` on its own line → `<hr style="border:none; border-top:1px solid #cccccc; margin:20px 0;">`

Read `${CLAUDE_PLUGIN_ROOT}/library/gears-broadcast/assets/template.html` and replace:

- `{{SUBJECT}}` — email subject line
- `{{PREVIEW_TEXT}}` — inbox preview snippet
- `{{BODY_HTML}}` — the converted HTML
- `{{SIGNOFF_NAME}}` — default `Lou`

These are plain string substitutions done before the Resend call — not Resend's own
triple-brace contact-merge fields (`{{{FIRST_NAME}}}` etc., which the template's
unsubscribe link still uses), so there's no collision.

---

## Step 3 — Derive plain text

Strip the markdown body to plain text (drop `**`/`*`/`#`, keep bullets as `- `, links as
`text (url)`) — `create-broadcast` requires both `html` and `text`.

---

## Step 4 — Create the broadcast

Call `create-broadcast` directly with:
- `html` + `text` — the filled template
- `segmentId` — the gears_owners ID above
- `from` — the default sender (or user override)
- `subject`, `previewText`, `name` (a descriptive internal label for the Resend dashboard)

**Do not** call `compose-broadcast`, `get-tiptap-json-content`, or `connect-to-editor` —
those exist for visual-editor collaboration and aren't needed for a plain update email.

---

## Step 5 — Preview and confirm

Show the user the rendered subject, preview text, and body in chat.

Ask: **"Looks good? Send to gears_owners? (yes / no)"**

Do not proceed until confirmed — outbound sends always need a per-instance yes, even from
this skill.

---

## Step 6 — Send

Only after explicit approval, call `send-broadcast` with the broadcast ID returned in
Step 4.
