# Squid SDK - an ETL framework for Web3 data

Squid SDK is a set of tools to ingest, transform and present blockchain data.

The SDK currently supports indexing of EVM- and [Substrate](https://substrate.io)-based chains.

## Overview

Squid SDK consists of several key components.

### Archive

An Archive is a specilized data lake optimized for batch access to the historical event and transaction data. Currently, public Archives are maintained by the Subsquid Labs GmbH and will be replaced by a decentralized solution in the future.

- For EVM chains, see a [separate `eth-archive` repo](https://github.com/subsquid/eth-archive). For a list of public EVM archive endpoints, see the 
[docs](https://docs.subsquid.io/develop-a-squid/evm-processor/configuration/).

- For Substrate chains, the achive service is formed by [`substrate-ingest`](substrate/substrate-ingest),
[`substrate-gateway`](https://github.com/subsquid/substrate-gateway), postgres compatible database
and optionally [`substrate-explorer`](substrate/substrate-explorer), which together

1. ingest blockchain data
2. decode and persist it in a normalized form
3. make it available for further processing and exploration.

For a list of public Substrate acrhives, see [the Aquarium page](https://app.subsquid.io/archives).

Compared to data access using a conventional chain node RPC, an archive allows one to access data in a more granular fashion and from multiple blocks at once. 


### Processor

[`substrate-processor`](substrate/substrate-processor) (for Substrate-based networks) and [`evm-processor`](https://github.com/subsquid/evm-processor)(for EVM networks) fetch on-chain data from an Archive and execute user-defined data mapping code to transform and persist the data into the target database.

### Typegen tools

[squid-substrate-typegen(1)](substrate/substrate-typegen) generates facade TypeScript classes
for type-safe decoding substrate events, calls and RPC storage queires. It natively supports Substrate runtime upgrades by inspecting the historical metadata changes and generating runtime version-aware data access methods. 

Similarly, [squid-evm-typegen(1)](evm/evm-typegen) generates facade TypeScript classes for type-safe decoding of EVM event logs, transaction data and RPC contract state responses.  

### Postgres

Both `evm-processor` and `substrate-processor` are designed to be able to load the processed data into an arbitrary database and indeed one can run it without a persistent store. 

Extra tooling for data modeling and serving the data with GraphQL is available when a processor is run against a postgres-compatible database. In such a case, the Subsquid framework suggests the following dev flow:

1. Define the target database schema using a GraphQL dialect enriched with custom directives
2. Generate [TypeORM](https://typeorm.io) entity classes with [typeorm-codegen](typeorm/typeorm-codegen)
3. Generate and apply database migrations with [typeorm-migration](typeorm/typeorm-migration)
4. Use powerful and extensible [GraphQL server](graphql/graphql-server) to serve the produced data.

See the [docs](https://docs.subsquid.io) for more details on the data modelling using the schema file and an auto-generated GraphQL API over it.

### Other tools

The Subsquid framework incorporates a few npm packages that might be useful in a standalone mode:

* [commands](util/commands) - a cross-platform runner of project-specific commands. Designed to replace `Makefile` and `package.json` scripts for squid projects. Natively integrated in [squid CLI](https://github.com/subsquid/squid-cli).
* [scale-codec](substrate/scale-codec) - encoder and decoder for [SCALE](https://docs.substrate.io/reference/scale-codec/) data serialization format
* [ss58-codec](substrate/ss58-codec) - encoder and decoder for [SS58 address format](https://docs.substrate.io/v3/advanced/ss58/)
* [ss58](substrate/ss58) - [ss58-codec](substrate/ss58-codec) paired with [SS58 registry](https://github.com/paritytech/ss58-registry).

## Getting started

The best way to get started is to install [squid CLI](https://github.com/subsquid/squid-cli) and scaffold a squid project with [`sqd init`](https://docs.subsquid.io/squid-cli/init/). 

For step-by-step instructions, follow one of the [Quickstart guides](https://docs.subsquid.io/quickstart/).

## Developer community

Our developers are active on [Telegram](https://t.me/HydraDevs) and [Discord](https://discord.gg/subsquid). Feel free to join and ask any question!

## Contributing

Subsquid is an OpenSource project, contributions are welcomed, encouraged and will be rewarded!

Please consult [CONTRIBUTING.md](CONTRIBUTING.md) for hacking instructions
and make sure to read our [code of conduct](CODE_OF_CONDUCT.md).
