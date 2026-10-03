# publish-article v1.0

Take a finished Markdown article and put it live on aimmhub.coachlou.com.
Writing skills end at a draft; this is the last step. It orchestrates only:
the KB half belongs to okf-kb's `inbox/articles` workflow and the deploy half
to aimm-hub's `npm run deploy`. Never re-implement either here.

**Input:** path to a finished `.md` article. **Output:** the live URL, plus the
commit hashes in okf-kb and aimm-hub.

**Default is straight through to live and pushed**: invoking the skill is the
consent. If the user says not to publish ("just save it", "don't deploy",
"stage it"), stop after step 2 and report it as publishable, not published.

## Gotchas

- `git push` in aimm-hub deploys nothing. Only `npm run deploy` goes live.
- The custom domain sits behind Cloudflare Access, so verify on the mirror
  `https://aimm-hub-astro.accounts-0c6.workers.dev/`, not aimmhub.coachlou.com.
- aimm-hub's `content/articles/` is an rsync `--delete` copy of
  `aimm-okf/knowledge/articles/`. Never edit it by hand; fix the concept in
  okf-kb and redeploy.
- Both repos usually have unrelated work in the tree. Stage specific files,
  never `git add -A`.
- Both repos sit outside most session working directories. Request directory
  access first when the harness requires it.
- An article whose slug already exists makes the okf-kb workflow stop and ask
  (update the existing article, or pick a new slug). Pass that question to the
  user; don't choose for them.

## Steps

### 1. Locate and stage (code)

Read the `okf-kb` and `aimm-hub` rows in `~/.aai/context.md`. If either row
is missing, ask the user for the path once and add the row. Then:

```bash
cp "<article.md>" "<okf-kb>/inbox/articles/<slug>.md"
shasum -a 256 "<okf-kb>/inbox/articles/<slug>.md"   # first 12 chars → ledger lookup
grep "<first-12>" "<okf-kb>/.aai/memory/ledger.md"
```

`<slug>` is the kebab-case title unless the user gave one. If the hash is
already in the ledger and `knowledge/articles/<slug>.md` exists, the KB side is
done: skip to step 3.

### 2. Ingest (owned by okf-kb)

Read and follow `<okf-kb>/.aai/instructions.md`, then
`<okf-kb>/inbox/articles/SKILL.md`, for this one file. That workflow writes the
source, the published concept (description, tags and aliases are inference
there), the index, the validation run, the log, the ledger row and the move
into `sources/`, and commits in okf-kb. Then push okf-kb (`git push`), unless
the user said not to publish.

### 3. Deploy (code)

```bash
cd "<aimm-hub>" && npm run deploy
```

This clears the Astro cache, syncs from okf-kb, builds, and runs
`wrangler deploy`. A failure here → report the error output and stop. Don't
retry blind.

### 4. Verify (code)

```bash
curl -s -o /dev/null -w "%{http_code}" https://aimm-hub-astro.accounts-0c6.workers.dev/articles/<slug>/
```

Must be `200`. Anything else means it isn't live, so report that, not success.

### 5. Commit the synced copy (code)

```bash
cd "<aimm-hub>" && git add "content/articles/<slug>.md" && git commit -m "Publish '<title>'" && git push
```

## Report

Two to four lines: the live URL (`https://aimmhub.coachlou.com/articles/<slug>/`),
whether the mirror returned 200, and the okf-kb and aimm-hub commit hashes. If
it stopped early, say at which step and why.
