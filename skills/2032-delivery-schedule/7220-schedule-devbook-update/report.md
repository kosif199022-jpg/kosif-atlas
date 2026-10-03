# Devbook update report

The frame and its rules are `../../resources/report-contract.md`. Follow this shape exactly.

```markdown
## Devbook update · <owner/repo> · <YYYY-MM-DD>

**<Verdict: what moved and the draft pull request, or the person's step that is left.>**

### Needs you
| What | Where | Do |
| --- | --- | --- |
| Re-sync the scheduler | the main checkout | `delivery-schedule:update` |

### Moved
| Component | From | To | What changed |
| --- | --- | --- | --- |

### Run
| Outcome | What | Why |
| --- | --- | --- |

*`schedule-devbook-update@<version>` · components <list> · <ISO datetime UTC>*
```

A person's step — a plugin to install, the scheduler to re-sync — is always a *Needs you* row.
