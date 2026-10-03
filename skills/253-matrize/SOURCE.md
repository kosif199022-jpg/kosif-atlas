# matrize

Derives a named, platform-neutral design system from reference exemplars and emits it to any target. Measurement and interpretation stay separate artefacts rather than separate sections: decode records what each reference actually shows, graded for how far its values can be trusted and what rights its source carries, while name interprets — every recurring element gets a purpose, a rule and an anti-rule, and a rule with no stated failure case is not emitted at all. The source of truth is a DTCG token file, never CSS; CSS, a VitePress theme layer and the landscape sketchbook are formatter output run by committed scripts, so the same tokens regenerate byte-stable. References are read-only, enforced by a PreToolUse hook rather than by convention, so values and rules may be extracted while assets are never copied. Every fan-out agent is read-only; writes are confined to the configured design root's system/ and out/ directories.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/anselmoo/werkstoff/tree/3308da58f71a65f166e5a563a16f6f0ebfdfcfb8/plugins/matrize
- Commit: `3308da58f71a65f166e5a563a16f6f0ebfdfcfb8`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 18). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
