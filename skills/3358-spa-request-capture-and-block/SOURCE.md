# spa-request-capture-and-block

Capture the exact outbound request body a single-page app sends, and stop it before it reaches the server. Use when: (1) you need the real JSON payload of an action (export, purchase, submit) to compare against an expected fix, (2) triggering the action for real would cost money, credits, or create a record you cannot undo, (3) a fetch-only interceptor "did not fire" and the request went out anyway, (4) you must prove which of two endpoints an action actually posts to, (5) you are verifying a frontend fix by observing behaviour rather than reading the bundle, (6) the harness is installed but captures nothing on an Angular/zone.js app — prototype patches are bypassed and you need the constructor-level swap plus a pre-flight proof before any risky click, (7) you must prove a submission actually created something, not just that a request left the browser. Covers patching window.fetch AND XMLHttpRequest together (the XHR half is the one usually missed), the constructor swap for zone.js apps, the pre-flight gate, matcher scope (block the commit call, never the dialog's own reads), recording responses, blocking cleanly, and disarming afterwards — including why a hash-route navigation does not remove the patch.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/spa-request-capture-and-block
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
