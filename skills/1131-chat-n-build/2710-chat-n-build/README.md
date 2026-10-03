# chat-n-build

A live local dashboard you drive by talking to your agent. The agent is the backend: it
changes `dashboards/<name>/state.json` through the bundled `dash` CLI, and the page
(served on 127.0.0.1) redraws every second. Buttons queue events the agent handles on its
next turn; in Claude Code a background `dash wait` wakes it on click.

- `SKILL.md` → `instructions.md`: the agent contract.
- `scripts/dash.py`: CLI and server, one file, Python 3.11+ stdlib only.
- `assets/`: renderer, launcher, custom-widget sandbox, `process.md` template.
- `references/`: widget authoring, per-harness notes, recipes (read on demand).
- `evals/evals.json`: trigger evals (should / shouldn't).

Try it from a project folder:

```bash
python3 <skill dir>/scripts/dash.py init demo && python3 <skill dir>/scripts/dash.py serve --open
```

Tests (start real servers on random ports, about 15 s):

```bash
python3 -m unittest discover -s chat-n-build/tests
```

## Promoting a skillified process to the library (manual, not in v1)

`dash skillify` writes `.aai/skills/<skill>/` in the project, and `dash init --from` reads
only from there. To make a process available everywhere, go through the library's dev
workspace (`ambient-library`, not `~/.ailib`, which is a read-only production build):

1. Copy `.aai/skills/<skill>/` to `<ambient-library>/in-progress/<skill>/`.
2. In `instructions.md`, change `dash init <run> --from <skill>` so it points to the copied
   assets, or copy `assets/` into the project's `.aai/skills/<skill>/` at run time.
   (`init --from` has no library lookup yet.)
3. Add `.claude-plugin/plugin.json` (copy a sibling's; description = catalog line).
4. `scripts/promote.sh <skill> --dry-run`, then without `--dry-run`, then do the catalog,
   marketplace and `SKILLS.md` steps it prints, and bump the wrapper versions.
5. `python3 scripts/audit-distribution.py` must exit 0. Commit there.
6. Release later, after real use: add it to `RELEASE.yaml` and run
   `scripts/build-production.sh`.
