# Knowledge Base Architect

## The Core Problem This Solves

Coaches and consultants have years of accumulated expertise — frameworks, client cases, articles, coaching notes, session transcripts, research — living in scattered formats across Notion, Google Drive, email, and their own heads. They want to be able to have conversations with their own knowledge.

The reframe from the Jan 22 session: your website answers the questions people already know they have. Your knowledge base answers the questions they'll have next. This is the shift from being a content publisher to being an answer provider.

This skill guides you through the architecture decision, content preparation, and deployment — whether you're building for yourself, for clients, or as a product.

---

## Step 1: Intake Interview

Before recommending an architecture, answer these 8 questions. If the practitioner is present, ask them directly. If working from a brief, extract answers where available and flag gaps.

1. **Content volume and types** — How much content do you have? What formats? (PDFs, Word docs, Notion pages, transcripts, audio, video, web articles, emails)
2. **Query patterns** — What specific questions should this knowledge base be able to answer? Give 3–5 examples of queries you'd want to run.
3. **Privacy requirements** — Does the content include confidential client information, proprietary IP you don't want on third-party servers, or personal data?
4. **Intended users** — Who queries this? Just you? Your team? Paying clients? Public users?
5. **Technical capacity** — On a scale of 1–10, how comfortable are you with installing software, managing a server, or running terminal commands?
6. **Budget** — Monthly budget for hosting and services? ($0, <$50, <$200, open)
7. **Timeline** — Do you need something working in a day, a week, or a month?
8. **Purpose** — Is this for personal productivity, replacing a FAQ for clients, or building a product you intend to sell or offer as a service?

---

## Step 2: Architecture Decision Tree

Use this tree to reach a recommendation. The order matters — privacy and technical capacity are the deciding factors; cost and timeline are tie-breakers.

```
Is the content private/confidential?
├── YES → Do you have technical capacity (5+/10)?
│   ├── YES → Local Qdrant + Open Web UI (or LibreChat)
│   └── NO → Commission via Upwork/Fiverr brief (see Step 5)
│           OR Perplexity Spaces (if content can be semi-public)
└── NO → Is this client-facing or a product?
    ├── YES → Pinecone + ChatGPT Action (or Qdrant + LibreChat)
    └── NO → What's the primary use case?
        ├── Research synthesis → Perplexity Spaces or NotebookLM
        ├── Quick demos or audio synthesis → NotebookLM
        └── Full privacy + low cost → Open Web UI + local models
```

---

## Step 3: Architecture Options and Trade-offs

### Option A: Local Qdrant + Open Web UI
**Best for:** Practitioners with private/confidential content who want full control and are willing to invest setup time.

| Factor | Detail |
|---|---|
| Privacy | Maximum — data never leaves your machine or VPS |
| Technical complexity | 6/10 — requires Docker, Coolify or Hostinger VPS setup |
| Cost | ~$5–20/month VPS hosting; inference costs separate |
| Setup time | 4–8 hours for first deployment |
| Query quality | High, especially for long-form and nuanced content |
| Scalability | Good — Qdrant handles millions of vectors |

**Recommended stack:** Qdrant (vector DB) + Open Web UI (chat interface) + Ollama or Claude API (inference) + Coolify (self-hosting orchestration).

**When to avoid:** If you need clients to access this immediately and have no DevOps support.

---

### Option B: Pinecone + ChatGPT Action
**Best for:** Practitioners who want to deploy a client-facing GPT product without managing infrastructure.

| Factor | Detail |
|---|---|
| Privacy | Moderate — content lives on Pinecone's cloud servers |
| Technical complexity | 4/10 — primarily configuration, minimal coding |
| Cost | Pinecone free tier to ~$70/month depending on volume; OpenAI API costs scale with usage |
| Setup time | 2–4 hours |
| Query quality | High for chunked documents; lower for nuanced reasoning |
| Scalability | Excellent for public-facing use |

**Recommended stack:** Pinecone (vector DB) + OpenAI Embeddings + ChatGPT Custom GPT with Action.

**When to avoid:** Confidential client content; if you prefer not to depend on OpenAI.

---

### Option C: Perplexity Spaces
**Best for:** Research synthesis and public or semi-public content; practitioners who want zero setup friction.

| Factor | Detail |
|---|---|
| Privacy | Low — content is visible to Perplexity |
| Technical complexity | 1/10 — browser-based, no installation |
| Cost | Free to $20/month (Pro) |
| Setup time | Under 1 hour |
| Query quality | Strong for synthesis across sources; weaker for retrieval from specific private documents |
| Scalability | Limited by Space size and Perplexity's rate limits |

**When to avoid:** Any content with confidentiality requirements; if you need to answer questions from your own unpublished frameworks.

---

### Option D: NotebookLM
**Best for:** Audio synthesis (podcast-style summaries), quick demos with clients, and exploratory use before committing to infrastructure.

| Factor | Detail |
|---|---|
| Privacy | Low to moderate — content goes to Google |
| Technical complexity | 1/10 |
| Cost | Free (as of early 2026) |
| Setup time | Under 30 minutes |
| Query quality | Strong for document-grounded Q&A; excellent audio output |
| Scalability | Not suitable as a primary KB; limited sources per notebook |

**When to avoid:** As a primary knowledge base; for confidential content; for anything requiring persistent memory across sessions.

---

### Option E: Open Web UI + Local Models
**Best for:** Full privacy and lowest ongoing cost; practitioners with technical capacity and consumer-grade hardware.

| Factor | Detail |
|---|---|
| Privacy | Maximum — runs entirely on your local machine |
| Technical complexity | 7/10 — requires Ollama setup, model downloads, document ingestion pipeline |
| Cost | $0 ongoing (hardware you already own) |
| Setup time | 2–6 hours depending on hardware |
| Query quality | Depends heavily on model choice; weaker than API models for complex reasoning |
| Scalability | Limited by local hardware |

**When to avoid:** If query quality matters more than cost; if you need to access the KB from multiple devices or share with clients.

---

## Step 4: Minimum Viable Content List

The practitioner almost always has more content than they need. The problem is prioritization. Identify the 10–20 assets that should be ingested first by asking:

1. Which 5 documents contain your most distinctive frameworks or methodologies?
2. Which content do clients most often ask you to repeat, explain, or send?
3. Which content took you the longest to produce and is least likely to be found elsewhere?
4. Which transcripts or notes capture your best thinking at its clearest?
5. What would you most want to be able to ask a question about at 11pm on a Tuesday?

Prioritize: frameworks and methodology documents, your best articles and long-form content, heavily annotated session notes, any content that answers your most frequently asked questions.

Deprioritize for the first version: early drafts, content that duplicates other assets, client deliverables that are highly specific and won't generalize.

---

## Step 5: Chunking and Tagging Strategy

Good retrieval depends on how content is prepared before ingestion. Adapt this based on the chosen architecture.

**Chunk size:**
- Coaching transcripts and long-form articles: 500–800 tokens per chunk with 50-token overlap
- Short-form content (LinkedIn posts, brief notes): 200–300 tokens, minimal overlap
- Structured documents (frameworks, step-by-step guides): chunk by section, not by token count — keep a full step or sub-section together

**Tag taxonomy (recommended minimum):**
- `date` — when was this content created or published?
- `type` — transcript, article, framework, note, client deliverable
- `topic` — 2–4 topic tags from a controlled vocabulary you define in advance
- `framework` — if this content introduces or applies a named framework, tag it
- `audience` — self, client-facing, public

**Metadata fields to always include:**
- Source title or identifier
- Author (important if ingesting content from others)
- Date
- Type

---

## Step 6: Deployment Brief

Use this template to produce a brief that can be handed to a Fiverr or Upwork freelancer if you don't want to implement yourself.

---

**Knowledge Base Deployment Brief**

**Objective:** Build a personal AI knowledge base that allows [me / my clients] to query [X years / X documents] of [type of content].

**Recommended stack:** [Architecture from Step 2]
- Vector database: [e.g., Qdrant self-hosted on Coolify / Pinecone cloud]
- Inference: [e.g., Claude API / OpenAI API / local Ollama]
- Interface: [e.g., Open Web UI / ChatGPT Custom GPT / LibreChat]
- Hosting: [e.g., Hostinger VPS / local machine / cloud]

**Content to ingest:** [X documents, Y total approximate size, formats listed]

**Chunk strategy:** [tokens per chunk, overlap, any section-based rules]

**Tag taxonomy:** [list tags]

**Estimated setup time:** [from architecture table above]

**Testing protocol:**
1. After ingestion, run these 5 test queries: [list your actual queries from Step 1]
2. Verify that results reference the correct source documents
3. Check that at least 3 queries return answers that include source citations
4. Confirm the interface is accessible at [URL / local address]

**Deliverables expected:**
- Running deployment accessible at [URL or local address]
- Brief documentation of how to add new content
- Instructions for querying from [device / browser]

---

## Step 7: Maintenance Protocol

A knowledge base degrades if it is not maintained. Establish these habits from the start:

**Ingestion cadence:**
- Session transcripts: add within 48 hours of session
- New articles and posts: add on publish date
- New frameworks: add when finalized, not when drafted

**Quarterly review:**
- Flag content older than 18 months for review — is it still accurate?
- Check for content that has been superseded by newer frameworks
- Review your most-queried topics — are there gaps that should be filled?

**Version control:**
- When you update a framework, mark the old version as deprecated rather than deleting it — your KB should be able to answer questions about how your thinking has evolved
- Keep a simple changelog (a plain text file works) that notes what was added and when

---

## Architecture Summary Reference

| Architecture | Privacy | Technical | Cost/mo | Setup Time | Best For |
|---|---|---|---|---|---|
| Local Qdrant + Open Web UI | Maximum | 6/10 | $5–20 | 4–8 hrs | Private IP, product-builders |
| Pinecone + ChatGPT Action | Moderate | 4/10 | $20–70 | 2–4 hrs | Client-facing GPT products |
| Perplexity Spaces | Low | 1/10 | $0–20 | <1 hr | Research synthesis, public content |
| NotebookLM | Low–Moderate | 1/10 | $0 | <30 min | Audio demos, quick exploration |
| Open Web UI + Local Models | Maximum | 7/10 | $0 | 2–6 hrs | Full privacy, zero ongoing cost |
| Commission (Upwork/Fiverr) | Depends on stack | 0/10 | Variable | 1–2 weeks | No technical capacity |
