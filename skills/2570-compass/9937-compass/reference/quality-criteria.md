# Quality Criteria

## Internal quality (assessed by specialists)

| Criterion | Definition | How to measure |
|-----------|-----------|----------------|
| **Testability** | how easily code can be unit-tested and isolated | Coverage % — line (C0) or branch (C1) |
| **Complexity** | difficulty understanding/maintaining a single function | Cyclomatic Complexity (CC) — count decision statements + 1 |
| **Cohesion** | class implements a single responsibility | LCOM — pairs of methods not sharing attributes; higher = worse |
| **Coupling** | strength of dependency between classes | CBO — count of other classes a given class depends on |
| **Size** | scale of the codebase | LOC, method count, class count, package count |

## External quality (perceived by users / business)

| Criterion | Definition | How to measure |
|-----------|-----------|----------------|
| **Efficiency / Performance** | good use of computing resources | TPS, throughput, latency, response time (e.g., < 1s for 99% of requests) |
| **Robustness** | keeps running through unexpected failures (network drop, disk fail) | MTTR, % data-loss probability per incident |
| **Reliability / Availability** | uptime serving users free of arch/infra failures | MTBF, contracted SLA % (99.99%, etc.) |
| **Usability** | friendly UI, clear instructions, accessible | training time for new users; A/B-tested funnel conversion |
| **Correctness** | matches specification, no bizarre behavior | bug count caught in CI; incident reports from production |
| **Portability** | recompile / port to new OS or platforms | % of code 100% portable |

## Using these criteria

- Pick the 2–3 that matter most for the system class (Type A / B / C).
- State them as targets in the ADR (Architecture Decision Record).
- Re-check during code review, not just at design time.
