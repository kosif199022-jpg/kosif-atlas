# I Built an AI Skill That Finds What Makes You Irreplaceable. Here's How It Works.

Something I've been thinking about for months finally clicked into a working tool last week, and I want to walk through both the thinking and the mechanics — because the problem it solves is one I'm seeing everywhere.

The problem: knowledge entrepreneurs — consultants, coaches, advisors, boutique service providers — are watching AI compress the visible layer of their expertise into something fast and cheap. They know they need to differentiate. But every differentiation exercise they try produces the same polished, generic output: "I provide personalized service." "I really understand my clients." Table stakes wearing a moat costume.

The tool I built is a Claude skill called **The Irreplaceable Edge**. It's a prompt architecture that runs an adaptive conversation to find the specific thing about how someone works that AI structurally cannot replicate — then validates it against the market and designs a business model around it.

This article is a full breakdown: the problem it solves, how I designed it, what happens under the hood, and what it produces.

---

## The Problem: Your Best Asset Is Invisible to You

I keep running into the same paradox. The knowledge entrepreneurs who have the most to offer are the ones least able to articulate what makes them different. Not because they lack self-awareness — because the thing that makes them irreplaceable doesn't feel special to them. They experience it as "just doing the job well."

Michael Polanyi named this in 1966: we know more than we can tell. The more skilled you become, the less you can explain what you're doing. Your knowledge compiles into automatic processes that fire without conscious thought.

An executive search consultant doesn't just find candidates. He sits across from a CEO and *hears* — underneath the stated job requirements — that the reason the last three hires failed was organizational, not talent-related. A management consultant reads the political topology of a leadership team before a single slide is presented. These judgment patterns are invisible, undocumented, and worth more than anything a sourcing algorithm can produce.

But ask these people "what's your competitive advantage?" and you get their marketing copy. The real edge is buried under abstractions.

---

## Why I Couldn't Stop at Strengths

The first version of the skill only excavated what people are great at. Find the edge, name it, build around it.

Too clean. In practice, I kept hitting three failure modes:

**Unacknowledged weakness.** Someone with a genuinely irreplaceable diagnostic edge who spends 60% of their week on execution work they dread. The edge was real, but the business model was diluting it.

**Unvalidated market demand.** A beautiful, AI-proof capability that the market didn't care enough to pay a premium for. The edge was real. The commercial viability wasn't.

**Inherited business model.** Hourly billing because everyone in the industry bills hourly. A model designed for generic service delivery trying to contain a specific, irreplaceable kind of value.

So I rebuilt the skill around three dimensions: find the edge, map the vulnerabilities, validate the market, and design a model that fits. Miss any one of the three and you have an insight, not a strategy.

---

## How the Skill Works: The Architecture

The skill isn't a questionnaire. It's a conversation engine with a repertoire of moves and a live tracking system that determines what to ask next.

### The Signal Map

After every response from the user, the skill updates an internal model:

- **Emerging themes** — what patterns keep appearing
- **Convergence points** — where multiple stories point to the same thing
- **Divergence points** — where answers contradict or surprise
- **Tension threads** — unresolved contradictions worth pulling
- **Energy markers** — what the person got animated about versus flat
- **Absent signals** — what was expected but didn't show up
- **Vulnerability map** — weaknesses surfaced: what they avoid, lose at, resent doing
- **Market signals** — evidence of what buyers actually pay premiums for
- **Model patterns** — how they currently charge, deliver, and structure
- **Current hypothesis** — best guess at the edge, evolving
- **Confidence level** — low, emerging, converging, or crystallizing

This map is the compass. It determines every next move. The skill isn't following a script — it's following the signal.

### The Ten Moves

The skill has ten categories of conversational move, used in whatever order the signal map demands.

**1. Story Extraction.** Pull specific narratives, not abstractions. "Tell me about a time you saved a client from a disaster they didn't see coming." Never accept a generalization when you can get a specific instance. After each story, go deeper: "What specifically made you see that? What would a less experienced version of you have missed?"

**2. Pattern Surfacing.** Name what's emerging before the person does. "I'm noticing something across these stories. In each one, the real value wasn't X — it was Y. Does that resonate?" When divergence appears, name that too — contradictions are often the most important signal.

**3. The Challenge.** Pressure-test the emerging edge. "If this is your real value, why couldn't an AI approximate it within two years?" "If you got hit by a bus, could someone learn this from your case files?" Uses web search to bring real competitive intelligence into the conversation.

**4. The Inversion.** Find value by exploring its absence. "Tell me about an engagement that went badly. What was missing?" "If a client used the AI-first competitor instead of you, what would they not know they're missing until it's too late?"

**5. The Time Test.** Distinguish appreciating assets from depreciating ones. "Is this meaningfully better now than five years ago? How specifically?" "Will this be more or less valuable as AI improves?"

**6. Latent Space Exploration.** Go beyond what the person has considered. Web search for parallel industries, academic research on the relevant type of expertise, business models in adjacent fields. Connect findings to the conversation.

**7. Crystallization.** When signal converges, name the edge with precision. Not rushed — only when genuine confidence emerges.

**8. Weakness Excavation.** "What part of your client-facing work do you dread?" "Tell me about the last client you lost — and be honest about whether it's a pattern." "If I watched you work for a month, what would I notice you avoiding?" Connects weaknesses to the emerging edge: what to shed, outsource, or fix.

**9. Market Validation.** Tests whether anyone actually pays a premium for the proposed edge. Uses web search for competitor positioning, buyer frustration patterns, and pricing precedents. "Who has already paid you a premium without flinching? What was true about their situation?"

**10. Business Model Exploration.** "How do you charge now? Where does your edge show up in that structure — and where is it invisible?" "What if the engagement was restructured so the edge was the product?" Explores retainer versus project, diagnostic-first versus embedded, value-based versus hourly.

---

## The Pacing Logic

A few design decisions that make the conversation work:

**One question at a time.** Never stack questions. Give the person space to think.

**Stay in story mode longer than feels comfortable.** The instinct is to move to strategy after two stories. The fourth and fifth stories are where the non-obvious patterns emerge.

**Follow energy.** If the person lights up — lean in. If they go flat — note the absence and move on. The energy pattern is signal.

**Don't resolve tension prematurely.** If two stories contradict, hold both. The contradiction often *is* the edge — the ability to read context and deploy different judgment patterns.

**Name uncertainty.** "I'm tracking something but I can't name it yet. One more story about this thread?"

---

## The Design Decision That Changed Everything: Live Search as Context Engineering

This is the part I think is genuinely new, and I want to spend some time on it because I haven't seen anyone else do it this way.

Most AI-powered coaching or strategy tools are closed-loop. The user brings information to the conversation, the AI processes it, and the output is some recombination of what the user already knew. It's introspective by design. The AI is a mirror — sometimes a clever mirror, but still a mirror.

The Irreplaceable Edge skill is different. It actively searches the web *mid-conversation* and weaves what it finds into the dialogue in real time. This isn't a bolt-on feature. It's a structural design choice that changes the quality of the output in ways I didn't fully anticipate when I built it.

Here's what I mean concretely.

When someone describes their edge — say, a boutique executive search consultant who reads organizational dynamics that job descriptions don't capture — the skill doesn't just reflect that back with encouragement. It searches for how AI-first recruitment platforms describe their offerings *right now.* It pulls in what those platforms claim to do, where their marketing language reveals structural gaps, and what buyers in that space are saying about their experience with those platforms. Then it brings that intelligence directly into the next question: "I just looked at how [competitor] positions their service. They claim to do X. But based on what you described in your last story, here's the gap they can't close. Does that match what you're seeing in the market?"

That's not introspection anymore. That's live competitive intelligence fused with self-discovery.

The skill uses web search at three critical points, each for a different strategic purpose:

**During the Challenge (Move 3)**, search pressure-tests the emerging edge against reality. If someone claims their edge is relationship-based trust, the skill searches for the latest AI capabilities in relationship management and personalization. Not to be discouraging — to be rigorous. If the edge survives contact with what AI can actually do today, it's real. If it doesn't, better to find out in the conversation than in a dry pipeline.

**During Latent Space Exploration (Move 6)**, search expands the solution space beyond what the person has considered. It looks for parallel industries where the same boutique-versus-AI-at-scale dynamic has already played out. How did the boutique players who survived do it? What business models emerged? What academic research exists on the specific type of expertise this person exercises? The person brings their stories. The skill brings the world's context.

**During Market Validation (Move 9)**, search grounds the emerging edge in commercial reality. It looks for where premium pricing already exists in this market, what buyers complain about with current providers (including AI-first ones), and what competitor weaknesses look like from the buyer's perspective. This is the move that turns a self-discovery exercise into a market strategy.

What makes this work isn't the searching itself — anyone can Google their competitors. It's the *timing* and *integration.* The search happens after the person has told their stories, after patterns have emerged, after a hypothesis is forming. The intelligence lands in a context where it means something specific. "Buyers in your space are frustrated about X" hits differently when X maps directly to the judgment pattern the person just described in their third story.

I've started thinking of this as **context engineering** — not just managing what's in the AI's context window, but actively enriching it with external intelligence at precisely the moments where that intelligence changes the quality of the conversation. The skill doesn't search randomly or comprehensively. It searches *strategically*, based on what the signal map says is needed next.

The result is a conversation that feels like talking to a strategist who did their homework on your market before the meeting — except the homework is happening live, shaped by what you're revealing about yourself in real time. I haven't seen another AI skill that does this, and I think it's the single design decision that separates this from a sophisticated questionnaire.

---

## The Other Bet: No Process

There's a second design decision that I think is just as important as the live search, and it's one that goes against almost everything in the AI prompt engineering playbook.

The skill has no process.

No phases. No steps. No "first we do X, then we do Y." No progress bar. No structured sequence the user can see coming three questions ahead.

This was deliberate, and it was hard to commit to — because every instinct in skill design says you should give the LLM a clear sequence. Step 1, Step 2, Step 3. It makes the output predictable. It makes testing easier. It makes the conversation feel organized and professional.

It also produces formulaic answers. And formulaic answers are exactly the problem this skill exists to solve.

Here's what I mean. If a knowledge entrepreneur can predict the next question — if they can see the pattern of the interview unfolding — they start optimizing their answers for the structure rather than for honesty. It's the same thing that happens in every structured strategy workshop: people figure out the framework in the first ten minutes and then start giving framework-shaped answers. The output looks clean. It also looks exactly like everyone else's output, because the structure is doing the thinking, not the person.

The Irreplaceable Edge skill works differently. It has a *repertoire* of moves — ten of them — but no prescribed order. The interviewer (Claude) selects the next move based on a live signal map that updates after every response. If three stories converge on the same pattern, the skill might jump to a challenge. If a weakness surfaces unexpectedly in the middle of a strength story, the skill might pivot to excavate it. If the person's energy drops, the skill notes the absence and changes direction.

The conversation follows *signal*, not script.

I think of it as the difference between a structured interview and a great dinner conversation with someone who happens to be brilliant at strategy. In a structured interview, you know what's coming. You prepare. You perform. In a conversation with someone genuinely curious, you find yourself saying things you've never articulated before — because the next question isn't the next item on a list, it's the thing that needed to be asked based on what you just revealed.

That's the quality I'm trying to produce. The moment where someone says something and then pauses, surprised by their own answer. "I've never thought about it that way before." That moment is where the real edge lives. And it almost never happens inside a structured framework, because structured frameworks signal to the brain that this is a performance, not an exploration.

The practical mechanics: the signal map tracks eleven dimensions (themes, convergence, divergence, tension, energy, absent signals, vulnerabilities, market signals, model patterns, hypothesis, confidence). After every response, the skill reflects — in its internal thinking — on how this answer connects to or contradicts what came before. It names what surprised it. It names what's missing. *Then* it chooses its next move.

Sometimes the skill will stay in story extraction for five or six turns straight, because the stories keep revealing new facets. Sometimes it'll jump from a strength story directly into a weakness question, because the person's energy shift signaled something they're avoiding. Sometimes it'll pause the entire conversation to run a web search because something the person said triggered a hypothesis about their competitive landscape that needs immediate testing.

The user never sees the architecture. They just experience a conversation that feels responsive, surprisingly perceptive, and unlike any strategy exercise they've done before.

There's a risk in this approach: without structure, some sessions could wander. That's why the convergence criteria exist as a quality gate — the skill won't synthesize until it has evidence across all three dimensions (edge, market, model) and the confidence level has reached "crystallizing." The lack of process in the *middle* of the conversation is offset by clear standards for what the *end* must look like. You can dance freely on the way there, but the destination is rigorous.

I've started calling this principle "structured destination, unstructured path." The skill knows exactly what it needs to produce. It has no opinion about how to get there. And that freedom is what produces the quality of insight that a step-by-step process never reaches — because the most important question in any conversation is the one you couldn't have predicted needing to ask until the person said the thing that made it necessary.

---

## Where These Two Bets Meet

I've described two design decisions separately — live search as context engineering, and the deliberate absence of a structured process. But the interesting thing is what happens when they work together, because the combination produces something neither could produce alone.

Here's what I mean.

In a structured process, search would happen at a predetermined point. Step 4: Research the competitive landscape. Step 7: Validate against market data. The search is scheduled, not responsive. It happens because the framework says it's time, not because the conversation surfaced something that needs immediate external grounding.

In the Irreplaceable Edge skill, search is triggered by the signal map — by something the person *just said* that changes the hypothesis in a way that demands real-world validation before the next question can be chosen well.

That distinction matters more than it sounds like it should.

When an executive search consultant tells me his real value is reading organizational dysfunction underneath a job description, and I can feel the hypothesis converging — that's the exact moment to search for how AI-first recruitment platforms position their organizational assessment capabilities. Not in ten minutes when the framework says it's research time. Right now. Because what I find in that search determines whether my next move is to challenge the edge ("they claim to do this too — what specifically can you do that they can't?") or to validate it ("they can't touch this — here's why — now let's find out who pays a premium for it").

The unstructured conversation creates the *need* for search at precisely the right moment. The search results reshape the *direction* of the unstructured conversation in real time. They feed each other.

I've started thinking of this as a feedback loop between internal signal and external intelligence. The conversation generates hypotheses. The search tests them against reality. The test results redirect the conversation. The redirected conversation generates sharper hypotheses. And so on, with each cycle producing a higher-fidelity picture of where the person's irreplaceable value actually sits in the market.

A structured process can't do this because the timing is wrong — the search happens on schedule, not on signal. A closed-loop conversation can't do this because there's no external intelligence entering the system — it's just recombining what the person already knew.

The combination — unstructured path plus live search — creates something I haven't seen in other AI skill designs: a conversation that is simultaneously deeply personal (driven by the person's stories and energy patterns) and empirically grounded (validated against real competitive intelligence, market data, and parallel industry patterns in real time).

Let me give a concrete example of what this looks like in practice.

A management consultant is telling me about a client engagement where she walked into a strategy session and immediately read that the initiative would fail — not because the strategy was wrong, but because the political dynamics of the leadership team made execution impossible. Great story. The signal map is converging on "political topology reading" as a potential edge.

In a structured process, I'd note that and move to the next question in the sequence. In this skill, I pause and search: "AI-powered organizational network analysis leadership dynamics." I find three platforms that claim to map organizational influence patterns using communication data and reporting structures. I bring that back into the conversation: "I just found three tools that claim to do organizational network analysis. They map influence patterns from email and Slack data. How is what you do different from what they produce?"

Her answer — which I couldn't have predicted — is that those tools map the *formal* network, the one that shows up in communication data. What she reads is the *shadow* network: who actually trusts whom, who's quietly building alliances, who's about to leave, who has veto power that doesn't appear on any org chart. None of that is in the data. It's in the room.

That distinction — formal network versus shadow network — becomes the sharpest articulation of her edge. And it only emerged because the search happened at the exact moment the conversation made it relevant, and the search results gave her something specific to push against.

That's the symbiosis. The unstructured conversation finds the right moment. The search brings the right challenge. The challenge produces the right articulation. None of those three things works without the other two.

If I had to name the design principle underneath all of this, it would be: **let the conversation breathe, but don't let it float.** The absence of structure gives the conversation room to go where it needs to go — to follow energy, to hold contradictions, to let the person surprise themselves. The live search keeps it grounded in reality so it never drifts into pure introspection. The conversation breathes. The search provides gravity.

I think this is a genuinely new pattern in AI skill design, and I suspect it has applications well beyond competitive strategy. Any domain where someone needs to discover something about themselves that they can't access through direct questioning — and where that discovery needs to be validated against external reality — could benefit from this combination of unstructured adaptive dialogue and strategically timed context injection.

But that's a different article. For now, the point is this: the two design bets aren't separate features. They're two halves of the same mechanism. And the mechanism only works because neither half is compromised. Full freedom in the conversation path. Full access to external intelligence when the signal demands it. The intersection is where the quality lives.

---

## Convergence: When to Synthesize

The skill won't crystallize prematurely. It requires signals across all three dimensions before producing a synthesis:

- Three or more stories point to the same mechanism
- The challenge didn't crack it
- The time test passes — the edge is demonstrably compounding
- The market intersection is clear — who pays, when they need it, why AI fails
- Vulnerabilities are mapped
- A business model shape is emerging

If the signal isn't there, it says so: "I don't think we've found it yet. I'm seeing X, but it doesn't pass the irreplaceable test because Y. Let me try a different angle."

---

## The Deliverable: What Comes Out

When convergence is reached, the skill produces a structured synthesis:

**Edge Statement.** One to three sentences naming the irreplaceable edge in the person's own language. Should feel like a mirror, not a prescription.

**Evidence Map.** Connects the edge to specific stories from the conversation. The person sees their own experience reflected with new coherence.

**Vulnerability Map.** Three categories: what to shed entirely, what to hand to AI or outsource, and delivery risks that sit around the edge. If the edge tells you what to build around, this tells you what to build *away from.*

**Market Intersection.** The situational buyer, the trigger event that makes the edge worth a premium, and the point where AI-first alternatives fail. Grounded in both conversation evidence and web search findings.

**Structural Argument.** Why the edge is specifically AI-proof — the structural properties that resist commoditization.

**Compound Curve.** How the edge gets more valuable over time. What accumulates. What year twenty looks like versus year five.

**Business Model Blueprint.** Revenue model (and why it fits the edge). Engagement architecture. Time allocation. What to stop doing. Client narrative. Where to deploy AI as a force multiplier.

**One-Line Test.** A single sentence for prospective clients. The right client leans forward. The wrong client self-selects out.

---

## The Failure Modes I Designed Against

Every design decision in the skill exists because I watched something go wrong. Here are the ones that mattered most:

**Strength-only bias.** The early version never asked about weaknesses. An edge sitting on top of an unacknowledged vulnerability is a strategy with a trap door.

**Edge without a market.** The most seductive failure. The insight feels true and significant — but truth and commercial viability are different things.

**Market without an edge.** The inverse: identifying a lucrative need and stretching capabilities to fit it. If the position requires you to be something you're not, it collapses under delivery.

**Premature crystallization.** Naming the edge before earning it. If the person says "yeah, I guess" instead of "yes, that's exactly it" — keep digging.

**Comfortable synthesis.** If the named edge is something already on their website, it's not the real edge. The real one almost always surprises the person.

**Flattery masquerading as insight.** "You're just really good at what you do" is a compliment, not a strategy.

**Generic business model.** "Charge more and position as premium" could apply to anyone. The model has to be a consequence of this specific edge.

---

## What I've Learned From Watching It Run

A few observations from sessions so far:

The weakness excavation is where the most practical value lives. People know their strengths intuitively, even if they can't articulate them. They're less honest with themselves about what they should stop doing. I've watched people realize the thing they should drop was consuming more than half their week.

The energy contrast between edge-zone stories and commodity-layer stories is the most reliable diagnostic signal. When someone lights up telling a story, that's their edge. When they go flat, that's what needs to go.

Market validation through web search produces genuinely useful intelligence. Competitor weaknesses, buyer frustration patterns, pricing precedents from parallel industries — it brings real data into what would otherwise be a purely introspective exercise.

The business model conversation is the one people are most hungry for. They know their current model doesn't fit. They just haven't had a structured way to design a better one around their actual strengths.

Second sessions are significantly better than first sessions. Time between sessions lets the pattern recognition percolate. People come back having noticed moments in their daily work that map to the emerging edge.

---

## How to Get the Most Out of It

**Before the session:** Think of five engagements where your involvement produced an outcome nobody else could have. Not your biggest wins — your most *you* wins. Also think about the last client you lost and the work you dread.

**During the session:** Give real stories, not strategy. Stay in the stories longer than feels comfortable. Let the skill challenge you. Be honest about weaknesses. Engage with the market intelligence it surfaces.

**After the session:** Run it again in two to three weeks. Notice moments in your daily work that map to the emerging edge. Those real-time observations become the most powerful evidence.

---

## The Bigger Pattern

I built this tool for a specific client — a boutique executive search consultant watching AI-first platforms compress his sourcing layer. But the more I work with it, the more I see it as a response to a much broader pattern.

AI is compressing everything that can be compressed. Everything that survives the compression is, by definition, irreplaceable. The question for every knowledge entrepreneur is whether they'll recognize that asset, name it, and build around it — or keep competing on the commodity layer until the market decides for them.

The skill is one way to find the answer. But the underlying principle is simple: your most valuable asset is the one you can't see, because you experience it as just doing the job well.

Find it. Name it. Build around it.

That's the work that matters now.