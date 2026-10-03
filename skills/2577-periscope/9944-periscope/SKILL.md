---
name: periscope
description: >-
  Role-play a senior / staff / principal engineer looking at your company, then sweep the surfaces you
  grant it for opportunities across three lenses: tech (decisions forming, uncaught risk, missing
  conventions), product (problems unvalidated, outcomes uninstrumented), and org (knowledge siloed,
  friction repeating, decisions with no owner). Returns at most 5 ranked openings, each with the
  specific first move and a ready-to-approve draft. Built on the principle "promotions lag behavior:
  you operate at the next level first, the title follows." Surfaces and tools are declared by the user
  at onboarding, never assumed. Read-only by default; never posts without explicit per-message
  approval. Logs approved contributions to an evidence trail that feeds brag-doc. Use when the user
  says "periscope", "senior scan", "staff scan", "promo scan", "what needs my attention", "where
  should I weigh in", "where can I have the most impact", "any opportunities", "catch me up", or wants
  more scope, visibility, or to operate above their current level.
---

# periscope

Adopt the role, look at the company through it, and hand back a short ranked list of places where
operating at that level actually happens. A periscope sees over and beyond your current position
without changing it, which is the whole move: operate at the next level before the title arrives.

**Principle:** promotions lag behavior. You operate at the next level first, and the title follows.
This skill finds where that operating is available right now.

**Read-only:** sweeps and the main flow never post, comment, react, or approve. Posting happens only
after explicit user approval of one specific message (Step 5).

**Anti-performative filter (non-negotiable):** drop any opportunity scoring zero on Leverage *or*
Credibility, regardless of visibility. Shallow opinions dropped into ten visible threads read as
noise, not seniority, and actively damage a promotion case.

## The role drives the question

The configured `role.level` is not a threshold, it changes what you go looking for. Ask the question
for the level, not the level below it.

| Level | The question it asks |
|-------|----------------------|
| **Senior** | Is this decision right? Is the risk caught? Is this system going to hold? |
| **Staff** | *Should* this decision exist? Who else is blocked by it? What convention is missing that keeps making this recur? |
| **Principal** | Is this the right problem for the org to have? What structural constraint keeps producing this class of problem? |

`role.scope` bounds what counts as yours to weigh in on. `role.mandate` lists the behaviors the level
is expected to show, and the Stretch axis scores against it.

## Lenses

Run every lens the config enables. Each has its own signals and its own credibility rule, so they are
not interchangeable.

### Tech
- a decision still being formed (architecture, API contract, migration, data model, dependency)
- an approach carrying risk nobody has named
- a convention missing, so each team is inventing its own
- duplicated effort across teams solving one problem twice
- a system quietly degrading (flake rate, build time, error budget, cost curve)

### Product
- a feature with no stated user problem behind it
- an outcome with no metric, or a metric with no instrumentation to read it
- scope growing while the problem statement stays fixed
- a decision resting on stakeholder preference with no user evidence

**Delegate the framing.** `cagan-check` already owns the five risks (value / usability / feasibility /
viability / ethical), the feature-factory smells, and the outcome-metric questions. Pull its content
in for this lens rather than restating it here. Restating it is how the two drift.

### Org
- the same question asked more than twice (knowledge siloed, or a doc that does not exist)
- a decision circling with no owner
- a review or approval bottleneck one person is the queue for
- onboarding friction that hits every new person and gets re-solved individually
- a process step everyone quietly routes around, which means it is wrong

## Surfaces and tools

**Nothing is scanned until the user declares it.** No auto-detection sweep, no "I found these MCPs so
I read them." Onboarding proposes, the user confirms, only then does anything get read.

Each surface declares a `kind`. Sweep behavior derives from the kind, never from the vendor, so a new
tool is a config line rather than new instructions:

| kind | What it is | Why it matters |
|------|-----------|----------------|
| **chat** | Slack, Teams, Teamwork Chat, Discord | Fast threads, short decision windows, cheapest signal |
| **tracker** | Jira, Linear, GitHub Issues, Teamwork Projects | Where scope and approach get decided |
| **docs** | Notion, Confluence, Google Docs, Teamwork Spaces | RFCs and design docs in open review are the highest-leverage window |
| **code** | GitHub, GitLab, Bitbucket | Open PRs and review threads |
| **analytics** | Amplitude, PostHog, Metabase, a warehouse | Fuel for the product lens; usually the missing half |
| **support** | Zendesk, Intercom, a support inbox | Product and org signal that never reaches engineering |

`tools.allow` is the hard reach limit. A tool absent from the allowlist is never called, even when
connected and even when it would obviously help. If a surface's tool is unavailable at run time, skip
that surface and say so in the digest.

## Files

All under `~/.claude/state/periscope/` (deliberately **outside** the skill directory, so config and
evidence never get vendored when the skill is copied or published):

- `config.json` — onboarding output.
- `state.json` — `last_run` plus seen items, so a thread is not re-surfaced unless it escalated.
- `contributions.log.md` — evidence trail of approved and posted contributions, read by `brag-doc`.
- `voice.md` — drafting rules observed from the user's own writing; overrides the generic floor.

## First-run onboarding

If `config.json` is missing, collect once and persist. Ask in this order, one topic at a time:

```json
{
  "role": {
    "level": "Staff",
    "scope": "platform plus the two teams consuming it",
    "mandate": ["de-risk other teams' work", "set conventions", "unblock without taking over"]
  },
  "identity": { "handles": { "code": "your-handle", "chat": "your-handle" } },
  "domains": [
    { "name": "frontend architecture", "keywords": ["state management", "rerender", "bundle", "hydration"] },
    { "name": "serverless", "keywords": ["lambda", "cold start", "iam", "queue"] }
  ],
  "lenses": ["tech", "product", "org"],
  "surfaces": [
    { "name": "eng chat", "kind": "chat",      "tool": "mcp__slack__*",     "scope": ["#eng"],    "lenses": ["tech", "org"] },
    { "name": "issues",   "kind": "tracker",   "tool": "gh issue",          "scope": "org:acme" },
    { "name": "rfcs",     "kind": "docs",      "tool": "mcp__notion__*",    "scope": ["Engineering"] },
    { "name": "prs",      "kind": "code",      "tool": "gh",                "scope": "org:acme",  "lenses": ["tech"] },
    { "name": "usage",    "kind": "analytics", "tool": "mcp__amplitude__*", "lenses": ["product"] }
  ],
  "tools": { "allow": ["gh", "mcp__slack__*", "mcp__notion__*", "mcp__amplitude__*"] },
  "audience": ["manager", "tech leads", "staff engineers"]
}
```

- **role** first: it determines the question every later step asks.
- **domains** are areas of *demonstrable* standing (systems owned, failure modes known, conventions
  set), each with 2-4 search keywords. Tech credibility keys off these.
- **surfaces**: enumerate what is actually connected, propose a list, let the user cut it. Omitting
  `lenses` means all enabled lenses apply to that surface.
- **audience** (optional) is whose visibility matters for advancement. Scores 1 when unset.
- **voice**: offer to read a sample of the user's own recent messages and distill `voice.md`. Skip if
  declined.

## Workflow

### Step 1 — Load state and window
Read `state.json`. Default window is the last **48h** (cap 7 days) when there is no prior state. An
item already surfaced returns only if it **escalated**: a new decision point, a question that went
unanswered, or a reopened thread.

### Step 2 — Parallel sweep
One **read-only** sweep subagent per configured surface, all dispatched at once. Each is told its
`kind`, its scope, the enabled lenses for that surface, the `role.level` question, and the domain
keywords. It hunts only the signals for its lenses.

Sweeps return **raw findings only**: location, link, participants, a 2-4 sentence summary, which lens
and signal matched, and the specific gap the user could fill. No scoring in the sweep.

**Filter automated participants first, on every surface.** Review bots, CI, and deploy previews
dominate comment counts and none of it is discussion. Drop anything authored by a name containing
`bot`, `qodo`, `copilot`, `coderabbit`, `sonar`, `snyk`, `renovate`, `dependabot`, `vercel`,
`netlify`, or `github-actions`, and treat the remainder as the real thread. A 40-comment PR with 39
bot posts is a **quiet** PR, not a busy one, and reading the raw count backwards is how a converging
change gets mistaken for a live debate. Bot output is still evidence *about* the change (an unanswered
security warning is a finding), it is just never evidence of human deliberation.

Per-kind guidance:

- **chat** — read recent activity in scoped conversations, follow threads that are still moving, run
  2-3 keyword searches from the domain map. Ignore social chatter, resolved threads, FYIs, and
  threads already converging.
- **tracker** — the decision signal lives in **comments**, not in the item list and not in the
  activity feed. Activity feeds frequently return rows with no usable item type, so they cannot be
  filtered down to discussion; treat them as a change log, not a source. The reliable path is two
  steps: enumerate items in scope (recently updated first), then fetch comments per item. Cap the
  fan-out, take the most recently touched 15-30 items rather than every open task. Hunt unresolved
  threads, open scope or approach questions, and anything phrased as waiting on someone. Ignore pure
  status updates and completed items.
  **Read the whole thread, not the tail.** An unanswered question is rarely the last comment; it gets
  buried under later status chatter while never actually being answered. Scan every comment for
  questions and commitments, then check whether anything *after* it resolved that specific point. A
  thread whose latest message is "handed off to QA" can still contain a decision nobody closed.
  **Cross-surface shortcut:** when a code-surface PR body links a tracker item, harvest that ID
  directly instead of enumerating. It is the cheapest route to the discussion behind a change, and it
  is how the two surfaces corroborate each other: a tracker thread can confirm a code-surface finding
  (someone saying "this is just a theme setting" on the third client to hand-build the same feature)
  or kill it (the risk you were about to raise was already discussed and accepted). Prefer a finding
  two surfaces agree on. Comment author fields are often numeric user IDs; resolve them to names
  before the digest, or attribute by role instead.
- **docs** — enumerate pages with active comments or edits in scope. An open RFC review period is the
  highest-leverage find available. Ignore published-and-static pages.
- **code** — list open PRs updated in the window **excluding the user's own**. Hunt PRs touching the
  user's domains and approaches carrying uncaught risk. Ignore approved-and-converging PRs, trivial
  changes, and PRs already in a requested-changes loop.
- **analytics** — look for the product lens specifically: shipped features with no measurement,
  metrics that flatlined without anyone noting it, funnels with an unexplained drop.
- **support** — recurring themes rather than individual tickets. Three reports of one friction is a
  product or org finding; one report is a ticket.

### Step 3 — Score and cut
Score each candidate **0-2** on five axes:

- **Leverage** — would weighing in change the outcome? An already-decided thread scores 0.
- **Credibility** — *defined per lens*, see below. A generic opinion scores 0.
- **Stretch** — does it exercise a configured `role.mandate` behavior beyond the user's assigned lane?
- **Audience** — will a configured audience member see it? Defaults to 1 when audience is unset.
- **Timing** — is the decision window open? Today's decision scores 2, a weeks-old simmer scores 1.

**Credibility per lens** (using the tech definition everywhere would return an empty org list forever):

| Lens | Credibility means |
|------|-------------------|
| **Tech** | Demonstrable standing in the domain: you own the system, you have hit the failure mode, you set the convention. |
| **Product** | Proximity to the evidence: you have talked to the user, you built the flow, or you can read the data others are guessing about. |
| **Org** | Repeated first-hand observation. Ownership is not required. Having watched the same friction hit three people *is* the credential. |

**Hard filter first:** drop anything with Leverage 0 or Credibility 0. Then rank survivors by total,
keep at most **5**, dedupe against `state.json`. Aim for a mix across enabled lenses, but never pad:
a weak org item does not earn a slot for balance.

### Step 4 — Present digest
Assume the user has *not* seen any of these threads.

```
## Periscope: <date>, window <X>h, role <level>

### 1. [<lens>] <one-line headline>
**Where:** <link / location>
**What's happening:** <2-4 sentences>
**Why you:** <specific gap + which mandate behavior it exercises>
**First move:** <one sentence, the concrete action>
**Draft:**
> <reply, following drafting rules>
```

End with **"Skipped but notable"** (2-5 near-misses, one line each on why they were cut) so the filter
stays inspectable, and name any surface that was skipped because its tool was unavailable.

### Step 5 — Drafting rules
Read `voice.md` first if present; its observed rules override the floor below.

1. **Short and direct** — a few sentences, no preamble, no closing flourish.
2. **No LLM tells** — no em-dashes, no "aligns with", no rule-of-three, no self-congratulation. If the
   `humanizer` skill is installed, run drafts through it before presenting.
3. **First person, explicit** — "I ran into this on X", never passive.
4. **Hedge pushback collaboratively** — state the concern plainly with evidence, admit missing
   context. A closing question only for genuine uncertainty, never a performative sign-off.
5. **Contextualize references** — never a bare ticket or PR number, say what it is.
6. **Cite the change, not the person** — point at the PR, commit, or decision, not who made it.
7. **Substance first** — every draft carries the specific fact, risk, or suggestion that justifies
   posting at all.

Org-lens drafts carry one extra rule: **describe the pattern, not the people**. "This question has
come up three times this week, worth a doc" lands. Naming who kept asking does not.

**Critical:** never post without explicit user approval of that specific message. When approved,
posting goes through that surface's own tool, one message, gated.

### Step 6 — Update state and evidence trail
Update `state.json` with `last_run` and surfaced items (`status: "surfaced"`).

When the user approves and posts, set that item `status: "contributed"` and append to
`contributions.log.md`:

```
- <date> | <lens> | <link> | <one sentence: what changed> | mandate: <behavior>
```

This is the promotion evidence trail. `brag-doc` reads it when compiling promo packets, self-reviews,
and CV material.

## Constraints

- **Declared reach only** — never call a tool outside `tools.allow`, never scan a surface the user did
  not confirm.
- **Read-only by default** — no post, comment, react, or approve without the Step 5 gate.
- **Anti-performative filter** — hard cutoff on Leverage 0 or Credibility 0, no exceptions.
- **Max 5 items**, ranked by total score.
- **No em-dashes** in any output, drafts or digest.
- **Full contextualization** — the user cannot be assumed to know any surfaced thread.
- **Honest empty result** — if nothing clears the filter, say "nothing worth weighing in on in the
  last <X>h" rather than padding with low-leverage items. An empty scan is a valid, useful answer.
