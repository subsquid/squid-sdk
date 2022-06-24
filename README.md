# Subsquid: ETL framework for Web3

[Subsquid](https://subsquid.io/) is a query node framework for Substrate-based blockchains. In straightforward terms, Subsquid can be thought of as an ETL tool, with a GraphQL server included.

Subsquid's [multi-layer approach](https://docs.subsquid.io/key-concepts/architecture) aims to pre-process and decode raw chain data and store it for easier access by query nodes, providing increased performance over direct RPC calls.

Thanks to Subsquid, the complexity of fetching and transforming blockchain data can be vastly reduced. On top of that, developers get a batteries-included GraphQL server with comprehensive filtering, pagination, and even full-text search capabilities.

## Developer community

[![Subsquid Discord](https://flat.badgen.net/discord/members/dxR4wNgdjV?icon=discord)](https://discord.gg/dxR4wNgdjV) [![Subsquid Devs Telegram](https://badgen.net/badge/Subsquid%20Developers/telegram?icon=telegram&)](https://t.me/HydraDevs)

## Getting Started

### Prerequisites

* Node v16.x
* [Rush](https://rushjs.io)
* Docker

You can install `rush` globally via npm (`npm install -g @microsoft/rush`)
or use `node ./common/scripts/install-run-rush.js` everywhere instead of `rush(1)`

### Some useful commands

```bash
# install npm dependencies
rush install 

# build all packages
rush build 

# run end-to-end test suite (independent from the commands above)
cd ./test/e2e-suite && ./run.sh
```

### Start hacking

To start using the framework and understand its versatility, clone or fork our [squid-template](https://github.com/subsquid/squid-template) repository and find out how convenient it makes to build an API based on blockchain data.

### Documentation

For more information about the project, visit our [documentation page](docs.subsquid.io).
If you find any inconsistencies in the documentation (spelling mistakes, missing things, passages that are not easy to understand), please report it on our [documentation repository](https://github.com/subsquid/docs).

## Contributing

Subsquid is an OpenSource project, contributions are welcomed, encouraged and will be rewarded!

Please read and adhere to the guidelines expressed in [the contributing page](CONTRIBUTING.md) and make sure to read our [code of conduct](CODE_OF_CONDUCT.md).
