<!-- GovTribe Skills generated documentation reference. Do not edit; regenerate from the canonical public GovTribe Docs page. -->

# Vector-store content retrieval

- Canonical GovTribe Docs page: [https://govtribe.com/docs/govtribe-for-agents/guides/vector-store-content-retrieval](https://govtribe.com/docs/govtribe-for-agents/guides/vector-store-content-retrieval)

Use vector-store content retrieval when an agent needs to ask conversational questions of a full source-file package instead of relying only on record metadata or short snippets.

This is the agentic source-package review path for solicitation packages, PWS/SOW files, amendments, Q&A, pricing instructions, exhibits, and workspace files. The common workflow is `Search_Government_Files` to find the source package, `Add_To_Vector_Store` to stage the relevant files, and `Search_Vector_Store` to retrieve source-grounded passages without manually downloading each attachment.

This pattern is for government files and user files staged through `Add_To_Vector_Store`. It is not a GovTribe documentation search, a general GovTribe knowledge base, or a full-document export.

Vector-store retrieval does not cover every file type in a source package. If `Add_To_Vector_Store` reports skipped or unsupported spreadsheet-like files, such as pricing schedules, workbooks, CSV/TSV files, CLIN tables, budget templates, or staffing matrices, use the host's available attachment or spreadsheet capability; when none is available, disclose the coverage gap and request a supported export before making complete package-level claims.

## Solicitation package review workflow

Use this workflow when the user asks for a conversational readout of an entire solicitation package, not just a list of files.

### Choose the starting point

| Starting point | Agent path |
| --- | --- |
| A GovTribe record with files, such as an opportunity, pursuit, IDV, or grant. | Resolve the record first, inspect or search its attached government/user files, then stage the whole file-bearing record when the user wants a full-package read. |
| A specific government-file set. | Resolve exact `government_file` IDs with [Search government files](https://govtribe.com/docs/govtribe-for-agents/tools/search-government-files-mcp-tool) or supplied file links, then stage those selected files. |
| A specific user-file set. | Resolve exact `user_file` IDs with [Search user files](https://govtribe.com/docs/govtribe-for-agents/tools/search-user-files-mcp-tool) or supplied file links, then stage those selected files. |
| A mixed or ambiguous source package. | Resolve the parent record and files separately, stage only the files needed for the question, and call out any missing or ambiguous attachments. |

1. Resolve the target record. Use `Search_GovTribe` when the record type is unclear, or use `Search_Federal_Contract_Opportunities` when the user supplied a solicitation number, notice ID, opportunity title, or GovTribe opportunity link.

2. Find the government files. Use `Search_Government_Files` with the resolved opportunity ID or related parent record. Request stable fields such as `govtribe_id`, `govtribe_url`, `name`, `govtribe_ai_summary`, `posted_date`, and `download_url` when they are useful for source selection. Treat `content_snippet`, `parent_record`, and similar relationship-backed fields as optional evidence; do not rely on them as required linking fields.

3. Stage the smallest useful source set. Use `Add_To_Vector_Store` with either the whole file-bearing opportunity or selected `government_file` IDs. Stage the whole opportunity when the user asks about the full package; stage selected files when the question is limited to one attachment, amendment, or exhibit.

4. Poll until the package is ready. Follow the readiness and retry guidance in the [Add to vector store MCP response](https://govtribe.com/docs/govtribe-for-agents/mcp-tool-responses/add-to-vector-store-mcp-tool-response). Do not make final package-level claims until the response says the requested files are ready.

5. Ask focused source questions. Use `Search_Vector_Store` for scope, deliverables, submission instructions, evaluation factors, pricing rules, required forms, eligibility, security clauses, deadlines, and amendment impacts. Use several focused searches instead of one broad prompt when the answer needs precise evidence.

6. Synthesize with source limits. Treat retrieved chunks as evidence for the answer. Separate confirmed facts from unresolved questions, and state when a required clause, deadline, file, or attachment was not retrieved.

## When to use vector-store retrieval

Use this pattern when the user needs semantic retrieval from file text, such as:

- requirements, clauses, instructions, or risks buried inside a solicitation attachment
- exact supporting evidence from a user-uploaded file
- concept-level matching across long file text where keyword metadata search is too thin
- a focused answer that depends on retrieved chunks from one or more staged files

Use normal search tools first when file metadata, record fields, or `content_snippet` values answer the question.

Do not require `content_snippet` or `parent_record` to continue a source-package review workflow. Some clients or search paths may omit those fields even when the file can still be staged and searched. To link a file back to a parent, prefer the ID you filtered on, the resolved GovTribe URL, file name, and file-source metadata returned by the tool.

## Decide whether to stage files

Prefer the least expensive path that can answer the question.

| User need | Use |
| --- | --- |
| Find records or files by title, parent record, agency, dates, or metadata. | `Search_*` tools, [Search government files](https://govtribe.com/docs/govtribe-for-agents/tools/search-government-files-mcp-tool), or [Search user files](https://govtribe.com/docs/govtribe-for-agents/tools/search-user-files-mcp-tool) |
| Answer from short snippets already returned by file search. | Search tool response plus cited snippets |
| Read requirements, instructions, clauses, or attachments in detail. | `Add_To_Vector_Store` then `Search_Vector_Store` |
| Compare content across several attachments or user files. | Stage the smallest relevant file set, then search the vector store |
| Extract spreadsheet-like pricing schedules, CLIN tables, budget templates, staffing matrices, CSV/TSV files, or workbooks skipped by vector-store retrieval. | use the host's available attachment or spreadsheet capability; when none is available, disclose the coverage gap and request a supported export |
| Analyze a full solicitation package conversationally. | Resolve the opportunity, search attached government files, stage the package, then run focused `Search_Vector_Store` questions |
| Search GovTribe docs or general product knowledge. | Do not use vector-store content retrieval; use the relevant documentation or MCP tool references |

## Before staging files

Resolve the file or file-bearing entity before calling `Add_To_Vector_Store`.

| Check | Guidance |
| --- | --- |
| Supported type | Use only `govtribe_type` values supported by [Add to vector store MCP tool](https://govtribe.com/docs/govtribe-for-agents/tools/add-to-vector-store-mcp-tool). |
| Target scope | Stage the smallest file set that can answer the question. |
| Existing store | Reuse a relevant completed `govtribe_vector_store_id` when the same corpus is already staged. |
| Metadata-only question | Use [Search government files](https://govtribe.com/docs/govtribe-for-agents/tools/search-government-files-mcp-tool) or [Search user files](https://govtribe.com/docs/govtribe-for-agents/tools/search-user-files-mcp-tool) instead when file metadata is enough. |

Supported staged item types currently include file records and selected file-bearing entities such as `government_file`, `user_file`, `pursuit`, `federal_contract_opportunity`, `federal_contract_idv`, and `federal_grant_opportunity`.

## Add files to a vector store

Call `Add_To_Vector_Store` with the resolved items. Omit `govtribe_vector_store_id` to create a new vector store, or include an existing ID to append files to a reusable store.

Tool: `Add_To_Vector_Store`

```json
{
  "items": [
    {
      "govtribe_type": "government_file",
      "govtribe_id": "<GOVERNMENT_FILE_ID>"
    }
  ]
}
```

Capture the returned `govtribe_vector_store_id`. Later steps use that ID for readiness checks and retrieval. If the first call omitted `govtribe_vector_store_id`, add the returned ID to follow-up `Add_To_Vector_Store` status checks while keeping the same source `items`; otherwise an external MCP client can create a new vector store instead of polling the existing operation.

## Interpret `Add_To_Vector_Store` output

Use [Add to vector store MCP response](https://govtribe.com/docs/govtribe-for-agents/mcp-tool-responses/add-to-vector-store-mcp-tool-response) as the source of truth for response shape, text-only client behavior, retry instructions, ready-for-search guidance, and failure handling.

| Output you can see | How to use it |
| --- | --- |
| `Vector store ... has ... completed, ... pending, ... failed` | Treat it as the current readiness snapshot. |
| `Call Add_To_Vector_Store again later with the same source items and this govtribe_vector_store_id` | Poll again with the same source `items` and the returned `govtribe_vector_store_id` before relying on complete package retrieval. |
| `Requested files are ready for Search_Vector_Store` | Search the returned `govtribe_vector_store_id`. |
| `unsupported`, `failed`, skipped spreadsheet-like files, or `Nothing was added` | Review the failure guidance. If the skipped file can affect the answer, use the host's available attachment or spreadsheet capability; when none is available, disclose the coverage gap and request a supported export instead of treating the vector store as complete package coverage. |

## Poll readiness

Follow the Add-to-vector-store response status until the requested files are ready.

| Status | Next step |
| --- | --- |
| `in_progress` | Call `Add_To_Vector_Store` again later with the same source `items` and the returned `govtribe_vector_store_id`. |
| `completed` | Search the vector store with `Search_Vector_Store`. |
| `failed` | Do not assume the requested files are ready for retrieval. Review the failed file names and adjust the source set. |

For complete package analysis, wait until `Add_To_Vector_Store` reports that the requested files are ready for `Search_Vector_Store`. If `Search_Vector_Store` is called too early, it can return a not-ready message. Some clients may return available chunks while other requested files are still pending; treat those results as partial and keep polling before making final package-level claims.

## Search staged file content

Call `Search_Vector_Store` after the vector store is ready. Keep `max_num_results` as small as the question allows.

Focused retrieval:

Tool: `Search_Vector_Store`

```json
{
  "query": "List mandatory deliverables and submission format instructions.",
  "govtribe_vector_store_id": "<VECTOR_STORE_ID>",
  "max_num_results": 5,
  "rewrite_query": false
}
```

Conceptual retrieval:

Tool: `Search_Vector_Store`

```json
{
  "query": "Summarize cybersecurity incident response expectations and reporting deadlines.",
  "govtribe_vector_store_id": "<VECTOR_STORE_ID>",
  "max_num_results": 10,
  "rewrite_query": true
}
```

Treat returned chunks as semantic evidence. They can support an answer, but they are not a full-document export.

## Query construction

| Need | Query guidance |
| --- | --- |
| Specific clause, form, or instruction | Name the exact term, clause, requirement area, or document section and keep `rewrite_query` off. |
| Broader concept | Use a natural-language question and consider `rewrite_query: true`. |
| Too few useful results | Broaden the wording or enable query rewriting. |
| Too many noisy results | Narrow the wording, name the exact requirement area, or lower `max_num_results`. |

For solicitation package reviews, run a small set of focused searches instead of one broad search:

- scope, deliverables, and performance requirements
- submission instructions, volume structure, page limits, required forms, and due-date rules
- evaluation factors, pass/fail requirements, and scoring criteria
- pricing instructions, option-year assumptions, and contract type
- eligibility, set-aside, facility, clearance, cybersecurity, and compliance constraints
- amendments, Q&A, or attachments that change instructions or deadlines

## Examples

Find candidate government files before staging a package:

Tool: `Search_Government_Files`

```json
{
  "query": "PWS SOW Section L Section M proposal instructions evaluation factors",
  "federal_contract_opportunity_ids": ["<FEDERAL_CONTRACT_OPPORTUNITY_ID>"],
  "fields_to_return": [
    "govtribe_id",
    "govtribe_url",
    "name",
    "govtribe_ai_summary",
    "posted_date",
    "download_url"
  ],
  "per_page": 10
}
```

Stage an entire opportunity package when the user asks for a full solicitation package review:

Tool: `Add_To_Vector_Store`

```json
{
  "items": [
    {
      "govtribe_type": "federal_contract_opportunity",
      "govtribe_id": "<FEDERAL_CONTRACT_OPPORTUNITY_ID>"
    }
  ]
}
```

Retrieve source evidence for submission and evaluation rules:

Tool: `Search_Vector_Store`

```json
{
  "query": "Extract proposal volume requirements, page limits, required forms, submission method, and evaluation factors.",
  "govtribe_vector_store_id": "<VECTOR_STORE_ID>",
  "max_num_results": 10,
  "rewrite_query": false
}
```

Stage one file when the question is limited to a specific attachment:

Tool: `Add_To_Vector_Store`

```json
{
  "items": [
    {
      "govtribe_type": "government_file",
      "govtribe_id": "<GOVERNMENT_FILE_ID>"
    }
  ]
}
```

Retrieve clause-level evidence from that file:

Tool: `Search_Vector_Store`

```json
{
  "query": "What cybersecurity reporting, incident response, and access control requirements appear in this attachment?",
  "govtribe_vector_store_id": "<VECTOR_STORE_ID>",
  "max_num_results": 6,
  "rewrite_query": true
}
```

## When not to use it

Do not stage files just because vector retrieval is available. Prefer the normal MCP search path when:

- the question is about record metadata, not file text
- `content_snippet` already answers the question
- the user needs a list of files, not semantic chunks from file contents
- the selected `govtribe_type` is not supported by `Add_To_Vector_Store`

## Related articles

- [Add to vector store MCP tool](https://govtribe.com/docs/govtribe-for-agents/tools/add-to-vector-store-mcp-tool): Review supported item types and staging arguments.
- [Search vector store MCP tool](https://govtribe.com/docs/govtribe-for-agents/tools/search-vector-store-mcp-tool): Review semantic retrieval arguments.
- [Search vector store MCP response](https://govtribe.com/docs/govtribe-for-agents/mcp-tool-responses/search-vector-store-mcp-tool-response): Interpret returned structured results, snippets, and readiness messages.
- [Search government files](https://govtribe.com/docs/govtribe-for-agents/tools/search-government-files-mcp-tool): Search government-file metadata and snippets before staging full text.
- [Search user files](https://govtribe.com/docs/govtribe-for-agents/tools/search-user-files-mcp-tool): Search team-uploaded file metadata and snippets before staging full text.
- [Proposal Workflows with MCP](https://govtribe.com/docs/govtribe-user-guide/govtribe-mcp/govcon-workflows-with-mcp/proposal-workflows): Use the generated Solicitation Package Review prompt as a copy-ready workflow in connected MCP clients.

---

For current tool schemas, parameters, response fields, or freshness-sensitive behavior, call the live `Documentation` MCP tool instead of inferring details from this bundled reference.
