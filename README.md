# Subsquid - an ETL framework for Web3 data

[Subsquid](https://subsquid.io/) framework is a set of tools that help
to ingest, transform and present blockchain data.

Our current focus is on [substrate](https://substrate.io)-based chains,
with support for EVM-based chains coming next.

## Overview

Subsquid framework consists of several key components.

### Archive

Archive is a set of services formed by [substrate-ingest](substrate-ingest),
[substrate-gateway](https://github.com/subsquid/archive-gateway), postgres compatible database
and optionally [substrate-explorer](substrate-explorer), which together

1. ingest blockchain data
2. decode and persist it in normalized form
3. make it available for further processing and exploration.

Compared to chain node RPC,  an archive allows one to access data in a more granular fashion and from multiple blocks at once.

### Processor

[substrate-processor](substrate-processor) fetches the data from an archive and executes
user-defined mapping code against it.

### Typegen tools

[substrate-typegen(1)](substrate-typegen) can generate facade TypeScript classes
for substrate events, calls and storage items, allowing to work with chain data
in a fully typesafe and runtime upgrades aware fashion.

Similarly, [squid-evm-typegen(1)](evm-typegen) generates facade TypeScript classes for type-safe processing of EVM logs.  

### Postgres

`substrate-processor` is designed to be able to load the processed data into an arbitrary database and indeed one can  
run it without a persistent store. 

However, additional tooling is available when a processor is run against a postgres-compatible database.
In such a case, subsquid framework suggests the following dev flow:

1. Define the target database schema using a GraphQL schema enriched with custom directives
2. Generate [TypeORM](https://typeorm.io) entity classes with [typeorm-codegen](typeorm-codegen)
3. Generate and apply database migrations with [typeorm-migration](typeorm-migration)
4. Use powerful and extensible [GraphQL server](graphql-server) to serve produced data right away.

### Squid

_Squids_ - this is how we call ETL projects built with the Subsquid framework.

Squids have a certain structure and are supposed to be developed as a regular node.js package. See [squid-template](https://github.com/subsquid/squid-template) for a reference. 

A typical squid implements both data mapping and an API server presenting the data.

Squids can be deployed to a Subsquid cloud service called [Aquairum](https://app.subsquid.io). In the future, the cloud service will be replaced by a decentralized network of providers.

### Other tools

Subsquid framework incorporates a few npm packages that might be useful in standalone mode:

* [scale-codec](scale-codec) - encoder and decoder for [SCALE](https://docs.substrate.io/reference/scale-codec/) data serialization format
* [ss58-codec](ss58-codec) - encoder and decoder for [SS58 address format](https://docs.substrate.io/v3/advanced/ss58/)
* [ss58](ss58) - [ss58-codec](ss58-codec) paired with [SS58 registry](https://github.com/paritytech/ss58-registry).

## Getting started

The best way to get started is to clone and inspect [squid-template](https://github.com/subsquid/squid-template)
project.

## Developer community

Our developers are active on [telegram](https://t.me/HydraDevs). Feel free to join and ask any question!

## Contributing

Subsquid is an OpenSource project, contributions are welcomed, encouraged and will be rewarded!

Please consult [CONTRIBUTING.md](CONTRIBUTING.md) for hacking instructions
and make sure to read our [code of conduct](CODE_OF_CONDUCT.md).
