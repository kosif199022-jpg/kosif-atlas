# vendor-console-form-silent-noop

A vendor console's confirm button silently does nothing and the required consent checkbox clears itself on every submit. Use when: (1) a submit button appears to work but the dialog just stays open, (2) a required checkbox visually ticks and then un-ticks on submit, (3) a click or value-set on a checkbox reports success yet the app behaves as if it is unchecked, (4) you are about to retry the same click a fourth time, (5) you need to know whether the request is even leaving the browser before blaming the UI. Two causes that imitate each other: a framework-controlled input that ignores synthetic clicks and needs a real Space keypress, and a server error the console renders nowhere. Covers telling them apart in one read-only step, reading the swallowed response body, and checking whether an earlier attempt half-succeeded.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/vendor-console-form-silent-noop
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
