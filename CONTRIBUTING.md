# Contributing to Squid

Squid is an open-source project and contributions in the form of a PR are welcome. We use [conventional-commits][conventional-commits] enforced by the [commitizen][commitizen] and [commitlint][commitlint]

## Testing

A pull request adding a new feature or fixing an existing bug should include a test covering the changes. The contribution can be covered either by an end-to-end test or by  a unit test. End-to-end tests are located in `test/e2e-suite` and `test/e2e-project` and can be run from the root with `rush e2e`. Unit tests are package-specific. Both e2e and unit tests are run by CI once a PR is opened.

## Versioning and Releases

The monorepo is organized with rush, with a single version for all packages. Once a pull request is merged, the version is bumped to the new pre-release version following the conventional commits convention. When deemed mature, the `release` action can be manuually triggered. It graduates the pre-release version and publishes to the npm registry and docker hub.

## Publishing (for maintainers only)

`release` Github action is supposed to be run manually. It has the following inputs:

[conventional-commits]: https://www.conventionalcommits.org/en/v1.0.0/
[commitizen]: https://github.com/commitizen
[commitlint]: https://commitlint.js.org/#/
