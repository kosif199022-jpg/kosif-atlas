# I Built a 6-Agent AI Team That Writes PRDs. Here's Every Design Decision.

*A deep-dive into TrelloAgents — the architecture, the thinking, and what you can steal for your own workflows.*

---

I kept running into the same wall.

Every time I wanted to move an idea from "thing I'm excited about" to "thing I can actually build or hand to someone," I'd hit the spec-writing phase and slow to a crawl. Not because the thinking was hard — the thinking was mostly done. It was the *documentation* of the thinking. The translation of a fuzzy idea into a structured, coherent, technically rigorous product requirements document. That part was eating hours, sometimes days.

I knew AI could help. But "help" usually meant: open a chat, describe the idea, get a draft, spend the next 45 minutes editing. Better than nothing. Still slow. Still me-dependent.

What I wanted was a system that could take a raw idea and produce a production-ready PRD — autonomously, with built-in quality review — while I was doing something else.

So I built one. And in building it, I accidentally designed something that taught me more about multi-agent AI architecture than any tutorial I've read.

This is that story.

---

## The First Question: Where Does State Live?

Before I wrote a single line of code, I had to answer a question that turned out to be more important than any technical choice: **where does the system store what it knows?**

Most people building agent pipelines reach for a database. A table somewhere. A JSON file. A vector store. All reasonable. But they introduce a problem: the state is invisible. You can't look at a database row and understand, at a glance, where your idea is in the process, what's been done to it, what the output looks like.

I wanted the system to be *legible*. I wanted to be able to open a single view and see the entire pipeline in motion — not read logs, not run queries.

That's when I looked at my Trello board and had the realization that unlocked everything:

**A Kanban board is already a state machine.**

Each column is a state. Moving a card is a state transition. The card *is* the work item, carrying its history with it. Trello wasn't designed for this, but it's exactly right for it. The board becomes the database, the dashboard, and the control panel simultaneously.

This is Concept #1: **use the tool that's already legible.** Don't build infrastructure to track what a visual tool can show you for free.

So I mapped the pipeline to the board. Seven columns:

```
Intake → Decompose → Spec Write → Spec Review → Assemble → Final Review → Done
```

Every idea enters at Intake as a card. The card moves right as agents process it. When it reaches Done, the PRD is attached. The board tells the whole story without opening a single log.

---

## The Second Question: Who Does the Work?

With the pipeline mapped to the board, I had to decide who — or what — moves the work through it.

My first instinct was to build a Python orchestrator. A script that polls the board, detects cards that need processing, spins up API calls, and manages the whole thing. I actually built that version. It worked, technically. But it had a fundamental problem: **the agents running inside it had no real intelligence.** They were just API calls. They couldn't make judgment calls, access context, or use tools. They were dumb executors wrapped in a smart-looking pipeline.

I threw it out and started over with a different mental model.

The insight: **Claude Code is already an orchestrator.** It can read files, run commands, spawn sub-agents, track state, make decisions, and loop until a condition is met. Instead of building orchestration infrastructure around dumb agents, I could make Claude Code the coordinator — and give each pipeline stage to a fully intelligent Claude sub-agent.

This is Concept #2: **don't build what already exists.** The orchestration layer was right there. I just needed to point it at the pipeline.

The architecture shifted to this:

- **Claude Code** = the project manager. Reads the board, decides what needs to happen, delegates to agents, attaches outputs, moves cards.
- **Agent sub-agents** = the specialists. Each one gets a focused task, does it with full intelligence, returns the result.

Claude Code doesn't do the product thinking. The agents don't do the coordination. Each layer does exactly one thing.

This separation matters more than it looks. It means I can change how an agent thinks (edit a prompt) without touching the orchestration. I can change how the pipeline flows (edit Claude Code's instructions) without touching any agent. The layers are independent.

---

## Building a Team, Not a Tool

Once I had the orchestrator-agent separation clear, the next decision was how to structure the agents themselves.

The temptation is always to build one general-purpose agent. One smart thing that can intake ideas, decompose them, write specs, review specs, and assemble the PRD. Simpler to manage. Fewer moving parts.

The problem is that general-purpose prompts produce general-purpose output. When you ask one agent to do six different jobs, each job gets a fraction of the attention it deserves. More importantly, you lose the quality signal that comes from specialization — the Spec Reviewer is only good at its job if it's *only* a Spec Reviewer, not also the Spec Writer that just wrote the thing it's reviewing.

So I built a team. Six agents, each with a single responsibility:

| Agent | Job |
|---|---|
| **Intake Analyst** | Structures a raw idea into a problem statement, audience definition, value prop, and success criteria |
| **Feature Decomposer** | Breaks the idea into 3–7 independent, specifiable features |
| **Spec Writer** | Writes a detailed feature spec for one feature — user stories, acceptance criteria, technical approach, data models |
| **Spec Reviewer** | Reviews a spec for completeness, clarity, and alignment with the original idea |
| **PRD Assembler** | Takes all approved specs and builds a unified, coherent PRD |
| **Final Reviewer** | Reads the finished PRD against the original idea and either approves or requests revisions |

Each agent knows its role deeply. The Spec Writer knows what a great spec looks like. The Reviewer knows what to look for. Neither knows anything about the pipeline they're part of.

This is Concept #3: **division of cognitive labor.** The same reason you don't ask your engineer to review their own code, you don't ask the Spec Writer to review its own spec. Specialization produces quality. And when quality fails, you know exactly which agent to fix.

---

## The Shape of the Pipeline: 1 → N → 1

Here's something I didn't anticipate designing — I just noticed it once it was working.

The pipeline has a distinct shape: one idea fans out into many parallel workstreams, then converges back into one deliverable.

```
One idea
    ↓
One Idea Brief
    ↓
N Feature Cards (created by Decomposer)
    ↓ ↓ ↓ ↓ ↓  (each processed in parallel)
N Feature Specs
    ↓ ↓ ↓ ↓ ↓  (each reviewed in parallel)
N Approved Specs
    ↓
One Unified PRD
```

This `1 → N → 1` shape turns out to be a fundamental pattern in agentic workflows. It appears any time you have a problem that can be decomposed into independently addressable subproblems. You fan out to work in parallel, then converge to synthesize.

The reason this matters: **parallelism is where you get the time savings.** Each Spec Writer runs simultaneously. Five features get written in the time it takes to write one. The pipeline processes them concurrently, and the Assembler waits until all N are ready before synthesizing.

But not everything can run in parallel. Some stages have dependencies that force sequential execution:

- **Intake** runs once, on one card. Sequential.
- **Decompose** runs once, on one card. Sequential.
- **Spec Write** runs once per feature card, with no dependencies between features. **Parallel.**
- **Spec Review** same — no feature depends on another being reviewed. **Parallel.**
- **Assemble** waits until *all* features are approved. Blocks until N is complete.
- **Final Review** runs once, on the assembled PRD. Sequential.

This is Concept #4: **know which work is parallelizable and which isn't.** The answer is always the same: work is parallelizable when there are no dependencies between the items. Features don't depend on each other. Reviews don't depend on each other. But assembly depends on everything coming in.

Getting this right cuts total processing time from 45+ minutes to under 15.

---

## How the Agents Communicate: Memory Built Into the Cards

This is the piece I'm most proud of, and the piece that required the most creative constraint.

Agents can't talk to each other directly. There's no real-time message bus. The Spec Writer can't ask the Spec Reviewer a question. The PRD Assembler can't ping the Intake Analyst to clarify something. Each agent runs in its own context, finishes its job, and exits.

So how does information flow from one stage to the next?

**Through the card itself.**

I realized that a Trello card has exactly the right structure to be a complete unit of agent memory and communication, if you use each field for the right purpose:

**Attachments = Working Memory**

Each card carries one file attachment — the artifact produced by the most recent stage. When the Intake Analyst finishes, it attaches an Idea Brief. When the Spec Writer finishes, it replaces that with a Feature Spec. One attachment, always current, always the thing the next agent needs to read.

The "replace, don't accumulate" rule is deliberate. You never have to wonder which attachment is the latest version. There's only one.

**Comments = Agent-to-Agent Communication**

When the Spec Reviewer makes a decision, it posts a comment: what it found, what it approved, what it wants revised. When the Spec Writer revises in response, it reads those comments for context. The review process is asynchronous, mediated by the card, fully auditable.

Comments are also the human's interface. You can add a comment with your own feedback, and the Spec Writer will incorporate it on the next pass.

**Description + Hidden Metadata = Identity and Lineage**

Every card carries a hidden block in its description:

```
<!-- workflow:{"idea_id":"idea-1234","iteration":2,"type":"feature"} -->
```

Trello doesn't render HTML comments, so the card looks clean to a human. But to the code, this block is how every feature card knows which idea it belongs to, how many revision cycles it's been through, and what type of work item it is. Without this, you can't link features back to their parent idea. The entire 1→N→1 pattern depends on it.

**List Position = Current State**

Which column the card is in *is* the state. Intake column = needs intake processing. Spec Write column = needs a spec written. Done column = complete. There's no status field to check. The position is the status.

**Labels = Flags**

Blue "In Progress" = an agent is actively working on this. Green "Approved" = ready to move forward. Purple "Needs Revision" = bounced back with feedback. These are visible at a glance on the board, without opening any card.

This is Concept #5: **repurpose what's already there.** Trello wasn't built to be agent memory. But its structure maps perfectly to what agents need: a persistent artifact (attachment), a communication channel (comments), an identity system (metadata), a state indicator (list position), and status flags (labels). No external database. No message broker. No state store. It's all on the card.

The deeper architectural insight: **agents don't need to communicate directly.** They need shared, persistent memory. The card is that memory. Each agent reads the current state, does its work, writes the result back, and exits. The next agent picks up where the last one left off. It's asynchronous by nature, which means it's also resilient — if anything fails, the state is preserved on the card and you can resume from exactly where you stopped.

---

## The Quality Loop: How the System Gets Better at Its Own Work

A pipeline that just moves forward isn't interesting. What makes this system useful is that it can go *backwards*.

When the Spec Reviewer reads a spec and finds it lacking — unclear requirements, missing edge cases, technical gaps — it doesn't just fail silently. It posts a comment with specific feedback, changes the label to "Needs Revision," and moves the card back to Spec Write. The Spec Writer reads the feedback, revises the spec, and moves it back to Spec Review. This loop runs until the Reviewer approves.

This is the review-bounce loop, and it's where the quality in the output actually comes from. Without it, you get first-draft quality. With it, you get reviewed, iterated, refined output.

But autonomous loops have a failure mode: they can run forever. A sufficiently picky Reviewer will keep bouncing specs indefinitely. So there's a guardrail: the `iteration` counter in the card's metadata increments on every bounce. Hit the limit, and the card gets flagged `Blocked` instead of bouncing again. A human decides what to do next.

This is Concept #6: **every autonomous loop needs a termination condition.** Not as an afterthought — as a first-class design requirement. If you can't define when the loop ends, you haven't finished designing the loop.

The combination of the quality loop and the termination condition produces something interesting: the system has a *natural quality floor.* A spec can't reach Assemble without surviving Spec Review. The PRD can't reach Done without surviving Final Review. Quality is structural, not aspirational.

---

## The Configuration Is the Prompt

Here's the design choice that I think has the most leverage for AIMM members:

**Every agent's behavior is defined entirely by a markdown file.**

Not code. Not configuration. A plain text file containing a system prompt. The Spec Writer's output format, the Reviewer's criteria, the Assembler's document structure — all of it lives in `agents/spec_writer.md`, `agents/spec_reviewer.md`, `agents/prd_assembler.md`. Edit the file, change the behavior. No deployments. No code changes.

This matters for two reasons.

First, it's accessible. Anyone who can write clearly can change how an agent behaves. You don't need to understand the Python, the API calls, or the orchestration logic. You open a markdown file and rewrite the instructions.

Second, it separates concerns cleanly. The *what* (what the agent is supposed to think and produce) is in the prompt. The *how* (how work flows, how state is managed, how outputs are stored) is in the orchestration. These can evolve independently. I've changed the Spec Writer's format three times without touching a line of infrastructure code.

This is Concept #7: **prompt-as-configuration.** When behavior is pure text, it's universally editable. This is what makes the system customizable without being complicated.

---

## This Isn't a PRD Machine. It's a Pattern.

Here's what took me a while to see: the system I built isn't specifically about product specs. It's a general-purpose pattern for any workflow that involves taking a raw input, decomposing it into parallel workstreams, iterating on each to quality, and assembling the results into a final deliverable.

The PRD use case is just the first instance of the pattern.

**Worked Example: Adapting to a Content Marketing Pipeline**

Imagine you're an AIMM member running a coaching business. You want to take a content topic and automatically produce a complete content package — blog post, email sequence, LinkedIn posts, lead magnet outline — instead of a PRD.

Here's exactly what you change:

| Agent File | Original Purpose | Your Version |
|---|---|---|
| `agents/intake_analyst.md` | Extracts product problem, audience, value prop | Extracts content goals, target audience, tone, platform mix |
| `agents/feature_decomposer.md` | Decomposes idea into 3–7 features | Decomposes topic into 3–6 content pieces |
| `agents/spec_writer.md` | Writes detailed feature spec | Drafts each content piece in full |
| `agents/spec_reviewer.md` | Reviews spec for completeness, feasibility | Reviews for voice consistency, CTA clarity, audience fit |
| `agents/prd_assembler.md` | Assembles specs into unified PRD | Assembles content calendar + full package |
| `agents/final_reviewer.md` | Final proofread and polish | Brand alignment and sign-off |

Six markdown files. Nothing else changes. The same Python code, the same Trello structure, the same Claude Code orchestration, the same artifact model, the same review-bounce loop, the same parallelism — all of it carries over.

Submit a topic:

```bash
python trello_ops.py submit "How busy entrepreneurs can build a personal brand without social media"
```

Ten minutes later: a complete content package attached to the original card in Done.

**Other applications of the same pattern:**

- **Sales proposal pipeline**: brief → section breakdown → copy for each section → review → final proposal
- **Course curriculum development**: learning objective → module breakdown → lesson outlines → review → full syllabus
- **Due diligence pipeline**: company overview → area breakdown (financials, market, team, tech) → deep dives → review → report
- **Legal document pipeline**: requirements → section decomposition → draft per section → review → assembled contract

The pattern is: one input, N parallel workstreams, convergent output, quality loop built in. Anywhere you have that shape of problem, this architecture fits.

This is Concept #8: **build the engine, not the application.** Once you understand the pattern, the specific content is a configuration choice. The pipeline is reusable. The agents are replaceable.

---

## What This Taught Me About AI Systems Design

Looking back at every decision in this build, there's a consistent thread.

The best choices weren't clever. They were simple things used correctly:

- A Kanban board used as a state machine instead of building a custom one
- A visual tool's native fields used as an agent memory structure instead of building a custom one
- Claude Code used as an orchestrator instead of building a custom one
- Markdown files used as behavior configuration instead of building a configuration system

The worst ideas I had in the early versions were all versions of: *build a custom thing to do a job a simpler tool can already do.* The subprocess-based orchestrator. The status database. The custom logging system. All thrown out.

The principle underneath this: **the complexity of a system should match the complexity of the problem.** PRD generation is conceptually complex — six distinct cognitive tasks, parallel execution, iterative quality loops, multi-card coordination. But the infrastructure doesn't need to be complex. The board handles state. The cards handle memory. Claude Code handles coordination. The prompts handle intelligence.

When those layers fit together correctly, the system does something genuinely surprising: six AI agents collaborate on meaningful intellectual work, produce professional-grade output, and the whole thing is visible in real time on a Kanban board you could explain to anyone in two minutes.

That's the goal. Not architectural sophistication. **Appropriate architecture.**

---

## How to Customize This for Your Work

If you've installed TrelloAgents and you're ready to adapt it:

**Step 1: Define your input and your output.**
What's the raw thing going in? What's the assembled deliverable coming out? Those define your Intake and Assemble agents.

**Step 2: Define the decomposition.**
What are the parallel workstreams? What are the independent units of work that can be processed simultaneously? Those become your feature cards.

**Step 3: Define quality.**
What does good look like for each unit of work? That's your Reviewer's criteria. Don't skip this — the quality loop is where the output goes from draft to production-ready.

**Step 4: Edit the six agent files.**
Each one gets a new role, new instructions, new output format. Keep the structure (produce an artifact, make it clear, handle the revision case) but rewrite the substance.

**Step 5: Submit something and watch it run.**
The orchestration, the board, the artifact model — none of that changes. You're just pointing the same engine at a new problem.

---

The system running in your dist folder right now was built from these principles. Every file, every design decision, every constraint traces back to one of the concepts above.

The best way to learn it is to run it, break it, and rebuild it for something you actually need.

Go build something.

— Lou

---

*TrelloAgents is part of the AIMM toolkit. Built April 2026.*
