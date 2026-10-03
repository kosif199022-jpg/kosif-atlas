# gears-broadcast

A Claude skill that sends any email to GEARS licensees in one prompt. Give it a subject
and body (or nothing — it'll draft them with you), and it fills a branded template,
creates a Resend broadcast directly from raw HTML/text (skipping the dashboard
visual-editor round trip), previews it, and sends only after confirmation.

---

## What it does

1. Uses the subject/body if already given; otherwise collects them from the user
   (markdown body — bold, italic, bullets, headers, links, rules)
2. Converts markdown to HTML and fills `assets/template.html`
3. Calls Resend's `create-broadcast` directly with `html`/`text` — no `compose-broadcast`,
   `get-tiptap-json-content`, or `connect-to-editor` round trip
4. Shows a preview and waits for confirmation
5. Sends via `send-broadcast` only after explicit approval

Trigger phrases: *"send a gears broadcast"*, *"email the licensees"*, *"notify gears
owners"*, *"send this to gears_owners"*.

---

## Prerequisites

Requires the **Resend MCP** server connected, with:

- A `gears_owners` segment already created in Resend (this skill has its ID baked in;
  re-resolve via `list-segments` if it ever changes)
- A verified sending domain/address (default assumed: `support@coachlou.com`)

---

## Why raw HTML instead of the dashboard editor

Resend's `compose-broadcast` flow is built for visually collaborating on an email in
the dashboard — useful when you want to noodle on layout, overkill for a quick send.
Going straight to `create-broadcast` with filled-in `html`/`text` cuts the round trip
from four Resend calls (plus a browser hop to the dashboard) down to two.

## Reusing for another product/audience

Swap the segment ID, default sender, and template branding in `instructions.md` and
`assets/template.html` — the workflow (collect subject/body → convert → create → preview
→ send) is generic to any single-segment broadcast, not just release notes.
