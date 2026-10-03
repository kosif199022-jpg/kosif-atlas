# Bridge protocol (normative)

The bridge is a directory. Anything that can read and write these files is a
conforming participant — the skill, `bridge.py`, `server.py`, a shell one-liner.
`bridge.py` is the recommended way to touch them; it is not the protocol.

```
<app>/runtime/
├── state/
│   ├── app.json          skill → dashboard   the whole UI, as data
│   └── tasks/<id>.json   task → dashboard    one file per background task
├── queue/
│   ├── inbox.jsonl       dashboard → skill   pending events, one per line
│   └── processed.jsonl                       drained events (audit trail)
├── log.jsonl             anything → dashboard streaming log lines
├── server.json           server → skill      {pid, port, url, started} while running
├── models.json           models.py           provider registry; may hold keys (0600)
└── config.json                               {workspace, ...} per-install settings
```

## Guarantees

- Encoding is UTF-8 JSON (`app.json`, `tasks/*.json`, `server.json`) or JSONL
  (`inbox`, `processed`, `log`).
- Whole-file writes are atomic: write to a temp file in the same directory, then
  `rename`. Readers never see a torn document.
- Line appends are a single `write(2)` on an `O_APPEND` descriptor. Lines under
  4 KiB are atomic on every mainstream OS; keep event payloads small and put big
  things in files the payload points to.
- Event `id` is a ULID (26 chars, Crockford base32, time-sortable). Consumers dedupe
  on it; delivery is at-least-once.
- `drain` moves every pending line to `processed.jsonl` (stamped `processed`) and
  truncates `inbox.jsonl` atomically. A crash between the two can duplicate, never
  lose.
- The server is optional to the skill. Every `bridge.py` command works with the server
  down; the dashboard simply isn't live. `bridge.py status` reports `server: null`.

## `app.json`

```jsonc
{
  "app":    { "name": "…", "version": "…", "description": "…" },
  "nav":    { "current": "pipeline", "pages": ["home", "pipeline", "models", "log"] },
  "status": { "phase": "drafting", "message": "Writing section 3 of 5", "busy": true },
  "pages":  {
    "pipeline": { "title": "Pipeline", "widgets": [ /* widget objects */ ] }
  }
}
```

`status` is rendered on every page (the persistent strip). `nav.current` is set by the
server on `nav` events and may be set by the skill to move the user.

### Writing state with `bridge.py push`

| Form | Effect |
|---|---|
| `push <path> <json>` | set the value at `path` (a bare word is taken as a string) |
| `push --json '<json>' <path>` | same, but an object merges into the object already there |
| `push --json '<object>'` | deep-merge into the whole state |
| `push --file state.json` | replace the whole state |

The root holds only `app`, `nav`, `status`, `pages`. Every write is validated: an
unknown top-level key, a `widgets` that isn't a list, or a widget without `id` and
`type` is refused with `{"ok": false, "error": …}` and exit 1, and nothing is written.

### Widgets

Every widget: `{ "id": string, "type": string, ...props }`. `id` is unique within its
page and is how `bridge.py push pages.<page>.widgets.<id>.<prop> <value>` addresses
it. Unknown `type` renders as a labelled JSON dump rather than failing.

| type | props | inbound? |
|---|---|---|
| `markdown`  | `text` | no |
| `status`    | `label`, `value`, `tone` (`neutral\|ok\|warn\|error\|busy`) | no |
| `progress`  | `label`, `value`, `max`, `note` | no |
| `list`      | `title`, `items: [string \| {text, tone, meta}]`, `ordered` | no |
| `table`     | `title`, `columns: [string]`, `rows: [[…]]` | no |
| `kv`        | `title`, `items: {k: v}` or `[{k, v}]` | no |
| `buttons`   | `buttons: [{name, label, payload?, tone?, confirm?}]` | yes — `action` |
| `form`      | `title`, `fields: [{name, type, label, placeholder?, options?, value?, required?}]`, `submit` (event name), `submit_label` | yes — `form` |
| `log`       | `title`, `limit` (default 500), `sources?: [string]`, `app?` (scope to one app), `filters` (default true: level chips, app chips when several apps, text search) | no |
| `app-list`  | `title`, `apps?` (omit to use the live list from an aggregating server), `actions?`, `empty?` | yes — `action` with `payload.app`, `payload.path` |
| `steps`     | `title`, `items: [{label, caption?, state: done\|current\|todo\|failed}]` | no |
| `checks`    | `title`, `items: [{label, state: pass\|fail\|pending\|skip, detail?}]` | no |
| `task-list` | `title`, `app?` (scope to one app), `limit?`, `filters` (default true: status + app chips), `show_app?`, `empty?` | no |

Field `type`: `text`, `textarea`, `number`, `select`, `checkbox`, `password`.
`password` fields are posted like any other field; the skill is responsible for
storing the value somewhere safe (see `models.py set-key`) and never echoing it.

### Shell chrome (not widgets)

Every page also gets, from the shell itself:

- **Status strip** — `status.phase`, `status.message`, `status.busy`.
- **Rail indicators** — running/queued task count and pending-action count; clicking
  opens the Activity drawer.
- **Activity drawer** — right-hand pane with Tasks and Log tabs (filterable). Pinned as a
  column at ≥1280 px, sliding overlay below that. Open/closed and the chosen tab are
  remembered per browser.

Apps don't need a dedicated Log or Tasks page; add one only if the app wants a
differently-scoped view (e.g. `task-list` with `app` set on a build page).

## Events (`inbox.jsonl`)

```json
{"id":"01J…","ts":"2026-09-29T10:14:02Z","type":"action","name":"approve_outline","page":"pipeline","payload":{}}
{"id":"01J…","ts":"…","type":"form","name":"submit_feedback","page":"pipeline","payload":{"feedback":"tighten the hook"}}
{"id":"01J…","ts":"…","type":"nav","name":"drafts","page":"drafts","payload":{}}
```

`type` ∈ `action | form | nav`. `name` is the button `name`, the form's `submit`, or
the target page. Anything else is rejected by the server with 400.

## Tasks (`state/tasks/<id>.json`)

```json
{"id":"t_01J…","app":"article-studio","title":"Review: the hook","role":"reviewer","provider":"codex",
 "status":"running","started":"…","finished":null,"prompt_file":"…","output":null,"error":null,"pid":1234}
```

`status` ∈ `queued | running | done | failed`. `app` is the owning app's manifest name and `title` a short human label; both are shown in task lists and let a multi-app surface group and filter. `output` is the final text (or a path
when large). `run_task.py` owns these files; the skill reads them.

## Log (`log.jsonl`)

```json
{"ts":"…","level":"info","app":"article-studio","source":"skill","message":"Outline approved"}
```

`level` ∈ `debug | info | warn | error`. `app` is the owning app's manifest name (added by `bridge.py log`). `source` is free text (`skill`, `task:t_01J…`,
a script name).

## Server HTTP surface

Only the dashboard uses this. Bound to `127.0.0.1`.

| method | path | purpose |
|---|---|---|
| GET | `/` , static | `dashboard/` |
| GET | `/events` | SSE: `state`, `log`, `tasks`, `inbox` events; snapshot on connect |
| GET | `/api/state` `/api/log?since=N` `/api/tasks` `/api/inbox` `/api/manifest` | polling fallbacks |
| GET | `/api/apps` | aggregating server only: per-app status (below); `[]` otherwise |
| POST | `/api/action` | body `{type, name, page?, payload?}` → appends to inbox |

SSE also emits `apps` (same shape as `/api/apps`) when aggregating.

## Aggregation

An app can watch other apps' activity. It's how the vibe-skill builder studio shows
every app's tasks and logs in one Activity drawer.

- **Enable**: `"aggregate": ["../../app-skills/*"]` in `manifest.json` (globs relative
  to the app folder; `~` and absolute paths work), or `bridge.py serve --aggregate GLOB`
  (repeatable), or `VIBE_AGGREGATE` (os.pathsep-separated). Any folder a glob matches
  that has a `manifest.json` counts; the app never aggregates itself.
- **Read-only.** The aggregator reads other apps' `runtime/state/tasks/`, `runtime/log.jsonl`,
  `runtime/server.json`, `runtime/state/app.json` and inbox length. It never writes to
  another app's runtime and never drains its inbox. To act on another app, run that
  app's own `bridge.py`/scripts.
- **Merged views**: `/api/tasks` and `bridge.py tasks --all` list tasks from every app;
  `/api/log` returns the merged tail ordered by `ts`; the SSE `log` event streams new lines
  from every app. Records missing `app` are stamped with the owning app's manifest name.
- **Discovery**: globs are re-scanned every 5 s, so new app folders appear without a
  restart; their existing log history is not replayed into the live stream (it is in
  `/api/log`).
- **App status** (`bridge.py apps`, `/api/apps`):

```json
{"id":"article-studio","name":"article-studio","version":"0.1.0","description":"…","path":"/…/app-skills/article-studio",
 "status":"running","port":42551,"url":"http://127.0.0.1:42551/","phase":"drafting","message":"Writing section 3 of 5",
 "pending_events":0,"tasks_running":1,"tasks_failed":0,"last_activity":"2026-09-29T04:31:02Z","adapters":["generic","claude-code"]}
```

  `status` is `running` only when the app's `server.json` names a live pid.
