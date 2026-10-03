# Anti-AI-isms Checklist

## Purpose

AI-generated prose has recognizable tells — constructions, word choices, and structural patterns that signal "a model wrote this" to experienced readers. This checklist enforces craft-level polish that makes the output indistinguishable from expert human writing. Applied by all draft personas and by the Line Editor during the final coherence pass.

---

## Banned Words and Phrases

### Filler and Hedge Words (cut entirely or replace with specifics)
- "It's important to note that" → cut; just state the thing
- "It's worth mentioning" → cut
- "Interestingly" → cut; let the reader decide what's interesting
- "Notably" → cut
- "In fact" → cut; just state the fact
- "Essentially" → cut
- "Basically" → cut
- "Arguably" → cut or commit to the argument
- "It goes without saying" → if it goes without saying, don't say it
- "Needless to say" → then don't say it
- "At the end of the day" → never
- "When it comes to" → cut; just name the thing
- "In terms of" → cut
- "The reality is" → cut; just state the reality
- "That said" / "That being said" → restructure to eliminate the need
- "To be sure" → cut
- "To be fair" → cut unless genuinely steel-manning an objection
- "Moving forward" → cut

### AI-Signature Constructions
- "Let's dive in" / "Let's explore" / "Let's unpack" → never
- "Here's the thing" → never (unless the voice profile specifically uses it)
- "Think about it this way" → restructure to just present the reframe
- "Imagine a world where" → never
- "What if I told you" → never
- "The short answer is... the long answer is..." → never
- "Spoiler alert:" → never
- "[Topic] isn't just [obvious thing] — it's [slightly less obvious thing]" → this construction is the single most common AI tell. Restructure completely.
- "From [X] to [Y]" as a sentence opener → AI defaults to this for range-stating. Restructure.
- "Whether you're a [X] or a [Y]" → never
- "In today's [anything]" → never
- "In an era of" → never
- "Now more than ever" → never
- "Game-changer" → never
- "Paradigm shift" → never unless heavily ironic

### Overused Transition Patterns
- "But here's where it gets interesting" → never; the writing itself should be interesting
- "And that's exactly why" → restructure
- "This is where [X] comes in" → restructure
- "Enter [concept/person]" → never
- "The bottom line?" → never
- "So what does this mean?" → never; just explain what it means

### Inflation Words
- "Groundbreaking" → almost never justified
- "Revolutionary" → almost never justified
- "Transformative" → only if you can show the before and after specifically
- "Powerful" → replace with a specific description of the power
- "Incredibly" / "Amazingly" / "Remarkably" → cut; these are the writer being impressed instead of making the reader impressed
- "Crucial" / "Critical" / "Essential" / "Vital" → use once per article maximum, and only if the claim genuinely warrants it

---

## Banned Structural Patterns

### The Diagnostic "you" in Openings (v2.1)

Diagnostic "you" tells the reader what they are experiencing with a specific tool, trend, or behavior in the first 300 words. It is an AI tell because models default to this pattern — assuming the reader has had the exact experience, and often implying judgment.

Examples of diagnostic "you" (banned in openings):
- "You've been using [tool] for three months and something feels off."
- "You open the draft and instead of relief, you feel dread."
- "You're a few months into [behavior] and the speed is there but something's missing."
- Stacked second-person: "You've tried X. You know Y. You keep doing Z anyway."

These fail because: (1) they presume specific prior experience, (2) they often imply the reader is doing something wrong, (3) readers who don't have the exact experience bounce, (4) readers who do may feel judged rather than seen.

**Replacement:** Open through a universally human experience first. The topic-specific diagnosis can enter the piece in a body section after rapport has been built. Scenic "you" (universally true moments anyone can enter) is fine. Diagnostic "you" belongs in "The Pattern" section, not the opening.

Test: Could a reader who doesn't share the specific experience still engage with the opening and say "that's not me, but I know people like me who experience this"? If yes, passes. If no, it's diagnostic — rebuild.

### The AI Listicle Drift
If the article starts as prose and gradually drifts into numbered lists or bullet points, this is an AI tell. Maintain the structural mode established in the first 500 words throughout the piece. If the article is prose, stay in prose. If it uses a map/framework structure (like the Cartographer), use that structure consistently — don't dissolve into bullets.

### The Symmetric Paragraph
AI tends to produce paragraphs with a claim sentence, 2-3 support sentences, and a concluding sentence that restates the claim. This metronomic rhythm is detectable. Vary paragraph length and structure. Some paragraphs should be one sentence. Some should be six. The rhythm should feel organic, not algorithmic.

### The Exhaustive Example Set
AI tends to list 3-5 examples when 1 strong example would suffice. If one example makes the point, use one example and move on. Multiple examples are only justified when each adds a genuinely different dimension (not just another instance of the same pattern).

### The Premature Summary
AI tends to summarize what it just said at the end of each section. Cut all internal summaries. The reader remembers what you just wrote. Trust them.

### The Diplomatic Hedge
AI tends to add qualifiers to every claim: "While this approach has its limitations..." or "Of course, this isn't always the case..." One hedge per article is enough. Commit to your claims. If a claim needs a hedge, either strengthen the evidence or cut the claim.

---

## Punctuation Rules

- **Em-dashes (—):** Maximum 3 per article. AI overuses em-dashes dramatically. Replace with periods, commas, colons, or parentheses. **Procedural check:** Before delivering any draft, run a literal character search for `—`. Do not rely on memory or read-through — search and count. If the voice profile permits em-dashes, count them. If count exceeds 3, replace the excess.
- **Exclamation points:** Zero. Unless the voice profile explicitly uses them and you can cite a specific instance.
- **Semicolons:** Maximum 2. They're fine but AI reaches for them too often.
- **Ellipses (...):** Zero in body text. Acceptable only in quoted dialogue.
- **Colons for reveals:** Maximum 3 per article. The "claim: reveal" construction is powerful but AI saturates it.

---

## Voice-Specific Overrides

If the loaded voice profile contradicts any rule above (e.g., the author's actual voice uses em-dashes heavily), the voice profile wins. The anti-AI-isms checklist is a default — it prevents generic AI tells. But if the author genuinely writes with em-dashes, removing them would make the output sound *less* like them.

Flag any override in the evolution log: "Anti-AI rule [X] overridden by voice profile."

---

## Application Points

1. **Drafter** — Apply during initial draft. Prevents AI tells from entering the text.
2. **Line Editor (final coherence pass)** — Scan and enforce. This is the last gate before delivery.
3. **Substitution Test (Stress Test 4)** — If the Substitution Test flags passages as interchangeable, cross-reference this checklist. The flagged passages likely contain constructions from the banned list.
