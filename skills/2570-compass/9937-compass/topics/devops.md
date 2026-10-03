# Raw — DevOps

For the five-stage pipeline with promotion gates (Local → CI → Exhaustive Testing → Deployment → Production Monitoring), see [reference/devops-pipeline.md](../reference/devops-pipeline.md).

## 1. Concepts

### DevOps
- **Definition**: culture integrating Development and Operations from project start; automates the delivery cycle.
- **Solves**: kills siloed teams; prevents traumatic deploys, last-minute incompatibilities, inter-team friction.

### Distributed Version Control (DVCS / Git)
- **Definition**: peer-to-peer architecture where each developer has a full local repository.
- **Solves**: enables offline work, fast commits, history control; allows team collaboration without overwriting peers' code.

### Continuous Integration (CI)
- **Definition**: practice (born in XP) where developers integrate code into the main branch frequently (e.g., daily), triggering automation.
- **Solves**: prevents Integration Hell from long-lived isolated branches.

### Continuous Deployment (CD)
- **Definition**: every commit integrated into main goes to production quickly and automatically.
- **Solves**: eliminates the stress of large-scale deadline launches; gives immediate user feedback.

### Continuous Delivery
- **Definition**: code on main is always release-ready, but the final deploy requires human/business approval.
- **Solves**: keeps strategic control of deployment for systems where invisible updates aren't tolerated.

### Feature Flags / Toggles
- **Definition**: boolean variables hiding incomplete code in production.
- **Solves**: lets CI continue with unfinished features without breaking user experience.

## 2. When to Use

- **DevOps automation** — when deploys cause delays (weekend work), require manual intervention, or hit hardware/DB mismatches at the last minute.
- **Git / Pull Requests** — every project regardless of size; PR-and-fork model is the standard for distributed teams and open source.
- **Continuous Integration** — collaborative teams. The CI server fires every time multiple developers push to the shared base.
- **Continuous Deployment** — Web/SaaS where the user doesn't install anything locally.
- **Feature Flags** — Canary releases (5% sample), production A/B tests for behavioral validation.

## 3. When NOT to Use

- **Strict CI** — open source, where volunteer contributions aren't on a daily controllable cadence.
- **Automatic Continuous Deployment** — desktop, mobile, embedded — daily forced updates disrupt user operations. Use Continuous Delivery instead.
- **Permanent feature flags** — release flags must not become legacy code; clean them up as soon as the old branch is obsolete.

## 4. Smells

- **Integration Hell** — cascading bugs after months of isolated development, days of manual merge resolution. Caused by long-lived feature branches.
- **CI Theater** — robust CI server building local commits, but no actual integration into mainline → false sense of agility.
- **Broken build ignored** — server reports failure on a commit, devs keep coding new features instead of stopping to fix.
- **Traumatic / manual deploys** — error-prone manual scripts; deploys started Friday with weekend-long firefights expected.

## 5. Operational Checklist

- [ ] Version everything in Git: code, pages, configuration, infra scripts.
- [ ] Commit locally and push remotely frequently — ideally daily.
- [ ] Adopt trunk-based development; eliminate long-lived feature branches.
- [ ] Configure CI servers with fast builds (ideally < 10 min) running on 100% of commits.
- [ ] On any broken build → halt new development, fix immediately or revert to last green.
- [ ] Block submissions if unit tests or coverage regress.
- [ ] Wrap in-progress features with feature flags on the main branch.
- [ ] Squash temporary commits into a clean atomic logical commit before opening a PR.
- [ ] Use Pull Requests for peer review before merging.

## 6. Examples

- **Developer flow** — `git add` / `git commit` / `git push` → CI server picks up → tests + build → merge gate.
- **Feature flag routing** — `if (featureEnabled("newCheckout")) { newFlow(); } else { oldFlow(); }`

## 7. Trade-offs

- **Monorepo vs Multirepo** — Monorepo: single source of truth, atomic large-scale refactors, needs custom navigation tooling. Multirepo: clean isolation per project/team, but fragments cross-repo changes and dependency tracking.
- **Continuous Deployment vs Continuous Delivery** — Deployment: fastest cadence, no human bottleneck. Delivery: same automation, retains the final manual button — vital for clients who can't accept silent installs.
- **Trunk-based vs Feature Branches** — Trunk-based: kills merge hell via daily integration, requires strict feature-flag discipline. Long branches: comfort of isolation, but main drifts and merging becomes catastrophic over time.

## 8. Cross-references

- **Agile / XP** — CI was formalized in Extreme Programming. DevOps culture extends agile values into the last operational mile.
- **Requirements** — Continuous Deployment closes the loop on abstract specs; released versions measure market requirements via real usage (A/B tests behind feature flags).
- **Testing** — CI collapses without a fast, dense suite of unit tests as the base; without it, false positives flood the pipeline.
