# Setup and authentication

Read when the executable, context, authentication, or API compatibility needs attention.

## Install or update

Check PATH and `coolify version` before installing. Use a method appropriate to the platform and existing package
manager:

```sh
# Homebrew on macOS or Linux
brew install coollabsio/coolify-cli/coolify-cli

# Go, when its toolchain is available
go install github.com/coollabsio/coolify-cli/coolify@latest
```

The upstream [installation instructions](https://github.com/coollabsio/coolify-cli#installation) also provide
Linux/macOS and PowerShell installers. Download and inspect an installer before execution. Recheck the executable and
version afterward.

`coolify update` updates the CLI, not the server. Respect package-manager installations and the user's upgrade scope.
Creating a skill or inspecting resources is not a reason to upgrade either component.

## Configure a context

`coolify config` reports the actual configuration path. On Unix it is normally `~/.config/coolify/config.json`; Windows
documentation has differed, so use the reported path. The config contains tokens.

Get an API token from the instance's `/security/api-tokens` page. Reuse an existing authorized credential or have the
user enter it locally through a secure input flow. Do not ask for it in chat. Use permissions needed for the task
without broadening them merely to inspect resources.

These templates assume variables supplied through the local shell or secure input. They are placeholders passed
explicitly, not automatic CLI authentication settings:

```sh
# Self-hosted; URL is the instance origin, without /api/v1
coolify context add "$COOLIFY_CONTEXT" "$COOLIFY_INSTANCE_URL" "$COOLIFY_API_TOKEN"

# Existing Coolify Cloud context
coolify context set-token cloud "$COOLIFY_API_TOKEN"

coolify --context "$COOLIFY_CONTEXT" context verify
coolify --context "$COOLIFY_CONTEXT" context version
```

Token arguments may be visible in process arguments. Avoid shell tracing, literal tokens in recorded commands, and
verbose output. Clear temporary token variables after use. Do not fabricate stdin or token-file options.

`--token` overrides authentication for a selected context; it does not supply a URL. `context add --default`,
`context use`, and `context set-default` change the saved default. Use those only when that configuration change is
intended. Do not use `context add --force` to silently overwrite a context.

## Diagnose failures

| Symptom                                  | Next check                                                                                      |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Missing executable or unexpected version | Resolve PATH and installation method; inspect installed help.                                   |
| Unknown context                          | Inspect names, then add or correct only the intended context.                                   |
| Connection, DNS, or TLS error            | Check instance origin and connectivity before touching credentials.                             |
| 401 or 403                               | Check token validity, team, and endpoint permissions; verification does not prove write access. |
| 404 or version rejection                 | Check URL, resource ownership/type, and server API version.                                     |
| Timeout, 429, or 5xx after a write       | Inspect resulting state before retrying; the CLI may already have repeated the request.         |

Implementation references:
[API client](https://github.com/coollabsio/coolify-cli/blob/76ca47187a0c34b6f68c5c44b192fc457749e2c7/internal/api/client.go)
and
[context selection](https://github.com/coollabsio/coolify-cli/blob/76ca47187a0c34b6f68c5c44b192fc457749e2c7/internal/cli/client.go).
