# zoom-mastermind-recap

Automated end-to-end pipeline for AIMM (AI Mastermind for Leaders) session recaps. Fetches Zoom cloud recordings, transforms transcripts into newsletter-style reports, publishes to Notion, and extracts reusable prompt templates.

## Relationship to `aimm:mastermind-recap`

This skill extends the original cowork skill `aimm:mastermind-recap` with a **Step 0 bootstrap** that handles Zoom recording fetches and batch processing. The core recap logic (Steps 1-8) is identical. The two skills coexist:

| Skill | Invocation | Use case |
|---|---|---|
| `aimm:mastermind-recap` | `/aimm:mastermind-recap` | Cowork version. Manual only — user provides file paths. |
| `zoom-mastermind-recap` | `/zoom-mastermind-recap` | This version. Adds auto mode for scheduled runs. Also supports manual mode. |

## Two modes

### Manual mode

User provides transcript (and optionally chat) file paths. Skips Step 0 and goes straight to recap writing.

```
/zoom-mastermind-recap

Transcript file: /path/to/transcript.vtt.txt
Chat log file:   /path/to/chat.txt
```

### Scheduled / auto mode

Invoked with no file paths. The skill:

1. Runs `fetch_recording.py` to pull new recordings from Zoom Cloud
2. Scans `OUTPUT_ROOT` (from `.env`) for folders with `done.flag` but no `recap.done.flag`
3. Processes each pending session oldest-first through the full recap pipeline
4. Writes `recap.done.flag` after each successful publish

```bash
claude -p "/zoom-mastermind-recap"
```

## What it produces

For each session:

- **Notion page** under the AIMM Report Hub (with navigation links, hub topic summary, AIMM Sessions database sync)
- **Local markdown** at `~/Documents/AIMM Recaps/AIMM-Recap-YYYY-MM-DD.md`
- **Prompt template command files** in `commands/aimm/` (when prompts pass the inclusion rubric)
- **AIMM Prompt Library rows** in Notion (when prompts are extracted)

Each recap includes: pull quote, 30-second summary, 3-5 topic sections (500-750 words each) with value-add callouts, Community Corner, "Try This" exercise, and prompt templates when warranted.

## Dependencies

### Sandbox (`~/Downloads/zoom-recap-sandbox/`)

The bootstrap step relies on:

| File | Purpose |
|---|---|
| `.env` | Zoom OAuth credentials + `OUTPUT_ROOT` path |
| `fetch_recording.py` | Zoom Cloud Recording downloader (stdlib-only Python) |
| `test_auth.py` | OAuth token exchange (imported by fetch_recording.py) |
| `test_list.py` | Recording list API (imported by fetch_recording.py) |

### External

- **Zoom Server-to-Server OAuth app** with recording + summary scopes
- **Notion MCP** for publishing (gracefully degrades to markdown-only if unavailable)
- **aimm-shared-repo** at `/Volumes/Extreme Pro/users/loudalo/GitHub/aimm-shared-repo` for storing extracted command files (external drive must be mounted)

## Idempotency

The pipeline is safe to re-run:

- `fetch_recording.py` skips folders that already have `done.flag`
- The skill skips folders that already have `recap.done.flag`
- Notion pre-flight checks for existing recap pages before creating duplicates

To force a re-recap, delete the `recap.done.flag` from the session's folder.

## Installation

The skill lives in the sandbox. A symlink makes it discoverable by Claude Code:

```bash
ln -sf ~/Downloads/zoom-recap-sandbox/skills/zoom-mastermind-recap ~/.claude/skills/zoom-mastermind-recap
```

To uninstall:

```bash
rm -f ~/.claude/skills/zoom-mastermind-recap
rm -rf ~/Downloads/zoom-recap-sandbox
```

## Scheduling (TODO)

Target: launchd plist firing Friday 6am ET, giving ~4 hours before the 10am newsletter email.
