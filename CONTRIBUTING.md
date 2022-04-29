# Contributing to Squid

Squid is an open-source project that plans to eventually become community-owned. Contributions in the form of Pull Requests are welcome and encouraged. We use [conventional-commits][conventional-commits] enforced by the [commitizen][commitizen] and [commitlint][commitlint]

## Developer community

[![Subsquid Discord](https://flat.badgen.net/discord/members/dxR4wNgdjV?icon=discord)](https://discord.gg/dxR4wNgdjV) [![Subsquid Devs Telegram](https://badgen.net/badge/Subsquid%20Developers/telegram?icon=telegram&)](https://t.me/HydraDevs)

## Getting started

In order to contribute, you may want to get the development environment setup. Subsquid is based on Node.js, on TypeScript, and that it needs Docker installed on your system.
Head over to our documentation and follow [the tutorial](https://docs.subsquid.io/tutorial/development-environment-set-up) to learn how to setup your development environment.

### Where to start

Issues in the repository are tagged with labels and there are two special types of labels regarding priority and rewards:

- priority0-priority4 express the level of urgency from highest to lowest
- $-$$$$$ express the level of remuneration, from highest to lowest

When selecting an issue to pick up, please start from highest priority first (lowest number, because GNU/Linux process priority), when possible. Another good starting point is to look at the [`good first issue`](https://github.com/subsquid/community/labels/good%20first%20issue) label, which is attached to issues we think are a good starting point for newcomers.

### Open a Pull Request

When creating a Pull Request, please make sure to test and review your work first. Then, verify that the pull request is opened against the `main` branch of our repository, using the provided template, making sure to go through the checklist.

### Submit the PR and participate in the review

- Once submitted, the PR will be reviewed by the internal team or by the community. Keep an eye on it, as reviewers will want to ask questions
- Forked repositories should always perform a pull of the main branch before submitting a Pull Request. In case of a merge conflict, please follow this [git tutorial](https://lab.github.com/githubtraining/managing-merge-conflicts)


## Testing

A pull request adding a new feature or fixing an existing bug should include a test covering the changes. The contribution can be covered either by an end-to-end test or by  a unit test. End-to-end tests are located in `test/e2e-suite` and `test/e2e-project` and can be run from the root with `rush e2e`. Unit tests are package-specific. Both e2e and unit tests are run by CI once a PR is opened.

## Versioning and Releases

The monorepo is organized with rush, with a single version for all packages. Once a pull request is merged, the version is bumped to the new pre-release version following the conventional commits convention. When deemed mature, the `release` action can be manuually triggered. It graduates the pre-release version and publishes to the npm registry and docker hub.

## Publishing (for maintainers only)

`release` Github action is supposed to be run manually.

## Rewards

The Subsquid team needs expanding. To collaborate with us, start contributin to our repository, if the collaboration is successful, over time you could become part of the internal team, if you wish so. Continuous external collaboration is also welcome, and will be economically rewarded according to the level of contribution.

## Contribution workflow

### Assign Issues

Issues will usually report a time slot before which a Pull Request needs to be open. Whenever someone claims the task, and fails to respect the indicated deadline, the Issue can be considered up for grabs.
This is to avoid "stale" Issues.

On the other hand, unless specified in a "competition" type of task, please avoid working on an issue that has been claimed by someone else.

### Pull Requests

Whenever you open PR against our repository, our best recommendation is to finish it quickly, i.e., being merged under 72h since opening/last discussion, if it's not a complex issue requiring more profound attention of more members. Otherwise, you will be raising the chance to face many merge conflicts. Please observe these guidlines for Pull Requests:

- When submitting a deliverable for a Quest, please create a dedicated folder, named after the Quest title:

  - "Helm charts for Squid Archives" => `squid archives helm charts`

- Such folder should contain all the work done. How to best organize the subfolders structure is left to the contributor.

- A Pull Request to the repository's `main` branch should be made.

### Avoiding stalled PRs

When the issue is converted to a draft, and you don't reply within 48h, we will close it and unassign you from the task to leave room for someone else to finish the PR who has more availability and codebase understanding.

### Issues

If you've found something in the content or the website that should be updated, search open issues to see if someone else has reported the same thing. If it's something new, open an issue using a template. We'll use the issue to talk about the problem you want to fix.

### Support ❓

We are a small team working hard to keep up with the documentation demands of a continuously changing product. Unfortunately, we can't help with support questions in this repository. If you are experiencing a problem with GitHub unrelated to our documentation, please get in touch with GitHub Support directly. Any issues, discussions, or pull requests opened here requesting support will be given information about contacting GitHub Support, then closed and locked.

If you're having trouble with your GitHub account, contact support.

## Pull Requests checklist

When deciding if I merge in a pull request, I look at the following things:

### Does it state intent

Structure the Pull Request title, so that both the problem you are tackling and the solution proposed by your contribution are clearly stated.

### Is it of good quality

- There are no spelling mistakes
- It reads well
- For English language contributions: Has a good score on Grammarly or Hemingway App
- Haven't used force-push. If that is the case, PR will be closed.

### Reviewing

The Subsquid core team, but sometimes our community as well, review every PR. Reviews are meant to make sure that Subsquid keeps improving by adding valuable contributions.

💛 Reviews are always respectful, acknowledging that everyone did the best possible job with the knowledge they had at the time.

💛 Reviews discuss content, not the person who created it.

💛 Reviews are constructive and start a conversation around feedback.

#### Self-review

You should always review your PR first.

For content changes, make sure that you:

- Confirm that the changes address every part of the content design plan from your issue (if there are differences, explain them).
- Review the content for technical accuracy.
- Copy-edit the changes for grammar, spelling, and adherence to the style guide.
- Check that all of your changes are correct by running the test suite.
- If there are any failing checks in your PR, troubleshoot them until they're all passing.

#### Update strategy: always use merge

Try to submit your PR as soon as possible. That's always an excellent way to avoid conflict with other commits.

However, if the conflict happens, we want you always use merge to resolve it. The reason is we don't want to mix the merging strategies, and we want to see only your commits in your PR.

#### Pull request template

When you open a pull request, you must fill out the "Ready for review" template before we can review your PR. This template helps reviewers understand your changes and the purpose of your pull request.

## Troubleshooting

#### Code quality

We follow what we have in .eslintrc.js, and you can see warnings and errors by running yarn lint. With yarn lint --fix, you will get auto fixed code.

#### Don't have access to push to the repository

You need to fork the repository, commit a change to your repository, and create pull request.

#### Does it follow the contributor covenant

This repository has a [code of conduct](CODE_OF_CONDUCD.md),every submission that does not adhere to it will be denied or removed if accidentally accepted.

[conventional-commits]: https://www.conventionalcommits.org/en/v1.0.0/
[commitizen]: https://github.com/commitizen
[commitlint]: https://commitlint.js.org/#/
