# Grill with Prototype — commands

Anything you type is conversation, except a message that is *only* one of the words
below (plus its arguments). Those run exactly like the matching dashboard button: no
interpretation, no confirmation beyond what the button itself asks. Case doesn't matter;
a leading `/` or `grill-with-prototype` is ignored.

## Always available

**`status`** — One line: what the app is doing right now, whether anything is waiting
for it, and which background tasks are running.

**`open`** — The dashboard URL. Starts the app's server if it isn't up.

**`models`** — Re-detects which model CLIs and API keys are available and refreshes the
Models page.

**`help`** — Opens this page.

**`<button or form name> [{json}]`** — Any button or form on any page, by name, with
an optional JSON payload — useful when the button isn't on the page you're looking at.

## Grill with Prototype

**`new <Product name> [--from marketplace|admin|content]`** — Starts a project in the
workspace and renders its first screen. Without `--from` it seeds a blank landing page; with
it, a copy of that example product. Example: `new Porch Light`.

**`use <slug>`** — Switches the Prototype and Requirements pages to another project. Same as
pressing that project's button at the top of the Prototype page.

**`sync`** — Re-renders the prototype from the current spec and refreshes both pages. Runs
automatically after every change the interviewer makes; type it if the frame looks stale.

**`next`** — Prints what the interviewer would ask next: controls you clicked that are not
specified yet, other unspecified controls, then the question bank for the current phase.

**`ledger`** — The requirements ledger and locked decisions as text, the same content as
the Requirements page.

**`phase <frame|shape|grill|contract|prd>`** — Moves the phase marker on the Requirements
page. The interviewer moves it on its own; use this to pull it back or push it forward.

**`prd`** — Writes `SPEC.md` from the prototype and the ledger: requirements, examples,
screens, data, actions and decisions. Anything still open is a `TODO:` line at the end;
`make spec` in an init-dev-project repo fails until those are settled.

**Clicking the prototype** — Every click is reported to the interviewer. A control with a
`? not specified` sticker is one nobody has described yet; clicking it puts that question at
the top of the queue.

**Answer forms** — When more than three questions are pending, they arrive as one form under
the prototype. Each field is pre-filled with the interviewer's recommended answer; change
what is wrong and press *Send answers*.
