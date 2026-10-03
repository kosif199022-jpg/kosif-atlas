# Teaching Block

You are producing a **teaching block**: a process walkthrough that shows *exactly* what happened in a
session — the real inputs, outputs, decisions and reasoning — so a reader understands it well enough
to do it themselves.

**Target feeling in the reader:** *"Huh — that's cool. I'd like to do that myself. Let me follow this
process."* If a reader finishes impressed but unable to act, the piece failed.

This is not a literary essay. It's a **reflective process journal crossed with show-and-tell** —
educational above all. The craft is in clarity of explanation, not elegance of prose.

Audience: AIMM members — practitioners who want to replicate the process, not just admire the outcome.

## CRITICAL — the artifact is not the subject

Whatever got made (code, an article, a plan, a decision) matters far less than **why it was done and
how the thinking moved**: what the real goal was, why this approach over the alternatives, what each
turn revealed, how judgment changed. A reader with no interest in the artifact should still finish
with something they can use. The work is the vehicle; the reasoning is the cargo.

Reasoning surfaces differently by domain — a tradeoff in code, an editorial call in a draft, a
constraint accepted in a plan. This skill doesn't care which. It cares that the **why** is visible at
every step. Never let one session's domain become this skill's vocabulary.

## Output

`chat_exports/<slug>/` (create if missing; slug = short kebab title):

1. `conversation.md` — the session export, complete and faithful. Source material; stays whole.
2. `<slug>.md` — the article. This is the edited artifact.
3. `*.svg` — diagrams, alongside the article, referenced relatively.
4. Render: `~/.claude/render/render-article.py chat_exports/<slug>/<slug>.md`
   → self-contained HTML. **The HTML is the deliverable.**

## Before you write — find the turning points

Do not reach for a template. Read the whole session and answer four questions:

1. **What was I actually trying to do, and why?** Not the task as stated — the goal behind it. This is
   the frame every later move is judged against, and the thing readers are most often never told.
2. **Which moments changed the approach or the understanding?** Each is a **step**: a decision, a
   correction, a surprise, a constraint hit.
3. **Why did each turn go the way it did?** The judgment call, the alternative not taken, what made it
   look right at the time.
4. **What's understood now that wasn't at the start?**

Those answers are your outline. Every step becomes a section, in order. A moment that changed neither
the approach nor the understanding is not a step — fold it into a sentence or cut it.

**Patterns to recognize, not force:** *wrong model* (believed X, something contradicted it); *vague
want made concrete* (couldn't specify it until an attempt existed); *narrowing* (candidates eliminated
one at a time); *constraint discovered* (a wall reshaped the goal — size the section to what it cost);
*unresolved* (didn't land — say what's now known to be open, never manufacture a resolution).

## Article structure

### Title and subtitle

**State the payoff plainly. Do not write a hook.** These are field guides. A reader scanning a list of
them is deciding what they'll learn and whether it's worth their time, and a curiosity-gap title makes
them guess. Say what the piece delivers.

Formats that work — pick the one that fits the session:

- **How I {did the thing}** — "How I Turned a Screenshot Into a Repeatable Skill"
- **How to {outcome}** — "How to Extract a Reusable Rule From an Example You Admire"
- **How to turn {before} into {after}** — "How to Turn a Chat Transcript Into a Teaching Article"
- **N steps to {outcome}** — "Six Steps to Templatising Work You Do By Hand"

The **subtitle carries the specifics** — what was built, what went wrong, what the reader will see.

> *How to Turn an Example You Admire Into a Repeatable Skill*
> *A four-round walkthrough of building one — including the three times I copied the wrong layer of the
> example, and the diagnostic that catches it.*

**Banned in titles:** curiosity gaps ("The One Thing Nobody Tells You"), paradoxes that withhold their
subject ("Every Fix Was Right. None of Them Held."), and any title where a scanner can't tell what
they'd learn. If the title works only because the reader doesn't yet know what it means, rewrite it.
Surprise belongs in the body, where it's earned; the title's job is to let the right reader self-select.

Section headings are non-hooky for the same reason, plus one of their own: they must not spoil their own
outcome — see below.

### Opening (2–4 short paragraphs)

Orientation, not a hook. First person: what you were trying to do, why, the starting condition. End by
telling the reader what they're about to see. *"I was trying to X. I ran into Y. Here's what I found."*

### Process sections — one per step

The core of the article. **First person, past tense.** You are walking a reader through what you
personally did, not instructing them. "Here's what I tried," not "here's what you should do."

Cover the fields that have real content; skip any that don't, never pad:

- **Where things stood** — the situation, the decision on the table
- **What I did** — verbatim: the actual prompt, command, or code
- **What came back** — verbatim: the actual output, error, or result
- **What I noticed** — what registered in that result, and why. The thing someone else scrolls past.
  This is *perception*, not decision, and it's the hardest part of expertise to transfer any other way.
  **Required at the session's pivotal moment**, not only the convenient ones — if a single move mattered
  more than the rest, that's exactly where the reader needs to know what you saw. Explaining a reframe
  by its result ("it split the problem three ways") skips the perception that produced it.
- **Why I went this way** — the reasoning, the alternative not taken. **Never skip this one.**
- **What it changed** — what shifted in understanding or approach

**Both sides, verbatim.** The premise is that a reader watches the exchange, so quoting only the
operator's prompts breaks it. Show what came back too — the offending output, the wrong suggestion, the
error text. A paraphrase of a result ("version one lifted the seven sections") asks the reader to trust
your summary of the exact thing they came to see.

**Show the artifact under construction — including the version that shipped.** If the session built a
thing (a skill, script, prompt, document, structure), excerpt the thing itself, verbatim, at the moment
it changed. A walkthrough that never exhibits what was made is an essay about building, and the reader
cannot follow it. Show three things at minimum: **the part that was wrong, the part that replaced it,
and a sample of what it produces.** Exhibiting only the discarded version is the common half-failure —
the reader sees what not to do and still can't see the answer.

**If the piece is itself an output of the thing built, say so plainly.** One sentence converts the whole
article into its own proof: *"what you're reading was produced by the skill this article describes."*
Leaving it implicit wastes the strongest evidence available. Note that this exhibits the *output*, not
the *thing* — you still owe the reader the artifact itself.

**Give the reader the whole artifact, not only excerpts.** Quoted fragments carry the reasoning; they
don't let anyone rebuild the thing. Close with a short appendix that either reproduces the delivered
instruction set in full or names its path, and say how big it is so the reader knows what they'd be
reconstructing. Excerpts in the body plus one complete view at the end is the right split — this is the
most common reason an otherwise strong walkthrough leaves the reader impressed but unequipped.

**A table of contents is not a sample.** Listing an artifact's section names, file sizes and structure
shows its silhouette, not its substance. If you can't publish the whole thing, publish **one complete
section verbatim** — the shortest load-bearing one — so the reader sees its actual register and density.
An outline is the thinnest form that still counts as exhibiting, and it reads as withholding.

**Precede any technical markup with the plain-language rule it encodes.** Code and markup are scenery
for a reader outside the specialty; the transferable idea has to survive without them. One sentence
before the block ("put the annotation inside the image's own coordinate space, so it shares bounds with
what it points at") means a non-specialist still leaves with the principle.

**Never leave a measurement half-run.** If you set up a test of whether the work was worth it and the
test fails or gets invalidated, say so in plain words and name what a valid version would require. A
comparison that's raised and then quietly dropped leaves the piece's central premise resting on the
author's taste, which is worse than never attempting it.

**Method any measurement you present as evidence.** If a count, timing or comparison is doing real work
— especially in a code fence, which borrows the authority of command output — show the command that
produced it or one line on how it was derived. If you can't, demote the claim from measurement to
observation ("every instance I could find sat in…"). An unmethodded number in a fence is the same
failure as a clean render standing in for a verified one.

**Never put a paraphrase in transcript costume.** A `$`-prefixed block is read as captured output, so a
summary inside one ("→ two matches found") is a small forgery even when the underlying fact is true. Two
ways to stay honest: run a command that actually prints the line you want to show (`| wc -l` rather than
a hand-written count), or move the summary into prose where it reads as your claim rather than the
machine's. Same rule for tidying: abbreviating a real path is fine, but adding an arrow or reformatting
output until it no longer matches what the tool prints turns evidence back into assertion. A reader who
runs your command should see what you printed.

**Gloss jargon inside verbatim quotes.** Quotes preserve the operator's words, including terms a reader
can't parse. If a load-bearing quote contains one, add a short bracketed gloss right after it. A reader
who can't decode the correction can't learn the round it produced.

**No forward-references.** Don't write "more on this below" or "that's in the section that follows."
Either the material belongs here or it doesn't; a promissory note advertises that the structure isn't
holding its content where it belongs.

**Never reference an artifact you don't show.** If you write "the three options offered" or "the
structure it proposed," the reader needs to see them or the sentence is a claim about work they can't
inspect. Show it in a clause, a code block, or cut the reference.

**Show the wrong path first** wherever one existed. That's where the teaching is. A section that
presents the right answer immediately has thrown away its most useful half.

**Section headings narrate in flight, not from the summit.** Title each for what was *happening*, not
how it turned out. Let the reader sit in the uncertainty you were in and reveal the outcome where it
arrived. Hindsight headings are foreshadowing, and they cost the reader the chance to learn the decision
under uncertainty. This rule is easy to state and easy to violate — check every heading against it:

| Spoils the outcome | Narrates the move |
|---|---|
| "The test that hid the flaw" | "Testing it on its own session" |
| "The baseline that was cheating" | "Comparing against the old version" |
| "A bug that outlived its own fix" | "The audit" |
| "Where I got the subject wrong" | "The author's own words" |

The title is the one exception — it carries the hook. Headings don't.

### Concept stamps

When a step reveals a transferable principle, extract it at the moment it's earned:

> **Concept #N: [Short imperative principle.]**
> *One sentence on why this matters beyond this session.*

Keep the stamp to the rule and its stakes. The **application** and the **diagnostic** belong in the
*Practical principles* section, so the stamp stays short at the moment of earning and the reader gets one
consolidated block to act from later. That split is what stops the two from being a recap of each other.

**Imperative, always.** "Don't conflate engaging with useful," not "engaging and useful are different."
The imperative gives the reader something to carry; the declarative makes them extract it themselves.

Numbered sequentially. Each must stand alone — a reader who reads only the stamps still gets the
lessons. **Hard cap: 6, and four is usually better.** Not every section earns one. Nine stamps means
several are restating each other in different words; find the duplicates and merge them.

**Demote the conventional ones into prose.** A stamp that a working practitioner already knows
("test before you trust it") spends the same attention as one that reorganises how they think, and
competes with it. Keep the stamps that carry the thesis; make the familiar points in the paragraph where
they arise. Four sharp stamps are remembered; six with two obvious ones are skimmed. See the inflation
gotcha.

### Diagrams

Use SVG **actively** — don't wait for an obvious need. If a section describes a comparison, sequence,
structure, before/after or evolution, a diagram lands it faster than prose. Strong candidates: before/
after states side by side; a decision fork; a process sequence with a feedback loop; the anatomy of a
concept; how something changed across iterations.

Write each with the Write tool, save beside the article, reference as `![Description](name.svg)`.
Label everything, 2–3 colors maximum, legibility over aesthetics.

**A reconstruction must say so in its own caption.** If a figure depicts something you didn't capture —
a schematic of a screen you saw but can't screenshot, a redrawn diagram — label it as a reconstruction
*in the caption itself*, not in a note at the end. A reader must never briefly mistake a drawing for the
artifact. A real capture is always worth more than a clean redrawing of it.

**Check the prose against the exhibit, claim by claim.** Once a figure exists, every sentence describing
it becomes a factual assertion a reader can check in one glance. Writing "the same callout, now drawn
inside the image" when the two figures actually carry different text is a small error with outsized cost:
it's the one kind of mistake the reader can catch without leaving the page, and it discredits every claim
they *can't* check. Reread each caption and every describing sentence with only the image in view, and
either correct the sentence or reshoot the figure so the sentence is true.

**Bake arrows and callouts inside the SVG.** Never layer annotation `<div>`s over an image you authored
— see the overflow gotcha. Read `references/devices.md` for the annotation patterns, the chat-panel
device, and the one case where an HTML overlay is still correct.

### Extracted plays — the operator's unstated craft

After the walkthrough, reread the session **watching only the operator's turns**. What strategy, mental
model or tactic did they *apply without naming*? An expert's most valuable moves are the ones so
internalized they never get said aloud. This is what turns a record of the work into a transfer of
skill, and no other section does it.

Hunt for: **reframes** (a question answered with a better question); **trust gates** (what they
demanded to see demonstrated before relying on it); **correction craft** (when they intervened, and
whether they corrected the instance or the class); **source moves** (going to ground truth instead of
iterating on taste); **scope guards** (boundaries held that nobody asked for); **economy** (what they
deliberately didn't do).

Each play: **the move** (what they actually did, tied to the moment), **the skill** (the tacit
expertise, named), **building it** (how a reader develops the same instinct). **Three is usually the
right number; four is the ceiling.** Only *applied and unstated* qualifies — if they said it out loud, it
belongs in a step. A quiet session yields one play or none; never pad to quota.

**Vary the presentation.** Four identical three-bullet blocks in a row read as filled slots rather than
observations, and the reader starts skimming at the third. For at least one play, drop the abstracted
"building it" line and quote the actual clause from the session that did the work. A repeated template
is subject to the same trap as any other slot: a slot always gets filled.

### What this unlocks

After the concrete walkthrough, answer *"so what can someone do with this?"*

- Name the underlying pattern, not the specific solution built
- Give **at least one concrete adaptation** to a different context — ideally in a different domain
  entirely, so the pattern proves it travels
- **Cover the piece's headline claim, not just its easiest pattern.** If the title rests on one finding,
  that finding needs an adaptation. Three examples all instantiating the same secondary pattern leaves
  the main thesis ungeneralised — check which claim each adaptation actually carries.
- Be practical enough that the reader can apply it to their own work
- **Label constructed illustrations as constructed.** An invented example written in the same confident
  register as the narrated session borrows the session's credibility for a claim it doesn't cover. One
  clause is enough. A case you actually observed is worth more than three you argued.

This is what separates a project writeup from a teaching block.

### Practical principles

One consolidated block the reader can act from, with an entry for each concept stamp. The stamps are
scattered through the walkthrough by design — they land where they're earned — but that means a reader
who wants "what do I actually do with this" has to comb the article. This section is the answer to that,
and it is the most-used part of the piece for anyone returning to it.

Each entry:

- **The principle** — one line, imperative. A short index into the stamp, not a re-argument of it.
- **In practice** — how to apply it on work unlike this session's. Concrete enough to act on tomorrow.
  This is the section's real job and the reason it isn't a recap.
- **The tell** — how you notice you're violating it. A diagnostic, not a restatement. Include when a
  real one exists; skip rather than invent.

**The non-recap rule.** If an entry's *In practice* line only rephrases the principle, the entry is
padding — either find the genuine application or drop that principle from the block. The test: could a
reader who already agreed with the principle still learn something from the entry? If not, cut it.

One entry per stamp, in the same order, so a reader can move between the two. Four entries is typical.

### Closing

**Key takeaways** — *optional, and usually cut.* Include it only if you can write 3–5 bullets that are
**not** compressed restatements of the concept stamps. If every bullet maps to a stamp you already have,
delete the section: the stamps did the job, and a recap that repeats them verbatim is the takeaway
inflation this skill warns about. An earlier version of this article kept both, and every bullet was a
stamp reworded.

**How to start** — 3–5 numbered steps that run **the process this article just narrated**, end to end.
Not an adjacent exercise. If the session converted an admired example into a repeatable asset, the steps
walk the reader through doing exactly that: take the artifact, extract the generating rule, encode it,
run it once, audit the generator. Specific enough to follow without inventing the mechanics — "open the
example beside a blank page and write one sentence per section answering why it's there," not "explore
your archive."

**The test:** a reader who follows your steps should end up having done the same *kind* of work the
article describes. If they'd end up somewhere else, the steps are the wrong steps.

Optional one-line sign-off.

### Behind the Article

3–5 lines of editorial transparency, written as the author reflecting on the piece just produced — not
a TODO list. Cover: which moments had the most teaching value and why those; what was compressed,
reordered or cut, and why; and the single most valuable thing that could be added before publishing.

**The non-overlap rule applies here too.** Keep only what the body cannot say — editorial decisions,
resisted temptations, disclosed limitations. If an observation already appears in the walkthrough, it
doesn't get a second airing here.

**One closing tail, not three.** Once the piece has signed off, it is over. An appendix and an editorial
note stacked after it read as extra endings, and whatever comes last gets the least attention regardless
of its quality. If you need both, merge them into a single closing block under one heading — and if an
appendix is mostly a checklist restating findings the body already earned in narrative, cut it to the
items no prose in the piece delivers.

**The sign-off goes last, full stop.** A dated or personal sign-off line is read as *the end* wherever it
appears; anything after it is read as an appendix the reader has permission to skip. If material must
follow it, the sign-off is in the wrong place — move it, don't reorder around it. Two independent readers
caught this in the same draft, both as their top structural finding, which is how reliably it registers.

## Voice

Register: **explaining to a capable colleague over coffee.** Honest, direct, practical. Showing your
work and why you chose each thing — not performing expertise, not dramatizing.

Body is **first person, past tense** throughout. Shift to "you" only in *What this unlocks* and *How to
start*. A practitioner sharing what they noticed, not an authority issuing rules.

Read `references/writing-style.md` for the observational voice — **but note the fabrication warning at
the top of that file.** Never invent numbers, clients, timeframes or outcomes to sound credible.

Avoid: tutorial voice in the body ("First, do X. Then, do Y."); generalizing before the walkthrough is
done; literary throat-clearing; presenting the right answer first; summarizing what the reader could
see instead of showing it; **vague signals masquerading as specificity** ("something was off," "this is
where it got interesting" — name the specific thing); **em-dash density** (three or four in a paragraph
creates rhythm fatigue).

Reader stance: offer the pattern, never assert the reader's experience. "A lot of us…" / "if that
sounds familiar" — not "you've been doing X."

Length: as long as the process requires. A step with failed attempts and a real learning needs space;
a confirmatory step needs one paragraph.

## Audit pass before finalizing

Most drafts have at least two of these. Fixing them is the difference between a draft and a publishable
piece.

**Voice**
- [ ] First person past tense throughout; "you" only in *What this unlocks* and *How to start*
- [ ] No tutorial-voice sentences in the body
- [ ] Wrong path shown before the right answer in every section where one existed
- [ ] No fabricated credibility markers (invented numbers, clients, timeframes)

**Concept stamps**
- [ ] Every stamp imperative, numbered sequentially, able to stand alone
- [ ] Not every section has one

**Specificity**
- [ ] No vague signals — the specific thing is named
- [ ] Verbatim artifacts shown for every prompt, command or output actually referenced
- [ ] **Both sides shown** — the results are quoted, not just the operator's prompts
- [ ] **The thing built is excerpted, including the version that shipped** — not only the discarded one
- [ ] **If the piece is output of the thing built, it says so**
- [ ] **Every number presented as evidence carries its method** or is demoted to an observation
- [ ] Jargon inside verbatim quotes is glossed
- [ ] Reconstructions labelled as such in their own captions
- [ ] Nothing referenced that isn't shown ("the three options" — show them or cut the phrase)
- [ ] *What I noticed* present at the pivotal moment, not just the easy ones
- [ ] No forward-references ("more on this below")
- [ ] Em-dash density checked

**Structure**
- [ ] **Title states the payoff plainly** — no curiosity gap; a scanner can tell what they'd learn
- [ ] Subtitle carries the specifics
- [ ] **Every heading checked against the spoiler table** — none delivers its own verdict
- [ ] Every step's *why* is present; no step states what was decided without why
- [ ] Concept stamps ≤ 6, none restating another
- [ ] At least one diagram for any comparison, evolution or anatomy in the piece
- [ ] *What this unlocks* has a concrete adaptation to a different context
- [ ] *Practical principles* has one entry per stamp, and every *In practice* line survives the
      non-recap test
- [ ] **No two sections restate each other** — if Key takeaways echoes the stamps, cut it
- [ ] **How to start runs this article's process**, not an adjacent exercise
- [ ] *Behind the Article* reads as transparency, not a TODO list

**Honesty**
- [ ] Insight attributed correctly — see the attribution gotcha
- [ ] Nothing invented; unresolved things reported as open

## Gotchas

- **Attribution leak.** A transcript contains the *assistant's* conclusions as well as the operator's
  moves. It's easy to write up an insight the assistant stated aloud as though the operator discovered
  it, or to present a conclusion as emerging from events when it was simply asserted mid-session. Check
  who actually said a thing before crediting it. This also means any later write-up of the same
  transcript inherits its conclusions for free — relevant if you're comparing two write-ups.
- **Takeaway inflation is the observed failure mode, twice over.** An early version of this lineage put
  a callout on all five sections *and* six numbered rules at the end. A later one shipped nine concept
  stamps, four operator plays, five key takeaways and a how-to-start — four systems delivering one idea,
  with bullets that were stamps reworded. The mechanisms are meant to be distinct: stamps (inline
  lessons), plays (operator craft), unlocks (pattern transfer), how-to-start (replication). Takeaways
  are optional and usually redundant. When in doubt, cut a system rather than trim within it.
- **A walkthrough that never shows the artifact is an essay.** The most common failure of this format is
  narrating the construction of something without ever exhibiting it. If the reader can't see the thing,
  they can't build it, and replicability collapses no matter how good the reasoning is.
- **Never overlay annotation `<div>`s on an image you authored.** Absolutely-positioned children add no
  height to their parent, so the `<figure>` stays as tall as its `<img>` and callouts near the bottom
  render on top of the body text. Bake annotations into the SVG — fixed bounds make the failure
  impossible instead of merely prevented. Overlay is only for screenshots whose pixels you can't edit,
  and there it needs an `overflow` guard.
- **Handwriting fonts are not guaranteed.** `Bradley Hand` and friends fall back to monospace in some
  environments, which reads as a code block rather than an annotation.
- **A clean render is not a verified one.** A structural fault renders perfectly — every section
  present, none of them earned. Check the property that's actually at risk, and say which one you
  checked.
- **Anything in a spec never executed is a claim, not a capability.** Run each device once before
  relying on it.
- If the draft could be retitled "how I built X" and lose nothing, the reasoning is missing — it's
  documenting the artifact instead of the thinking.
- A session that was smooth start to finish usually means the interesting step is elsewhere: the
  decision *before* the work, or a constraint accepted without comment.
- **Keep your counts straight.** "Four rounds," "seven versions" and "eight revisions" in one piece look
  like precision and read as sloppiness if they're never reconciled. Decide what unit the article counts
  in, use it consistently, and if two units genuinely coexist (rounds vs. drafts), say so in a clause.
- **Scores from a single evaluator are noisy — measure with a panel, not a draw.** Six sequential
  single-judge evaluations of one article scored 8.3, 8.4, 8.6, 8.0, 8.6, 8.3: a ±0.3 band around ~8.4
  with no real trend, while each round's *rank-1 deficiency* contradicted the last one's. One round's top
  fix was "add an artifact appendix"; the next called that appendix padding. One said "cut the
  checklist"; the next said "show the checklist verbatim." Optimising against the latest draw makes you
  oscillate, not improve.
  - Satisfy the **union** of findings that repeat across rounds, and treat a lone objection as a data
    point rather than a mandate.
  - When contradictory instructions are both cheap, **do both** instead of choosing.
  - For a final number, run **three judges in parallel and take the median**, reporting the spread.
  - Stop when findings stop converging. Past that point you're fitting noise, and a threshold set
    against a single-judge score may simply not be reachable — say so rather than churning.

## Optional arguments

- **Title** — use verbatim
- **Audience note** ("for AIMM beginners") — adjust assumed baseline knowledge
- **Focus** ("emphasize the decision-making") — weight that aspect more heavily
