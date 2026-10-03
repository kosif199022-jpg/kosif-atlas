# portfolio-sync — reference

Detailed rules for writing entries in the user's project-portfolio archive (path resolved per [SKILL.md](SKILL.md#path-resolution)). Loaded only when drafting/amending an entry.

## File structure (when creating a new portfolio file)

If the resolved file does not exist, create it with this skeleton:

```markdown
# {User Name} — Developer Portfolio & Experience

## Professional Experience ({Company})

<!-- per-project entries: ### Name — Descriptor + **Role:** + **Stack:** + bullets + **Technologies:** -->

## Client / Freelance Work

## Side Projects / Personal Work

## Technical Skills Summary

| Domain | Technologies |
|--------|-------------|
| **Frontend** |  |
| **Backend** |  |
| **Databases** |  |
| **Cloud & Serverless** |  |
| **E-commerce** |  |
| **Integrations** |  |
| **Auth & Security** |  |
| **DevOps & Tooling** |  |
| **AI/ML** |  |
| **Mobile** |  |
```

Sections are added on demand as projects accumulate.

## Writing style — match existing file

- **Section headers:** `### Project Name — Short Descriptor`
- **Sub-line:** `**Stack:** Tech, Tech, Tech` (and `**Role:**` for professional work)
- **Bullets:** concrete, noun-led, no filler. Prefer specifics ("17 Drizzle schema files", "RFC 7807 problem+json", "cron-based scanner") over generic claims ("robust architecture", "scalable").
- **Nested bullets:** 2 spaces indent, used sparingly for sub-modules of a multi-part project.
- **No emojis, no trailing adjectives, no marketing adverbs.** If a bullet reads like a recruiter wrote it, rewrite it.
- **Technologies line** at end of professional-work entry — comma-separated, matching existing grouping style.

## What to include in new or amended entry

High-signal only. A good bullet names a concrete capability, integration, or architectural choice that a reader could not infer from "it's a Next.js app." Skip:

- Generic framework features ("uses React hooks", "TypeScript throughout").
- Tutorials/learning code, trivial redirectors, scratch folders.
- In-progress state that will be stale next week — save tense architectural choices, not "currently refactoring X".

When in doubt, err on terse.

## Updating Technical Skills table

If the project introduces a tool/tech not already listed in the "Technical Skills Summary" table at the bottom of the file, add it to the matching row. Do not duplicate.

## After-write checks

- Verify edited file still has `## Technical Skills Summary` table at end.
- Verify no section was accidentally duplicated.
- Report: what was changed, in one or two sentences.
