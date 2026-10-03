# rxjava-dofinally-terminal-then-finally-test-race

An RxJava test that asserts a side effect of `doFinally` (a released semaphore permit, a decremented in-flight gauge, a closed resource) immediately after `TestObserver.await()` / `blockingGet()` is racy BY CONSTRUCTION: the operator delivers the terminal event to the downstream observer FIRST and runs the finally action AFTER, so the awaiting thread can observe the pre-release state. Use when: (1) CI fails with something like "permits should be returned once the held requests complete ==> expected: <0.0> but was: <1.0>" while the same test passes locally and in other parameterizations, (2) deciding whether such a failure is a REAL resource leak or a test-harness race, (3) writing tests around `doFinally`-based cleanup and choosing between asserting immediately and polling, (4) tempted to claim "fixed locally, 5/5 green" for a race your machine never reproduced. Covers the RxJava source proof, the leak-vs-race differentiation signals, the polling-assert fix, and the control experiment that tells you whether local runs mean anything.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/voitta-ai/skillz/tree/feb9ceb0539f8f65355406ff1d5789c28c17a512/plugins/rxjava-dofinally-terminal-then-finally-test-race
- Commit: `feb9ceb0539f8f65355406ff1d5789c28c17a512`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
