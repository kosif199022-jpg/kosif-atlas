---
name: The Skeptic
type: command
description: Structured adversarial review of any AI output — identifying vulnerable assumptions, simulating failure scenarios, and producing a hardened revision. The single highest-ROI post-generation habit — costs nothing on a subscription and routinely produces substantial improvements.
source: Lou Dallo — Mar 5, 2026 AIMM session on adversarial review workflow
trigger: /aimm:skeptic
location: wiki/mastermind/commands/
source-sessions:
  - 2026-03-05_Mastermind
---

# The Skeptic

Structured adversarial review of any AI output — identifying vulnerable assumptions, simulating failure scenarios, and producing a hardened revision. The single highest-ROI post-generation habit: costs nothing on a subscription and routinely produces substantial improvements. From Lou's battle-tested /skeptic workflow (Mar 5, 2026).

---

You will now act as a skeptical expert whose job is to find the weaknesses in your previous response and produce a stronger version. This is not a politeness exercise — you are adversarially reviewing your own work with the goal of catching errors, omissions, and fragile assumptions before the user acts on them.

$ARGUMENTS

If no specific output was referenced above, apply this review to your most recent substantive response in this conversation.

---

STEP 1 — VULNERABILITY IDENTIFICATION:
Identify the 3 most vulnerable points in the response. A "vulnerable point" is a claim, assumption, or recommendation that is most likely to be wrong, incomplete, misleading, or to fail under real-world conditions. Prioritize:
- Claims that depend on unstated assumptions
- Recommendations that work in theory but commonly fail in practice
- Conclusions where you had low confidence but presented with high confidence

For each vulnerable point:
- Name the underlying assumption that makes it fragile
- Describe a specific, realistic scenario where following this advice produces a bad outcome (not a contrived edge case — a plausible situation the user might actually encounter)
- Rate your confidence that the original point is correct (0-100%)

---

STEP 2 — OMISSION SCAN:
What did the original response leave out that matters? Identify 1-3 considerations that were absent — not because they're tangentially related, but because their absence makes the response actively less useful or potentially misleading.

---

STEP 3 — HARDENED REVISION:
Produce a revised response that:
- Preserves everything that was strong in the original
- Fixes or properly qualifies what was weak
- Incorporates the omissions from Step 2
- Adjusts confidence language to match actual confidence levels

Mark what changed and explain why each change matters.

Apply additional skeptical lenses as warranted by the content — including but not limited to: survivorship bias in examples, availability bias in recommendations, confirmation bias in analysis, and implementation feasibility gaps.

---

QUALITY CHECK:
Before delivering, verify:
☐ The vulnerable points are genuinely the weakest parts (not nitpicks chosen because they're easy to fix)
☐ The failure scenarios are realistic (not theoretical edge cases)
☐ The revision is substantively different where it matters (not just hedged language on the same claims)
☐ You didn't soften the critique to avoid seeming harsh — the user invoked /skeptic specifically because they want the hard version

If any check fails, redo that section.

## Source

- [[wiki/mastermind/sessions/2026-03-05_Mastermind]] (Lou Dallo — adversarial review workflow)
