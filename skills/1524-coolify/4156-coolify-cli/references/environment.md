# Environment variables

Read before creating, updating, importing, or troubleshooting Coolify environment variables.

## Inspect scope

Use the owning resource's `app env`, `service env`, or `database env` commands. Application `env list` shows regular
variables by default; `--preview` selects preview variables and `--all` includes both in the checked CLI.

```sh
# Shell supporting pipefail; preserve a failed CLI exit when piping.
set -o pipefail
coolify --context "$COOLIFY_CONTEXT" --format json app env list "$APP_UUID" --all |
  jq '[.[] | {uuid, key, is_preview, is_build_time, is_runtime, is_literal, is_multiline}]'
```

Inspect key, UUID, preview identity, and scope flags. For duplicate keys, prefer a UUID for lookup and inspect how the
installed update command targets its write. Passing a UUID does not guarantee UUID-based mutation: the checked
application update resolves the variable, then sends its key and supplied fields. Resolve scope ambiguity before
writing.

Application env list/get mask values unless `--show-sensitive` is set in the inspected implementation. This does not
establish redaction for other commands or versions. Filter output before returning it. Read sensitive values only as
needed, and never reuse a masked placeholder as a secret.

## Create and update

Examples use a nonsecret value; choose values and scopes from the task:

```sh
# New variable available only at runtime
coolify --context "$COOLIFY_CONTEXT" app env create "$APP_UUID" \
  --key LOG_LEVEL --value info --build-time=false --runtime=true

# Omitted optional update fields are preserved by the checked implementation
coolify --context "$COOLIFY_CONTEXT" app env update "$APP_UUID" "$ENV_UUID" \
  --value warn
```

Application update requires `--value` even when changing another field. The checked command requires Coolify server
`4.0.0-beta.469+`. Do not resend guessed or masked values to change metadata.

Use `--flag=false` to disable a Boolean flag. Creation help lists build-time and runtime defaults as true; pass explicit
scopes when they matter. Update sends optional fields only when their flags change, so do not impose creation defaults
on existing variables.

`--is-literal` controls interpolation; `--is-multiline` marks multiline values. Preserve intentional interpolation
expressions. Service env commands lack application previews, and database flags differ; inspect their own help.

Keep secret values out of recorded command literals and shell tracing. Pass values from authorized secret sources
locally without printing them. For file-based operations, use a narrowly scoped protected file and retain only what the
task requires.

## Import a file

```sh
coolify --context "$COOLIFY_CONTEXT" app env sync "$APP_UUID" \
  --file "$ENV_FILE" --build-time=false --runtime=true
```

Sync updates existing keys and creates missing keys. It does not delete remote keys absent from the file. The checked
command has no documented dry-run flag. To preview changes, compare local and remote key/scope metadata without issuing
sync.

Explicit scope flags apply across the imported set. Split mixed build/runtime or preview imports into appropriately
scoped operations. Do not assume sync handles duplicate regular/preview keys safely; inspect installed behavior first.

Treat partial failure as partial application. Read back affected keys before retrying and verify scopes and values
privately as needed. Sync emits progress text even with `--format json`; check its exit status and per-operation
outcome.

## Shared variables and activation

`shared-env --help` exposes team, project, environment, and server scopes. Resolve the owning scope and intended
consumers before changing an inherited value. Use a resource-specific setting when that is the requested scope.

Read affected metadata back after an update. Verify values privately if required, reporting only the match result. Saved
configuration does not prove running containers loaded it. Redeploy or restart as required by the change and authorized
scope, then verify application behavior.

Sources: [env commands](https://github.com/coollabsio/coolify-cli#application-environment-variables),
[update handling](https://github.com/coollabsio/coolify-cli/blob/76ca47187a0c34b6f68c5c44b192fc457749e2c7/cmd/application/env/update.go),
[sync behavior](https://github.com/coollabsio/coolify-cli/blob/76ca47187a0c34b6f68c5c44b192fc457749e2c7/cmd/application/env/sync.go),
and
[JSON formatting](https://github.com/coollabsio/coolify-cli/blob/76ca47187a0c34b6f68c5c44b192fc457749e2c7/internal/output/json.go).
