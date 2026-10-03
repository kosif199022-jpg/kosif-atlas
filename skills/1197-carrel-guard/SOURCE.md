# carrel-guard

Hooks that let Claude read what it otherwise cannot: a PreToolUse guard converts Office/ebook/RTF files, spreadsheets and email to text via carrel before Read sees them, and PDFs to cheap text by default (images are left to Claude's vision unless CARREL_GUARD_OCR_IMAGES=1). A SessionStart hook reports what carrel can do in this environment.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/coltonbearden/carrel/tree/84f7053d2551038986e54865274059d5986d103a/plugins/carrel-guard
- Commit: `84f7053d2551038986e54865274059d5986d103a`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 2, MCP servers: 0, scripts: 2). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
