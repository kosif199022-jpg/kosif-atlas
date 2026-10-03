# What's new report

The frame and its rules are `../../resources/report-contract.md`. Follow this shape exactly.

```markdown
## What's new · <owner/repo, …> · <YYYY-MM-DD>

**<Verdict: how much moved, and the one item worth opening first.>**

### Needs you
| What | Where | Do |
| --- | --- | --- |
| Merged, but its issue is still open | [#<pr>](<url>) → [#<issue>](<url>) | `gh issue close <issue> -R <owner/repo>` |
| Open, but its ticket is already done | [#<pr>](<url>) → [<KEY-1>](<url>) | [review](<url>) |
| No ticket linked | [#<pr>](<url>) | — |

### <owner/repo> — merged
| What | Where | Author | Ticket |
| --- | --- | --- | --- |
| <own words, 8 at most> | [#<n>](<url>) | <login> | [<KEY-1>](<url>) `done`, or — |

### <owner/repo> — open
| What | Where | Author | State | Ticket |
| --- | --- | --- | --- | --- |
| <own words> | [#<n>](<url>) | <login> | `new` or `updated` | [#<n>](<url>) `open`, or — |

### Run
| Outcome | What | Why |
| --- | --- | --- |

*`schedule-whats-new@<version>` · since <timestamp, or first run: last <n> days> · <ISO datetime UTC>*
```

One merged and one open section per repository, in the order given. A repository with
nothing new is a `skipped` row under *Run*: `nothing since <timestamp>`. The follow-up
candidates are the *Needs you* rows; unattended, nobody is asked.
