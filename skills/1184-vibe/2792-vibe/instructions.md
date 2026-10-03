# vibe

Vibe coding with engineering rigor gently applied. The user describes what they
want. You test it, build it, run it, look at it, fix it, commit it, and show a
finished result. The user touches each request twice: **ask** and **accept**.

`<skill>` below means the directory that holds this file.

## Important — read first

- **Green means you ran it.** A gate is green only if you ran its command in
  this turn and it exited 0. Never
  report green from memory, from "should pass", or from a partial run.
- **Never weaken a test to reach green.** Do not delete, skip (`.skip`, `xfail`,
  `test.fixme`), loosen an assertion, or raise a timeout to hide a failure. Fix
  the code. If the check itself was wrong, record that as an assumption.
- **Two touchpoints only: step 1 (Ask, or Define in tier L) and step 6.**
  Do not stop mid-loop to ask. Choose the most
  reasonable reading, record it as an assumption, and show it at accept. The
  one exception: a one-way door (see step 1) you cannot decide.
- **Missing secret or external dependency = stuck, not faked.** No API key, no
  network, no browser download → build and commit what the gates can verify
  without it (the no-key path, the logic against labeled fakes), and report the
  live part as stuck at accept. Never
  hardcode a key: read it from the environment or a gitignored `.env`. Never
  swap a mock in and present it as the real thing.
- **Never push.** Commit locally at green only. Never `git add -A`: stage the
  files you changed.
- **Existing stack wins.** In a folder with code, detect and use its stack,
  test runner, and style. Do not migrate or add a second framework.
- **The ambient anchor says "do not scaffold a project here."** In a vibe
  folder, building the app *is* the folder's function. The stamp overrides it.
- **An existing `.aai/instructions.md` blocks the installer's stamp.** Step 0
  appends the vibe section (below) to it instead. Never overwrite `.aai/` files.
- **Dev servers.** Let Playwright's `webServer` start the app for e2e. To show
  the user a live app in the Claude desktop app, use the preview tool with
  `.claude/launch.json`. Otherwise start servers in the background and stop them
  when the turn ends.
- **Playwright needs a browser.** Run `npx playwright install chromium` once
  (or `uv run playwright install chromium`). If it cannot download, report stuck.
- **Chromium logs every 4xx response as a console error**, so the G4 guard fails
  on expected server-side validation errors. Validate in the client too, or return
  200 with an error body. Never filter the guard to get green.
- **Playwright auto-dismisses `confirm()` dialogs.** Handle each dialog in the
  test (`page.once('dialog', d => d.accept())`) and test the cancel path too.
- **No git identity?** Commit with `git -c user.name=vibe -c user.email=vibe@localhost`
  inline on each commit (a shell variable does not word-split in zsh).
  Do not change the user's git config.
- **Load `<skill>/references/ste100.md` only at the Docs step**, and
  `<skill>/references/define.md` only for tier L.
- **Long plans outlive the context window.** Keep the plan file current at
  every checkpoint. It, not the conversation, is the source of truth.
- **`.aai/` holds only what the loop needs to run:** the stamp, the context,
  and the log. Everything the user reads goes in the app root, including
  `PLAN.md`. An app with `.aai/memory/vibe/plan.md`: `git mv` it to `PLAN.md`
  in the next checkpoint. If its `.aai/context.md` has an "App map" section,
  rewrite the file to the form of `<skill>/templates/aai/context.md` in the
  same checkpoint. Move any content that the docs do not have into `FUNCSPEC.md`.

## Mode and routing

- **Folder mode:** `.aai/instructions.md` contains the vibe stamp. On for every
  session.
- **Session mode:** "vibe on", "/vibe", "let's vibe this", "vibe code a …". On for this
  conversation. Step 0 writes the stamp unless the user said "just this session".
- **Off:** "vibe off" or "normal mode" for this conversation. Permanent off:
  the user removes the vibe section from `.aai/instructions.md`.

While on, route by intent:

| Request | Route |
|---|---|
| Changes the app: build, add, change, fix, restyle, "it breaks when…" | the loop |
| Question: "how does X work", "what's in the schema" | answer normally, change nothing |
| Explicit git or file operation | do it normally, no loop |
| "continue", "keep going" with a plan in progress | the component loop, next component |
| "Spec this as a WBS", more than ~12 components, or more than one person | not vibe: suggest a formal spec or WBS workflow (graduation path) |

At the start of each session in a vibe folder, read `.aai/context.md`, the
last ~40 lines of `.aai/memory/vibe/log.md`, and `PLAN.md` if it exists.

## The loop

### Step 0 — Bootstrap (first build in a folder)

On the first build, run step 1 first (for tier L, Define up to its handoff).
The stack depends on the answers. Then bootstrap, then continue at step 2
(tier L: write PRD and plan, then the component loop). `{{NAME}}` below means the app's name
from step 1 (the folder name if there is none).

1. `git init` if the folder is not a repo.
2. **Stamp** (unless "just this session"). If `.aai/instructions.md` is
   missing, copy `<skill>/templates/aai/*.md` into `.aai/`, replacing `{{NAME}}`. If it exists without a vibe section, append the
   `## vibe mode` section of `<skill>/templates/aai/instructions.md` to it. Make
   sure `CLAUDE.md` and `AGENTS.md` tell agents to read `.aai/instructions.md`.
3. **Stack.** Existing code: detect it. Empty folder: use the defaults below.
4. **Context.** Fill `.aai/context.md`: a one-line purpose and the
   exact `dev` (the one command the user runs to use the app), `build`, `test`,
   and `e2e` commands. It routes to the root docs. Never copy their content
   into it. Create an empty `.aai/memory/vibe/log.md`.
5. **Docs.** Copy `<skill>/templates/docs/*.md` to the app root when missing,
   replacing `{{NAME}}`.
6. **Harness.** Set up the test runner and Playwright (web) with one passing
   unit smoke test and one passing e2e smoke test. Add the console-error guard (see G4). Gitignore `.vibe/`, `.env`,
   `node_modules/`, test output, and the SQLite file.
   - Vitest: put `test.include` (the unit test folder, so it skips `e2e/`) in a
     separate `vitest.config.ts`. In `vite.config.ts` it fails the typecheck.
   - Playwright: `workers: 1`, `expect: { timeout: 5000 }`, and
     `webServer` with `stdout: 'pipe'` (G4 reads server errors from it).
   - **E2E isolation.** Run e2e servers on their own ports (from env vars) with
     `reuseExistingServer: false`, so a running `npm run dev` and its real
     database are never touched. Use a separate SQLite file (path from an env
     var, deleted before `webServer` starts). Reset it before each test
     through a reset route that exists only when a test env var is set, called
     from an `auto: true` fixture. Empty-state and error scenarios then do not
     depend on test order.
   - **An app built before one of these conventions:** add the missing one in
     the next slice whose tests need it. Leave a working config alone.
7. Commit: `vibe: bootstrap`. Commit `.aai/`, and `.ailib/` if it exists
   (`.ailib/` is the pinned vendored copy). G6 does not apply to this commit:
   the doc skeletons still hold placeholders. The first Docs step fills them.

Stack defaults (new apps only):

| Need | Default |
|---|---|
| Web UI | Vite + React + TypeScript |
| Local backend | Node + Hono (TS). FastAPI when the logic is Python-heavy. |
| Storage | SQLite: `better-sqlite3` or Python `sqlite3`. Keep the DB file out of git. |
| Unit tests | Vitest / pytest |
| UI checks | Playwright, headless chromium, one project, `webServer` in config |
| CLI | TS via `tsx`, or Python stdlib `argparse` |

Use one HTML file with `localStorage` instead only when all are true: one
screen, no server logic, and losing the data on a browser reset is acceptable.
Say which you chose in the step 1 assumptions.

### Step 1 — Ask ◆

Pick a tier and say which one ("tier M: one feature").

| Tier | When | Front end |
|---|---|---|
| S | One small change or a bug | Checks and assumptions. Ask only if blocked. |
| M | One feature, or a new one-screen app | The Ask below |
| L | A new app with more than one screen, or a request of ~3+ slices | Read `<skill>/references/define.md` and run Define. Then the component loop. |

**The Ask (S and M).** Write **acceptance checks**: observable behaviors
("clicking Save adds a row that survives reload"). Add assumptions. Then ask
only questions whose answer changes what you build — max 5. If a default is
cheap to reverse, list it as an assumption instead of asking:

- Each question carries your **proposed default**, so "yes" is a full answer.
- Where behavior is ambiguous, show a **concrete example** of input and output.
- If the feature touches data or a routine the user already has, ask how they
  do it today and what data exists. A default cannot guess an existing habit.
- **Confirm one-way doors** even when you have a default: the data model and
  where user data is stored (not UI preferences such as a theme), auth or multiple users, paid or external services, deleting
  user data, and the stack for a new app.

- No questions → send the checks and assumptions in one short message and
  **continue without waiting**.
- Questions → send checks, assumptions, and questions. Wait. If the answers
  add scope, add checks for it and continue. Ask again only for a new one-way
  door.
- Number new checks after the last requirement in `PRD.md`.
- A tier-M request of a few slices → say "building in N slices". Each slice
  runs steps 2–Checkpoint.

**Component loop (tier L).** After the Define handoff, for each pending
component in `PLAN.md`, in dependency order:

1. **Pre-flight.** Re-read the component's scenarios against the current code
   and the log. An earlier component can make a scenario wrong, done, or
   incomplete. Fix the scenarios you can judge and write the change in the
   component's `notes`. Stop and ask only for a one-way door you cannot decide.
2. Run steps 2 → Checkpoint for its scenarios (split into slices if it needs
   more than one).
3. Set it to `done` in its last checkpoint commit. If a gate is stuck, set
   `blocked: <why>` and continue with components that do not depend on it.
4. Send a one-line progress note ("2/5 done: import works"). Do not wait.

Step 6 runs once, after the last component. "continue" in a later session
resumes at the first `pending` component, at pre-flight. Commits of a
half-built component stay; pre-flight sees them in the code.

**Bug mode:** "it breaks when X" → write a failing test that reproduces X (e2e if
it shows in the UI). Run it and confirm it fails for the right reason. Then go to step 3.

### Step 2 — Test first

Each logic check → a unit test. Each UI check → a Playwright spec. Name tests
after the check. Run only the new test files and confirm the new tests fail. These tests are
permanent regression tests.

### Step 3 — Build

Implement the slice. Match the existing code. Keep it simple, not stunted: real
components, real tables, real validation at trust boundaries (user input, files,
network).

### Step 4 — Gate loop

Run the gates in order. On failure: read the error, state the cause in one
line, change the approach, rerun. **Max 5 attempts per gate.** Then stop the
slice and carry the failure, diagnosis, and a recommendation to step 6.

| Gate | Pass condition |
|---|---|
| G1 Build | build / typecheck / lint command exits 0 |
| G2 Tests | full unit suite passes |
| G3 E2E | full Playwright suite passes (all earlier specs too) |
| G4 Runtime | no browser console errors or page errors during G3, no server errors in the piped `webServer` output |
| G5 Look | screenshots of changed screens at 1280px and 390px: no broken layout, overflow, clipped text, unreadable contrast, or unfinished look |
| G6 Docs | `python3 <skill>/scripts/docs_gate.py --root .` exits 0 after staging |

**G4 guard** — add once as `e2e/fixtures.ts`, and import `test`/`expect` from it
in every spec. (A `throw` inside `page.on` does not fail the test. Collect and
assert.)

```ts
import { test as base, expect } from '@playwright/test';
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await use(page);
    expect(errors, 'browser console errors').toEqual([]);
  },
});
export { expect };
```

**G5:** keep one spec, `e2e/look.spec.ts`. For each screen, it captures the
empty, filled, and error states at 1280px and 390px into `.vibe/shots/`
(gitignored). View the shots of every screen the slice changed with your
image-reading tool. If no screen changed, G5 passes and the accept says so.

**CLI apps:** G3–G5 become one scripted sample run whose output a test asserts.

### Step 5 — Cold review (non-trivial diffs)

Spawn a fresh subagent with no build context. Give it `git diff` (run
`git add -N <new files>` first, or new files are missing), the checks,
and this brief: "Find (1) checks no test covers, (2) tests weakened, skipped, or
deleted, (3) obvious unhandled edge cases, (4) secrets or unvalidated input at
trust boundaries. Report findings only." For each real finding, write a failing test first
(step 2), fix it (step 3), and rerun **all** gates, G5 too (step 4). A fixed
finding is a new check: it goes into PRD at the Docs step. Run the
review once per slice. List findings you did not fix as limits at accept.

### Docs

Read `<skill>/references/ste100.md`. Update `README.md`, `PRD.md`,
`FUNCSPEC.md`, `USERGUIDE.md` to describe the app **as it is now**. Add each
check to PRD as a numbered requirement. In tier L, PRD also lists the
scenarios of components not built yet, under a heading marked "planned".
Remove the mark when the component is done. Update `.aai/context.md` if the commands
changed. If the app has `distro/APP_FILES`, keep it listing only the
user-facing files.

### Checkpoint

Stage the changed files. Run G6. Commit `vibe: <slice summary>`. Never push.
Next slice → step 2.

### Step 6 — Accept ◆

One message:

- **What works now** — the checks, each marked passed. In tier L, group them
  by component.
- **Look** — one filled-state shot per screen at desktop and 390px (name the
  folder for the rest), or a sample CLI run.
- **Assumptions** you made.
- **Stuck** items, with the diagnosis and your recommendation.
- **Limits** — review findings you did not fix.
- How to run it (the `dev` command or the preview).

The next request is implicit acceptance. Feedback → new checks → step 2.
"Undo that" → `git revert` the last vibe commit(s), then run G2–G3.

## Log

Append one entry per request (in tier L, one per component) to
`.aai/memory/vibe/log.md` just before the last checkpoint commit of it, so the entry ships in that commit:

```markdown
## <date> — <request in a few words>
- component: <n. name> (tier L only)
- checks: <n> (<slices> slices) · assumptions: <list>
- gates: G1 ok · G3 fail×2 (selector timing → waited on response) · …
- review: <findings or none>
- result: done | stuck: <why>
```

## Release (only on "release" or "publish")

For a folder with `distro/`. Confirm before every write.

1. Evals or tests green, tree clean, docs current.
2. Bump `distro/.claude-plugin/plugin.json` version. Add a `CHANGELOG.md` entry.
3. Commit and tag `vX.Y.Z`.
4. From the ambient-library dev workspace (never `~/.ailib`):
   `distro_kit.py validate <repo>`, then `distro_kit.py publish <cap> <repo> --check`.
   Show the plan.
5. On go-ahead: `publish <cap> <repo>` once. Add `--release` to that same run
   only if the user asks for production; it includes the publish. Each publish
   bumps the library plugin version, so a second run bumps it twice. Never push
   unless asked.

## Install (make a folder a vibe project)

```bash
bash "${CLAUDE_PLUGIN_ROOT}/library/ambient-folder/install.sh" vibe --check <app-folder>
bash "${CLAUDE_PLUGIN_ROOT}/library/ambient-folder/install.sh" vibe <app-folder>
```

The first command is a no-write plan. Confirm the target before the second.
If the capability is not in the production library yet, run the same script
from the ambient-library dev clone: `<ambient-library>/library/ambient-folder/install.sh`.
Without the plugin, "vibe on" in the folder does the same stamping at step 0.
