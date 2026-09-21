# Squid SDK - an ETL framework for Web3 data

[![npm](https://img.shields.io/npm/v/@subsquid/evm-processor.svg)](https://www.npmjs.com/package/@subsquid/evm-processor)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![Docs](https://img.shields.io/badge/docs-sqd.dev-blue.svg)](https://docs.sqd.dev)

Squid SDK is a TypeScript ETL toolkit for blockchain data, that currently supports

* Ethereum and everything Ethereum-like
* [Substrate](https://github.com/paritytech/polkadot-sdk)-based chains
* Solana.

Squid SDK is distinguished by

* Being a toolkit (rather than an indexing app like TheGraph or Ponder)
* Fast binary data codecs and type-safe access to decoded data
* Native support for sourcing the data from SQD Network.

The latter is a key point, as [SQD Network](https://docs.sqd.dev/en/network/overview)
is a decentralized data lake and query engine,
that allows to granularly select and stream subset of block data to lightweight clients
while providing high performance compared to traditional RPC APIs.

## Quickstart

Install the [SQD CLI](https://github.com/subsquid/squid-cli) and scaffold a new project:

```bash
npm install -g @subsquid/cli
sqd init my-squid
```

For step-by-step instructions, follow the [How to start guide](https://docs.sqd.dev/en/sdk/squid-sdk/how-to-start).

## Documentation

* Full documentation: [docs.sqd.dev](https://docs.sqd.dev)
* SQD CLI reference: [docs.sqd.dev/en/cloud/reference/cli](https://docs.sqd.dev/en/cloud/reference/cli)
* Website: [sqd.dev](https://sqd.dev)

## Developer community

Our developers are active in the SQD developer community on [Telegram](https://t.me/HydraDevs). Feel free to join and ask any question!

## Contributing

SQD is an open-source project, contributions are welcomed, encouraged and will be rewarded!

Please consult [CONTRIBUTING.md](CONTRIBUTING.md) for hacking instructions
and make sure to read our [code of conduct](CODE_OF_CONDUCT.md).

### Change Management

This project uses [Rush](https://rushjs.io/) for monorepo management. When making changes to packages, you need to document them using the rush change system:

1. **After making your changes and committing them**, run:
   ```bash
   rush change -b origin/master
   ```

2. **Follow the interactive prompts** to:
   - Select the type of change (major, minor, patch, or none)
   - Provide a clear description of what changed
   - The description should explain the feature/fix from a user's perspective

3. **Change types**:
   - `major`: Breaking changes that require users to update their code
   - `minor`: New features that are backward compatible
   - `patch`: Bug fixes and small improvements
   - `none`: Internal changes that don't affect the public API

4. **Best practices**:
   - Write clear, concise descriptions
   - Focus on what changed from the user's perspective
   - Include relevant technical details when necessary
   - Use present tense ("Add feature X" not "Added feature X")

The change files are automatically generated in `common/changes/@subsquid/[package-name]/` and will be used to generate changelogs during the release process.
