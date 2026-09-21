# Contributing to Subsquid

Subsquid mono-repo is managed by [rush](https://rushjs.io).
The setup is pretty standard for rush projects. All information from
[rush docs](https://rushjs.io/pages/developer/new_developer/) is applicable here.

## Getting started

### 1. Clone the repo

Subsquid repository contains a number of large test data files,
which are stored as [git LFS](https://git-lfs.github.com) objects.

It can make sense to skip downloading those files by setting
`GIT_LFS_SKIP_SMUDGE` environment variable.

```bash
GIT_LFS_SKIP_SMUDGE=1 git clone git@github.com:subsquid/squid-sdk.git
```

### 2. Install rush

Install `rush(1)` globally from npm.

```bash
npm install -g @microsoft/rush
```

Alternatively one can use a provided starter script instead of `rush(1)`.

```bash
node common/scripts/install-run-rush.js <regular rush command>
```

### 3. Install dependencies

```bash
rush install
```

### 4. Build the project

```bash
rush build
```

### 5. Run tests

Running tests requires a recent version of [docker](https://www.docker.com).

```bash
# Run unit tests
rush test

# Run tests requiring git-lfs files
rush test:lfs

# Run end to end test suite
rush e2e
```

### 6. Lint & format

The repository is linted and formatted with [Biome](https://biomejs.dev) via a
Rush autoinstaller.

```bash
# Lint
rush lint
rush lint:fix

# Format
rush format
rush format:fix

# Lint + format together
rush biome
rush biome:fix
```

The Biome configuration lives in `biome.json` at the repo root. The autoinstaller
(the tool itself) is pinned in `common/autoinstallers/lint/`. `rush install` /
`rush update` automatically install it and symlink `node_modules/@biomejs/biome`
at the repo root so editor integrations (e.g. the Biome VS Code extension) can
discover the pinned binary. Bump the pinned version with:

```bash
rush update-autoinstaller --name lint
```

### 7. Shared vitest tooling

The shared `vitest.config.ts` at the repo root is backed by the `vitest`
autoinstaller at `common/autoinstallers/vitest/`. `rush install` / `rush update`
automatically install it and symlink `node_modules/vitest` at the repo root so
editors and the shared config can resolve `vitest/config`. Bump the pinned
version with:

```bash
rush update-autoinstaller --name vitest
```

## Pull Requests

All pull requests should be made from a fork. To create a pull request

```bash
# 1. Create a new branch to incorporate your changes
git checkout -b new_awesome_feature

# 2. Make and commit your changes

# 3. Create and commit a change file describing your modifications
rush change -b <the target branch you are basing your changes on>
git add common/changes
git commit -m "changes"
```

After that send a PR from `new_awesome_feature` to the target branch.
