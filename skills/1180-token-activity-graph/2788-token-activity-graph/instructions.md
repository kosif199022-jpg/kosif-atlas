# token-activity-graph

Builds an interactive self-contained HTML visualization of token usage across Claude Code sessions, aggregated by day, app, and model, with cost calculated from live pricing.

---

## Flow

**1. Verify Claude Code stats exist**

Read `~/.claude/stats-cache.json`. Required fields:
- `dailyModelTokens` — array of `{date, tokensByModel}` objects
- `modelUsage` — object of per-model stats

Exit with "No Claude Code session data found" if missing or empty.

**2. Fetch live pricing**

`GET https://models.dev/api.json` and read `anthropic.models.<model-id>.cost`. Extract per-model:
- `input`, `output`, `cache_read`, `cache_write` ($/1M tokens)

Models with no `cost` (e.g. non-Claude or `:free` variants in the stats) cost $0 — list them in the page footnote.

If cache prices missing, derive: `cache_read = input × 0.1`, `cache_write = cache_read × 3`.

**3. Transform to graph format**

Aggregate dailyModelTokens by date and app into:

```json
{
  "days": {
    "YYYY-MM-DD": {
      "app_name": {
        "in": input_tokens,
        "out": output_tokens,
        "cr": cache_read_tokens,
        "cw": cache_write_tokens,
        "cost": cost_usd,
        "calls": call_count
      }
    }
  },
  "models": {
    "YYYY-MM-DD": {
      "app_name": {
        "model_name": { "in", "out", "cr", "cw", "cost", "calls" }
      }
    }
  }
}
```

**Token split:** each `dailyModelTokens` total is input + output + cache read + cache write combined. Split it with that model's lifetime mix from `modelUsage`: `in = total × inputTokens / Σ`, `out = total × outputTokens / Σ`, `cr = total × cacheReadInputTokens / Σ`, `cw = total × cacheCreationInputTokens / Σ`, where `Σ` is the sum of those four fields. Only when a model is missing from `modelUsage` (or its four fields sum to 0), fall back to input 30% / output 70% and say so in the footnote.

**Calls:** `dailyActivity[date].messageCount`, shared across that day's models by token share.

Cost = `(in × in_price + out × out_price + cr × cr_price + cw × cw_price) ÷ 1,000,000`

**4. Build self-contained HTML**

Create `token-graph.html`:

- **CSS variables** (light/dark @media prefers-color-scheme):
  - `--paper`: #fbfdfd (light), #0f1117 (dark)
  - `--ink`: #202126 (light), #e6edf3 (dark)
  - `--muted`: #6b7280 (light), #8b949e (dark)

- **Font:** SFMono-Regular, Consolas, Liberation Mono (monospace, tabular-nums)

- **Inline data:** `<script type="application/json" id="token-activity-data">` with graph format JSON

- **Renderer:** Inline `${CLAUDE_PLUGIN_ROOT}/library/token-activity-graph/graph.js` verbatim as a `<script>` after the data block. Never fetch it from the web.

- **Mount:** `<div data-token-activity></div>` — renderer auto-mounts

**5. Open in browser**

File must run in a live browser (file:// blocks JS in static preview). Use `open token-graph.html` or drag into browser.

---

## Gotchas

- **graph.js is a pinned, reviewed fork** — inline the bundled copy as-is. Upstream (bentossell.com) falls back to fetching its author's own usage data when inline data is missing or invalid, which would chart someone else's tokens as yours; the fork removes that and shows an error instead. Never swap in a fresh download without re-reviewing it; any re-pin must pass `node ${CLAUDE_PLUGIN_ROOT}/library/token-activity-graph/check-graph.js ${CLAUDE_PLUGIN_ROOT}/library/token-activity-graph/graph.js` (exit 0).
- **Validate the data block before inlining** — `json.loads` it (or `JSON.parse`) and confirm `days` is non-empty. An invalid block now renders an error, not a graph.
- **Claude Code only** — other agents (Codex, Cline, etc.) lack aggregated stats. Skip unless user explicitly includes others.
- **One self-contained file** — move it anywhere, it still works (all data inlined).
- **Never apply 30/70 to the whole dataset** — Claude Code traffic is ~95% cache reads (cheapest rate) and <1% output (dearest). Pricing daily totals as 30/70 input/output overstates cost ~23×; on one real 43-day dataset it gave $195,638 against $8,632 with the lifetime mix.
- **Stats can be stale** — `lastComputedDate` is when Claude Code last rebuilt the cache, not today. Put the date range in the footnote so a gap (and a "0 day streak") isn't read as inactivity.
- **Cache pricing rule:** Mark "3x" as a comment if derived.
- **Local file limitations** — browsers block JS on file:// URLs in some contexts. Instruct user to open in browser directly.

---

## Data source notes

- **dailyModelTokens:** Total tokens per model per day — all four types combined, no split.
- **modelUsage:** Cumulative per-model input / output / cache-read / cache-write counts — the source of the daily split ratios. `costUSD` there is 0; ignore it.
- **Split accuracy:** the lifetime mix is exact in total but approximate per day. 30/70 is a last resort for models without `modelUsage` only.

---

## Output

Confirm: `"Token activity graph ready at [path]. Open in your browser — shows usage by day, app, and model with live list pricing."`
