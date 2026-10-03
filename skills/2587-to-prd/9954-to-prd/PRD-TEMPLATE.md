# PRD template

Fill the block between the `<prd-template>` tags. Drop the tags from the final file written to `docs/prds/`.

<prd-template>

# PRD: <Feature title>

- **Status**: draft | accepted | shipped
- **Date**: YYYY-MM-DD
- **Sources**: <links to relevant ADRs in docs/adr/, prior issues, related PRDs>

## Problem Statement

The problem the user is facing, from the user's perspective.

## Glossary

Ubiquitous language for this feature — terms used identically by the business, the PRD, and the code. 5-15 entries, one line each.

```
Term — short definition. (aliases: <other names if any>)
```

Omit only if the feature is genuinely vocabulary-free (pure infra refactor, perf tuning).

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A long, numbered list. Format:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

Extensive — cover all aspects of the feature.

## Implementation Decisions

- Modules to build/modify
- Interfaces to be modified
- Technical clarifications
- Architectural decisions (link to ADRs where relevant)
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets — they rot fast.

## Testing Decisions

- What makes a good test here (test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (similar test types in the codebase)

## Out of Scope

What's explicitly NOT in this PRD.

## Further Notes

Anything else.

</prd-template>
