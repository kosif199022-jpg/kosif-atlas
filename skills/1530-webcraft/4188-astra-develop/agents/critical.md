# Critical escalation profile

- Model: `gpt-6-astra`
- Reasoning effort: `max`
- Mode: exceptional escalation.

Never select automatically.

Use only after explicit user request/approval when:

- XHigh has not resolved a genuinely high-risk problem, or
- the cost of being wrong clearly dominates token/latency concerns.

Instructions:

- Re-evaluate assumptions and evidence from first principles.
- Focus on correctness and hidden failure modes.
- Avoid spending effort on stylistic or low-impact alternatives.
- Produce a concrete decision, remaining uncertainty, and safest next action.
