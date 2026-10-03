# research-ops-skills

4 Research-Operations skills + 1 orchestrator: clinical-research (study design: protocol synopsis, endpoint selection, sample-size/power, phase-gating, feasibility), research-finance (R&D program budgeting, burn/runway, F&A indirect-rate modeling, capitalize-vs-expense routing, portfolio ROI), market-research (TAM/SAM/SOM both-methods, survey/sampling design, segmentation, CI synthesis), product-research (interview/JTBD/usability/concept-test design, saturation, insight repository synthesis). Orchestrator skill uses context: fork. Each sub-skill ships per-skill onboarding (onboard.py), a customization loader (config_loader.py) consumed by every tool, and an isolated opt-in autoresearch evaluator (ar_evaluator.py) bridging to engineering/autoresearch-agent. 24 stdlib-only Python tools (12 analysis + 12 onboarding/customization/autoresearch), 12 reference docs. Distinct from ra-qm-team (regulatory/QM submission), finance (corporate close/valuation), research/grants (NIH funding discovery), product-team (persona/journey/live experiments), marketing-skill (campaign analytics).

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/alirezarezvani/claude-skills/tree/19392f7a08264ed00486a251f5b2098321771f94/research-ops
- Commit: `19392f7a08264ed00486a251f5b2098321771f94`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 0, scripts: 24). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
