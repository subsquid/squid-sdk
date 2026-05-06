---
name: squid-sdk-release
description: Cut a new squid-sdk release — verify Rush change files, run the bump/release/github-release workflows in order, watch them, and (for minor/major bumps) standardize the auto-generated GitHub release notes. Use when the user asks to "release", "publish", "ship", or "cut the next release" of squid-sdk.
metadata:
  internal: true
---

# squid-sdk release

End-to-end release procedure for the squid-sdk Rush monorepo. Unlike a single-version repo, squid-sdk publishes ~109 packages with **independent per-package versions**, driven by three manual `workflow_dispatch` workflows. GitHub releases are date-tagged (`YYYY-MM-DD`), not version-tagged. Most of the heavy lifting is automated — your job is to trigger the workflows in the right order, surface failures clearly, and (optionally) wrap the auto-generated release notes for minor/major bumps.

## Mental model

| Stage | Workflow | What it does |
|---|---|---|
| 1. Bump | `bump.yml` | `rush change --verify` then `rush version --bump` against `release/arrowsquid`, merges versions + CHANGELOGs back into the current branch |
| 2. Publish to npm | `release.yml` (`mode=release`) | From `release/arrowsquid`, builds and publishes via OIDC trusted publishing (`NPM_CONFIG_PROVENANCE=true`) |
| 3. GitHub release | `github-release.yml` | Diffs `**/CHANGELOG.md` since the previous date tag, aggregates per-package sections + contributors, creates `YYYY-MM-DD` tag and release |

Per-package change tracking lives in `common/changes/@subsquid/<pkg>/<branch>_<timestamp>.json`. Each PR that touches a published package should add a change file via `rush change` — no change file means CI's verify step fails.

## Preconditions

Confirm before starting:
- Working tree is clean.
- You're on the feature branch where the release will be cut from (typically `master`); the merged PRs since the last release are the contents of this release.
- Every published package modified since the last release has a corresponding change file. Run locally:
  ```sh
  node common/scripts/install-run-rush.js change --verify --target-branch origin/release/arrowsquid
  ```
  If this fails, ask the user to author missing change files with `rush change` (or open a PR that does).
- `gh auth status` passes and the user has `Actions: write` on `subsquid/squid-sdk`.

## Steps

### 1. Bump versions (`bump.yml`)

```sh
BRANCH=$(git rev-parse --abbrev-ref HEAD)
gh workflow run bump.yml --ref "$BRANCH" -R subsquid/squid-sdk
gh run watch --workflow=bump.yml --exit-status -R subsquid/squid-sdk
```

This pushes version bumps and CHANGELOG.md updates to both `release/arrowsquid` and the current branch. Pull locally afterwards: `git pull`.

If the merge-back step fails, the current branch diverged from `release/arrowsquid` in a non-trivial way — surface it and let the user resolve. Do not force.

### 2. Publish to npm (`release.yml`, mode=release)

```sh
gh workflow run release.yml -f mode=release -R subsquid/squid-sdk
RUN_ID=$(gh run list --workflow=release.yml --limit 1 --json databaseId --jq '.[0].databaseId' -R subsquid/squid-sdk)
gh run watch "$RUN_ID" --exit-status -R subsquid/squid-sdk
```

This always runs from `release/arrowsquid` regardless of caller branch (see `release.yml` line 29). The publish step uses **OIDC trusted publishing** — no NPM_TOKEN.

If a single package fails to publish, the tree is now half-published. **Do not retry blindly.** Check what landed:

```sh
npm view @subsquid/<failed-pkg> versions --json | tail -5
```

Common cause: the failing package's trusted publisher is not configured on npmjs.com. Surface the error verbatim to the user and stop — do not proceed to step 3 until npm and the local CHANGELOG state agree.

### 3. Cut the GitHub release (`github-release.yml`)

```sh
gh workflow run github-release.yml -R subsquid/squid-sdk
gh run watch --workflow=github-release.yml --exit-status -R subsquid/squid-sdk
```

The `.github/actions/publish-releases` action will:
- find the previous `YYYY-MM-DD[.N]` tag,
- diff `**/CHANGELOG.md` since that tag,
- emit `### @subsquid/<pkg> <ver>` sections in the order Git returned the changed paths,
- append a Contributors footer (resolved from commit emails to GitHub logins),
- create a `YYYY-MM-DD` tag (or `YYYY-MM-DD.N` if today already has one),
- publish a release with those notes.

If no CHANGELOG.md diff exists, the action exits cleanly without creating a release — usually a sign that step 1 was skipped or every change was `type: none`.

Print the release URL when done:
```sh
TAG=$(gh release list --limit 1 --json tagName --jq '.[0].tagName' -R subsquid/squid-sdk)
echo "https://github.com/subsquid/squid-sdk/releases/tag/$TAG"
```

### 4. (Optional) Standardize release notes

Only for releases that contain at least one **minor or major** bump. Patch-only releases keep the bare auto-generated body — they're not worth a headline.

Rules in [release-notes-template.md](release-notes-template.md). The wrap-around prepends a `## <Headline>` and 1–3 sentence lead and appends a compare link; the per-package `### @subsquid/...` blocks are kept verbatim.

To rewrite:

```sh
TAG=2026-04-15  # or whatever date tag was created
PREV=$(gh api repos/subsquid/squid-sdk/releases --jq '.[1].tag_name')
# headline + lead come from the user-visible diff; don't restate every package bullet
gh release edit "$TAG" -R subsquid/squid-sdk --notes "$(cat <<EOF
## <Headline>

<1-3 sentence lead.>

$(gh release view "$TAG" -R subsquid/squid-sdk --json body --jq .body)

**Full Changelog**: https://github.com/subsquid/squid-sdk/compare/${PREV}...${TAG}
EOF
)"
```

Pick the headline from the largest user-visible change in the aggregated body. **Don't restate every package's bullets.** The per-package sections are already there — the headline is editorial framing, not a summary.

## Prerelease path

For prereleases (e.g. previewing changes from a feature branch under a non-`latest` dist-tag):

```sh
gh workflow run release.yml -f mode=prerelease --ref <feature-branch> -R subsquid/squid-sdk
```

This runs from the caller branch (not `release/arrowsquid`), uses `rush publish --apply --partial-prerelease --tag <branch>` with a commit-hash suffix, and does **not** cut a GitHub release. Skip `bump.yml` and `github-release.yml` for prereleases.

## Failure modes

- **`rush change --verify` fails in CI**: a published package was modified without an accompanying change file. The user must run `rush change` for each missing package and push the JSON files in `common/changes/@subsquid/<pkg>/`.
- **`bump.yml` merge-back fails**: branch diverged from `release/arrowsquid` non-trivially. Resolve by hand; do not force-push.
- **Partial npm publish**: stop and surface. Re-running `release.yml` will skip already-published versions (Rush checks the registry), but if the cause was a misconfigured trusted publisher, the same package fails again. Fix the npmjs.com config first.
- **Date tag collision**: the action automatically suffixes `.2`, `.3`, … (`createDateTag()` in `index.js`). Nothing to do.
- **No CHANGELOG diff after running `bump.yml`**: every change file was `type: none` (e.g. doc/test-only changes). Action exits cleanly without a release. Confirm this is intended.
- **`github-release.yml` fails to resolve a contributor login**: not fatal — the action just skips that author. Check logs if a known contributor is missing.

## Quick reference

```sh
# Verify change files locally
node common/scripts/install-run-rush.js change --verify --target-branch origin/release/arrowsquid

# Three workflow triggers
gh workflow run bump.yml --ref "$(git rev-parse --abbrev-ref HEAD)" -R subsquid/squid-sdk
gh workflow run release.yml -f mode=release -R subsquid/squid-sdk
gh workflow run github-release.yml -R subsquid/squid-sdk

# Watch the latest run of a workflow
gh run watch --workflow=<file>.yml --exit-status -R subsquid/squid-sdk

# Inspect what was published
gh release view --web -R subsquid/squid-sdk
```
