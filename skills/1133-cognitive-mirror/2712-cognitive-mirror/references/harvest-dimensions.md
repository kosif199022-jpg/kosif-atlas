# Harvest Dimensions Reference

How to detect decision instances in conversation history. Each dimension
describes a type of decision moment, what it looks like in practice, and
how to extract the structured record from it.

---

## 1. Override Decisions

**What happened:** Claude proposed or built something. The user rejected it
and substituted their own version.

**Detection signals in conversation text:**
- "No, instead do..."
- "That's not right. Here's what I want..."
- "Scrap that. The approach should be..."
- User provides a complete alternative after Claude's output
- User deletes/rewrites significant portions of Claude's draft

**Extraction priority:** HIGH — these are the clearest training examples
because both the "wrong" output and the "right" output are visible.

**What to capture:**
- input_state: What Claude produced or proposed
- decision: What the user replaced it with
- reasoning_signals: Any stated reason ("that's too generic," "missing the
  structural issue," "the audience won't care about this")

---

## 2. Correction Decisions

**What happened:** Claude got the general direction right but the specifics
wrong. The user adjusted rather than replaced.

**Detection signals:**
- "Close, but change X to Y"
- "The framing is off — it should be about Z, not W"
- "You're overcomplicating this" or "this needs to go deeper"
- User edits a specific section while accepting the rest
- Calibration language: "too much," "not enough," "wrong tone," "wrong level"

**Extraction priority:** HIGH — corrections reveal calibration heuristics
that are extremely valuable for DSPy compilation because they show where
the user's quality threshold sits relative to Claude's default output.

**What to capture:**
- input_state: The specific element Claude got wrong
- decision: The correction applied
- reasoning_signals: The calibration criterion ("too generic," "wrong
  audience level," "missing the mechanism," "sounds like every other coach")

---

## 3. Reframe Decisions

**What happened:** Claude approached a problem from one angle. The user
reframed it as a fundamentally different problem.

**Detection signals:**
- "The real issue isn't X, it's Y"
- "You're solving the wrong problem"
- "Think about it this way instead..."
- "That's the golf cart version — here's the Ferrari..."
- User introduces a metaphor, analogy, or framework that changes the
  entire conversation direction

**Extraction priority:** VERY HIGH — reframes are the most valuable
decision instances because they reveal the user's deepest mental models.
They're also the hardest for DSPy to learn because they require
understanding WHY the new frame is better, not just THAT it's different.

**What to capture:**
- input_state: The frame Claude was operating in
- decision: The new frame the user introduced
- reasoning_signals: Why the new frame is better (if stated — often it
  isn't, and that's okay. The instance is still valuable even with
  `["reasoning not explicit — reframe was intuitive"]`)

---

## 4. Selection Decisions

**What happened:** Claude presented options, or the conversation reached
a fork, and the user chose a direction.

**Detection signals:**
- "Let's go with option B"
- "I prefer the second approach because..."
- User responds to "should I do X or Y?" with a clear choice
- User selects from a list Claude provided and adds reasoning

**Extraction priority:** MEDIUM-HIGH — valuable when the user explains
their selection criteria. Less valuable as "picked B" without reasoning.

**What to capture:**
- input_state: The options available (all of them, briefly)
- decision: Which option was chosen
- reasoning_signals: The selection criteria (if stated). If not stated,
  note what was unique about the chosen option versus the alternatives.

---

## 5. Rejection Decisions

**What happened:** The user rejected something without providing an
alternative — a pure "no."

**Detection signals:**
- "Don't include that"
- "That doesn't belong here"
- "Remove the section about..."
- "We're not doing that"
- User deletes content without replacing it

**Extraction priority:** MEDIUM — rejections reveal boundaries and
quality gates but lack the positive signal of what SHOULD happen.
Still valuable in aggregate — if the user rejects the same kind of
thing across multiple conversations, that's a strong pattern.

**What to capture:**
- input_state: What was rejected
- decision: The rejection itself (and any stated reason)
- reasoning_signals: Why it was rejected. Common patterns: "commodity
  content," "wrong audience," "scope creep," "not our IP," "too vague"

---

## 6. Quality Gate Decisions

**What happened:** The user evaluated output against an internal quality
standard and the output either passed or failed.

**Detection signals:**
- Explicit evaluation language: "this is good," "not good enough,"
  "this works," "this doesn't meet the bar"
- Comparative evaluation: "better than the last version but still
  missing X"
- Specificity demands: "too vague," "need concrete examples,"
  "where's the evidence?"
- Voice/tone evaluation: "doesn't sound like me," "too corporate,"
  "too casual for this audience"

**Extraction priority:** HIGH — quality gates are the metric functions
for DSPy compilation. Each gate decision is a labeled example of what
passes and what fails according to the user's standards.

**What to capture:**
- input_state: The content being evaluated
- decision: Pass/fail and the specific verdict
- reasoning_signals: The quality criteria applied. These are gold —
  they directly inform the metric function for DSPy optimization.

---

## 7. Scope Management Decisions

**What happened:** The user expanded or contracted the scope of what
was being built, written, or designed.

**Detection signals:**
- "Let's also include..."  /  "Cut that, it's out of scope"
- "This is getting too big — focus on just X"
- "Actually, we need to handle Y too"
- "That's a separate project"
- "Combine these into one" / "Split this into two"

**Extraction priority:** MEDIUM — scope decisions reveal prioritization
heuristics. More valuable when the user explains why they're expanding
or contracting.

**What to capture:**
- input_state: The scope as it existed before the change
- decision: What was added, removed, or restructured
- reasoning_signals: The prioritization logic ("not enough value for the
  complexity," "this is the part people will actually use," "save that
  for v2")

---

## Extraction Quality Rules

**The trivial-decision filter:** Not every user choice is a decision
instance worth extracting. Apply this test: "Could this decision teach
a system to handle a FUTURE situation it hasn't seen?" If the answer is
no — if the decision is purely local to this specific context with zero
transfer value — skip it.

Examples of decisions to SKIP:
- "Make the font bigger" (local formatting preference)
- "Put the date at the top" (layout preference)
- "Use bullet points instead of paragraphs" (presentation preference)
- "Call the variable `user_count`" (naming convention — unless it reveals
  a systematic naming philosophy)

Examples of decisions to EXTRACT:
- "Cut this section — it's commodity content anyone could write"
  (transferable quality criterion)
- "Reframe this as a risk, not an opportunity"
  (transferable strategic judgment)
- "The audience for this isn't beginners, it's people who already tried
  and failed" (transferable audience calibration)
- "Don't build the full system — build the smallest thing that proves
  the concept" (transferable scope heuristic)

**The confidence calibration:** When in doubt between medium and low
confidence, choose low. It's better to flag something for human review
than to pollute the training set with uncertain examples. The user can
always promote a low-confidence instance to high after review.
