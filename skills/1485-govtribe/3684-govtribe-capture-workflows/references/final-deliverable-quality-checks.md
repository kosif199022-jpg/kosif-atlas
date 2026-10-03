# Final Capture Deliverable Quality Checks

Use these checks before delivering capture artifacts such as acquisition briefs, market research white papers, bidder lists, subcontractor/contact research, gap analyses, PTW briefs, pipeline summaries, and pursuit memos.

## Evidence and recommendation separation
- Separate retrieved evidence from interpretation and recommendation.
- Label low-confidence assumptions, missing source documents, weak incumbent lineage, and thin comparable sets.
- Keep direct evidence near the recommendation it supports.
- Do not overstate a vendor's fit, buyer intent, likely bidders, or price posture when evidence is only directional.

## Executive-ready format
- Open document-style outputs with the decision, ranking, or action the customer can use.
- Use narrow tables for rendered briefs. Move full evidence universes, raw scorecards, long contact lists, and normalization details to CSV/XLSX/JSON companions.
- Prefer XLSX over raw CSV for customer-facing contact, subcontractor, or comparable lists when formatting, source notes, filtering, or multiple tabs improve usability.
- Keep charts and visuals labeled, readable, and tied to the story. Prefer `Show_Chart` for supported inline charts; otherwise use a provider-neutral host chart capability or a labeled Markdown table with CSV/JSON companion data.
- Remove placeholders, internal paths, debug text, model/tool identifiers, and raw prompt or tool dumps.

## Deliverable-specific checks
- Acquisition briefs and market white papers should have clear scope, key takeaways, evidence tables, implications, and next actions.
- Subcontractor and contact lists should include source basis, role fit, relevant past work or buyer connection, and outreach caveats.
- Gap analyses should distinguish missing evidence from actual capability gaps.
- Bid/no-bid, black-hat, and likely-bidder briefs should avoid raw scoring dumps in the rendered memo.
- PTW outputs should carry pricing confidence and missing-price-document caveats.

## File-specific QA
- Use the external host's provider-neutral rendering and visual-inspection capability for PDF, Word, presentation, or spreadsheet outputs.
- Preserve source templates, links, headings, table width, page-flow, formula, and workbook checks before delivery.
- When rendering or visual inspection is unavailable, deliver the validated source artifact plus a Markdown or CSV fallback and state exactly what was not visually verified.

## Delivery note
The final response should describe the customer-facing artifact, confidence, and next action. It should not expose internal QA mechanics.
