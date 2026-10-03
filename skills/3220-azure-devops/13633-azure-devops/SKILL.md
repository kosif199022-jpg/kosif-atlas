---
name: azure-devops
description: "Access Azure DevOps work items and pull requests via the az CLI — read, create, link, WIQL queries, PRs. Works on any project/organization (org/project derived from the git remote). Trigger: /devops, 'read work item', 'create a bug/task', 'create a PR', a work item URL or #number."
---

# /azure-devops — work items and PRs via the `az` CLI

For Azure DevOps, NEVER use `curl`/`WebFetch` against the REST API (it returns a
302 redirect to login and looks like you have no access) and never `gh` (that's
GitHub). Always use the `az` CLI with the `azure-devops` extension — it is
authenticated and works immediately.

## 0. Project context (portability)

Do NOT hardcode the org/project — derive them from the repository or the defaults:

```bash
git remote get-url origin
#   https://<org>.visualstudio.com/<Collection?>/<Project>/_git/<Repo>
#   https://dev.azure.com/<org>/<Project>/_git/<Repo>
az devops configure --list          # check configured defaults (organization, project)
```

- If defaults are set and match the remote, commands work without `--org/--project`.
- If not: add `--organization https://... --project <P>` to every command, or set
  `az devops configure --defaults organization=... project=...` (after confirming
  with the user, since it is a global setting).
- First use on a new machine: `az extension add --name azure-devops`, sign in with
  `az login` (AAD) or `az devops login` (PAT).

## 1. Work items

```bash
# read (URL .../_workitems/edit/<id> or #<id>)
az boards work-item show --id <id> -o json
az boards work-item show --id <id> --query "{title: fields.\"System.Title\", state: fields.\"System.State\", type: fields.\"System.WorkItemType\", area: fields.\"System.AreaPath\", iter: fields.\"System.IterationPath\"}" -o json

# create (take type/area/iteration from a related item or the parent US if the user doesn't say)
az boards work-item create --type Bug --title "..." --area "<AreaPath>" --iteration "<IterPath>" --assigned-to <email> --query "{id: id}" -o json

# update fields (Bug: the description belongs in Repro Steps, not in System.Description)
az boards work-item update --id <id> --fields 'Microsoft.VSTS.TCM.ReproSteps=<div>HTML content…</div>'

# links
az boards work-item relation add --id <child> --relation-type parent --target-id <parentId>

# search (WIQL) — CAUTION: only the fields in SELECT are returned; always read with -o json
az boards query --wiql "SELECT [System.Id],[System.WorkItemType],[System.State],[System.Title],[System.AreaPath],[System.IterationPath] FROM WorkItems WHERE [System.Title] CONTAINS 'xyz'" -o json
```

Pitfalls (learned the hard way):
- `-o table` on `az boards query` drops fields — always use JSON and extract from `fields`.
- `Microsoft.VSTS.TCM.ReproSteps` comes back as HTML; images embedded in a work item
  CANNOT be fetched through the API — ask the user for a screenshot.
- `--assigned-to`: if it returns "is not a known identity", the user's DevOps
  identity uses a different email domain than their local git config — check on an
  existing work item:
  `az boards work-item show --id <known id> --query "fields.\"System.AssignedTo\".uniqueName"`.
- Write titles/descriptions in the project's language.

## 2. Pull requests

```bash
# create — always link the work item(s)
az repos pr create --source-branch <branch> --target-branch <develop|main> \
  --title "#<workitem> <type>: <description>" --work-items <id> \
  --description "..." --query "{id: pullRequestId}" -o json

# status / list
az repos pr show --id <prId> --query "{status: status, merge: mergeStatus, closed: closedDate}" -o json
az repos pr list --status active -o table
```

Pitfalls (learned the hard way):
- Before pushing, check whether a PR for the branch already exists — if it was
  **completed** in the meantime, the remote branch was deleted and a new push
  creates a "new branch" → a NEW PR is needed (the old one does not "reopen").
- Set autocomplete ONLY on explicit request, and then with `transitionWorkItems=false`
  (`az repos pr update --id <id> --auto-complete true --transition-work-items false`),
  so linked work items don't jump to Resolved.
- PR title per the project's convention (e.g. `#<number> <type>: <description>`
  derived from the branch name).
- Respect the project's rules before committing/creating a PR (e.g. mandatory
  tests — check the project's CLAUDE.md).

## 3. Pattern for a new bug with a parent US (full flow)

1. Find the parent US: WIQL by title → take its Id, AreaPath, IterationPath.
2. `work-item create` with the same area/iteration, type Bug, assigned to the user.
3. `work-item update` with Repro Steps (HTML: symptom, cause, fix).
4. `relation add` parent.
5. Branch `BUGFIX/<id>-short-description` off the development branch; at the end
   `pr create --work-items <id>`.

## Rules

- Creating/modifying work items and PRs are external effects — when in doubt about
  the target (which parent, which iteration) ask; otherwise take the values from
  the parent US.
- Never delete anything (`az boards work-item delete`) without explicit confirmation.
- Reply in the user's language.
