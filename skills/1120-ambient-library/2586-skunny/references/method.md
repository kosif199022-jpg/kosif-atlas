# Skunny method — reference guide

Origin: Forex Factory "Indicator Free Trading" thread. Codified here as the
engine (`skunny.py`) implements it. This is the authority when interpretation
and engine output seem to disagree — the engine wins on numbers, this file
wins on meaning.

## Core premise

Price moves in swings. The only tradeable information is the latest completed
swing's two extremes and the Fibonacci grid stretched between them. There are
**no signals**. The method identifies the exact prices where the market must
answer a question, and the discipline is waiting for the answer at a line you
knew about in advance.

## Construction (what the engine does)

1. **Swing points:** fractal extremes — a bar whose high (low) exceeds the
   `n` bars on each side (default n=8; per-symbol override in watchlist).
2. **Alternation:** enforce strict H/L alternation; on repeats the more
   extreme point wins. Result: a clean zigzag.
3. **The leg:** the last two swing points = the latest completed leg.
4. **The grid:** fib retracements 0 / .236 / .382 / .5 / .618 / .786 / 1
   anchored on the leg. 0 = the newer extreme, 1 = the older extreme.

## Vocabulary

| Term | Definition |
|---|---|
| **Door** | The 1.0 level — the older extreme. A close beyond it CANCELS the swing (the structure the map was drawn from is void). |
| **Edge** | The 0.0 level — the newer extreme. A close beyond it RESUMES the leg (trend continuation confirmed). |
| **Breathing band** | .382–.618. Retracement inside it is ordinary respiration, not information. |
| **rn** | Fraction of the leg retraced (0 = at edge, 1 = at door). |
| **Question** | The binary the current price poses at the nearest meaningful line. |
| **Episode** | A logged door-break or leg-resume event — the market answering. |

## States (engine classifier, urgency-sorted)

| State | Meaning | Analyst posture |
|---|---|---|
| AT THE DOOR | Price at/near 1.0. Cancel-or-reject imminent. | Highest attention. Binary pending. |
| DOOR BROKEN / FLOOR BROKEN | Closed beyond 1.0. Swing cancelled; old floor/ceiling flips role. | Watch the retest: does the broken line now cap/support? |
| DEEP RETRACE | Beyond .786 but door intact. Swing in doubt. | The door is next; name it. |
| PULLBACK WINDOW | In the breathing band after a directional leg. | The classic continuation zone — watch for hold + resume through the edge. |
| LEG EXTENDING | Pushing beyond the edge. Trend running. | New swing point will redraw the map; don't chase mid-air. |
| OPEN AIR | Beyond the grid with no mapped line nearby. | No information. Wait for a new turning point to print. |
| BREATHING | Mild retrace < .382. | Nothing to do. Normal. |
| NO STRUCTURE | Fewer than 2 usable swings. | Symbol unmapped; more data or higher n. |

## Episode grammar (the recurring plots)

1. **Poke-and-slam:** price pierces the door intraday, closes back inside —
   swing survives, often violently. 
2. **Clean break:** decisive close through the door — cancellation; the line
   flips (old floor becomes ceiling and vice versa).
3. **Breathing-band bounce:** retrace holds .382–.618 and resumes through the
   edge — the textbook continuation.
4. **The failed resume:** price approaches the edge, can't close through,
   rolls back — early warning the leg is exhausting.

Episodes 1 vs 2 share the same setup (AT THE DOOR) and only the close
distinguishes them — which is why the method forbids acting before the close.

## Relationship to Elliott Wave & classic fib strategy

Skunny is deliberately narrower than Elliott: it takes Elliott's premise
(markets move in waves) but refuses wave-counting's subjectivity — only the
LAST completed leg matters, and its grid is mechanical. When the user asks
Elliott-flavored questions, map honestly:
- A .382–.618 hold-and-resume ≈ Elliott wave-2/wave-4 behavior.
- A door break ≈ invalidation of the impulse count.
- Skunny has no wave labels, no 5-wave forecasts — never bolt them on as if
  the method produced them. Offer Elliott context as *external framing*,
  clearly labeled.
Fib extensions (1.382/1.618 targets) exist in the Streamlit app, not the CLI
grid; treat them as auxiliary, not core Skunny.

## What the method never does

- Never says "buy" or "sell". It says "the question is at 138.03".
- Never acts intra-bar. Closes answer questions; wicks ask them.
- Never predicts. It maps where information WILL arrive.
- Most days, most symbols say nothing. Silence is the method working.
