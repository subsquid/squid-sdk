# Subsquid - an ETL framework for Web3 data

[Subsquid](https://subsquid.io/) framework is a set of tools which help
to ingest, transform and present blockchain data.

Our current focus is on [substrate](https://substrate.io) based chains,
with support for ethereum ecosystem coming next.

## Overview

Subsquid framework consists of several key components.

### Archive

Archive is a set of services formed by [substrate-ingest](substrate-ingest),
[substrate-gateway](https://github.com/subsquid/archive-gateway), postgres compatible database
and optionally [substrate-explorer](substrate-explorer), which together

1. ingest blockchain data
2. decode and persist it in normalized form
3. make it available for further processing and exploration.

Compared to chain node RPC, 
archive allows to access data in a more granular fashion and from multiple blocks at once.

### Processor

[substrate-processor](substrate-processor) fetches the data from archive and executes
user-defined mapping code against it.

### Typegen

[substrate-typegen(1)](substrate-typegen) can generate facade TypeScript classes
for substrate events, calls and storage items, allowing to work with chain data
in a fully typesafe and runtime upgrades aware fashion.

### Postgres

Although `substrate-processor` is designed to work with any database or without
database at all, a special attention was given to the case, 
when postgres compatible database is used as the target destination for the chain data.

For such case, subsquid framework suggests the-graph like dev flow:

1. Define the target database schema using GraphQL and a number of custom directives
2. Generate [TypeORM](https://typeorm.io) entity classes with [typeorm-codegen](typeorm-codegen)
3. Generate and apply database migrations with [typeorm-migration](typeorm-migration)
4. Use powerful and extensible [GraphQL server](graphql-server) to serve produced data right away.

### Squid

_Squids_ - this is how we call ETL projects built with subsquid framework.

They have a certain structure and supposed to be developed as regular node.js packages.

Typical squid implements both data mapping and HTTP API presenting the end result.

Squids can be deployed to subsquid cloud and in the future to decentralized community network.

### Other tools

Subsquid framework incorporates a number of npm packages which might be useful in standalone mode:

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
