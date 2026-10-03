# homebrew-cask-adopt-app-management

Adopt a hand-installed macOS app into a Homebrew cask and get past the three ways it silently fails. Use when: (1) brew install --cask <app> --adopt dies on 'chgrp -hR admin ... exited with 1' with hundreds of 'Operation not permitted' lines even though sudo took the password, (2) sudo brew is refused as 'extremely dangerous and no longer supported', (3) a retry fails with 'hdiutil: attach failed - Resource busy' or 'Download failed', (4) an agent shell hits 'sudo: a terminal is required to read the password', (5) brew output piped through tail looks clean but the app version never changed. Root cause of (1) is macOS App Management (TCC) on the terminal app, not file permissions; root does not bypass it. Covers the App Management grant and relaunch, the no-adopt alternative that keeps user data, and detaching the leftover DMG.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/homebrew-cask-adopt-app-management
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
