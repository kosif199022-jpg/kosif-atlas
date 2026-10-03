# group-newsletter

A Claude skill that sends a formatted HTML newsletter to a Google Contacts group in one prompt. You write the subject and body in markdown; the skill handles member lookup, HTML conversion, branded template injection, preview, confirmation, and sending.

---

## What it does

1. Collects a subject line and markdown body (asks if not provided)
2. Fetches the recipient list from a named Google Contacts group via `get_contact_group`
3. Converts markdown to HTML (paragraphs, bold, italic, lists, headings, links, rules)
4. Injects the HTML into a branded email template (`assets/template.html`)
5. Renders a preview and waits for confirmation before sending
6. Sends to each member individually, or as one BCC send — your choice at setup

Trigger phrases: *"send this to [your group name]"*, *"send the newsletter"*, *"email the group"*.

---

## Prerequisites

This skill requires the **advanced-gmail-mcp** server to be set up and wired into Claude Desktop. That covers:

- Cloning and configuring [coreyepstein/advanced-gmail-mcp](https://github.com/coreyepstein/advanced-gmail-mcp)
- Creating a Google Cloud OAuth Desktop app credential
- Configuring `accounts.json` with your sending account(s)
- Running the OAuth auth flow for each account
- Adding the MCP entry to `claude_desktop_config.json`
- Enabling the **People API** in Google Cloud Console (required for contact group lookup)
- Adding `contacts.readonly` to the OAuth scopes in `src/gmail/auth.ts` and re-running auth

**Full setup guide:** [`look-over-my-shoulder/gmail-mcp-multi-account-setup/`](https://github.com/coachlou/aimm-shared-repo/tree/main/look-over-my-shoulder/gmail-mcp-multi-account-setup) — includes step-by-step instructions, gotchas, and all required code patches.

Your Google Contacts must have a contact group containing the recipient email addresses. The skill looks up this group by name at send time.

---

## Install

Install it from the library (plugin, or *"add aimm-newsletter to this project"*).
Nothing in the skill's own files is edited — not now, not ever. An update
replaces them wholesale and your settings survive, because they don't live here.

---

## Set up — once per newsletter

Open the folder the newsletter lives in and ask for a send (or say *"set up the
newsletter here"*). The skill asks for the values below once and saves them in
that folder's `.aai/skills/aimm-newsletter/`. After that, every send from that
folder — or any folder inside it — just works.

| Asked once | Saved with | What it is |
|---|---|---|
| `org_name`, `copyright_holder` | the newsletter's folder | template header and footer |
| `group_name` | the newsletter's folder | Google Contacts group to send to |
| `subject_prefix` | the newsletter's folder | e.g. `[ACME]`, or `none` |
| `unsubscribe_url` | the newsletter's folder | full URL, or `none` |
| `send_mode` | the newsletter's folder | `individual` or `bcc` |
| `account_alias`, `from_address` | this machine | which Gmail MCP account sends |

A second newsletter is a second folder; it gets its own answers and shares the
machine's sending account. To change a value later, say so (*"change the
newsletter's subject prefix"*) — the skill runs `scripts/resolve.py --set`.

No passwords or tokens are ever asked for or stored: Gmail credentials stay in
the advanced-gmail-mcp `accounts.json`; `account_alias` only names one.

**To go further than values:** add project rules in
`.aai/skills/aimm-newsletter/overrides.md` (keeps updates), or restyle
`assets/template.html` in a fork (you own it; no more updates). `{{BODY_HTML}}`
is the one placeholder a template must keep.

---

## Files

```
aimm-newsletter/
├── README.md           ← this file
├── SKILL.md            ← redirect to instructions.md
├── instructions.md     ← the skill
├── contract.yaml       ← the values the skill needs (always empty here)
├── scripts/resolve.py  ← finds the newsletter's folder and its saved values (added by the build)
└── assets/
    └── template.html   ← HTML email shell
```

---

## Notes

- **Prefer `individual` sends.** Each recipient receives the email addressed to them directly. BCC arrives as bulk mail and signals spam filters; use it only for large lists.
- **Subject prefix is always applied** (unless it is `none`). Even if the user includes a prefix in their input, the skill prepends the configured one.
- **Preview is mandatory.** The skill will not send without an explicit confirmation — this is by design, not skippable.
- **Scope changes require re-auth.** If you add `contacts.readonly` to an existing setup, delete the affected token file and re-run `npx tsx src/auth.ts your_alias`.
