# Quality Gates

This file defines the quality bar, the self-evaluation loop, and the stop conditions every role on the brand-writing-team uses before handing off its output. The bar is **top 1% — world-class**. "Good enough for a blog post" is not the target. The target is the kind of piece a smart reader sends to a friend with the line "you have to read this."

Every role uses the same loop. The criteria differ by role and live in each role file under "Quality rubric & self-evaluation."

## The loop

After producing an initial draft of your output, before handing off:

1. **Score yourself against your rubric.** For each criterion in your role's rubric, assign a 1–10 score and write a one-sentence justification. Compute the overall score as the *minimum* of the per-criterion scores (a chain is as strong as its weakest link — not the average, which lets you hide failures).

2. **Decide whether to ship or revise:**
   - **If overall score ≥ 9:** ship. You've cleared the bar.
   - **If overall score < 9 and you have revisions remaining:** identify the weakest criterion (or two), revise the output to fix specifically those, and re-score.
   - **If you have used 3 revisions:** ship the best version you produced, with the final score and a note explaining what you couldn't get above 9 and why.

3. **Track revisions.** You get **a maximum of 3 revisions** (so up to 4 total versions: initial + 3). Stop early if the score reaches ≥ 9. Stop early if a revision moves the score by less than 1 point — diminishing returns means more passes won't help.

## Scoring guide

Use this anchor for every criterion. Be honest. The whole system breaks if roles inflate their scores to skip the loop.

| Score | Meaning |
|---|---|
| **10** | Could not be improved by another pass. Setting the standard. |
| **9** | Top 1%. Possibly minor polish, but no substantive weakness. **This is the ship bar.** |
| **8** | Strong. Has one identifiable improvable weakness. |
| **7** | Solid and professional. Has 2–3 improvable weaknesses but is workable. |
| **5–6** | Functional but mediocre. Multiple issues. A reader would notice. |
| **3–4** | Below bar. Significant problems. A reader would lose trust. |
| **1–2** | Failing. Should not ship. |

A 9 is not "I tried hard." A 9 is "a working professional in this craft would see no obvious problem." Be your own toughest critic. Inflated scores will be caught downstream by the next role or the user, and the team will lose trust in the pipeline.

## Why "minimum, not average"

If your rubric has six criteria and five of them are 10s and one is a 4, your overall is **4**, not 9. Brand-building writing fails on its weakest link — one fabricated stat, one off-voice paragraph, one unanswered objection — and an average lets that hide. The minimum forces you to fix the weakest criterion before shipping.

The exception: if a criterion is genuinely not applicable to a particular piece, mark it `N/A` and exclude it from the minimum. Don't give it a score.

## What revision actually means

Revising is **not** rewriting from scratch. It is targeted improvement of the specific weak criteria you identified.

- If your weakest criterion is "specificity," go through the output and replace vague phrases with concrete ones from your inputs. Don't restructure.
- If your weakest criterion is "voice compliance," scan for banned phrases and AI tells, and replace them. Don't reorganize sections.
- If your weakest criterion is "sources verified," go verify the unverified ones — don't add new ones.

A revision should be smaller than the original work, not larger. If you find yourself rewriting more than 30% of the output in a single revision, you misdiagnosed the problem — the issue is upstream and you should ship with a note explaining what's wrong, rather than spending the budget polishing a fundamentally flawed artifact.

## Honest failure is better than false success

If after 3 revisions you cannot get above 9, **ship anyway** and write a clear note in your self-evaluation explaining:
- What the weakest criteria are
- Why you couldn't fix them within scope
- What upstream input is needed to fix them (e.g., "the dossier doesn't have a counter-example for the second claim")

The next role downstream and the orchestrator will use this note to decide whether to send something back upstream or proceed with the known weakness. Honest failure is recoverable. Hidden failure compounds.

## What the orchestrator checks

The orchestrator reads the `## Self-evaluation` block in every handoff. If a role ships with a final score below 7, the orchestrator should consider sending it back upstream with a note — the issue is probably not the role itself but its inputs (a bad thesis poisons the outline; a thin dossier hobbles the draft).

The Line Editor's final score is the last gate before delivery. If the Line Editor ships below 9, the orchestrator should not silently deliver — it should surface the score and the weakness to the user with the piece, so the user knows what they're getting.

---

## Mutation Proposal Step (orchestrator only)

After the final piece is delivered and the user has rated it (or declined), the orchestrator runs one additional step: proposing a rule mutation.

### How it works

1. **Identify the bottleneck.** Look at the per-role scores for this run. Find the role with the lowest overall score — the weakest link.

2. **Diagnose the failure.** Look at that role's per-criterion scores. Find the weakest criterion. This is the mutation target.

3. **Propose exactly one mutation.** The mutation should address the weakest criterion in the weakest role. It takes one of four forms:

   - **Criterion weight shift:** "What if criterion X was weighted 2x in the minimum calculation?"
   - **Constraint addition:** "What if the role was required to do Y?"
   - **Constraint removal:** "What if we dropped requirement Z for [content type] pieces?"
   - **Threshold change:** "What if the ship bar for this role was N instead of 9 for [content type]?"

4. **Present with hypothesis.** Every mutation needs a hypothesis — why this change might improve scores. "Because I think it would be better" is not a hypothesis. "Because the last 3 newsletter runs showed the Researcher scoring below 8 on recency, and newsletter pieces rarely need time-sensitive data" is.

5. **User decides:** Accept / Reject / Defer.

### Mutation constraints

- **One per run.** Never propose more than one mutation. Signal-to-noise matters.
- **Never re-propose a rejected mutation.** Check `evolution/rule-mutations.json` before proposing.
- **Constraint removals require 3+ data points.** Don't propose removing a constraint unless at least 3 runs show it hurting more than helping for a specific content type.
- **Mutations are role-scoped.** A mutation changes one role's file (or one variant's file). Never propose a mutation that changes multiple roles simultaneously.
- **Log everything.** Every proposal — accepted, rejected, or deferred — goes into `evolution/rule-mutations.json` with the generation number, hypothesis, and pre-mutation score baseline.
