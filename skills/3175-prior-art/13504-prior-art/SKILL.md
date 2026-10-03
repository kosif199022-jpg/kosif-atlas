---
name: prior-art
description: Check arXiv prior art before designing non-trivial architecture, algorithms, or protocols
license: MIT
compatibility: >
  Requires network access to export.arxiv.org, curl, and a host that can spawn
  parallel subagents. No install or dependencies needed.
allowed-tools: Bash Task Agent Read Grep Glob
disable-model-invocation: true
---

# Prior Art

Hours get wasted building something arXiv already solved, with the failure
modes already published. Read it first.

## Pre-flight (run before Phase 1)

This skill is expensive: a real arXiv fetch plus roughly one isolated
Agent call per paper (typically 10-20), plus scoring, clustering, and
convergence. Do not pay that cost when there's no real prior art to find.

**Step 1. Explicit invocation check.**

If the user invoked this skill by name, or explicitly asked to "check
arXiv", "check prior art", or "search for papers on this", **skip the rest
of this section and go straight to Phase 1**. The user opted in.

**Step 2. Self-judge (only if Step 1 did not match).**

Ask yourself three questions. If the answer to any is no, ABORT.

1. **Is there a technical mechanism to research?** Naming a variable,
   wiring a CRUD form, or gluing two documented SDKs together has no
   prior-art question worth asking. Designing a caching strategy, a
   consensus/coordination scheme, a ranking or retrieval approach, an
   ML training or inference technique, a novel protocol, or anything
   where "the naive version breaks at scale" does.
2. **Is the user about to commit real effort to it?** A one-off script
   doesn't earn a literature search. A component that will anchor the
   architecture, or that's expensive to redo once built wrong, does.
3. **Did the user leave the approach open?** If they already named the
   specific algorithm/paper/library to use, or said "just implement it
   the simple way", they've already converged. Don't re-open it. Abort.

If all three checks pass, proceed to Phase 1.

If any fails, ABORT and proceed with the direct implementation. Optionally
append one sentence: *"Say the word if you want this checked against arXiv
prior art first."*

## The loop

Three phases. Fetching is not divergence: it's find real documents, then
read each in isolation, then converge. Skipping the isolation step turns
this into an LLM guessing about papers it hasn't actually read.

### Phase 0: Categorize

Map the build problem onto 3-5 arXiv subject categories and 3-6 concrete
search terms (the technical mechanism words: "cache invalidation", not
"caching system"). Pick from the table below, or name another category id
if you're confident of it.

| Category | Covers |
|---|---|
| cs.AI | general AI systems, agents, planning, knowledge representation |
| cs.LG | learning algorithms, training methods, model architectures |
| cs.CL | NLP, language models, text processing |
| cs.CV | image/video understanding, generation, perception |
| cs.IR | search, ranking, recommendation, retrieval-augmented systems |
| cs.DC | distributed systems, consensus, sharding, replication, scheduling |
| cs.DB | storage engines, query processing, indexing, transactions, consistency |
| cs.SE | development practices, testing, program analysis, tooling |
| cs.PL | language design, type systems, compilers, runtimes |
| cs.CR | protocols, authentication, adversarial robustness, privacy |
| cs.NI | routing, congestion control, edge/CDN |
| cs.OS | kernels, schedulers, memory management, virtualization |
| cs.HC | interface design, usability, interaction models |
| cs.MA | coordination, negotiation, emergent behavior among agents |
| cs.RO | control, perception, manipulation, motion planning |
| cs.DS | algorithmic techniques, complexity, data structure design |
| cs.GT | mechanism design, auctions, incentive-compatible systems |
| stat.ML | statistical learning theory, probabilistic models |
| eess.SP / eess.SY | signal processing / control theory |
| math.OC | optimization, scheduling, resource allocation |

If the problem is pure product/business framing with no obvious technical
mechanism, say so plainly, but still commit to a best-effort technical
angle. Most build problems have one (caching, consistency, ranking,
scheduling, retrieval) even unphrased.

### Phase 1: Fetch (real HTTP, no summarization)

Fetch arXiv's export API with `curl`. **Do not use WebFetch here.** It
passes the response through a summarizing model, and a paraphrased abstract
still looks like an abstract, so the corruption is silent and every
downstream citation inherits it.

**The query must be URL-encoded.** Phase 0 produces multi-word terms, and a
literal space or `"` in the URL returns zero entries with no error at all.
Wrap each phrase in `%22`, use `+` for the spaces inside it, and `%28`/`%29`
for the OR group:

```bash
curl -s 'https://export.arxiv.org/api/query?search_query=cat:cs.DC+AND+%28all:%22cache+invalidation%22+OR+all:%22cache+coherence%22%29&start=0&max_results=4&sortBy=relevance&sortOrder=descending'
sleep 3
```

arXiv asks for one request at a time with a few seconds between them, so
chain the categories in a single Bash call with `sleep 3` between each.

Read each `<entry>` straight out of the Atom XML: `id`, `title`, `summary`
(the abstract), `author`, `published`, and the `abs`/`pdf` links. Every
field is ground truth. Never state a paper detail that was not in the
response.

If a category returns fewer than 2 entries, retry it with the terms dropped
(`search_query=cat:<CATEGORY>` alone). Don't pad the result set with
irrelevant hits to hit a target count. If everything comes back thin, say so
in the output rather than manufacturing findings.

If the fetch fails or the network is blocked, abort and say so. Never fall
back to papers you remember. Recalled citations are the exact failure this
skill exists to prevent.

### Phase 2: Diverge (read each paper in isolation)

For every paper collected in Phase 1, spawn one general-purpose subagent,
all of them in a **single message** so they run concurrently. Each subagent
gets only:

- the build problem
- that ONE paper's title, abstract, authors, year, and no other paper
- the instruction below

> You are in DIVERGENT READ mode. You have exactly one paper's title and
> abstract, and one build problem. You do not know what other papers
> exist. Do not assume, invent, or gesture at a broader survey.
> Read this abstract as if scouting prior art for someone about to build
> the stated thing from scratch. Never quote the abstract verbatim beyond
> a few consecutive words, paraphrase in your own words.
> Extract: approach (1-2 sentences, the core mechanism), borrow (1
> sentence, the single most concrete implementable takeaway, imperative:
> "Use X to do Y"; if too tangential, say so plainly), limitation (1
> sentence, the load-bearing weakness or breaking condition), relevanceNote
> (1 short clause on fit to the stated problem).
> Output JSON only: `{"approach":"...","borrow":"...","limitation":"...","relevanceNote":"..."}`

**Critical invariant.** These calls must be parallel and isolated. A read
that has seen other papers' abstracts starts summarizing the SET instead
of grounding in the ONE paper in front of it, a subtle failure that is
easy to miss because the output still looks paper-specific.

If this skill is already running inside a subagent that cannot fan out,
read the papers sequentially in context instead, and say so in the output.
The isolation guarantee is weaker there, so treat the reads as suspect.

### Phase 3: Converge (one path, not a shortlist)

After all reads return:

1. **Score.** Rate each reading 0-10 on: relevance (fit to the stated
   problem), practicality (buildable by a small team without exotic
   infra), rigor (does the abstract itself claim real evidence such as
   benchmarks, proofs, or a shipped system, vs pure concept). Rigor scores
   what the abstract asserts, never what the paper might contain. Flag a
   "trap" when a paper's own stated limitation implies a failure mode a
   builder would otherwise rediscover the hard way. Always pair it with a
   "strength": the one concrete thing that paper's approach gets right.
2. **Cluster.** Group readings into 3-6 clusters by underlying
   architectural angle (not by paper, not by keyword): "cache-invalidation
   plays", "consensus-free plays", "learned-index plays".
3. **Pick ONE.** Choose the cluster with the strongest relevance +
   practicality combination. Not the most novel, not the most cited, the
   one an engineer should actually build. This is the point of departure
   from wide-open brainstorming: this skill commits to a single
   recommendation, because "here are 4 papers, you decide" is exactly the
   time-wasting it exists to prevent.
4. **Synthesize.** For the chosen cluster, produce: a 4-8 sentence
   implementation sketch (actionable, not a lit-review summary), citations
   (paper id + title + url + role: "primary mechanism" / "supporting
   evidence" / "failure mode to avoid", grounded only in fetched data),
   the first concrete step, the load-bearing risk, and an "avoid" list
   pulled from every paper's limitation (not just the winner's; a pitfall
   named by a paper in a rejected cluster is still worth avoiding).
5. **Name the runner-ups.** One honest sentence per non-chosen cluster on
   the real trade-off that lost it the pick. Not a dismissal: the
   builder should be able to switch paths later knowing why.
6. **One open thread.** A question the read papers raise but don't
   answer, worth a design-review checkpoint before shipping.

## Output shape

Fill this template. THE PATH is the deliverable, so keep it visually
dominant rather than buried under the paper list.

````markdown
## Searched
Categories: `<ids>` | Terms: `<terms>` | Papers read: `<n>`

## Papers read

### <cluster angle>
- `<arxiv-id>` **<title>** `[rel8 prac6 rig7]`
  <one-line approach>

## Prior-art pitfalls
- `<arxiv-id>`: <the paper's own limitation, stated as the trap it implies>

## THE PATH: <chosen cluster>

<4-8 sentence implementation sketch, actionable, not a lit review>

**Citations**
- `<arxiv-id>` <title> <url> (primary mechanism)
- `<arxiv-id>` <title> <url> (supporting evidence)
- `<arxiv-id>` <title> <url> (failure mode to avoid)

**First step:** <one concrete action>
**Load-bearing risk:** <the assumption that breaks everything if wrong>
**Avoid:** <limitations pulled from every cluster, not just the winner's>

## Alternates considered, not chosen
- **<cluster>**: <the real trade-off that lost it the pick>

## Open thread
<question the papers raise but don't answer, worth a design-review checkpoint>
````

## Anti-patterns

- **Cross-contaminated reads.** If a paper's read mentions "compared to
  the other papers here" or "collectively these show", isolation broke.
  Discard and re-run that read alone.
- **Inferring from the title.** If a detail is unclear, re-fetch. Don't
  reason it out from the title.
- **Shortlist-as-cop-out.** Ending Phase 3 with "here are 3 good options"
  instead of one recommendation defeats the purpose. Commit.
- **Padding a thin result set.** Zero or few relevant papers is a valid,
  useful finding: it means the mechanism is either genuinely novel or the
  search terms were wrong. Say so. Don't stretch tangential papers to look
  like coverage.
- **Treating a paper's abstract as the whole paper.** The abstract is a
  pointer, not ground truth about implementation details it doesn't state.
  The "borrow" and "avoid" items should stay at the level of what the
  abstract actually supports.

## Calibration

- **How many papers?** Default 4 per category × 3-5 categories ≈ 12-20
  papers. Scale down for narrow/well-known mechanisms (2 per category is
  enough when the space is small), up for genuinely unclear territory.
- **When to stop widening?** If a category-only retry (terms dropped)
  still returns nothing usable, say so and move on. Don't cascade into
  unrelated categories chasing a result count.

## Cost

1 categorize + N isolated reads (typically 12-20) + 1 score + 1 cluster +
1 converge ≈ N+4 Agent-shaped calls, plus real arXiv HTTP fetches (~3s
courtesy delay between categories). Not for every design decision, only
the ones where getting the architecture wrong costs real rework.
