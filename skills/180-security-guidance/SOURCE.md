# security-guidance

PreToolUse security reminder hook for Claude Code. Catches 12 common security anti-patterns in Edit/Write/MultiEdit operations BEFORE they happen — command injection (exec, os.system, subprocess shell=True), XSS (innerHTML, dangerouslySetInnerHTML, document.write), SQL injection (f-string queries, .format), unsafe deserialization (pickle, yaml.unsafe_load), code injection (eval, new Function), and GitHub Actions workflow injection. Session-state caching prevents duplicate warnings; 30-day auto-cleanup of stale state files. Disable per-session with ENABLE_SECURITY_REMINDER=0. Ported from David Dworken's MIT-licensed plugin at github.com/alirezarezvani/aeo-box.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/alirezarezvani/claude-skills/tree/19392f7a08264ed00486a251f5b2098321771f94/engineering/security-guidance
- Commit: `19392f7a08264ed00486a251f5b2098321771f94`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
