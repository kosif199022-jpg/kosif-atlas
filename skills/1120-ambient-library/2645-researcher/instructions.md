# researcher

Gathers sources on a topic and returns a structured research dossier. Single
stage — it does **not** write or edit the piece.

## When to use

When someone says:
- "Research this topic"
- "Find sources on X"
- "Compile background on Y"
- "What's known about Z?" (when they want sourced findings, not a draft)

Not for drafting or editing — those are the `writer` and `editor` skills.

## Instructions

### 1. Confirm the brief

Capture, in one pass, what the research is for: the topic/question, the angle or
decision it feeds, and any depth or recency constraints. If the request already
makes these clear, don't ask — proceed.

### 2. Gather sources

Default to built-in **WebSearch** for discovery and **WebFetch** to read a
specific page. These work for every plugin user with no extra setup.

- Use **Perplexity** (`perplexity_search` / `perplexity_ask`) for lookups only
  if it's available in this session — it returns richer, cited answers.
- Use **Firecrawl** only to scrape a **specific URL** you already have, not for
  open-ended search.

Prefer primary sources. For every claim that matters, capture a URL you can cite.

### 3. Write the dossier

Produce a structured dossier — either inline (if the caller wants it in the
conversation) or as `RESEARCH-<slug>.md` in the working directory, where
`<slug>` is a short kebab-case form of the topic. Structure:

```
# Research: [topic]
*Brief: what this research feeds.*

## Key findings
- **[Claim]** — [one-line evidence]. Source: [URL]

## Supporting detail
[Short paragraphs or bullets grouping the evidence.]

## Open questions / unverified
- [Anything you could not source — name it plainly, do not drop it.]

## Sources
- [Title](URL)
```

### 4. Confirm

Note where the dossier lives (path or inline) and flag the open questions so the
caller knows what's still unverified.

## Rules

- Never fabricate statistics, quotes, studies, or named examples. If a claim
  can't be sourced, list it under "Open questions / unverified" — don't paper
  over it.
- Every load-bearing claim gets a citable URL.
- Distinguish what is known, what is argued, and what is speculative.
- Don't draft the piece. Stop at the dossier.
