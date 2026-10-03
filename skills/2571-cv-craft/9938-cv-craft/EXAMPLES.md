# cv-craft — examples

Concrete reference output for `tailor` and `screen-prep` modes. Loaded only when drafting either.

## Sample tailored CV

**Inputs:**
- Master: full-stack engineer, 8 years experience, stack covers Next.js, Node, AWS, Stripe, Shopify, Angular, Ionic, Cloudflare Workers, MongoDB.
- JD: *Senior Full-stack Engineer at Acme — Next.js + AWS + Stripe.*

**Tailored output (single page):**

```markdown
# Alex Ribeiro

Senior Full-stack Engineer

**Location:** Rio de Janeiro, Brazil — Remote
**Email:** alex.ribeiro@example.com
**LinkedIn:** linkedin.com/in/alex-ribeiro
**GitHub:** github.com/alexribeiro

## Summary

Full-stack engineer with 8+ years building production web apps on Next.js, Node.js, and AWS for B2B commerce. Architected Lambda + EventBridge middleware integrating Shopify, Stripe, and Recharge across a 12-store multi-tenant retailer. Cut checkout p95 latency from 800ms to 180ms by replacing N+1 Stripe calls with batched payment intents.

## Technical Skills

**Languages:** TypeScript, JavaScript, SQL

**Frameworks:** Next.js, Node.js, React

**Databases:** MongoDB, Aurora, PostgreSQL

**Cloud / DevOps:** AWS (Lambda, S3, CloudFormation, RDS/Aurora, SQS, SES, EventBridge), Cloudflare Workers

**Tools:** Stripe, Shopify Admin GraphQL, Recharge, Aftership

## Experience

### Full-stack Developer
**Northwind Commerce**, Austin, US — Remote
01/2022 – Present

- Architected Lambda + EventBridge middleware integrating Shopify, Stripe, Recharge, and Aftership for a multi-store commerce client.
- Designed CloudFormation stacks and Aurora schemas powering scalable e-commerce integrations.
- Built Next.js storefronts with Cloudflare Workers edge handlers for sub-100ms personalization.

**Stack:** TypeScript, Next.js, Node.js, AWS, Stripe, Shopify GraphQL, MongoDB
```

**Notes on the diff from master to tailored:**

- Headline `Full-stack Developer` → `Senior Full-stack Engineer` (matches JD's role title and seniority).
- Skills consolidated into single grouped section; ratings removed. TypeScript / Next.js / AWS / Stripe pulled to the front of their categories.
- Older Loopgate / FleetTrack role dropped — Angular/Ionic not aligned with JD; master keeps it.
- Bachelor of Electrical Engineering omitted on the one-page version; reinstate if the JD weights education.
- Summary rewritten — same facts, ordered around JD priorities and the three-layer structure (Identity / Scale / Complexity).

## XYZ bullet rewrites (before / after)

The tailor pass converts master bullets into the XYZ formula. Concrete cases:

| Before (master) | After (tailored, XYZ) |
|---|---|
| Worked on Shopify integrations for multiple stores. | Unblocked weekly Shopify sync across 12 stores and 40k SKUs by rebuilding the importer on EventBridge with idempotency keys. |
| Responsible for backend performance improvements. | Cut checkout p95 latency from 800ms to 180ms by replacing N+1 Stripe calls with batched payment intents. |
| Helped migrate the team from REST to GraphQL. | Migrated 14 internal endpoints from REST to Shopify Admin GraphQL, eliminating 6 round-trips per checkout and dropping average response time by 38%. |
| Built a robust serverless architecture for ingestion. | Designed an SQS + Lambda ingestion pipeline processing 2M events/day with a 99.95% delivery rate and DLQ-based replay. |
| Spearheaded the move to TypeScript across the codebase. | Led the TypeScript migration of 80k LoC across 4 services, eliminating ~120 prod runtime errors per month traced to type drift. |

Anti-patterns flagged: `worked on`, `responsible for`, `helped`, `robust` (empty modifier), `spearheaded` (AI-tell). Each rewrite supplies an explicit X (impact), Y (metric/scope), and Z (action).

## Sample CV score report

Rendered in `tailor` mode before any write. Score must be ≥ 80 to proceed without an explicit override. It is the skill's own quality gate, not a prediction of any ATS ranking.

```
CV Score: 84/100  [PASS]

  Requirement evidence  18/20  ✓  (8 evidenced, 1 listed-only)
                                   listed-only: "Terraform" (must-have)
                                   gap → ledger: "Kubernetes"
  XYZ bullet quality  14/20  ⚠  (8/10 full-XYZ, 1 partial, 1 weak)
                                 weak: L41 "Built internal admin tools."
  Structure           20/20  ✓
  Length / density    16/20  ✓  (1 page; 7/10 bullets carry a number)
  Voice               16/20  ⚠  (em-dash on L14; "leverage" on L22)

Fixes before write (auto-applied unless you object):
  - "Terraform": must-have shown only in Skills; surface it in the
    Northwind infra bullet where it was used
  - L14: replace em-dash with comma
  - L22: rewrite "leverage AWS Lambda" → "use AWS Lambda"
  - L41: rewrite to XYZ — propose:
      "Built an internal admin tool that cut customer-support
       resolution time from 8min to 2min by exposing order +
       refund actions over a single Shopify-Stripe view."
  - Surface "Kubernetes" gap in screen-prep (no master coverage)

Confirm fixes? (y / edit / override)
```

A `[FAIL]` example (score < 80) lists every category below threshold and blocks the write until either fixes are applied or the user explicitly overrides the gate.

## Sample screen-prep pack

**Output file:** `screen-prep-acme-senior-fullstack.md`

```markdown
# Screen Prep — Acme — Senior Full-stack

## Logistics knockouts

- **Work authorization / contract:** "I'm based in Brazil and work as a contractor, or through an EOR like Deel if you prefer. No visa needed for remote."
- **Timezone:** "I'm UTC-3. I can overlap 9am to 3pm US Eastern every day."
- **English:** "I work in English daily; my current team and clients are US-based."
- **Notice period / start:** {ASK USER}

## 30-second intro pitch

"I'm a full-stack engineer based in Rio with eight years of programming experience, the last five focused on Next.js, Node, and AWS. At Northwind Commerce I've architected Lambda-based commerce middleware integrating Shopify, Stripe, and Recharge for multi-store retailers. I'm looking for a senior role where I can own scalable backend integrations end-to-end."

## Why Acme

1. The JD emphasizes Stripe + AWS — directly aligned with my last two years of work.
2. Remote-first culture matches how I have shipped most of my career.
3. {ASK USER: any product or mission angle to add — answer is stronger when personal}

## Salary expectation

- **If the posting shows a range** (say USD {A}–{B}): anchor in the upper half. "The posted range works for me. Given the Stripe and AWS depth this role needs, I'd expect to land toward {upper half}."
- **If no range is posted:** {ASK USER for range}. Open by asking theirs: "Could you share the band for this role? Happy to go from there." If pressed, use the user's range: "I'm targeting USD {X}–{Y} for senior IC scope."

## Top 8 likely first-call questions

1. **Walk me through your background.** *(use the 30-second pitch above)*
2. **Tell me about a project you owned end-to-end.** *(Lambda + EventBridge middleware, Northwind Commerce — name the integrations and the outcome)*
3. **How do you approach scaling Lambda-based integrations?** *(idempotency, SQS dead-letter handling, EventBridge for fan-out, observability via CloudWatch)*
4. **Tell me about a time you debugged a hard production issue.** *(pick a real incident from master's bullets — name the symptom, the root cause, the fix, the prevention)*
5. **Why are you looking to leave Northwind Commerce?** *(growth-framed, not negative — "I am ready for senior-IC scope, and the projects I want to own are not on my current team's roadmap")*
6. **What is your experience with Stripe specifically?** *(billing flows, webhooks, idempotency keys, Recharge subscription orchestration)*
7. **How do you balance shipping speed and code quality?** *(test pyramid, what you skip on a prototype vs production, when you take on tech debt deliberately)*
8. **What questions do you have for us?** *(see below)*

Each answer ≤ 120 words, with one concrete fact that survives an AI note-taker's summary.

## Metric defense

- **"Cut checkout p95 from 800ms to 180ms"**: measured in CloudWatch p95 over the two weeks before and after the release; the batching change was mine, the CDN tweak shipped the same week was not, so I cite only the API latency.

## Gaps and risks

- **Kubernetes** — JD lists it; master shows light exposure only. Honest framing: "I have run containerized workloads on Lambda and ECS in production. My Kubernetes exposure has been research and side projects; I would ramp quickly given my AWS background."
- **Years on Stripe** — master shows ~2 years on Stripe directly. If the JD wants 4+, frame around the depth of the work, not the duration.

## Consistency and authenticity

- [ ] LinkedIn titles and dates match this CV exactly (Northwind start month checked).
- [ ] Camera on for the first call; quiet, lit room.
- [ ] One reference ready who can confirm the Northwind work, if they ask.

## Questions to ask the recruiter

1. What does the first 60 days look like for this role?
2. How does the team measure success six months in?
3. What is the on-call rotation, and how often does it page?
4. What is the biggest engineering challenge the team is working through right now?
```

## Sample standalone rewrite — post-CV section (PT-BR)

Rendered after `sync` (b) or `tailor` final write, separated from the CV body by `---`. Brazilian Portuguese.

```markdown
---

## A. Perfil inferido

- **Cargo mais provável:** Senior Full-stack Engineer
- **Senioridade:** Senior
- **Especialização:** e-commerce integrations / Stripe + Shopify middleware
- **Tipo de empresa-alvo:** scale-up B2B SaaS, remote-first

**Por quê:** 8+ anos de experiência, últimos 4 focados em arquitetura serverless AWS para comércio multi-store; bullets demonstram ownership end-to-end de integrações de pagamento; stack alinha com produtos B2B remote-friendly. Sinais como liderança de migração TypeScript e mentoria sugerem escopo Senior IC, não Staff ainda.

Se discordar, corrija e faça um novo upload.

## B. Mudanças principais

1. **Reduzido de 7 para 2 páginas** — mercado internacional rejeita CVs longos. Cortei detalhes técnicos repetidos entre cargos.
2. **Seção de Side Projects removida** — projetos pequenos foram agrupados sob a experiência da empresa onde foram construídos. Mantido apenas link do GitHub no header.
3. **Skills consolidadas em uma seção com categorias** — removidas as classificações Proficient/Intermediate/Beginner. Tecnologias sem evidência em nenhum bullet foram removidas (Svelte, Remix, Flutter).
4. **Summary reescrito** — antes era genérico ("passionate full-stack developer"). Agora segue estrutura Identidade / Escala / Complexidade.
5. **Empresa "Northwind Commerce" recebeu linha de contexto** — adicionado "Shopify Plus dev partner, multi-store e-commerce middleware" para recrutadores internacionais.

## C. Lista de revisão obrigatória antes do próximo upload

### Northwind Commerce
- [ ] `[ESTIMADO]` na linha "12 stores, 40k SKUs" — confirme se o número exato bate.
- [ ] `[DADO AUSENTE: qual era X?]` no bullet de migração GraphQL — quantos endpoints exatos? Qual a redução média de response time?
- [ ] `[DADO AUSENTE: métricas sobre Northwind Commerce]` — número de clientes, ARR, funding, clientes conhecidos para reforçar contexto.

### Loopgate
- [ ] `[DADO AUSENTE: qual era X?]` em "improved app performance" — qual era o p95 antes/depois?

## D. Próximos passos além do CV

1. **Contribuição open source em SDK de pagamentos** — o repositório `stripe/stripe-node` ou `Shopify/shopify-api-js` aceitam PRs externos. Uma issue resolvida ali demonstra exatamente o perfil do CV.
2. **Side project de observabilidade serverless** — uma ferramenta pequena que detecta cold-starts ou DLQ-replay em Lambdas. Demonstra a skill de "Stripe webhook reconciliation" sem precisar do contexto da Northwind Commerce.
3. **Outreach direto a hiring managers de scale-ups B2B remote-first** — Linear, Vercel, Cal.com, Resend. Procure no LinkedIn por "Engineering Manager" + stack do CV. Mensagem curta com link do GitHub + uma frase sobre o sistema descrito no Summary.
```

## When to deviate from these examples

- **Non-engineering roles** — strip the `Stack:` lines, replace with domain artifacts (campaigns shipped, papers published, deals closed).
- **Career-change CV** — lead with a "Selected Projects" or "Transferable Skills" section before Experience.
- **Academic CV** — extend to 2–3 pages, include Publications and Teaching sections (omit ATS rules — academic search is human-driven).
- **Two-page CVs** — keep the summary, current role bullets, and skills tight on page 1; let older roles and education fall to page 2.
