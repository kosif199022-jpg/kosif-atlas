# android-adb-device-verification

Verify an Android change on a device or emulator when the project has no test suite. Covers the build-install-drive-read loop, verifying the release build rather than only debug because R8 breaks reflection-driven code, tapping by element label instead of remembered coordinates, reading app-private state back with run-as, and mocking location. Its core discipline is calibration: a check that cannot observe anything reports the same thing as a check that observed nothing, so an unplugged cable, a stale uiautomator dump, a single-quoted attribute, or a pattern that can never match all read as a passing assertion. Ships scripts/adb-ui.sh with text, has, tap, tap-nth and type.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/android-adb-device-verification
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
