# cv-master.md schema

The master CV lives at `<dir>/cv-master.md` where `<dir>` is the user's CV directory (resolved via the [Path resolution](SKILL.md#path-resolution) flow in `SKILL.md`). Use this schema when bootstrapping or syncing. The master is **complete** — it includes everything the user has shipped. Tailoring trims it down later.

## Schema

```markdown
# {Full Name}

{Headline — e.g. "Full-stack Developer" or "Senior Backend Engineer"}

**Location:** {City, Country}
**Email:** {email}
**Phone:** {phone}
**LinkedIn:** {url}
**Portfolio / GitHub:** {url}
**Work authorization:** {e.g. "Brazil citizen — open to remote / contractor"}

## Summary

{3–4 sentences. Opens with role + years experience. Names primary stack. Names one or two distinctive angles or domain strengths.}

## Technical Skills

**Languages:** {comma-separated — TypeScript, Python, Rust, Go, SQL …}

**Frameworks:** {comma-separated — Next.js, React, Node.js, Django …}

**Databases:** {comma-separated — PostgreSQL, MongoDB, Redis …}

**Cloud / DevOps:** {comma-separated — AWS (Lambda, S3, EventBridge), Cloudflare Workers, Docker, GitHub Actions, Terraform …}

**Tools:** {comma-separated — Stripe, Shopify Admin GraphQL, Datadog, Linear …}

> Notes:
> - **No ratings.** No Proficient/Intermediate/Beginner, no stars, no bars, no percentages. Lead-ordering inside each category carries the depth signal instead.
> - Blank lines between categories are required (CommonMark collapses single newlines into spaces).
> - Drop empty categories. Drop any technology that does not show up in at least one experience bullet, side project, or education entry.
> - Lead each category with the items most relevant to the inferred target profile (or JD, in `tailor`).

## Professional Experience

### {Job Title}
**{Company}**, {Location} — {Remote | Hybrid | On-site}
{MM/YYYY} – {MM/YYYY or Present}

- {Bullet — action verb, concrete output, metric where credible}
- {Bullet}
- {Bullet}

**Stack:** {comma-separated tech used in this role}

### {Next role…}
…

## Side Projects  *(omit standalone section by default — group small projects under the relevant company experience; include only if [Projects threshold](REFERENCE.md#projects-when-to-include) met)*

### {Project Name} — {one-line descriptor}
**Stack:** {tech}
**Link:** {repo or live URL, optional}

- {Bullet — concrete capability or architectural choice}
- {Bullet}

## Education

### {Degree}
**{Institution}**, {Location} — {MM/YYYY} – {MM/YYYY}

- {Relevant coursework, thesis, awards}

## Languages

- {Language}: {Native | Fluent | Conversational | Basic}

## Certifications  *(optional, omit section if empty)*

- {Cert} — {Issuer, Year}

## Awards / Speaking  *(optional, omit section if empty)*

- {Item — venue, year}
```

## Field rules

- **Dates** in `MM/YYYY` format. Use `Present` for current role.
- **Bullets follow the XYZ method:** `Accomplished [X], as measured by [Y], by doing [Z]`.
  - **X = result/impact**, **Y = metric/scope**, **Z = action/how**. Example: *"Cut checkout p95 from 800ms to 180ms by replacing N+1 Stripe calls with batched payment intents."* Full guidance in [REFERENCE.md — Bullet rules](REFERENCE.md#bullet-rules--xyz-method).
  - **Three-tier metric system** ([REFERENCE.md — Data integrity](REFERENCE.md#data-integrity)): direct → verbatim; estimable → append `[ESTIMADO]`; missing → write qualitatively + append `[DADO AUSENTE: qual era X?]`. **Never invent a metric.**
- **Bullets start with action verbs** — Built, Architected, Migrated, Led, Designed, Optimized, Implemented, Reduced, Increased, Launched, Established, Mentored, Shipped, Cut, Owned, Tripled, Unblocked, Replaced, Consolidated. Avoid weak verbs (Worked on, Helped with, Was responsible for, Assisted in, Participated in).
- **Bullets show the technique, not just the outcome** — name the system, integration, or decision that made the result possible.
- **Numbers beat adjectives** — "cut p95 from 800ms to 180ms" beats "improved performance significantly".
- **One bullet, one outcome.** Do not chain unrelated work with "and".
- **No em-dashes (—) and no AI-tell vocabulary** (`leverage`, `delve`, `seamless`, `robust`, `spearhead`, `foster`, etc. — full list in [REFERENCE.md — Bullet anti-patterns](REFERENCE.md#bullet-anti-patterns-rewrite-if-you-see-these)).
- **Stack line per role** — pulls double duty for ATS keyword matching and human readability.
- **Company context line** for non-globally-known employers ([REFERENCE.md — Company context](REFERENCE.md#company-context)).
- **Promotions** at the same employer group under one company header with sub-titles ([REFERENCE.md — Career progression](REFERENCE.md#career-progression)). **Acquisitions** flagged explicitly.
- **Master keeps everything.** Never delete past roles or projects from the master. Tailored / rewrite outputs do the trimming and record removals in the post-CV section.

## Bootstrapping prompts (for the assistant)

When interviewing a new user in bootstrap mode, use prompts like:

- "What is your current or most recent role title?"
- "What is the largest system or product you have owned — user volume, transactions, revenue, team size?"
- "List the technologies you would be comfortable being asked deep questions about in an interview."
- "For your most recent role: what is one thing you built end-to-end that you are proud of? What was the measurable outcome?"
- "Any side project that demonstrates skill the day-job does not?"

Save after each section. Do not push the user through all eight at once — interview rhythm produces better content.
