---
name: lint
description: Run every linter, formatter check, and typecheck the repository has, and fix to zero
license: MIT
disable-model-invocation: true
---

1. Find what the repository runs: CI workflow steps, package.json scripts, Rakefile, Makefile,
   justfile, mise tasks, pre-commit and lefthook configs. Run the same commands, all of them.
2. Fix every warning and error, pre-existing ones included. Prefer fixing the code over silencing the
   rule. Disable a rule inline only when the code is right and the rule is wrong, and say which.
3. Do not change lint configuration to make the output clean.
4. Rerun until every command exits clean. Report the commands run and the counts fixed. Do not
   commit.
