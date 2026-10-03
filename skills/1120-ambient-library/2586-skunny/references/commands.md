# Command set — natural language → engine

The engine is `chat-ui/skunny.py`. All commands run from that directory.

## Verbs

| User says (examples) | Action |
|---|---|
| "check the feed", "what's the watchlist saying", "anything today?" | Read cached `skunny_feed.html` JSON → summarize. No rerun. |
| "refresh", "update", "latest", "rerun the feed" | `python3 skunny.py --feed` → republish artifact → report deltas |
| "analyze X", "deep dive X", "what's the story on X" | From cached JSON if X present; else `python3 skunny.py X` |
| "full report on X", "publish X" | `python3 skunny.py X` → publish `X_skunny.html` artifact |
| "add X (to watchlist)" | Append line to `watchlist.txt` |
| "remove/drop X" | Delete line from `watchlist.txt` |
| "show watchlist" | Read `watchlist.txt` |
| "what happened lately", "recent answers/episodes" | Read `skunny_episodes.jsonl` (tail) |
| "stack feed", "multi-timeframe view", "what's the bias", "any alerts?" | `cd ../app && ./.venv/bin/python feed_cli.py` (JSON; W/D/H1 stack cards) |
| "stack on X (and Y)" | `feed_cli.py --symbols X,Y` |
| "sort by alerts / bias", "only bullish ones" | `feed_cli.py --sort alerts` / `--bias bullish` |
| "tighter/looser alert threshold" | `feed_cli.py --threshold 0.2` (default 0.35%) |
| "print/PDF the feed" | Headless Chrome: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf=skunny_feed.pdf "file://$PWD/skunny_feed.html"` |

## Config knobs (mirror the Streamlit app's controls)

| User says | Flag / mechanism | Notes |
|---|---|---|
| "tighter swings", "more sensitive", "shorter-term structure" | lower `--n` (e.g. 5) | Default 8. Per-symbol in watchlist: `NVDA 5` |
| "looser swings", "bigger picture", "major structure only" | higher `--n` (e.g. 13) | |
| "longer history", "zoom out" | `--bars 250` (or more) | Default window ~120 bars |
| "weekly view" | Not in CLI (daily bars only). Say so; the Streamlit app has the Weekly/Daily/1h stack — offer `make webapp` | Honest gap, don't fake it |
| "csv/raw data for X" | `python3 skunny.py X --csv` | |

## Asset classes (Yahoo symbol forms — same coverage as the Streamlit app)

| Class | Form | Examples |
|---|---|---|
| Stocks / ETF | plain ticker | `AAPL`, `SPY`, `SII` |
| Crypto | `XXX-USD` | `BTC-USD`, `ETH-USD`, `SOL-USD` |
| FX | `XXXYYY=X` | `EURUSD=X`, `USDJPY=X`, `GBPUSD=X` |
| Indices | `^SYMBOL` | `^GSPC` (S&P), `^NDX`, `^DJI`, `^VIX` |
| Commodities / futures | `XX=F` | `GC=F` (gold), `CL=F` (WTI), `SI=F` (silver) |

Resolution rule: user names an asset in plain English ("gold", "bitcoin",
"the euro", "the S&P") → translate to the Yahoo form above, confirm the
mapping in one clause of the reply ("gold (GC=F) …"), and proceed. If a plain
ticker 404s, try the class-appropriate form before reporting failure.

## Display / composition

- **Feed card view:** the published feed artifact IS the card view. Reuse the
  cached HTML + same artifact URL until refresh is requested.
- **Deep-dive view:** per-symbol `X_skunny.html` published as its own artifact;
  keep one artifact per symbol per session (republish same path to update).
- **Dynamic composition:** when the user asks for a custom view (subset of
  symbols, comparison page, markdown table, JSON dump), compose it FROM the
  cached `skunny-data` JSON — never re-fetch market data just to re-display.
  Write the composed HTML to `chat-ui/` and publish; embed the same JSON block
  pattern so the composed page stays machine-readable.
- Raw exports on request: JSON (pretty-print the data block), markdown table
  (sym/state/door/edge/rn), CSV (`--csv` per symbol).
