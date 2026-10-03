<!-- GovTribe Skills generated documentation reference. Do not edit; regenerate from the canonical public GovTribe Docs page. -->

# Date filtering

- Canonical GovTribe Docs page: [https://govtribe.com/docs/govtribe-for-agents/guides/date-filtering](https://govtribe.com/docs/govtribe-for-agents/guides/date-filtering)

Use date filters when a GovTribe MCP search request needs a time-bounded cohort, such as recent awards, upcoming response deadlines, open ordering windows, or forecasted release dates.

## Date range shape

Most date range filters use an object with `from` and `to` keys:

```json
{
  "award_date_range": {
    "from": "2026-01-01",
    "to": null
  }
}
```

Keep both keys in the request. Set an open-ended side to `null`.

## Date values

Use fixed dates when the result should be reproducible, such as `2026-03-02`. Use date math when the request is intentionally relative to run time, such as `now-90d/d`, `now/d`, or `now+30d/d`.

## Choosing a date field

Pick the date field that matches the user's intent, then confirm the field exists on the selected MCP tool page.

| User intent | Common field |
| --- | --- |
| Awards issued during a period. | `award_date_range` |
| Opportunities posted during a period. | `posted_date` |
| Opportunities due during a period. | `due_date_range` |
| Current contract or award completion timing. | `current_completion_date_range` |
| Ultimate contract or award completion horizon. | `ultimate_completion_date_range` |
| IDV ordering deadline. | `last_date_to_order_range` |
| Forecasted solicitation timing. | `estimated_solicitation_release_date_range` |
| Forecasted award start timing. | `anticipated_award_start_date_range` |

For aggregation-first scans, apply the date filter before requesting aggregations so the rollup summarizes the intended cohort.

## Common date tasks

### Recent records

Use recent windows for questions about what changed, posted, or awarded recently. Use date math when the answer should always be relative to the time the agent runs.

Tool: `Search_Federal_Contract_Awards`

```json
{
  "award_date_range": {
    "from": "now-90d/d",
    "to": "now/d"
  },
  "fields_to_return": ["govtribe_id", "name", "award_date", "dollars_obligated"],
  "sort": {
    "awardDate": "desc"
  }
}
```

### Upcoming deadlines

Use due-date filters for bid, proposal, application, or response deadlines. A future `from` value avoids closed records when the user is asking what they can still act on.

Tool: `Search_Federal_Contract_Opportunities`

```json
{
  "due_date_range": {
    "from": "now/d",
    "to": "now+30d/d"
  },
  "fields_to_return": ["govtribe_id", "name", "due_date", "federal_agency"],
  "sort": {
    "dueDate": "asc"
  }
}
```

### Completion and recompete windows

Use `current_completion_date_range` on federal contract award records when the user asks about the current completion date. Use `ultimate_completion_date_range` when the question is about the latest possible completion date across options or extensions.

Tool: `Search_Federal_Contract_Awards`

```json
{
  "current_completion_date_range": {
    "from": "now/d",
    "to": "now+12M/d"
  },
  "fields_to_return": [
    "govtribe_id",
    "name",
    "completion_date",
    "ultimate_completion_date",
    "awardee",
    "contracting_federal_agency"
  ],
  "sort": {
    "completionDate": "asc"
  }
}
```

### Forecast timing

Use forecast-specific date fields when the user asks about expected solicitation release timing or anticipated award start timing.

Tool: `Search_Federal_Forecasts`

```json
{
  "estimated_solicitation_release_date_range": {
    "from": "now/d",
    "to": "now+6M/d"
  },
  "fields_to_return": [
    "govtribe_id",
    "name",
    "estimated_solicitation_release_date",
    "estimated_award_start_date",
    "federal_agency"
  ],
  "sort": {
    "estimated_solicitation_release_date": "asc"
  }
}
```

### Vendor and certification dates

Use vendor date filters for registration, renewal, recent-award activity, and SBA certification timing.

Tool: `Search_Vendors`

```json
{
  "vendor_sba_hubzone_expiration_date_range": {
    "from": "now/d",
    "to": "now+6M/d"
  },
  "sba_certifications": ["HUBZone"],
  "fields_to_return": [
    "govtribe_id",
    "name",
    "uei",
    "sba_cert_hubzone_expiration_date"
  ]
}
```

## Examples

Aggregation over a date-bounded award cohort:

Tool: `Search_Federal_Contract_Awards`

```json
{
  "award_date_range": {
    "from": "now-12M/d",
    "to": "now/d"
  },
  "aggregations": ["dollars_obligated_stats"],
  "per_page": 0
}
```

Open-ended posted-date filter:

Tool: `Search_Federal_Contract_Opportunities`

```json
{
  "posted_date": {
    "from": "2026-01-01",
    "to": null
  },
  "fields_to_return": ["govtribe_id", "name", "posted_date", "due_date"]
}
```

Fixed-date state and local opportunity window:

Tool: `Search_State_And_Local_Contract_Opportunities`

```json
{
  "due_date_range": {
    "from": "2026-05-01",
    "to": "2026-05-31"
  },
  "state_ids": ["VA"],
  "fields_to_return": ["govtribe_id", "name", "due_date", "state"]
}
```

## Related articles

- [MCP tools](https://govtribe.com/docs/govtribe-for-agents/tools): Review the exact date filters supported by each search tool.
- [Aggregations and leaderboards](https://govtribe.com/docs/govtribe-for-agents/guides/aggregations-and-leaderboards): Use date-bounded cohorts for rollups, rankings, and KPI summaries.
- [Search federal contract awards](https://govtribe.com/docs/govtribe-for-agents/tools/search-federal-contract-awards-mcp-tool): Review award-date, current completion-date, and ultimate completion-date filters.
- [Search federal contract opportunities](https://govtribe.com/docs/govtribe-for-agents/tools/search-federal-contract-opportunities-mcp-tool): Review posted-date and due-date filters on a federal opportunity search tool.
- [Search vendors](https://govtribe.com/docs/govtribe-for-agents/tools/search-vendors-mcp-tool): Review vendor registration and certification date filters.

---

For current tool schemas, parameters, response fields, or freshness-sensitive behavior, call the live `Documentation` MCP tool instead of inferring details from this bundled reference.
