# group-newsletter v1.1

**Project.** Before acting, and again before any write or send, run this
skill's `scripts/resolve.py --start <path or name the request gives, else .>`
(add `--current <last project_dir>` after the first run). Use only its output
for `{{env.*}}` / `{{project.*}}` values; every path in the steps below is
relative to `project_dir`; write nowhere else. If it returns `ask` or `needs`,
follow its `do` line. Tell the user `project_dir` before any write or send.
No shell available → ask the `project:` keys and work in the current folder.

`{{env.*}}` / `{{project.*}}` anywhere below or in the template are lookups in
that output — never guess or reuse a value from earlier in the conversation.
A value of `none` means "leave it out" (see steps 3 and 5).

## What this skill does

1. Collect subject + markdown body (ask if not provided)
2. Fetch the `{{project.group_name}}` contact group via `get_contact_group`
3. Convert markdown → HTML and inject into the template
4. Show preview — wait for confirmation
5. Send per `{{project.send_mode}}`: `individual` (one send each) or `bcc` (single call)

---

## Step 1 — Collect inputs

If the user hasn't provided both, ask for:
- **Subject line**
- **Body** (markdown — supports `**bold**`, `*italic*`, bullet lists with `-`, headers with `##`, links `[text](url)`)

---

## Step 2 — Fetch members

Call `get_contact_group` with `group_name: "{{project.group_name}}"`, `account: "{{env.account_alias}}"`.

---

## Step 3 — Convert markdown to HTML

Convert the markdown body to HTML using these rules:

- Double newline (blank line between paragraphs) → wrap each paragraph in `<p style="margin:0 0 20px 0;">...</p>`
- `**text**` → `<strong>text</strong>`
- `*text*` → `<em>text</em>`
- Lines starting with `- ` → collect into `<ul style="padding-left:20px; margin:0 0 25px 0;">` with each item as `<li style="margin-bottom:12px;">...</li>`
- `## heading` → `<p style="margin:0 0 8px 0;"><strong>heading</strong></p>`
- `[text](url)` → `<a href="url" style="color:#2c4d6e;">text</a>`
- Horizontal rule `---` → `<hr style="border:none; border-top:1px solid #cccccc; margin:30px 0;">`

Then read `${CLAUDE_PLUGIN_ROOT}/library/aimm-newsletter/assets/template.html` and fill it in this order:

1. Replace every `{{project.*}}` with its value (`unsubscribe_url` of `none` → `#`).
2. Search the result for `{{env.`, `{{project.` and `YOUR_`. Any hit → stop and
   report it; never send a template with an unfilled value.
3. Replace `{{BODY_HTML}}` with the converted HTML — last, so text the user
   wrote is never mistaken for a placeholder.

---

## Step 4 — Preview HTML in Claude

Write the full HTML string to `.aai/memory/aimm-newsletter/preview.html` (under `project_dir`) using the Write tool. This automatically renders the email in the preview panel.

Show in text:
```
Project:    <project_dir>
Settings:   <project.yaml path> · <environment_file>
From:       {{env.from_address}} (account {{env.account_alias}})
Group:      {{project.group_name}}
Mode:       {{project.send_mode}}
Subject:    <prefix + subject, exactly as it will be sent>
Recipients: <N> members — <comma-separated names>
```

Ask: **"Looks good? Send to all N members? (yes / no)"**

Do not proceed until confirmed.

---

## Step 5 — Send

Subject = `{{project.subject_prefix}} ` + the subject — always prefix, even if
the user already wrote it; a prefix of `none` means no prefix.

**`send_mode: individual`** — loop through members, one call each:
- `account`: `"{{env.account_alias}}"`
- `to`: that member's email address
- `subject`, `body` (the full HTML string), `is_html`: `true`

**`send_mode: bcc`** — a single call when there are 2+ members (with exactly 1,
send as `individual`):
- `account`: `"{{env.account_alias}}"`
- `to`: `"{{env.from_address}}"` (`to` must be a real address — the sender's own)
- `bcc`: all member emails joined with `, `
- `subject`, `body`, `is_html`: `true`

The user may override the mode for one send by asking; say so in the preview.

After the send(s) complete, report:
```
✓ Sent to N members.
Failed (if any): list names + errors
```

---

## Gotchas

- The `get_contact_group` tool returns `[{name, email}]` — use `email` for sending, `name` for the report.
- When installed standalone, `scripts/resolve.py` and `assets/template.html` are in this directory. The template file path is absolute: `${CLAUDE_PLUGIN_ROOT}/library/aimm-newsletter/assets/template.html` — use the Read tool to load it.
- Do not skip the preview/confirmation step even if the user seems certain.
- If a send fails for one member, continue with the rest and report the failure at the end.
