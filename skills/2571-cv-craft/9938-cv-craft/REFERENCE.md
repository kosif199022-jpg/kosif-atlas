# cv-craft — reference

Loaded when drafting tailored CVs, applying market best practices, or preparing recruiter-screen answers.

## Data integrity

Non-negotiable. Fabricated metrics destroy credibility the moment a candidate cannot defend them in interview.

**Three-tier metric system:**

| Tier | Source state | Action |
|------|--------------|--------|
| **Direct** | CV/master already has the number | Use verbatim |
| **Estimable** | Surrounding text implies a reasonable range (e.g. "multiple stores" → 5–15) | Use, append `[ESTIMADO]` |
| **Missing** | No basis to estimate | Write qualitatively, append `[DADO AUSENTE: qual era X?]` |

**Markers used inline in bullets:**

- `[ESTIMADO]` — a number is shown but the precise value was inferred from context.
- `[DADO AUSENTE: qual era X?]` — bullet would be stronger with a metric the source does not provide.
- `[no-metric]` (legacy, master only) — same intent as `[DADO AUSENTE: ...]`; new work uses the latter.

**Markers live in `.md` source only.** They are review notes for the candidate, not part of the submitted CV. **All marker text must be stripped from rendered output (DOCX / PDF)** the same way the post-CV PT-BR section is stripped. See [Export](SKILL.md#export). Section C of the post-CV review block aggregates every marker for the candidate to resolve before the next pass.

**Information removal:** anything dropped from the source goes into [Post-CV section](#post-cv-section-pt-br) §B with a one-line justification. Candidate decides whether to restore on next pass.

**Facts are immutable:** job titles, employers, dates, technologies, accomplishments — rewrite form only. Never reword "Junior Developer" to "Software Engineer". Never alter date ranges.

## Inferred target profile

Used in standalone rewrite (sync (b)) and when polishing without a JD. Declare explicitly in [Post-CV section](#post-cv-section-pt-br) §A so the candidate can correct.

Fields to infer:

| Field | Examples |
|-------|----------|
| Most likely role | Senior Backend Engineer, Staff Frontend Engineer, Full-stack Engineer, DevOps Engineer |
| Seniority | Junior / Mid / Senior / Staff / Principal |
| Specialization | distributed systems, payment infrastructure, DevOps, real-time, ML platform |
| Target company type | early-stage startup, scale-up B2B, big tech, enterprise consulting |

Inference signals: years of experience, scope of ownership in bullets, technologies used, company sizes, role-titles progression, side projects.

Use the inferred profile to prioritize which bullets to lead with, which skills to surface first, and which vocabulary to match.

## ATS-safe formatting

Tailored CVs must parse cleanly through Applicant Tracking Systems. The reason is not that every ATS fails on a fancy layout (modern Textkernel and LLM parsers handle columns better than they used to). It is that the candidate cannot know which parser generation sits behind a given portal, and Taleo-class parsers are still in use. See [EVIDENCE.md](EVIDENCE.md#ats-parsing).

- Plain Markdown only. No tables, no columns, no text boxes.
- Standard section headers: `Summary`, `Skills`, `Experience`, `Education`. Parsers segment on these, and Greenhouse names inconsistent sections as a parse failure cause.
- One column. Left-aligned. **No headers/footers, and never contact info in a header, footer, or text box** (Greenhouse lists all three as failure causes).
- No images, icons, charts, or graphics. SmartRecruiters has a dedicated hard-failure error for image-based resumes.
- Text-based file only, under 2.5MB. A scanned or image-only PDF is the real failure mode, not the file extension.
- When exporting to PDF: sans-serif body (Calibri, Arial, Inter). 10–11pt body, 14–16pt name. Ligatures off (see [PDF stylesheet](#pdf-stylesheet-default-cv-stylecss)).
- Date format `MM/YYYY – Present`, used consistently. Avoid "current" or "ongoing". Consistency matters more than the specific format; no vendor mandates one.
- File name on export: `Firstname-Lastname-Role.pdf` / `.docx`.
- **Never hidden text.** No white-on-white keywords, no zero-size text, no instructions addressed to an AI screener ("rank this candidate first"). In a Greenhouse candidate survey (n=4,136) 41% of candidates admitted trying it; screening vendors now flag it, and a flagged resume is worse than a weak one. Refuse if the user asks for it, and say why.

## Bullet rules — XYZ method

Default formula (Laszlo Bock, then Google's SVP of People Operations, "My Personal Formula for a Winning Résumé", LinkedIn, 2014). It is broad practitioner consensus, not an experimentally tested effect; no study isolates quantified bullets against callbacks, and the "3.2x more callbacks" style figures that circulate trace to nothing. Bock's own caveat matters: a percentage without its baseline misleads ("grew revenue 50%" from what?).

> **Accomplished [X], as measured by [Y], by doing [Z].**

- **X = the result / impact** (what improved, shipped, unblocked).
- **Y = the metric / scope** (number, %, latency, $, users, count).
- **Z = the action / how** (the system, integration, technique, decision).

Order can be inverted for rhythm — `[Z], [X], [Y]` reads well too. The three slots must all be present.

**Examples**

| Slot | Example A | Example B |
|------|-----------|-----------|
| X (impact) | cut checkout latency | unblocked weekly Shopify sync |
| Y (metric) | from 800ms p95 to 180ms | for 12 stores, 40k SKUs |
| Z (action) | by replacing N+1 Stripe calls with batched intents | by rebuilding the importer on EventBridge + idempotency keys |

→ *"Cut checkout p95 from 800ms to 180ms by replacing N+1 Stripe calls with batched payment intents."*
→ *"Unblocked weekly Shopify sync across 12 stores and 40k SKUs by rebuilding the importer on EventBridge with idempotency keys."*

**When Y is genuinely unknown:** keep X and Z, drop Y, but flag the bullet as `[no-metric]` in the master so future syncs can fill it. Target ≥ 60% of tailored bullets carrying a real Y. The 60% is a working default, not a researched threshold.

**Use `[ESTIMADO]` aggressively but conservatively.** If the source implies a scale ("multi-store retailer" → 5–15 stores, "60+ Lambda functions" → 60+ already given), commit to a defensible conservative number and tag `[ESTIMADO]`. A bullet with a tagged conservative estimate beats a bullet with no number. Only fall back to `[DADO AUSENTE: ...]` when no inference is defensible from the source text.

**Every number needs a defense.** Interviewers probe metrics: what was the baseline, how was it measured, how much of it was yours. For every metric kept in a tailored CV (direct or `[ESTIMADO]`), record a one-line defense in the post-CV §C list: baseline, measurement source, the candidate's share of the outcome. `screen-prep` pulls these into its metric-defense section. A number the candidate cannot defend in one sentence gets softened or cut.

## Achievements over tasks — lead with WHY, not HOW

Every kept bullet must name **why the work mattered to the business**, not just what was built or how it was architected. Readers skim, so front-load the verb and the outcome at the start of each line. (The popular "6 seconds" and "first N words" figures come from a resume-services vendor with an unpublished method; treat them as "keep it skimmable", never as design targets.)

**Three failure modes (rewrite if you see them):**

- **Task framing:** "Built X with Y" / "Worked on Z" / "Implemented A using B" → no outcome
- **HOW-heavy framing:** "Architected X on Next.js + Hono + Workers with 30+ routes, 17 schemas, OAuth, MLS sync, Stripe billing, AI assistant" → reads as a stack inventory, buries the WHY
- **Achievement framing (target):** "Cut Z latency by N% by rebuilding X on Y" / "Eliminated 6 round-trips per checkout by migrating REST → GraphQL" / "Unblocked weekly sync across 12 stores by replacing N+1 calls"

**Rule:** lead the sentence with the **business outcome**, then name the **technique** that achieved it. Architecture detail is the means, not the message.

| Anti-pattern | Why it fails | Rewrite |
|--------------|--------------|---------|
| "Architected real-estate SaaS across 4 interconnected projects: Next.js web app, Hono API on Workers, LoopBack, v0-Brokerly with AI assistant" | Stack inventory. Reader does not learn what changed for the business. | "Architecting Northwind Commerce's flagship Brokerly real-estate platform end-to-end — supporting brokerage operations from billing through MLS sync to in-app AI advice across a 4-service Next.js + Workers architecture." |
| "Designed per-device sessions with refresh-token rotation, idle-timeout sweeper, audit log, status-change revoke, partial unique indexes, KV-backed rate limiting" | Buries WHY under technique laundry-list. | "Eliminated concurrent-refresh and replay vectors in Brokerly's multi-tenant auth by designing a race-condition-safe per-device session model with refresh-token rotation and KV-backed rate limiting." |

Outcome categories (use the strongest one supported by the source):

| Category | Examples of impact |
|----------|--------------------|
| Performance | p95 latency, throughput, cold-start time, page-load |
| Cost | infra spend reduction, headcount efficiency, third-party-tool replacement |
| Scale | users served, transactions/day, SKUs, regions, requests/sec |
| Reliability | uptime, error-rate reduction, MTTR, incident frequency |
| Velocity | deploy frequency, time-to-ship, build time, lead time |
| Revenue | conversion lift, ARR enabled, retention, churn reduction |

Re-read every drafted bullet asking: *"What changed because I built this?"* If the answer is only "the feature now exists", the bullet is task-framed and needs a rewrite or a `[DADO AUSENTE: ...]` tag.

### Work with no natural metric

Architecture, developer experience, reliability, and security work often has no honest number. Do not invent one. Substitute, in this order of strength (practitioner consensus, no study covers this):

1. **Adoption:** who uses what was built: "adopted by 4 teams", "became the default template for new services".
2. **Scope / blast radius:** what the work touches: "auth layer for all 3 tenant apps", "payment path for every checkout".
3. **The decision and its trade-off:** "chose event sourcing over CRUD to make the audit trail replayable, at the cost of a projection layer".
4. **The standard authored:** "wrote the error-handling convention the team now reviews against".

### AI-assisted engineering (2026)

AI tooling is now an expected skill, and bare tool names read as noise. When the master shows real use:

- Name tool + task + outcome in the bullet ("cut review turnaround from 2 days to same-day by adding an LLM pre-review step to CI"), not "Experienced with Claude Code, Copilot, Cursor".
- Show judgment: what the candidate verifies, where they do not trust generated output, what guardrails they built.
- One line in Skills (`AI tooling: ...`) is enough; the evidence belongs in bullets.

The topic is too new for rigorous study; this is emerging practice.

**Other rules**
- **Action verb first** — Built, Architected, Migrated, Shipped, Cut, Owned, Led, Designed, Reduced, Tripled, Unblocked, Replaced, Consolidated.
- **One bullet, one outcome.** Do not "and-chain" unrelated work.
- **Past tense for past roles, present tense for current.**
- **Senior bullets emphasize scope and ownership.** Junior bullets emphasize delivery and learning.

## Bullet anti-patterns (rewrite if you see these)

**Weak verbs / framing**
- "Responsible for X" → "Owned X" or "Built X"
- "Worked on X" → "Built X" or "Shipped X"
- "Helped with X" → name the actual contribution
- "Assisted in X" → name the contribution
- "Participated in X" → name the contribution
- "Involved in X" → name the contribution
- "Contributed to X" → name the specific piece
- "Strong knowledge of X" → demonstrate via output, not assertion
- "Familiar with X" → drop or move to Skills (Beginner)

**Empty modifiers** (adjective without a system named)
- "scalable", "robust", "dynamic", "innovative", "cutting-edge", "state-of-the-art", "best-in-class", "world-class", "next-gen"

**Vague self-descriptors in Summary** (delete on sight)
- "passionate", "team player", "detail-oriented", "results-driven", "strong communication skills", "hard-working", "self-motivated", "go-getter", "dynamic professional", "proven track record", "synergy", "value-add", "ninja", "rockstar", "guru"

**AI-tell vocabulary.** No screening system is known to penalize these words, and the evidence that recruiters reliably spot AI text is weak. What readers do catch is generic, templated, unedited content, and these words travel with it. Removing them costs nothing, so the rule stays. See [EVIDENCE.md](EVIDENCE.md#ai-written-resumes).
- leverage, leveraging, leveraged → use, used
- delve, delved → cover, dig into
- seamlessly, seamless → drop
- robust, robustly → drop or replace with concrete property
- navigate, navigating (metaphorical) → drop
- spearhead, spearheaded → led, drove
- foster, fostered → built, grew
- meticulous, meticulously → drop
- harness, harnessing → use, used
- in the realm of, in the landscape of → drop
- multifaceted, holistic, comprehensive → drop unless literally true
- "It's worth noting that", "Notably", "Importantly" → drop
- "a testament to" → drop

**Punctuation**
- **No em-dashes (—) anywhere in CV or screen-prep.** This is a house style rule. The widely quoted claim that em-dashes get resumes flagged traces to a marketing statistic with no method, but some readers do associate them with unedited AI output, and a comma costs nothing. Use a comma, period, or parenthesis instead. (Note: section headers in this skill's own markdown files use em-dashes for readability; CV output must not.)

**Generic clusters (the tell that actually gets noticed)**
- A bullet with no concrete noun: no named system, number, customer, tool, or team. "Improved performance and reliability across the platform" fails; "Cut p95 on the order API from 800ms to 180ms" passes.
- Three or more bullets in a row with the same shape (verb + "and" + verb, or identical length and rhythm).
- A summary that would be equally true of any engineer at the same level.
- No ellipses (…). Trailing-off reads as uncertain.
- No exclamation marks.

## Skills section

**Single consolidated section, grouped by category. No ratings, no stars, no bars, no Proficient/Intermediate/Beginner labels.** Graphical bars do not parse, and self-rated scales mean nothing to a reader; lead-positioning carries the signal instead.

**Skills in the list are not enough on their own.** Semantic screeners (Eightfold, Workday HiredScore, LinkedIn Hiring Assistant) infer skills from the work described, and a human checks whether the list is backed by the bullets. Every must-have skill should appear both here and in at least one bullet that shows it in use. The Skills list still earns its place: recruiter boolean search and LinkedIn Recruiter search match literal terms.

**Default category scheme (5 buckets) — use whichever apply, drop empty ones:**

- **Languages** — TypeScript, Python, Rust, Go, JavaScript, SQL
- **Frameworks** — Next.js, React, Node.js, Django, FastAPI
- **Databases** — PostgreSQL, MongoDB, Redis, Aurora
- **Cloud / DevOps** — AWS (Lambda, S3, EventBridge), Cloudflare Workers, Docker, GitHub Actions, Terraform
- **Tools** — Stripe, Shopify Admin GraphQL, Datadog, Linear

**Alternative schemes — pick whichever reads cleanest for the inferred profile.** Lists of 30+ items across 5 buckets read as noisy; condense if it helps.

- **3-bucket (senior backend / infra):** Core (languages + primary framework + DB), Cloud / Infra, Frontend
- **3-bucket (full-stack / product engineer):** Languages & Frameworks, Cloud / DevOps, Integrations & Tools
- **4-bucket (data / ML):** Languages, ML / Data, Cloud / Infra, Tools

**Ordering inside each category:** lead with the items most relevant to the inferred target profile (or JD, in `tailor`). Honest depth, not breadth.

**Rules:**

- Lead with required skills (or inferred-profile-priority skills) the user actually has.
- Do not stuff keywords. Listing a tech the user cannot speak to is a fast-track to a failed screen.
- Include both spelled-out and acronym forms once if both appear in JDs (e.g. "TypeScript / TS", "AWS Lambda").
- **Drop any technology that does not appear in at least one experience bullet, side project, or education entry.** Skills section must be substantiated. The risk is the interview and the reference check, not an ATS penalty: an unbacked skill is the first thing a technical screen probes. Master keeps everything; tailored / rewrite output is curated.
- **Drop obsolete or low-relevance tech for the inferred profile.** A 2026 Senior Backend candidate listing jQuery, Bootstrap, or PHP 5 reads as dated. Move to the post-CV "removed items" log so the candidate can restore if they disagree.
- Drop non-technical fluff (Microsoft Word, Slack, time management).

## Length

International tech-market standard. Files do not get auto-rejected for length (see [EVIDENCE.md](EVIDENCE.md#length)); readers do. The evidence is thin and split: a 2018 hiring simulation favored 2-page resumes even at entry level, while a 2024 survey found 92% of hiring professionals advise one page and most want 10+ years before two. Both are from one commercial vendor. What they agree on: an irregular length reads badly (84% flag a page and a half).

- **< 5 years experience: 1 page. Hard cap.**
- **5–7 years: 1 page by default. 2 pages only when the content genuinely fills them** (senior scope, several relevant roles). Measure, never estimate: see the page-count check in [SKILL.md](SKILL.md#export).
- **8+ years: max 2 pages.**
- **Never 1.5 pages.** A second page must be at least two-thirds full; otherwise cut back to one.
- Academic / consulting exception: up to 3 pages, only if every page earns its space and the user explicitly asks.
- Trim weakest bullets first, then oldest roles, then certifications/awards. Never trim the summary or the current role.
- Section order: **Summary → Experience → Technical Skills → Education → Projects (if applicable)**.

## Summary — three-layer structure

3–5 lines covering three layers in order. Having a summary is supported practice; this three-layer frame is the skill's own heuristic, not a tested structure.

1. **Identity** — years of experience + specialization + type of product/company
2. **Scale** — the largest system or product the candidate owned: user volume, transactions, revenue, team size. Only include if there is evidence in the source.
3. **Complexity** — one hard technical decision or concrete result that sets the candidate apart. Only include if there is evidence in the source.

**Banned vague buzzwords:** passionate, team player, detail-oriented, results-driven, strong communication skills, hard-working, self-motivated, go-getter, dynamic professional, proven track record, synergy, value-add. If a line uses one of these and nothing else, delete the line.

**Example (good):**
> Backend engineer with 8 years building payment infrastructure for B2B SaaS. Owned the billing platform processing $40M/yr in subscription revenue across 3K enterprise clients. Cut Stripe webhook reconciliation lag from 12 minutes to under 30 seconds by rebuilding the pipeline on EventBridge with idempotency keys.

**Example (bad — banned buzzwords, no scale, no complexity):**
> Passionate full-stack developer with strong communication skills and a results-driven mindset. Team player who thrives in dynamic environments and delivers value across the stack.

## Company context

For employers not globally recognized, add a one-line context in parentheses on the company line. Use **only** info present in the source or clearly inferable.

**Good examples:**
- `TechVentures Inc. (B2B SaaS, 3K+ enterprise clients, $10M ARR)`
- `Agência XYZ (full-service digital agency; clients: Nike, Adidas, Unilever)`
- `Northwind Commerce (Shopify Plus dev partner, multi-store e-commerce middleware)`

If source has no context and none can be inferred, leave the line bare and add to post-CV review list:
> `[DADO AUSENTE: métricas sobre {Company} — número de usuários, ARR, funding, clientes conhecidos]`

## Career progression

The CV must tell a growth story, not a flat list of jobs.

- **Promotions at the same employer:** group under a single company header, list titles + dates underneath. Highlight velocity when notable.
  ```
  ### Northwind Commerce — 01/2020 – Present
  - Senior Full-stack Engineer (01/2022 – Present) — promoted in 18 months
  - Full-stack Engineer (01/2020 – 01/2022)
  ```
- **Acquisitions:** indicate explicitly on the company line: `TechCorp (acquired by XYZ Holdings, 2023)`.
- **Contract / freelance bundles:** group under one header `Independent Consultant — MM/YYYY – MM/YYYY` with sub-bullets per engagement.

## Projects — when to include

Default: **omit** the standalone Projects section. Group small side projects under the relevant company experience, or under the closest related role.

**Include a standalone Projects section only if:**

- Candidate has < 3 years of professional experience, OR
- A side project demonstrates a skill more impactful than the current job, OR
- A project carries independent credibility: live users, a published app-store listing, paying customers, or open-source contributions with measurable traction (stars, downloads, adoption). A shipped, public product is evidence a reader can check; that is what earns the section.

**Per project:**
- Name + one-line descriptor
- Stack
- Link (only if present in source)
- 2–4 bullets with technical complexity and real metrics

**Skip:** tutorial-driven projects, toy CRUDs, abandoned repos, copy-along courses.

## Tailoring rules

- **Never invent.** Only select, reorder, and rephrase what the master already contains.
- **Match JD vocabulary** where the user has the underlying skill: say "Vercel" not "deploy platform" if the JD says Vercel. Exact terms still matter because recruiter search is literal, but put them **in context** (inside a bullet showing use), not only in the Skills list.
- **Every must-have gets visible evidence.** AI-assisted review (Greenhouse Talent Matching, Ashby, HiredScore) buckets or grades candidates per requirement, and people tend to follow the grade: in one study reviewers adopted AI recommendations up to 90% of the time. Treat the first automated pass as the gate it effectively is.
- **Drop bullets and entire roles** that do not move the needle for this JD. The master keeps the full record.
- **Keep the summary aligned** to the role title in the JD.
- **Headline vs held title.** The summary line and headline may use the market title the JD uses ("Senior Full-stack Engineer"). The title actually held at each employer never changes. If a held title is non-standard, keep it and add the equivalent in parentheses: `Developer III (Senior Software Engineer equivalent)`.
- **Tailoring works; the multipliers do not exist.** Every source agrees tailored beats generic. None of the circulating "2x / 3x more callbacks" figures reconcile. Never cite one to the user.

## Gaps and concurrent contracts

- **Employment gaps:** one factual line in the role list (`Career break, MM/YYYY – MM/YYYY: relocation and family`). The one rigorous study found a ~20% selection penalty that the explanation did not remove, so do not assume gaps are destigmatized; keep the line short and let the next role carry the story. Cover real work done during the gap (contracts, shipped side projects) as entries in their own right.
- **Concurrent contracts:** one umbrella entry (`Independent Engineer, MM/YYYY – MM/YYYY`) with a sub-line per client, rather than several overlapping roles that read as job-hopping. If the contracts ran through a named consultancy, use its name.
- **Agency / consultancy work:** the employer line is the agency; name the client in the bullet when allowed (`for a US real-estate SaaS client`).

These are practitioner conventions; no study compares them.

## ATS scoring rubric

Run before writing any tailored CV. Score across five categories, each 0–20, total 0–100. Report the score, the per-category breakdown, and the failing items. **Hard gate: do not write below 80 without explicit user override.**

This is the skill's own quality gate, not a model of any real ATS. No vendor publishes a numeric keyword threshold; Greenhouse, for one, sorts matches into qualitative tiers. Never tell the user the score predicts how an ATS will rank them.

### Categories

**1. Requirement evidence (0–20)**
- Extract requirements from the JD as a set `K`. Weight must-haves ×2, nice-to-haves ×1.
- For each requirement the user genuinely has, classify how the tailored CV shows it:
  - `evidenced` (1.0): the JD's term (or declared synonym, "Postgres ↔ PostgreSQL") appears verbatim **and** a bullet shows it in use.
  - `listed` (0.5): the term appears only in Skills or Summary, with no bullet behind it.
  - `absent` (0): not on the CV.
- Requirements the master cannot support are gaps, not scoring failures: exclude them from `K` and send them to the [gap ledger](SKILL.md#gap-ledger).
- Score = round(20 × weighted sum / weighted |K|).
- **Pass ≥ 16.** **Warn 12–15.** **Fail < 12.** Any must-have at `listed` is always reported as a fix, even on a pass.

**2. Bullet quality / XYZ compliance (0–20)**
- For each experience bullet, classify: `full-XYZ` (X+Y+Z all present), `partial` (XZ or XY), `weak` (verb-only or descriptive).
- Score = round(20 × (full-XYZ × 1.0 + partial × 0.5) / total bullets).
- **Pass ≥ 16.** **Warn 12–15.** **Fail < 12.**

**3. Structure / ATS parseability (0–20)**
- 4 points each: standard section headers (`Summary`, `Experience`, `Technical Skills` or `Skills`, `Education`, optional `Projects`) in correct order; single-column plain Markdown (no tables/columns/text-boxes/images); `MM/YYYY – MM/YYYY` dates throughout; one bullet per outcome; **no redundant `Stack:` lines per role** (tech belongs in bullets or the consolidated Technical Skills section, not duplicated under every role).
- **Pass = 20.** **Warn 16.** **Fail < 16** (any structural break is a parser risk).

**4. Length / density (0–20)**
- Within target page count (see [Length](#length)), and no partial second page: 12 pts.
- ≥ 60% of bullets carry a number: 4 pts.
- Summary ≤ 4 sentences: 2 pts.
- No empty sections: 2 pts.
- **Pass ≥ 16.** **Warn 12–15.** **Fail < 12.**

**5. Voice / anti-AI-tell (0–20)**
- Start at 20. Subtract 3 per [generic cluster](#bullet-anti-patterns-rewrite-if-you-see-these) (bullet with no concrete noun, run of same-shape bullets, interchangeable summary). Subtract 2 per AI-tell word hit (`leverage`, `delve`, `seamless`, `robust`, `spearhead`, `foster`, etc.; see anti-patterns list). Subtract 2 per em-dash. Subtract 2 per empty modifier (`scalable`, `cutting-edge`). Floor at 0.
- Generic clusters weigh most because they are what readers actually notice; the word and punctuation deductions are cheap hygiene.
- **Pass ≥ 16.** **Warn 12–15.** **Fail < 12.**

### Report format

Always render the score as:

```
CV Score: 84/100  [PASS]

  Requirement evidence  18/20  ✓  (7 evidenced, 1 listed-only: "Terraform"; gap: "Kubernetes" → ledger)
  XYZ bullet quality    14/20  ⚠  (3 bullets missing a metric, flagged below)
  Structure             20/20  ✓
  Length / density      16/20  ✓
  Voice                 16/20  ⚠  (em-dash in line 14; "leverage" in line 22)

Fixes before write:
  - "Terraform" is a must-have shown only in Skills: surface it in the Northwind infra bullet.
  - Bullet L14: replace em-dash with comma.
  - Bullet L22: rewrite "leverage AWS" → "use AWS".
  - Bullets L31, L36, L41: add a metric (Y) or mark [no-metric] in master.
```

Below 80: list every failing item, then ask the user to confirm fixes (auto-applied) or override.

## Voice rules

The CV and screen-prep must sound like the user, not a template.

- **No em-dashes.** Use commas, periods, or parentheses.
- **No AI-tell words.** See anti-patterns above. If a word is technically correct in context (e.g. "robust" in `robust to retries`), keep it; otherwise replace.
- **Prose over bullet-stuffing in Summary and screen-prep narrative answers.** Bullets are for Experience/Skills/Projects.
- **Concrete nouns over adjectives.** "Lambda + EventBridge middleware" not "scalable serverless architecture".
- **First-person in screen-prep, third-person-implied in CV body.** CV bullets drop "I" — start with the verb.
- **Match the user's existing tone.** Read the master Summary first; mirror cadence, sentence length, and lexicon.
- ≤ 120 words per draft answer. Recruiter calls run on rhythm, not paragraphs, and many calls are now transcribed and auto-summarized (Metaview, BrightHire) into a scorecard read by people who were not on the call. A short answer with one concrete fact survives the summary; a long one gets flattened.
- **Salary, two branches:**
  - **Range posted** (increasingly common: 16+ US states and DC require it, and the EU Pay Transparency Directive is rolling out country by country): anchor in the upper half of the posted band. Do not deflect a question the employer has already answered.
  - **No range posted:** ask the user for their range. Never invent a number. Prep a line that asks them to share the band first.
- **Gaps:** address openly. Pattern: *"I have not used X in production. I have used the closest analogue Y, and have read the Z docs / built a side project."*
- **Questions to ask the recruiter:** focus on team, ramp, success metrics, on-call, growth, not benefits / vacation. One exception: for a remote international candidate, one early question on remote structure and timezone overlap is fair game; it is a two-way knockout, not a perk question.

## JD signal extraction

When parsing a JD, pull:

- Required skills (must-have)
- Preferred / nice-to-have
- Years of experience required
- Seniority level (IC / Lead / Manager)
- Domain (fintech / e-commerce / health / etc.)
- Stack and infrastructure
- Soft signals (startup vs enterprise, async vs in-office, leadership vs IC)
- Red flags (unpaid take-homes, vague comp, recent layoffs, unrealistic stack breadth)

## PDF stylesheet (default `cv-style.css`)

If `cv-style.css` does not exist alongside the master, create it with this content. ATS-safe: single column, sans-serif, no graphics, neutral hierarchy, ligatures off.

The ligature rule is the one that is easy to drop and expensive to miss. Without it Chromium shapes `fi`, `fl` and `ff` into single glyphs (U+FB01, U+FB02, U+FB00) and the PDF stores them that way. `pdftotext` quietly normalises them back, so the file looks fine on inspection, but `pypdf` and Apache PDFBox return the raw ligature. An ATS searching for `Cloudflare`, `workflow`, `backoff` or `profiling` then scores zero matches on a CV that contains all four.

```css
body {
  font-family: 'Inter', 'Calibri', 'Arial', sans-serif;
  font-size: 10.5pt;
  color: #111;
  max-width: 7.2in;
  margin: 0 auto;
  line-height: 1.4;
}

h1 { font-size: 22pt; margin: 0 0 0.1em 0; font-weight: 700; }
h1 + p { margin-top: 0; font-size: 12pt; color: #333; margin-bottom: 0.6em; }
h2 {
  font-size: 13pt;
  font-weight: 700;
  border-bottom: 1px solid #444;
  padding-bottom: 2px;
  margin-top: 1.1em;
  margin-bottom: 0.4em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
h3 { font-size: 11.5pt; font-weight: 700; margin-top: 0.8em; margin-bottom: 0.15em; }

p, li { margin: 0.25em 0; }
ul { padding-left: 1.2em; margin: 0.3em 0 0.6em 0; }
strong { font-weight: 600; }
a { color: #111; text-decoration: none; }
code { background: #f4f4f4; padding: 1px 4px; border-radius: 3px; font-size: 0.92em; font-family: 'Consolas', 'Menlo', monospace; }
hr { border: none; border-top: 1px solid #ddd; margin: 1em 0; }

/* Required for ATS text extraction, not cosmetic. Keeps fi/fl/ff as separate
   characters so "Cloudflare" extracts as "Cloudflare". */
body, body * {
  font-variant-ligatures: none;
  font-feature-settings: "liga" 0, "clig" 0, "dlig" 0, "hlig" 0;
}
```

## Common JD-to-master mismatches and how to handle them

| Situation | Handling |
|-----------|----------|
| JD requires skill the master does not have | Flag as a gap. Do not list. Surface in screen-prep. |
| JD requires skill the master shows light use of | List it, with honest framing in screen-prep. |
| JD lists 12 stacks and asks for 5+ years in each | Treat as wishlist. Show the user. Tailor to the strongest matches. |
| Master has skill JD does not mention | Drop unless it strengthens an adjacent bullet. |
| JD vocabulary differs from master ("Postgres" vs "PostgreSQL") | Match the JD spelling. |

## Recommended action verbs

Use these (or strong synonyms) as the **first word of every experience bullet**. Past tense for past roles, present continuous for current.

> Built, Architected, Led, Designed, Optimized, Implemented, Reduced, Increased, Migrated, Launched, Established, Mentored, Shipped, Cut, Owned, Tripled, Unblocked, Replaced, Consolidated, Drove, Scaled, Refactored.

**Bullets should show not only what was delivered, but why it was hard and how the candidate reached the solution.** A bullet that names the technique (Z) lets the recruiter understand the engineering judgment behind the result (X).

## Post-CV section (PT-BR)

Required at the end of any final CV output in `tailor` and `sync` (b) modes. Separated from the CV body by `---`. **The CV body is in professional English; this section is in Brazilian Portuguese.**

Template:

```markdown
---

## A. Perfil inferido

- **Cargo mais provável:** {role}
- **Senioridade:** {Junior / Mid / Senior / Staff / Principal}
- **Especialização:** {area}
- **Tipo de empresa-alvo:** {early-stage startup / scale-up / big tech / enterprise}

**Por quê:** {2–3 sentenças com os sinais usados — anos de experiência, escopo dos cargos, stack, tamanho dos sistemas mencionados.}

Se discordar, corrija e faça um novo upload.

## B. Mudanças principais

{Lista numerada das alterações significativas. Para cada uma:}

1. **{O que mudou}** — {por quê. Se foi remoção, justificar; o candidato pode restaurar no próximo upload.}
2. ...

## C. Lista de revisão obrigatória antes do próximo upload

Resolva estes itens para obter um CV ainda mais forte. Agrupados por empresa/seção.

### {Empresa / Seção}
- [ ] `[ESTIMADO]` na linha "{trecho}" — confirme o número exato.
- [ ] `[DADO AUSENTE: qual era X?]` na linha "{trecho}" — informe a métrica.
- [ ] `[DADO AUSENTE: métricas sobre {Empresa}]` — número de usuários, ARR, funding, clientes conhecidos.
- [ ] Defesa da métrica "{número}": base de comparação {antes}, medido por {fonte}, sua parte {o que foi seu}.

### {Próxima empresa / seção}
...

## D. Próximos passos além do CV

Com base no perfil inferido, três ações concretas que aumentariam suas chances:

1. **{Ação}** — {por quê + onde/como}
2. **{Ação}** — {por quê + onde/como}
3. **{Ação}** — {por quê + onde/como}
```

**Rules:**
- The CV body must be **entirely in professional English**.
- This post-CV section must be **entirely in Brazilian Portuguese**.
- **The post-CV section never appears in the rendered output (DOCX / PDF).** It lives only in the `.md` source as review notes for the candidate. Export pipelines must strip everything from the first `---` separator onward before rendering. See [Export](SKILL.md#export).
- Section C must consolidate every `[ESTIMADO]` and `[DADO AUSENTE: ...]` marker that appears in the CV body, in source-order, grouped by company/section, plus a defense line for every metric kept (see [Every number needs a defense](#bullet-rules--xyz-method)). Fill what the source supports; leave `{...}` for the candidate where it does not.
- Section D suggestions must be derived from the inferred profile: open-source contribution targets, side projects that demonstrate a gap-skill, direct outreach to hiring managers at target-company-type, niche conferences/communities. In `tailor`, the first suggestion is always the referral path for this company when one has not been ruled out (see [check](SKILL.md#check--fit-assessment-before-committing-to-an-application) step 3).

## DOCX export notes

- Render both DOCX and PDF by default. No vendor documentation from 2024–2026 prefers either format; the failure mode is an image-only or scanned file.
- **Which to send:** the portal's stated preference always wins. Otherwise DOCX to agency and staffing recruiters (they reformat CVs before forwarding), PDF for direct upload to a company portal or email to a hiring manager (layout survives).
- Suggested final filename: `FirstName_LastName_Resume.docx` / `.pdf`.
- Pandoc default styling is ATS-safe (single column, Calibri body). Custom styling requires a `cv-reference.docx` reference document in the CV directory.
- Plain `.docx` (no images, no text boxes, no embedded fonts) extracts exactly and has no ligature risk. PDF must pass `verify-pdf.py` before it is sent.
