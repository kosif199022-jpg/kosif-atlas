# Writing a custom widget

Read this only when no built-in type fits (BUILD mode). Loop:
`dash widget new <type>` → edit `dashboards/<name>/widgets/<type>.js` → `dash widget check <type>`
→ `dash set` a widget with `"type": "<type>"` → `dash errors` after the page has loaded it.

## Contract

```js
function render(widget, api) {
  // widget: this widget's object from state.json, passed as-is (only id/type/tab are validated)
  // return an HTML string, or build DOM into api.root and return nothing
}
```

| api | does |
|-----|------|
| `api.root` | the element your output goes into |
| `api.esc(s)` | escapes `& < > " '`; use it on **every** value from `widget` |
| `api.act(id)` | queues one of `widget.actions` as if its button was clicked. Undeclared ids are rejected by the server |
| `api.resize()` | reports height. Called for you after render and on size changes; call it yourself only after async layout |

Colors: use the CSS vars `--ink --mute --line --accent --ok --warn --bad --card`; they follow light/dark.

## Gotchas

- **Stateless.** The frame is rebuilt from scratch every time state.json changes, so local
  variables, scroll position and input text are lost. State that matters goes in `state.json`
  (via an action the agent handles).
- **No network, no parent.** The frame is `sandbox="allow-scripts"` with CSP `default-src 'none'`:
  `fetch`, images, fonts, `parent.document`, cookies and storage all fail. Pass everything
  through widget fields. `dash widget check` rejects `fetch`, `XMLHttpRequest` and `import` outright.
- **Widget text is untrusted.** It may come from web pages or user input. Build HTML only with
  `api.esc(...)`, or use `textContent`.
- **Render within 1 s**, or the card shows `widget error: timeout`.
- **Editing the JS doesn't reload it.** The page caches widget code until state.json changes;
  make any change (e.g. `dash log "widget updated"`) to pick up the edit.
- Limits: ≤ 20 KB, must define `function render(`, must parse (`node --check` when node exists).

## Errors

Throws, load failures and timeouts show "widget error: <type>" on the card and land in
`dash errors` as `{kind: "widget", type, widget, message}`. `check` can't run the widget,
so the first real test is the page load: after using a new type, run `dash errors`.

## Example

```js
function render(widget, api) {
  const cols = Object.entries(widget.columns || {}).map(([name, cards]) =>
    `<div style="flex:1"><b>${api.esc(name)}</b>${cards.map(c => `<div>${api.esc(c)}</div>`).join('')}</div>`);
  api.root.innerHTML = `<div style="display:flex;gap:8px">${cols.join('')}</div><button>Ship</button>`;
  api.root.querySelector('button').onclick = () => api.act('ship'); // widget.actions must declare "ship"
}
```
