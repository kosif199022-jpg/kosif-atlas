# {{CAP}}

{{PURPOSE}}

## Install

```sh
curl -fsSL https://raw.githubusercontent.com/coachlou/ambient-library/main/library/ambient-folder/bootstrap.sh \
  | bash -s -- {{CAP}} [target-folder]
```

Re-running the same command is the update path: `.ailib/` refreshes, `.aai/` is left alone.
`--check` reports drift without writing. Requires: {{RUNTIME}}.

## Operate

```sh
./{{LAUNCHER}} --help
```

TODO: two or three lines on the primary journey through `{{LAUNCHER}}`.

## Maintain

- `.aai/` is yours. Edit `identity.md`, `instructions.md`, `context.md` freely.
- `.ailib/{{CAP}}/` is vendored. Never edit; re-run install to update.
- To override behavior, copy into `.aai/skills/{{CAP}}/` and edit there.

## Rules

TODO: the gotchas an agent gets wrong without being told. Delete this section if none.
