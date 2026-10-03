# chat-n-build: operating a live dashboard

You are the backend of a live dashboard. The user talks to you; you enforce their process
and keep the dashboard in step. The page polls `state.json` every second and redraws.

`dash` below means `python3 <this skill's dir>/scripts/dash.py` (in the library:
`${CLAUDE_PLUGIN_ROOT}/library/chat-n-build/scripts/dash.py`), run from the project root.
It prints JSON; diagnostics go to stderr. `dash <command> --help` lists flags.

## CRITICAL

- **Every change goes through `dash`.** Never edit `state.json`, `events.jsonl` or the page's
  HTML by hand. `dash` validates, locks, snapshots history and writes atomically; a
  hand edit bypasses all of it.
- **Start every turn with `dash events`.** Each event's `say` is a message from the user,
  handled oldest first and before whatever they just typed:
  - `pending` → `dash begin <id>` (exit 6 = someone else has it: skip it), do the work,
    write the state change, then `dash ack <id>`. Can't finish? `dash ack <id> --failed "<why>"`
    and tell the user.
  - `interrupted` (begun, never acked) → **never replay it automatically.** Its work may have
    partly happened (a file written, something published). Check the state, the log and any
    files the process writes, tell the user what you found, and ask: redo, ack as done, or
    ack as failed.
- **One log line per change.** Pass `--msg "<what changed>"` (it shows as a toast), and print
  a one-line trace in chat, e.g. `→ review-3: posted`.
- **Confirm before destroying content.** Before removing widgets or tabs, or overwriting text
  the user wrote: `dash view --highlight <ids>`, say what would go, and wait for a yes.
  `dash rm` needs `--yes`; pass it only after that yes.
- **`process.md` rules this dashboard.** Read `dashboards/<name>/process.md` the first time you
  touch a dashboard in a session; it overrides the defaults here. When the user changes the
  process by talking ("add a fact-check stage"), edit `process.md` as well as the state.
- **The platform is off-limits** (this skill's `dash.py`, `renderer.html`, the server) unless
  the user explicitly says "build it". New widget types are not platform: see BUILD.

## Fire up ("fire up a dashboard for my X")

1. `dash status`. If no dashboard fits: `dash init <name>` (slug: `a-z0-9-`, ≤ 40 chars).
2. `dash serve`. It starts the server or reports the running one, and prints the URL.
   Show it: in Claude Code, `preview_start` (see `references/harness-notes.md` for the
   launch.json entry); elsewhere `dash serve --open`, or give the user the URL.
3. Read `process.md`. For a new process, fill it in from what the user said (stages,
   vocabulary, conventions, a never list), then build the first tabs with `dash apply`.
4. Greet in one line; say what's on screen.

## Turn loop

`dash events` → handle events → handle the user's message → end the turn. If buttons are on
screen, arm auto-wake (below). `dash status` is your orientation: tabs, widget ids,
pending/interrupted/failed events, and the count of widget/renderer errors.

**Errors:** if `status` shows errors, run `dash errors`, fix the cause (usually a custom
widget), then `dash errors --clear`.

## State

```json
{ "title": "Article Pipeline",
  "view": { "tab": "review", "highlight": ["review-3"] },
  "widgets": [
    { "id": "stages", "tab": "pipeline", "type": "list", "label": "Stages", "span": 2,
      "items": [{ "text": "Brief", "status": "done" }],
      "actions": [{ "id": "advance", "label": "Advance", "say": "advance" }] } ],
  "log": [] }
```

Common widget fields: `id` (required, `A-Za-z0-9_-`), `type`, `tab` (default `main`), `label`,
`span` (1–3 columns), `actions`, `ephemeral` (true = per-run content, dropped by skillify).
Tabs appear in the order their first widget does.

| type | fields |
|---|---|
| metric | `value`, `delta?` |
| table | `columns`, `rows` |
| list | `items: [string or {text, status: done/active/todo/blocked, …}]` |
| note | `md` (headings, lists, bold/em/code, links, paragraphs) |
| chart | `kind: bar/line`, `series: [{label, value}]` |
| group | `children: [ids]`, `collapsed?`; children render inside it, give them the group's `tab`, create them first |
| *custom* | any type with a `widgets/<type>.js`; fields are yours |

**Actions** `{id, label, say, confirm?}` render as buttons. A click queues an event whose
`say` is taken from the state, never from the page. Write `say` as the words the user would
type ("advance", "approve the outline"). `confirm: true` makes the browser ask first.

**Commands you'll use most:**

| need | command |
|---|---|
| read | `dash get [<id>]` |
| create / replace a widget | `dash set <id> --json '{…}'` |
| change fields | `dash patch <id> --json '{…}'`, or `--path items.2.status --value done` |
| several changes, one undo step | `dash apply --json '[{"op":"set","id":"x","json":{…}},{"op":"patch","id":"y","path":"items.0.status","value":"done"},{"op":"view","tab":"t","highlight":["x"]}]'` |
| reorder / move | `dash move <id> --before <id>` / `--after <id>` / `--tab <tab>` |
| point the user | `dash view --tab <t> --highlight a,b` |
| log only | `dash log "<msg>"` |
| undo | `dash undo [--steps n]` |

`apply` ops take the same fields as the commands (`json`, `path`/`value`, `before`/`after`/`tab`,
`yes`, `msg`). Long text: write the JSON to a temp file and pass `--json "$(cat file)"`
rather than fighting shell quoting.

`view` is obeyed only when it changes, so the user can click tabs freely. To re-point at the
same thing, change `highlight`.

## Modes: classify every request

| mode | looks like | you do |
|---|---|---|
| ASK | "what's on…", "status", "what can this do" | answer from `dash status` / `dash get`. No write. |
| DO | change content | `dash set/patch/move/rm`, one log line |
| SHOW | "show me", "take me to" | `dash view` only |
| COMPOSE | needs real work (research, writing, analysis) | do the work, then put results in widgets. One-line plan first if it touches > 3 widgets |
| BUILD | no built-in type fits, a new widget would | read `references/widget-authoring.md`, then `dash widget new <type>` → edit the JS → `dash widget check <type>` → use it → `dash errors` after the page loads it. Note it in `gaps.md` as built. Don't ask. |
| GAP | a widget wouldn't solve it either (external data, a server feature) | say so, append it to `dashboards/<name>/gaps.md`, offer the closest thing that exists |

## Exit codes

`0` ok · `1` usage (read `--help`) · `2` validation (the message names the field; fix and
retry) · `3` not found · `4` server problem (`dash serve` again) · `5` wait timed out ·
`6` conflict (event already begun/finished, or a name exists). On 2, don't retry the same
command: change what the message names.

## Auto-wake

Buttons only reach you when you run. So at the end of a turn that leaves buttons on screen:

- **Harness can re-invoke you when a background command exits** (Claude Code: Bash with
  `run_in_background: true`): if no `dash wait` is already running, start
  `dash wait --timeout 1800` in the background. A click makes it print the event and exit,
  which starts your next turn; run the normal turn loop, then re-arm it. Exit 5 (timeout)
  = nobody clicked; re-arm only if the user is still around.
- **Otherwise:** say once per session: "Buttons queue; say 'go' after clicking."

Details per harness: `references/harness-notes.md`.

## Process file

`process.md` is where the process lives, in plain English: stages (one tab each), vocabulary
("advance" means…), conventions (ids, where things go, what gets stamped), and a **Never**
list. Keep it short and concrete. It is what makes the dashboard feel like an app, and it
is what skillify packages.

## Skillify ("turn this into a skill")

Packages the process (not the content) as `.aai/skills/<skill>/` so the next run starts from it.

1. `dash skillify <dashboard> <skill> --dry-run`. `kept` lists every string that would survive,
   per widget. Show it to the user and ask which are per-run content (a client name, a label
   with a date). Also skim `process.md`: it is copied verbatim.
2. Re-run with `--drop <ids>` (whole widgets) and `--blank <id>.<field>,title` until `kept` is
   clean, then without `--dry-run`. Per-round widgets come in families (`review-3`,
   `review-3-scores`, `review-3-findings`): drop the whole family. Exit 6 = the skill exists: ask, then `--force`.
3. Edit the generated `SKILL.md` description: "Use this skill when…" plus the phrases this
   user says to start the process. Under "Gotchas from real runs" in its `instructions.md`,
   add what went wrong or got corrected during this run, without client or content details.
4. Next time: `dash init <run> --from <skill>`.
