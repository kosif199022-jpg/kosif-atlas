# compliance-os

Compliance OS — meta-orchestrator for multi-framework compliance programs. Configure-then-operate four stdlib Python tools: framework_selector.py (input: company profile across industry/geography/AI/medical/financial/headcount; output: applicable frameworks ranked across all 9 supported: ISO 27001, 13485, 42001, 14971, EU AI Act, MDR 745, GDPR, SOC 2, FDA QSR), cross_framework_mapper.py (input: 1+ framework control libraries; output: unified control matrix with overlap percentage + mapping confidence + unified evidence requirements per merged control), audit_simulator.py (input: framework scope; output: mock internal audit with 8-15 finding scenarios across 5 severity levels + interview questions per control), evidence_pool_generator.py (input: enabled framework configs; output: consolidated evidence checklist with reuse map). 4 in-depth references citing ISO 19011, IIA Standards, AICPA AT-C, NIST CSF, COSO ERM. Plus 3 cs-* persona agents (cs-compliance-officer, cs-aims-iso42001, cs-ai-act-compliance) + 3 /cs:* slash commands (/cs:compliance-readiness, /cs:aims-audit, /cs:ai-act-readiness). Reuses the 14 existing ra-qm-team skills and the 2 new compliance-team-* plugins.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/alirezarezvani/claude-skills/tree/19392f7a08264ed00486a251f5b2098321771f94/compliance-os
- Commit: `19392f7a08264ed00486a251f5b2098321771f94`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 4). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
