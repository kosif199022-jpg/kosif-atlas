# devbook

The devbook convention: arc42/, domain/, tech/, design/, and ai/ folders of addressed Markdown chapters and the change folder under openspec/changes/, behaviour captured one rule per chapter into requirements.md and the domain.invariants.md subpages, each chapter carrying a parseable meta block with status ladders and two decision rungs — approved, then accepted — on a domain/ chapter or a whole change, with their signatures and content fingerprints, runnable test-case links, a reserved ext namespace, and annotation fences that keep a review note in the chapter beside the passage it is about. Ships the checker — build.mjs, which validates every meta block and reference and writes nothing unless a layered plugin asks it to — the delta merge, delta.mjs, which lands only an accepted change in its chapters, the fence writer, the tech/ inventory scripts, three converters between chapters and code (capture-specs, apply-change, verify-change, each over six chapter kinds), validate, prose-check, annotation-sweep, tech-update, a versioned contract with runnable migrations, and init and update, which put the rules, the tools, and its AGENTS.md section into a repository and keep them current. Ships the shape and the check, never a flow: the delivery engine carries a chapter change, and devbook-derived keeps the committed _meta/ index fresh.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/jsdotnet/devbook/tree/585d8b881ae5011f1cf21caaeafb7bf876e04e25/plugins/devbook
- Commit: `585d8b881ae5011f1cf21caaeafb7bf876e04e25`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 50). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
