# Hosting and attaching UI media

Read this when uploading or posting media is part of the user's request or existing authorization. For screenshots
requested in a PR description, recommend the `assets-pr-screenshots` orphan branch in the repository containing the PR.
Follow a different destination when the user or project specifies one. Standalone screenshot requests can finish with
local files under `.local/`.

## Choose the destination

Resolve the repository and PR from the request and Git remotes before writing to them. A request to include screenshots
in a PR description includes uploading the selected media and updating that description; do not ask for the same
authorization again. If the user requests only a local draft, prepare it without pushing or posting.

Use `assets-pr-screenshots` for PR images when no other destination is specified. Reuse the branch if it exists, or
create it as an orphan branch if it does not. Keep it separate from the application's branches and never merge it into
them. Preserve the repository's visibility and verify that the resulting images render for the PR's intended audience.
If repository file URLs cannot serve that audience, use an established attachment mechanism with matching access, or ask
for the missing destination decision after preparing the media. Do not publish private media elsewhere just to obtain an
anonymous URL.

For other upload requests, use the specified or established destination, such as an issue attachment, build artifact,
documentation asset store, or object storage.

If an upload has no applicable default or established destination, prepare and inspect the files first, then ask only
for the missing destination or access decision. Authorization already given for that upload or post does not need to be
requested again.

Choose the upload mechanism supported by the available connector, CLI, API, or browser. Check current format and size
limits. Upload only the selected media files, never an entire temporary directory that may also contain authentication
state, logs, or unrelated screenshots.

Use the project's naming convention when one exists. On `assets-pr-screenshots`, group media under the actual ticket
identifier when available, or `pr-<number>`. Use a capture or revision subdirectory for repeat captures, for example
`pr-123/<capture-id>/menu-before.png`. If neither identifier exists yet, use a descriptive, collision-resistant capture
directory and keep its published path stable when the PR is created. Treat this branch as append-only: add new paths,
preserve earlier evidence, and never overwrite or delete files that existing reviews link to.

## Upload through a separate worktree

Use this workflow for the recommended `assets-pr-screenshots` branch or a project-specified asset branch. Confirm the
remote, directory layout, and any existing worktree before starting.

1. Inspect the main checkout and index. Use `.local/pr-assets/` for the asset worktree so it remains inspectable without
   changing the active checkout. Create `.local/` if needed and verify that it is ignored by the application repository.
   Reuse a matching existing worktree; do not overwrite an occupied directory or force a branch into a second worktree.
2. Fetch the existing asset branch and open it in that worktree. Only when the branch is absent, create it with
   `git worktree add --orphan -b assets-pr-screenshots .local/pr-assets`. Adapt the branch name if the project specifies
   another one. Check the installed Git version's supported syntax, and never recreate an existing branch.
3. Synchronize existing history before adding files. Copy only the inspected deliverables into a new directory or unused
   filenames.
4. Stage only those files in the asset worktree, inspect the staged diff, commit, and push to the confirmed remote and
   branch. Preserve existing history and published paths; do not force-push.
5. Resolve the resulting file URLs from the actual hosting provider and repository visibility. Keep media separate from
   application source where the project's workflow requires that separation.

An asset branch keeps binaries out of application commits, but those binaries still belong to the Git repository. Do not
claim it eliminates repository storage or clone costs.

## Verify and present

Use URLs returned by the upload mechanism when available. For repository-hosted files, derive the URL from the verified
host, owner, repository, revision, and path. Avoid expiring links for lasting review evidence unless expiration is
intentional and disclosed.

For public GitHub repositories, an image URL can follow this pattern, with each placeholder replaced by verified values:

```text
https://raw.githubusercontent.com/<owner>/<repo>/assets-pr-screenshots/pr-123/<capture-id>/menu-before.png
```

Keep branch-based paths append-only, or use the asset commit SHA in place of the branch for a fixed revision. For
private repositories and other providers, use their supported authenticated file or attachment URLs and test actual PR
rendering. See GitHub's
[permanent-link guidance](https://docs.github.com/en/repositories/working-with-files/using-files/getting-permanent-links-to-files)
when choosing between a branch URL and a commit-pinned URL.

Verify both retrieval and rendering. A successful HTTP response may be a login page or an unsupported download. Check
the content type and open the image or video in the destination's actual preview. Test public links without
authentication and private links with the intended audience's access when available. If audience access cannot be
verified, state that limitation instead of widening visibility.

Embed images with descriptive alt text and group before/after pairs together. Use native attachments or a supported
player for video, with a readable poster or download link when inline playback is unavailable. Follow the task's PR,
issue, or documentation template rather than imposing a fixed section name.

When an onion-skin comparison was generated for a subtle change, upload it with the original pair and present it beside
or below them, clearly labelled with its blend ratio. Keep the before and after images available as the original
evidence.

Return the final file locations and, when posting was requested, verify that the intended destination contains the
media. If upload succeeds but posting is blocked, preserve the hosted files and report the remaining step without
duplicating the upload. Keep the local capture files under `.local/` available for inspection after uploading.
