# Pricing Output Quality Checks

Use these checks before delivering pricing workbooks, pricing narratives, rate-support tables, staffing models, or pricing evidence packages.

## Workbook standards
- Use formulas for derived totals, burdens, escalation, option-year rollups, and loaded-rate calculations.
- Avoid hardcoded subtotals unless the user explicitly requests a static exhibit.
- Keep unburdened wage/rate inputs separate from burdened, loaded, or bill-rate outputs.
- Label escalation, fringe, overhead, G&A, fee, and other burden assumptions clearly.
- Include units in headers: hourly rate, annual salary, FTE, hours, quantity, option year, total price, or percentage.
- Add source notes or comments for wage, GSA Schedule, SCI, line-item, and user-provided assumptions.
- Validate formulas for `#REF!`, `#DIV/0!`, `#VALUE!`, `#N/A`, `#NAME?`, `#NUM!`, and `#NULL!`.
- Use the external host's spreadsheet capability to recalculate and render the final workbook when available. If it is unavailable, deliver a validated Markdown or CSV model with explicit formulas and state that workbook rendering was not visually verified.

## Narrative standards
- Keep the pricing conclusion scoped to the evidence type. BLS wage data is not a fully burdened bill rate, GSA Schedule rates are ceilings, awarded line items are context-specific, and SCI is a labor-footprint source.
- Distinguish evidence from recommendation. Do not present a price-to-win target as a definitive customer price without explicit assumptions.
- Explain confidence and missing evidence plainly when direct pricing documents, CLINs, labor mix, or incumbent data are absent.
- For one-page pricing narratives, use the external host's document capability to render and inspect PDF or DOCX output when available. If rendering or visual inspection is unavailable, deliver the validated source narrative plus a Markdown fallback and state what was not visually verified.

## GovCon-specific checks
- Confirm labor categories map to the closest available wage or Schedule evidence and name the proxy limits.
- Check burden/unburdened rate consistency across summary tabs, detail tabs, and narrative text.
- Check base and option year math for escalation, quantity changes, and period-of-performance alignment.
- Keep rate-support citations attached to the assumption or row they support.
- Do not mix federal, state/local, GSA, BLS, or SCI semantics without labeling the source and limitation.

## Delivery note
The final response should explain the pricing artifact and key assumptions in customer language. It should not expose raw validation output. When the host cannot create the requested artifact, deliver the complete Markdown or CSV fallback and explain the unavailable format without dropping the underlying analysis.
