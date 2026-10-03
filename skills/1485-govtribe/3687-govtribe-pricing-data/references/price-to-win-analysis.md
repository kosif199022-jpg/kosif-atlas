---
title: Price-to-Win Analysis
description: Build an evidence-backed PTW range and pricing posture for one opportunity, including terse context-dependent requests such as “ptw.”
---

# Price-to-Win Analysis

Use this reference when the user asks for price to win, PTW, a target bid range, proposed-price posture, recompete pricing, competitor-pricing inference, or pricing evidence for one opportunity, delivery order, task order, or solicitation.

## Context recovery

A terse prompt such as `ptw` is actionable when the conversation already contains an opportunity, pursuit, delivery order, solicitation, attached pricing files, or a proposed price.

- Recover the active target and available files before asking a question.
- Reuse previously resolved buyer, office, vehicle, incumbent, contract type, period of performance, CLINs, and likely competitors.
- Ask one bounded clarification only when multiple active targets exist or the missing choice materially changes the analysis, such as quick sanity check versus full PTW model.
- Do not respond with a generic definition of PTW when target context is available.

## Goal

Produce a defensible range rather than a single unsupported number, explain the evidence and confidence, compare any proposed price, and identify the pricing actions needed next.

Pricing Data owns the primary range, rate, staffing, FTE, wrap, and comparable-price analysis. When the user needs bid/no-bid, P(win), teaming, or pursuit-posture implications, preserve the result as a capture-analysis handoff without assuming another packaged skill is installed.

## Inputs to resolve

Use the request, active record, and source files to resolve as many of these as possible:

- opportunity, solicitation, task order, or delivery order identifier
- buyer and office
- vehicle and parent contract
- incumbent or predecessor
- contract type and evaluation method
- period of performance and option structure
- scope, CLINs, quantities, labor mix, locations, and service levels
- set-aside and vehicle-access constraints
- historical obligations and value basis
- proposed price, margin floor, or staffing plan
- likely competitors and visible public pricing signals

Proceed with a bounded analysis when some inputs are missing; state what the missing inputs do to confidence.

## Evidence sequence

### 1. Source-package and direct pricing evidence

Inspect the solicitation, pricing sheets, CLIN structure, amendments, Q&A, wage determinations, staffing exhibits, and evaluation language when available. Preserve the value basis of every price signal.

For GovTribe files, resolve the opportunity and attachments with `Search_Federal_Contract_Opportunities` and `Search_Government_Files`. Stage the smallest useful supported package with `Add_To_Vector_Store`, wait until the requested files are ready, and use focused `Search_Vector_Store` queries for pricing instructions, CLINs, evaluation rules, wage determinations, staffing, and amendments. Cite returned source metadata through the external host's native citation format. If a material spreadsheet or unsupported attachment is skipped, use the host's attachment or spreadsheet capability; if none exists, disclose the gap and request a supported export only when it changes the PTW conclusion.

### 2. Direct lineage and historical performance

For a delivery order or task order, trace the child award to the parent IDV or vehicle and gather historical obligations, period of performance, modifications, incumbent, and related orders when available.

Use `Search_Federal_Contract_Awards` to resolve the order or award and related order comparables, `Search_Federal_Contract_IDVs` to resolve its parent instrument, and `Search_Federal_Transactions` when modification or obligation movement matters. Use the bundled federal record-structure and award-value references for stable semantics, and call `Documentation` before relying on freshness-sensitive fields or filters.

Do not treat parent ceiling, maximum value, or total IDIQ obligations as the likely price for one order.

### 3. Comparable awards and line items

Prefer comparables in this order:

1. direct predecessor or prior iteration
2. same office and same vehicle
3. same buyer and tightly similar scope
4. same labor/quantity pattern and geography
5. broader market evidence only when direct comparables are thin

Use awarded state/local line items when unit, quantity, or equipment evidence is relevant. Keep included and excluded comparables visible.

### 4. Labor, staffing, and rate evidence

Use the appropriate bundled pricing guides:

- [Staffing, Wage, and Labor-Category Workflow](./staffing-wage-and-labor-category-workflow.md)
- [BLS Occupational Wage Data MCP Tool](./bls-occupational-wage-data-mcp-tool.md)
- [Search GSA Labor Rates MCP Tool](./search-gsa-labor-rates-mcp-tool.md)
- [Search Service Contract Inventory MCP Tool](./search-service-contract-inventory-mcp-tool.md)

Use staffing and FTE reasonableness checks when the proposed headcount materially drives price. Separate wage, fully burdened cost, bill rate, and ceiling rate.

### 5. Public benchmark versus proprietary actuals

For wrap-rate questions, indirect-rate questions, or competitor pricing:

- clearly state that actual company indirect rates, bid rates, and negotiated margins are generally proprietary unless directly provided or publicly disclosed
- provide planning benchmarks, observed rate relationships, or scenario assumptions instead of presenting a public-data estimate as an actual company rate
- show the assumed fringe, overhead, G&A, fee, or composite multiplier when using a modeled wrap
- distinguish a MAS ceiling rate from a likely task-order rate

## Reconcile the PTW range

Build both views when the evidence supports them:

- top-down market view from predecessor prices, awards, obligations, line items, public rate evidence, buyer behavior, and likely competition
- bottom-up execution view from labor, staffing, quantities, materials, escalation, transition, travel, risk, and fee assumptions

If the views diverge, show the gap and its likely cause. Do not hide it inside one midpoint.

Provide at least three scenarios:

- aggressive / low
- competitive midpoint
- premium / value-supported

For each scenario, state the range, assumptions, likely use case, realism risk, and evidence strength.

## Output contract

For a quick PTW request, return:

- recommended range or target
- proposed-price posture when available
- confidence
- top evidence and assumptions
- one immediate next action

For a fuller analysis, include:

1. target and pricing basis
2. evidence ledger with value basis
3. comparable universe and exclusions
4. top-down range
5. bottom-up range
6. reconciled PTW scenarios
7. proposed-price comparison
8. confidence and missing evidence
9. pricing actions
10. optional capture implications clearly labeled as a handoff

## Normal chained workflows

- If the follow-up is “write the submission email,” “draft the pricing cover note,” or another outbound proposal artifact, preserve the chosen price, assumptions, caveats, and active opportunity, then use the external host's document capability or return a complete Markdown draft when that capability is unavailable.
- If the follow-up asks whether to bid, how PTW affects P(win), or whether a teammate changes the economics, preserve the pricing result as a capture-analysis handoff and clearly separate the new strategic judgment from the pricing evidence.
- These handoffs are expected workflow progression, not routing failures.

## Guardrails

- Use a range, not a magic number.
- Keep facts, assumptions, and inferred competitor posture separate.
- Never imply access to proprietary competitor indirect rates or bid prices without evidence.
- Label ceiling, obligated amount, total potential value, evaluated price, hourly rate, and unit price correctly.
- Do not force external tools when the user supplied enough contract and staffing detail for a useful bounded reasonableness analysis.
- State when evidence is too thin to support more than a directional range.
