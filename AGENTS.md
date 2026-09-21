# Project Agent Guide

> **Scope:** Root repository ([subsquid/squid-sdk](https://github.com/subsquid/squid-sdk)). Applies to all subdirectories unless a future nested `AGENTS.md` explicitly overrides (none exist today).
>
> **Quality tooling:** This repo uses **[Biome](https://biomejs.dev/)** for **linting and formatting**, and **[Vitest](https://vitest.dev/)** for **unit tests** (via package `test` scripts and the shared root `vitest.config.ts`).

## Quick Facts

| Item | Detail |
| --- | --- |
| **Primary language** | TypeScript |
| **Monorepo tool** | [Rush](https://rushjs.io/) **5.170.1** (invoke via `node common/scripts/install-run-rush.js` or global `rush`) |
| **Package manager** | **pnpm** **9.15.4** (Rush-managed); **`strictPeerDependencies`** and shrinkwrap validation are enforced — fix peers in `package.json`, then **`rush update`** |
| **Node** | `rush.json` allows **>=18.13.1**; CI (`.github/workflows/test.yml`) uses **Node 24** |
| **Project paths** | Packages are registered in `rush.json`; folders are **two levels** from repo root (`category/project-name`, e.g. `evm/evm-stream`) |
| **Linting & formatting** | **[Biome](https://biomejs.dev/)** — config in `biome.json`; run through **`rush lint`**, **`rush format`**, **`rush biome`**; tool pinned in `common/autoinstallers/lint/` |
| **Unit testing** | **[Vitest](https://vitest.dev/)** — shared `vitest.config.ts`; packages run it from their **`test`** script; runner pinned in `common/autoinstallers/vitest/` |
| **Shrinkwrap** | `common/config/rush/pnpm-lock.yaml` — edit deps with **`rush add` / `rush remove`**, then **`rush update`**; use **`rush install`** read-only on CI |
| **Version policy** | **`ensureConsistentVersions`** is **on** — align semver ranges across packages or allow exceptions in `common/config/rush/common-versions.json`; run **`rush check`** |

Official Rush references: [Rush overview](https://rushjs.io/), [new developer guide](https://rushjs.io/pages/developer/new_developer/), [RushStack hub](https://rushstack.io/).

## Repository Tour

Top-level layout (domains are grouped as `category/package`; publishable packages are mostly `@subsquid/*`):

| Path | Role |
| --- | --- |
| `bitcoin/`, `evm/`, `fuel/`, `solana/`, `starknet/`, `substrate/`, `tron/` | Chain-specific libraries and tooling |
| `graphql/` | GraphQL server and OpenReader |
| `hyperliquid/` | Hyperliquid-related packages |
| `typeorm/` | TypeORM integration packages |
| `util/` | Shared utilities and internal helpers |
| `processor/` | Batch processor |
| `ops/` | Internal automation (e.g. `workspace` — dependency unify script used by `rush unify-dependencies`) |
| `test/` | Example squid projects, benches, and test harness packages (not all published) |
| `common/` | Rush config (`common/config/rush/`), autoinstallers, scripts, change files (`common/changes/`), temp install/build state (`common/temp/`) |
| `test/e2e-suite/` | End-to-end shell driver for **`rush e2e`** |

There is **no** repo-wide `Justfile`. **Makefiles** exist under **individual** packages (mostly `test/*` and a few libraries) for local convenience — not the primary workflow entrypoint.

**Layout snapshot (directories only, depth 1):** `.github/`, `.agents/`, `bitcoin/`, `common/`, `evm/`, `fuel/`, `graphql/`, `hyperliquid/`, `ops/`, `processor/`, `solana/`, `starknet/`, `substrate/`, `test/`, `tron/`, `typeorm/`, `util/` — plus root config (`rush.json`, `biome.json`, `vitest.config.ts`, `Dockerfile`, etc.).

## Tooling & Setup

1. **Clone:** Large fixtures may use Git LFS. To skip LFS smudge:  
   `GIT_LFS_SKIP_SMUDGE=1 git clone git@github.com:subsquid/squid-sdk.git`
2. **Rush:** Prefer pinned invocations:  
   `node common/scripts/install-run-rush.js <command>`  
   (or `npm install -g @microsoft/rush` per [CONTRIBUTING.md](CONTRIBUTING.md).)
3. **Install then build:**  
   `rush install` then `rush build` (see **Rush command discipline** below for scoped commands).
4. **Docker:** Required for some tests (see [CONTRIBUTING.md](CONTRIBUTING.md)).
5. **Editor tooling:** After `rush install`, Biome and Vitest are linked at repo root `node_modules/` for extensions — avoid **phantom dependencies** via a stray root `node_modules`; Rush warns if it finds one.

**Secrets / env:** No single `.env.example` at root is required for the core Rush workflow; individual packages or test apps may document their own. Prefer package READMEs and [Subsquid docs](https://docs.subsquid.io/) for runtime setups.

### Rush Command Discipline

Follow [Rush best practices](https://rushjs.io/): treat this repo as Rush-first.

| Practice | Detail |
| --- | --- |
| **Prefer Rush entrypoints** | Use **`rush`** for repo-wide operations, **`rushx`** for one package’s scripts (same as `npm run`, Rush-aware). Avoid **`npm` / `pnpm` / `yarn`** for installing or linking workspace packages; that bypasses Rush and breaks guarantees. |
| **When you need pnpm** | Use **`rush-pnpm`** so PNPM runs with the correct workspace context. |
| **Add / remove deps** | **`rush add -p <pkg>`** (add `--dev` / `--exact` as needed), **`rush remove -p <pkg>`**, then **`rush update`** so `pnpm-lock.yaml` stays valid. |
| **`rush install` vs `rush update`** | **`install`** — read-only from existing shrinkwrap (CI, clean clones). **`update`** — after changing `package.json`, `common-versions.json`, or Rush policies; refreshes the lockfile. After **`git pull`**, if dependencies changed, run **`rush update`**. |
| **`rush build` vs `rush rebuild`** | **`build`** — incremental (default dev loop). **`rebuild`** — clean / full rebuild when chasing cache or toolchain oddities. |
| **Project selection** | Scope expensive commands: **`--to <pkg>`** (project + deps), **`--from <pkg>`** (project + downstream), **`--impacted-by <pkg>`** (dependents only, for quick impact checks), **`--only <pkg>`** when deps are already known good. Unique short names work if unambiguous; prefer **`@subsquid/<name>`**. Examples: `rush build --to @subsquid/logger`, `rush build --from @subsquid/util-internal`. |
| **Optional build cache** | Per-project **`config/rush-project.json`** with **`outputFolderNames`** (e.g. `lib`) enables Rush’s local build cache under `common/temp/build-cache`. This repo may or may not use those files; adding them is optional tuning, not required for correctness. |
| **Troubleshooting** | **`rush purge`** — reset temp/install state when things are corrupted. **`rush update --recheck`** — force dependency re-evaluation. **`rush build --verbose`** — deeper logs. |

## Common Tasks

In the table below, **`rush`** stands for either global `rush` or
`node common/scripts/install-run-rush.js`. Prefer the pinned form in scripts,
CI-style commands, or any environment where global Rush is not already known to
match `rush.json`.

| Command | Purpose |
| --- | --- |
| `rush install` | Install from current shrinkwrap (no lockfile drift) |
| `rush update` | Regenerate/install after dependency or policy changes |
| `rush build` | Incremental build of all projects |
| `rush rebuild` | Clean rebuild of all projects |
| `rush build --to @subsquid/<pkg>` | Build one package and its dependency chain |
| `rush build --impacted-by @subsquid/<pkg>` | Build/check projects affected by one package when validating impact |
| `rush test` | Run **`test`** script where defined (bulk) |
| `rush test:lfs` | LFS / heavy **`*.lfs.test.ts`-style** suites (`workflow_dispatch` in CI) |
| `rush e2e` | `test/e2e-suite/e2e.sh` |
| `rush lint` / `rush lint:fix` | Biome lint |
| `rush format` / `rush format:fix` | Biome format |
| `rush biome` / `rush biome:fix` | Lint + format (`check`) |
| `rush check` | Enforce consistent dependency versions across packages |
| `rush unify-dependencies` | Cross-repo dependency unify (`ops/workspace`; flags `--update`, `--lower`, `--major`, `--dry` in `common/config/rush/command-line.json`) |
| `cd <projectFolder> && rushx <script>` | Run one package’s npm script after its deps are built (e.g. `rushx build`, `rushx test`) |

**Scoped validation examples:**

```bash
rush build --to @subsquid/logger
cd util/logger && rushx test
rush build --impacted-by @subsquid/logger
```

**Dependency examples:** run these from the target project directory unless you
are intentionally using Rush’s explicit project-targeting options. After any
dependency change, run `rush check`, then `rush update`.

```bash
rush add -p lodash --dev
rush add -p some-package --exact
rush remove -p lodash
```

**Autoinstaller bumps:** `rush update-autoinstaller --name lint` or `--name vitest`.

## Testing & Quality Gates

- **Linting & formatting (Biome):** Use **`rush biome`** (or `rush lint` / `rush format`) before PRs; **`rush biome:fix`** / **`lint:fix`** / **`format:fix`** apply safe fixes.
- **Unit tests (Vitest):** **`rush test`** after **`rush build`** — that invokes each package’s **`test`** script, which typically runs **Vitest** (`vitest --run`, etc.).
- **LFS-heavy tests:** `rush test:lfs` (CI job `test-lfs` on `workflow_dispatch`). This matches [CONTRIBUTING.md](CONTRIBUTING.md).
- **E2E:** `rush e2e` (Docker ecosystem expected).
- **CI:** `.github/workflows/test.yml` — `install` → `build` → `test` on PRs; LFS job on `workflow_dispatch`. Additional workflows: `docker.yml`, `docker-dev.yml`, `bump.yml`, `release.yml`, `github-release.yml`, `npm-tag.yml`.

## Workflow Expectations

- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md) — PRs from **forks**; follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
- **Change records:** For changes to published/versioned packages, run
  `rush change -b <base-branch>`  
  and commit files under `common/changes/` (feeds changelogs / releases), unless a maintainer explicitly says no release note is needed. Types: major / minor / patch / none — see [README.md](README.md) “Change Management”.
- **Product docs:** User-facing docs live primarily on [docs.subsquid.io](https://docs.subsquid.io/); this repo’s README is the SDK overview and onboarding pointer.

## Documentation Duties

- Update **[README.md](README.md)** when developer setup, high-level architecture, or contributor flow changes in a way users or new contributors will hit.
- Update **[CONTRIBUTING.md](CONTRIBUTING.md)** when install/test/lint commands or PR expectations change.
- Update **package READMEs** when public API or usage of a published package changes materially.
- Summarize work for maintainers using **Conventional Commits** (`feat:`, `fix:`, `chore:`, …) where the project expects them.

## Finish the Task Checklist

- [ ] Update relevant docs (`README.md` / `CONTRIBUTING.md` / package READMEs if the change is user-visible or setup-critical).
- [ ] After dependency edits: **`rush check`**, then **`rush update`** (not raw package managers).
- [ ] Run **`rush biome`** (or CI-equivalent) when touching TS/JS.
- [ ] Add or update **`rush change`** entries when publishing-affecting packages change.
- [ ] Summarize changes in **Conventional Commits** style for the final commit message / PR description.
