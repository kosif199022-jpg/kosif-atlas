# Ideal DevOps Pipeline

## Stage 1 — Local Development

Developer implements feature; runs initial tests on local machine.

**Promotion criterion**: commit to VCS → notifies and triggers CI server.

## Stage 2 — CI: Build + Unit Tests

CI server clones repo, runs full automated build (ideally < 10 min), then unit tests.

**Promotion criterion**: clean compile + 100% unit-test pass. Broken build → halt new development; fix becomes top priority.

## Stage 3 — Exhaustive Testing

Several times per day, CI subjects new commits to deeper, slower verification.

**Promotion criterion**: pass integration tests, system/UI tests, performance tests.

## Stage 4 — Deployment / Delivery

Two routes:

- **Continuous Deployment** — fully automatic. All prior tests green → code reaches production within hours.
- **Continuous Delivery** — code is release-ready, but final deploy requires manual approval (release manager / business decision).

## Stage 5 — Production Monitoring (Canary + Feature Flags)

Newly deployed code (often partial / under observation) hidden from end users via Feature Flags.

**Promotion criterion**: Canary release activates feature for ~5% of users. If no toxic bugs/failures → expand gradually to 100%. After full success, flags and old code are removed.

## Promotion gate summary

| From | To | Gate |
|------|----|----|
| Local | CI | Commit pushed |
| CI build | Test | Compile clean |
| Unit | Integration | All units pass |
| Integration | Pre-prod | Integration + system + perf pass |
| Pre-prod | Canary | Manual / automatic per CD vs Delivery |
| Canary | 100% rollout | No toxic bugs in 5% sample |
