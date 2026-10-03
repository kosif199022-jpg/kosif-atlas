# bymax-web-verify

Real-browser verification and assisted UI testing for web apps. /bymax-web-verify:test brings the full stack up — reuses a running backend instance or starts one, opens the frontend in the Claude Desktop Browser pane (preview) — and walks a UI flow step by step while the user watches, verifying via page state, console, network (2xx gate), and server logs; falls back to the agent-browser CLI in a terminal. /bymax-web-verify:verify drives a real browser to confirm a single change works. /bymax-web-verify:setup installs the agent-browser CLI + Chrome for Testing in one shot. A SessionStart hook detects a missing CLI and offers to install it. Depends on `agent-browser` but never bundles it. /bymax-web-verify:record captures a UI flow as reviewable video evidence: the project's own Playwright with video forced on for one isolated run, human pacing (slowMo with a resized timeout), ffmpeg lead-in trim with a verified first frame, an ffprobe pacing gate, optional --mp4, and a plain-text walkthrough derived from the spec that ran.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/bymaxone/bymax-agent-kit/tree/0aa49987c1f84bac7f8071fde4e5d48caf2e19e9/plugins/bymax-web-verify
- Commit: `0aa49987c1f84bac7f8071fde4e5d48caf2e19e9`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
