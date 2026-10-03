# 67% of Your AI's Potential Is Locked Behind Context You Didn't Know to Give It

---

*New research reveals that structured prompt architecture raises AI accuracy from 0% to 100% on reasoning tasks — and the difference isn't about writing better prompts. It's about surfacing the context you carry in your head but never think to include.*

---

## The Context You Didn't Think to Provide

Here is a question that should make every knowledge entrepreneur uncomfortable:

*When you ask AI a question and get a mediocre answer, how do you know if the model failed — or if your prompt did?*

Most of the time, it's the prompt. Not because you phrased it badly. Because you left out context you didn't think to include.

Consider this: "I want to wash my car. The car wash is 50 meters away. Should I walk or drive?"

Every major language model gets this wrong. Walk, they say. It's only 50 meters. Save the gas. Enjoy the fresh air.

The answer is drive. The car needs to be at the car wash. Walking leaves it behind.

This isn't a trick question. It's a *missing context* question. The constraint — the car must physically travel to the car wash — is true, obvious in retrospect, and completely absent from the prompt. Not because the person asking is stupid. Because they already know the car needs to be there. They didn't think to say it, because to them it's not "context" — it's just how car washes work.

The AI never had a chance. It was working with 33% of the information it needed — and it gave a confident, well-reasoned, categorically wrong answer. The person who asked couldn't tell the answer was wrong, because the context they didn't think to provide was something they'd never consciously think to state.

Now scale that failure to the problems you actually care about: pricing strategy, client proposals, course architecture, market positioning, content planning. Every prompt you write for these problems contains the same class of gaps — constraints you've internalized, assumptions you didn't think to state, stakeholder dynamics that live in your experience but never make it into the text box.

Your AI is working with a fraction of what it needs. And the fraction it's missing is context you *have* but didn't think to provide.

## The Research: Putting a Number on What's Missing

In February 2026, researcher Heejin Jo published a paper that quantified this problem with uncomfortable precision. The study (arXiv:2602.21814) ran 120 controlled trials using the car wash problem as a benchmark, systematically testing which layers of prompt architecture actually close the context gap.

The findings were surgical. Six conditions, each adding one architectural layer:

**Condition A — bare prompt, no system instructions:** 0% accuracy. The model recommends walking every time. Not because it doesn't know cars need to be physically present at a car wash — it does. Every major language model has that knowledge. The failure isn't a knowledge gap. It's an activation failure: the distance heuristic ("50 meters is short → walk") fires first, feels like a complete answer, and the model never interrogates whether distance is even the right frame for this problem. The implicit physical constraint — the car must travel to the car wash — never gets a chance to surface.

**Condition B — expert persona ("You are an expert advisor"):** Still fails. Telling the model to be smart doesn't help it override the heuristic. The distance frame still dominates.

**Condition C — structured reasoning scaffold (STAR framework):** 85% accuracy. A single structural change — forcing the model to articulate the *goal* of the task before generating an answer — broke the heuristic's grip. When the model wrote "Task: Get the car cleaned at the car wash," the physical constraint became unavoidable. Goal articulation forced the model to activate knowledge it already had but wasn't using.

**Condition D — user profile context added:** Marginal improvement.

**Condition E — full stack (persona + scaffold + profile + RAG context):** 100% accuracy.

**Condition F — scaffold + profile without persona:** Confirmed the scaffold does the heavy lifting.

The core finding: *structured prompt architecture matters substantially more than adding information.* The problem isn't that the AI lacks knowledge. It's that the prompt lacks the structural scaffolding that would force both the user and the model to surface what the user didn't think to say.

The mechanism is almost embarrassingly simple. When the model writes "Task: Get the car cleaned at the car wash," every token that follows is conditioned on that explicit statement. The context that the prompter didn't think to provide — the car must be there — becomes the foundation of the answer. Without that forced articulation, the model pattern-matches on "50 meters" and jumps straight to "walk" — the distance heuristic overriding the physical constraint without the model ever recognizing it missed something.

The model didn't get smarter between conditions. It got the same context the human already had — just made explicit.

## Why Knowledge Entrepreneurs Lose the Most

If you're building a knowledge business — courses, consulting, coaching, content — you are using AI every day for problems that have real stakes attached. Client strategy. Pricing architecture. Content positioning. Market analysis. Launch planning.

And here's the cruel irony: the more you know about your domain, the more context you leave out of your prompts without realizing it.

A novice pricing a group program might write "How should I price my new program?" and know it's vague. But an experienced knowledge entrepreneur writes the same prompt and *thinks* it's specific — because in their head, they've already factored in their market's price anchors, their existing offer ladder, the cannibalization risk, the competitive positioning. None of that makes it into the prompt. They don't think to include it because they don't consciously separate "what I know" from "what the AI knows."

The expertise that makes you valuable to your clients is the same expertise that makes your prompts incomplete. Your domain rules are so deeply internalized you don't think to state them. Your stakeholder intuitions are so automatic you don't realize they're context the AI needs. Your market knowledge is so familiar it feels like background noise rather than the signal that would completely change the answer.

This is what the 67% represents. It's not a knowledge gap. It's a *translation* gap. The distance between what lives in your head and what makes it into the text box. And that gap compounds on every prompt, every day, across every high-stakes decision you ask AI to help you think through.

## What We Built: A Skill That Closes the Gap

We took the paper's findings and asked: what if we built a tool that identifies the context you didn't think to provide — and then asks you for it before guessing?

That last part is the key insight. Early versions of the skill tried to infer all the missing context. Better than nothing. But inferring your pricing strategy is nothing compared to reading your actual pricing page. Guessing at your client's situation is nothing compared to scanning your discovery call notes.

The skill works in five layers:

**Layer 1 — Intent Inference.** What are you actually trying to accomplish? Not what you literally asked — what outcome you need. "Should I walk or drive to the car wash?" is literally a transportation question. But the real intent is "get my car washed." That reframing is where the missing context surfaces.

**Layer 2 — Constraint Mapping.** What must be true for the goal to be achieved that the prompt never states? Physical constraints, temporal dependencies, domain rules, stakeholder dynamics, assumption traps where a strong default heuristic overrides the specific situation.

**Layer 3 — Source Check.** This is where the skill becomes collaborative instead of monologic. Before inferring or researching to fill the gaps, it asks: *do you have real data that covers this?* Not vague questions like "do you have more context?" — specific artifact requests. "Do you have an intake form or discovery call notes for this client? A past proposal you've written for a similar engagement? Your pricing page or sales deck?"

The user often *does* have exactly what's needed. They have the client brief in a folder, the competitive analysis from last quarter, the course feedback from previous cohorts. They didn't think to include it because they didn't realize it was context the AI needed. The skill's job is to remind them that the answer to 67% of their prompt's potential is already sitting in a document somewhere.

**Layer 4 — Context Augmentation.** Whatever the user couldn't provide, the skill fills in — domain knowledge, relevant frameworks, scope calibration. But user-provided data always takes priority. Real data grounds everything. Inference fills the gaps.

**Layer 5 — Rewrite.** The enriched prompt integrates everything — user data, inferred context, surfaced constraints — into a version the user would have written if they'd had ten minutes to think about what they actually needed. And had their files open in front of them.

The skill operates in three modes. **Default mode** shows you the enriched prompt and what it found before answering — so you see what you didn't think to include and learn from it. **Fast mode** skips the preview and delivers the enriched answer directly. **Export mode** gives you the enriched prompt as a standalone artifact you can paste into any other tool.

## The Results: What 67% Looks Like in Practice

We tested four scenarios across the skill's evolution. The numbers tell the story.

**The car wash problem** (implicit physical constraint): Without the skill, the model recommends walking — wrong answer, confidently delivered, every time. With the skill, it surfaces the constraint the prompter didn't think to state, presents the enriched prompt, and recommends driving. The skill correctly skips the source check here — this is a universal constraint, not a knowledge gap the user could fill with documents.

**"What's the best way to learn Python?"** (massively underspecified): Without the skill, you get a generic 10-step listicle that applies equally to a teenager starting from zero and a senior developer switching languages. With the skill, it identifies three critical dimensions the prompter didn't think to specify — experience level, goal, and available time — and asks for them directly before answering. The result: tailored learning paths instead of one-size-fits-nobody advice.

**"How do I center a div in CSS?"** (genuinely simple): Both with and without the skill, you get a clean, direct answer. The skill correctly identifies that no context is missing and stands down. No over-scaffolding. This matters — a tool that adds friction to simple questions is a tool nobody uses.

**"Help me write a proposal for a coaching engagement with a mid-market SaaS company"** (context-hungry business prompt): Without the skill, you get a 215-line template with brackets everywhere — [CLIENT NAME], [YOUR CREDENTIALS], [PRICING]. Technically complete. Practically useless without an hour of customization. With the skill, it identifies four critical gaps the prompter didn't think to fill (client situation, decision-maker, differentiators, engagement model) and asks for specific artifacts: discovery call notes, past proposals, your coaching methodology doc. If you provide even one of these, the enrichment grounds the entire output in real data instead of placeholders.

**Aggregate: 87.5% pass rate with the skill versus 25% without.** On every eval where context was missing — which is three out of four real-world prompts — the skill caught what the user didn't think to provide.

The 67% figure comes from iteration 2, where the gap was even starker on the original three evals: 100% vs. 33%. The pattern holds across iterations: the skill captures roughly two-thirds more of the potential answer quality by surfacing context the user didn't think to include.

## Where This Holds Real Value for You

The gap between "what you know" and "what your prompt says" shows up everywhere. But some use cases bleed more value than others.

### Client Strategy and Proposals

When you prompt AI to help structure a client engagement, the prompt reflects your understanding of the situation. But your understanding has dimensions you didn't think to state — stakeholder dynamics you haven't mapped, competitive pressures the client mentioned in passing, regulatory constraints that apply but weren't top of mind.

The skill catches these. But more importantly, it asks whether you have the data: "Do you have an intake form, discovery call notes, or a CRM record? A past proposal for a similar engagement?"

If you hand it your discovery call notes, the proposal addresses concerns the client hasn't voiced yet — because the notes contained signals your prompt didn't. That's the difference between winning the work and being "one of the options."

### Course and Content Architecture

You ask AI to help outline a course module. Your prompt includes the topic and learning objectives. What it doesn't include — because you didn't think to state it: where this module falls in the learner's emotional arc, what misconceptions students carry into this topic, what the prerequisite knowledge *actually* is versus what you assume.

The skill asks: "Do you have the course syllabus so I can see sequencing? Any student feedback from previous cohorts? Your own framework or methodology doc?"

If you share even the student feedback, the outline shifts from "generic pricing module that any course creator could use" to "a module that addresses the exact misconceptions your students have reported." That specificity is what separates content people finish from content people bookmark and forget.

### Pricing and Positioning Decisions

You ask "How should I price my new group program?" and get back generic advice about value-based pricing. The skill catches what you didn't think to provide: your market's price anchors, your existing offer ladder, cannibalization risk, competitive positioning.

But instead of guessing at these, it asks: "Do you have a pricing page, sales deck, or competitor list I could reference?"

If you hand it your pricing page and a competitor analysis, the output shifts from "charge what it's worth" to "here's a price architecture that accounts for your specific ladder, avoids cannibalizing your 1:1 offer, and positions above [Competitor X] without triggering enterprise-only expectations." Strategy, not advice.

### Research and Analysis

You ask AI to analyze a market trend. The baseline answer synthesizes published consensus. The enriched version forces the model to consider what's missing: whose data isn't represented, what incentives bias the research, what the second-order effects look like for businesses structured like yours.

And when the skill asks "Do you have prior reports or internal data on this?" — and you hand it last quarter's analysis — the output builds on your existing thinking instead of starting from zero.

This is the difference between information and insight. One is free. The other is what your clients pay you for.

## The Deeper Lesson: You Already Have What Your Prompts Are Missing

The paper's finding — that prompt architecture matters more than prompt content — maps onto a truth knowledge entrepreneurs already know from their own client work:

*The expert's curse is not knowing what you know.*

Your clients come to you because they don't realize what context they're sitting on. They ask the wrong question, or ask the right question without the framing that would change everything. Your job is to surface the context they didn't think to share.

You do the exact same thing to AI. Every day. On every prompt. The context that would unlock the other 67% is sitting in your head, in your files, in your experience — and none of it makes it into the text box. Not because you're bad at prompting. Because you didn't think to provide it.

The prompt enrichment skill doesn't make AI smarter. It surfaces the context you didn't know you were withholding. It identifies what's missing, asks whether you already have it in a document somewhere — and more often than not, you do.

That's where the 67% lives. Not in some advanced technique you haven't learned. In the context you already have but didn't think to give. In the documents you didn't think to attach. In the constraints you know so well you forgot they were worth stating.

The skill just asks the right questions.

---

*Built from: "Prompt Architecture Determines Reasoning Quality: A Variable Isolation Study on the Car Wash Problem" (Jo, 2026, arXiv:2602.21814). Skill development and testing conducted using Claude Opus with the skill-creator evaluation framework. Three iterations: v1 (structured scaffold), v2 (prompt enrichment), v3 (collaborative source check). The prompt enrichment skill is available as a Claude skill for use in Cowork and Claude Code in the “AI Mastermind for Leaders” member’s GitHub repository.*