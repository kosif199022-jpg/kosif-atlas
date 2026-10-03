# Resource operations

Read the relevant section. Variables below stand for verified task values. Inspect command help before adapting recipes
to another version.

## Inventory

Read commands include `server list`, `project list`, `project get`, `project environments list`, `resource list`,
`app list`, `database list`, `service list`, and `team current`.

```sh
coolify --context "$COOLIFY_CONTEXT" --format json project list
coolify --context "$COOLIFY_CONTEXT" --format json project get "$PROJECT_UUID"
coolify --context "$COOLIFY_CONTEXT" --format json resource list
coolify --context "$COOLIFY_CONTEXT" --format json server get "$SERVER_UUID" --resources
```

Inspect `app get`, `database get`, or `service get` for the selected UUID. Filter sensitive details before exposing
output. A resource may be an application, standalone database, or service stack. Service children have both a parent
service UUID and their own UUIDs.

## Deploy and verify

Resolve the repository, branch or commit, image, and environment from the request and application configuration.
Deployment uses saved configuration; a local checkout does not set the remote branch. Do not rewrite configuration
merely to trigger a deployment.

```sh
coolify --context "$COOLIFY_CONTEXT" --format json deploy uuid "$RESOURCE_UUID"
```

Capture `.deployments[].deployment_uuid` from the successful JSON response and associate each result with its
`resource_uuid`. If the response omits a deployment ID, inspect the resource and recent jobs instead of inventing an ID.

```sh
coolify --context "$COOLIFY_CONTEXT" --format json deploy get "$DEPLOYMENT_UUID"
coolify --context "$COOLIFY_CONTEXT" app deployments logs "$APP_UUID" "$DEPLOYMENT_UUID" --lines 100
```

Poll that job at a bounded interval until a terminal outcome. Inspect status rather than treating exit code zero as
completion. Verify the requested commit or image when available, resource health, and the intended endpoint or smoke
check. A successful build alone does not prove application behavior.

`deploy name` selects the first exact name match in the inspected implementation. Resolve UUIDs when names could repeat.
`deploy batch` accepts comma-separated names, so establish every member before use.

`--pull-request-id` targets a preview. `--docker-tag` overrides the deployment image tag and requires server support,
documented as Coolify `4.0.0-beta.471+`. Use `--force` only when its deployment behavior is intended. `deploy cancel`
takes a deployment UUID, not an application UUID, and is an operational action.

## Logs

```sh
# Runtime logs
coolify --context "$COOLIFY_CONTEXT" app logs "$APP_UUID" --lines 100 --show-timestamps
coolify --context "$COOLIFY_CONTEXT" database logs "$DATABASE_UUID" --lines 100

# One Compose container in an application
coolify --context "$COOLIFY_CONTEXT" app logs "$APP_UUID" --service "$COMPOSE_SERVICE" --lines 100

# Discover service children before choosing a log target
coolify --context "$COOLIFY_CONTEXT" service application list "$SERVICE_UUID"
coolify --context "$COOLIFY_CONTEXT" service database list "$SERVICE_UUID"
coolify --context "$COOLIFY_CONTEXT" service logs "$SERVICE_UUID" --sub-service-name "$SUB_SERVICE_NAME" --lines 100
```

`app deployments logs` shows build/deployment logs; omitting its deployment UUID selects the latest deployment, which
can change during concurrent work. `app logs` shows runtime logs. Choose the source that answers the symptom. Use
`--follow` only where supported and stop after collecting the needed evidence.

## Create or update

Read the selected command's help for its required fields. Resolve server, project, environment, and destination from
inventory. Preserve intended build pack, ports, paths, domains, and health checks.

| Creation mode            | Repository or artifact input                                    |
| ------------------------ | --------------------------------------------------------------- |
| `app create public`      | Public Git URL and branch.                                      |
| `app create github`      | `owner/repo`, branch, and `--github-app-uuid`.                  |
| `app create deploy-key`  | SSH repository URL, branch, and `--private-key-uuid`.           |
| `app create dockerfile`  | Dockerfile content.                                             |
| `app create dockerimage` | Registry image name and intended tag.                           |
| `database create TYPE`   | Supported database type and its settings.                       |
| `service create TYPE`    | Template type, discoverable with `service create --list-types`. |

Use `--instant-deploy` when immediate deployment is in scope. Otherwise read the created resource back before
proceeding. Pass only intended update flags and verify the result.

`app update --compose-domain` replaces the existing service-domain mapping. Read the entire mapping first and include
entries that must remain. Preserve existing Build Secrets and unrelated build/runtime settings while troubleshooting.

## Backups, storage, and infrastructure

For an existing database backup schedule:

```sh
coolify --context "$COOLIFY_CONTEXT" database backup list "$DATABASE_UUID"
# Trigger when requested or needed by the authorized operation.
coolify --context "$COOLIFY_CONTEXT" database backup trigger "$DATABASE_UUID" "$BACKUP_UUID"
coolify --context "$COOLIFY_CONTEXT" database backup executions "$DATABASE_UUID" "$BACKUP_UUID"
```

Check execution completion and the reported artifact or destination. A configured schedule or accepted trigger is not
evidence of a completed or restorable backup.

Database deletion defaults `--delete-configurations`, `--delete-volumes`, `--docker-cleanup`, and
`--delete-connected-networks` to true in the checked CLI. Set cleanup flags to match the requested retention outcome. Do
not assume a force flag exists or that resource deletion preserves storage.

Use the owning resource's `storage` commands. Service storage creation also needs `--resource-uuid` for its child
application or database. Inspect mounts and ownership before changing them.

For less common work, discover the relevant tree with `--help`: `destination`, `server`, `cloud-token`, `cloud-init`,
`private-key`, `github`, `gitlab`, `tag`, `s3`, `notification`, `settings`, or `mcp`. Provisioning creates billable
infrastructure, and lifecycle commands affect running workloads; keep their scope explicit. Instance settings can
require privileges beyond resource access.

Sources: [README](https://github.com/coollabsio/coolify-cli#currently-supported-commands),
[deployment response](https://github.com/coollabsio/coolify-cli/blob/76ca47187a0c34b6f68c5c44b192fc457749e2c7/internal/service/deployment.go),
[name resolution](https://github.com/coollabsio/coolify-cli/blob/76ca47187a0c34b6f68c5c44b192fc457749e2c7/cmd/deployment/name.go),
and
[deletion defaults](https://github.com/coollabsio/coolify-cli/blob/76ca47187a0c34b6f68c5c44b192fc457749e2c7/cmd/database/delete.go).
