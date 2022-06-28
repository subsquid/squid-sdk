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

Compared to direct RPC access to chain nodes, 
archive gives an ability to fetch data in a more granular fashion and from multiple blocks at once.

### substrate-processor

### substrate-typegen

## Developer community

[![Subsquid Devs Telegram](https://badgen.net/badge/Subsquid%20Developers/telegram?icon=telegram&)](https://t.me/HydraDevs)

### Documentation

For more information about the project, visit our [documentation page](docs.subsquid.io).
If you find any inconsistencies in the documentation (spelling mistakes, missing things, passages that are not easy to understand), 
please report it on our [documentation repository](https://github.com/subsquid/docs).

## Contributing

Subsquid is an OpenSource project, contributions are welcomed, encouraged and will be rewarded!

Please read and adhere to the guidelines expressed in [the contributing page](CONTRIBUTING.md) 
and make sure to read our [code of conduct](CODE_OF_CONDUCT.md).
