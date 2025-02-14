# Squid SDK - an ETL framework for Web3 data

Subsquid SDK is a TypeScript ETL toolkit for blockchain data, that currently supports

* Ethereum and everything Ethereum-like
* [Substrate](https://substrate.io)-based chains
* Solana.

Subsquid SDK stands apart from the competition is

* Being a toolkit (rather than an indexing app like TheGraph or Ponder)
* Fast binary data codecs with type-safe access to decoded data
* Native support for sourcing the data from Subsquid Network.

The latter is a key point, as [Subsquid Network](https://docs.subsquid.io/subsquid-network/overview/) 
is a decentralized data lake and query engine,
that allows to granularly select and stream subset of block data to lightweight clients
while providing game changing performance over traditional RPC API.

## Getting started

The best way to get started is to install [squid CLI](https://github.com/subsquid/squid-cli) and scaffold a squid project with [`sqd init`](https://docs.subsquid.io/squid-cli/init/). 

For step-by-step instructions, follow one of the [Quickstart guides](https://docs.subsquid.io/quickstart/).

## Developer community

Our developers are active on [Telegram](https://t.me/HydraDevs) and [Discord](https://discord.gg/subsquid). Feel free to join and ask any question!

## Contributing

Subsquid is an OpenSource project, contributions are welcomed, encouraged and will be rewarded!

Please consult [CONTRIBUTING.md](CONTRIBUTING.md) for hacking instructions
and make sure to read our [code of conduct](CODE_OF_CONDUCT.md).
